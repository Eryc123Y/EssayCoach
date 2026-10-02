import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { en } from './en';
import { zh } from './zh';
import { localized } from './index';

const placeholders = (text: string) => new Set([...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'locales' ? [] : sourceFiles(file);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) ? [file] : [];
  });
}

function missingStaticCatalogIds(): string[] {
  const ids = new Set(Object.keys(en));
  const missing: string[] = [];
  for (const file of sourceFiles('src')) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        const argument = name === 'localized' ? node.arguments[1] : (name === 't' || name === 'message' ? node.arguments[0] : undefined);
        if (argument && ts.isStringLiteral(argument) && /^(ui|community)\./.test(argument.text) && !ids.has(argument.text)) {
          const { line } = source.getLineAndCharacterOfPosition(argument.getStart(source));
          missing.push(`${relative('.', file)}:${line + 1} ${argument.text}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return missing;
}

describe('localized', () => {
  it('returns the catalog text for the selected locale', () => {
    expect(localized('en', 'ui.rubricNowPublic')).toBe('Rubric is now public');
    expect(localized('zh', 'ui.rubricNowPublic')).toBe('量表已公开');
  });

  it('fills {name} placeholders from the variables object', () => {
    expect(localized('en', 'ui.pendingCount', { count: 3 })).toBe('3 pending');
    expect(localized('zh', 'ui.pendingCount', { count: 3 })).toBe('3 篇待复核');
    expect(localized('zh', 'ui.rubricImportedSummary', { name: '议论文', items: 3, levels: 33 })).toBe(
      '已导入量表“议论文”（3 个维度、33 个等级）'
    );
  });

  it('leaves a placeholder untouched when its variable is missing', () => {
    expect(localized('en', 'ui.pendingCount', {})).toBe('{count} pending');
  });

  it('keeps user-supplied values literal, including braces and dollar signs', () => {
    expect(localized('en', 'ui.rubricDeletedNamed', { name: '$& {count}' })).toBe('Rubric "$& {count}" deleted');
  });

  it('keeps the two-string fallback for text without a catalog entry', () => {
    expect(localized('en', 'Not in catalog', '不在词条表')).toBe('Not in catalog');
    expect(localized('zh', 'Not in catalog', '不在词条表')).toBe('不在词条表');
  });

  it('returns an unknown ID unchanged rather than throwing', () => {
    expect(localized('zh', 'ui.doesNotExist')).toBe('ui.doesNotExist');
  });
});

describe('locale catalogs', () => {
  const ids = Object.keys(en) as (keyof typeof en)[];

  it('has a non-empty Chinese entry for every English ID', () => {
    const missing = ids.filter((id) => !zh[id]?.trim());
    expect(missing).toEqual([]);
  });

  it('never introduces a Chinese placeholder that the English text lacks', () => {
    const unknown = ids.filter((id) => [...placeholders(zh[id])].some((name) => !placeholders(en[id]).has(name)));
    expect(unknown).toEqual([]);
  });

  it('contains every static UI ID used by the application source', () => {
    expect(missingStaticCatalogIds()).toEqual([]);
  });
});
