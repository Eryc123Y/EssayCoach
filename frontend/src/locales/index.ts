import { en } from './en';
import { zh } from './zh';

export type MessageId = keyof typeof en;
export type Locale = 'en' | 'zh';

const catalogs: Record<Locale, Record<MessageId, string>> = { en, zh };

export function message(id: MessageId, locale: Locale): string {
  return catalogs[locale][id];
}

export type MessageVars = Record<string, string | number>;

function interpolate(template: string, vars: MessageVars): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

// Static copy uses a stable ID and comes from the catalogs above. Copy with
// runtime values uses an ID whose text has `{name}` placeholders, filled from
// a variables object as the third argument. The two-string form (English,
// Chinese) remains only as a fallback for text that has no catalog entry.
export function localized(locale: string, idOrEnglish: string, inlineChineseOrVars?: string | MessageVars): string {
  if (typeof inlineChineseOrVars === 'string') return locale === 'zh' ? inlineChineseOrVars : idOrEnglish;
  const selected: Record<string, string> = locale === 'zh' ? zh : en;
  const template = selected[idOrEnglish] ?? idOrEnglish;
  return inlineChineseOrVars ? interpolate(template, inlineChineseOrVars) : template;
}
