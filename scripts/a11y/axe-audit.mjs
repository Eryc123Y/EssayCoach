// Automated accessibility audit: runs axe-core (WCAG 2.x A/AA rules) against the
// authenticated pages of each role, in English and Chinese, at desktop and
// phone widths. It needs the seeded development accounts (`make seed-db`) and a
// running stack (`make dev-local`). See scripts/a11y/README.md.
//
//   node audit.mjs [student,lecturer,admin]
//
// Automated rules catch only part of WCAG; keyboard and screen-reader checks
// still need a person.
import { chromium } from 'playwright-core';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5100';
const OUT = process.env.AXE_OUT || 'axe-results.json';

const ACCOUNTS = {
  student: ['student@example.com', 'student123'],
  lecturer: ['lecturer@example.com', 'lecturer123'],
  admin: ['admin@example.com', 'admin123']
};
const COMMON = ['/dashboard/rubrics', '/dashboard/tasks', '/dashboard/classes', '/dashboard/settings', '/dashboard/profile', '/dashboard/help', '/dashboard/community', '/dashboard/notifications'];
const PAGES = {
  student: ['/dashboard/student', ...COMMON, '/dashboard/essay-analysis', '/dashboard/tasks/1'],
  lecturer: ['/dashboard/lecturer', ...COMMON, '/dashboard/analytics', '/dashboard/rubrics/new', '/dashboard/tasks/new', '/dashboard/tasks/1'],
  admin: ['/dashboard/admin', ...COMMON, '/dashboard/analytics', '/dashboard/users', '/dashboard/observability']
};
const VIEWPORTS = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };
const only = process.argv[2] ? new Set(process.argv[2].split(',')) : null;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: process.env.CI ? ['--no-sandbox'] : [] });
const results = [];

async function scan(page, role, lang, vp, path) {
  try {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.evaluate(axeSource);
    const res = await page.evaluate(() =>
      // eslint-disable-next-line no-undef
      axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })
    );
    const finalPath = new URL(page.url()).pathname.replace(/\/$/, '');
    if (finalPath !== path.replace(/\/$/, '')) {
      results.push({ role, lang, vp, path, url: finalPath, rule: 'redirected', impact: 'n/a', help: 'page did not render at requested path', nodes: 0, sample: [] });
      console.log(`${role}/${lang}/${vp} ${path} REDIRECTED to ${finalPath}`);
      return;
    }
    for (const v of res.violations) {
      results.push({ role, lang, vp, path, url: page.url().replace(BASE, ''), rule: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(' ')) });
    }
    console.log(`${role}/${lang}/${vp} ${path} -> ${page.url().replace(BASE, '')}: ${res.violations.length} rule(s)`);
  } catch (error) {
    console.log(`${role}/${lang}/${vp} ${path} ERROR ${String(error).slice(0, 100)}`);
    results.push({ role, lang, vp, path, rule: 'scan-error', impact: 'n/a', help: String(error).slice(0, 200), nodes: 0, sample: [] });
  }
}

// Public pages first.
{
  const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await ctx.newPage();
  for (const p of ['/', '/auth/sign-in']) await scan(page, 'public', 'en', 'desktop', p);
  await ctx.close();
}

for (const [role, [email, password]] of Object.entries(ACCOUNTS)) {
  if (only && !only.has(role)) continue;
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    let loggedIn = false;
    for (let attempt = 0; attempt < 3 && !loggedIn; attempt++) {
      await page.goto(BASE + '/auth/sign-in', { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(1500); // let React hydrate so submit is handled by the app, not a native GET
      await page.locator('input[type="email"], input[name*="mail" i]').first().fill(email);
      await page.locator('input[type="password"]').first().fill(password);
      await page.locator('button[type="submit"]').first().click();
      loggedIn = await page.waitForURL(/\/dashboard/, { timeout: 60000 }).then(() => true).catch(() => false);
    }
    if (!loggedIn) throw new Error(`login failed for ${role}/${vpName}; last url ${page.url()}`);
    console.log(`${role}/${vpName} logged in at ${page.url().replace(BASE, '')}`);
    for (const lang of ['en', 'zh']) {
      const status = await page.evaluate(async (language) => {
        const r = await fetch('/api/v2/auth/settings/preferences/', { method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language }) });
        return r.status;
      }, lang);
      if (status >= 400) console.log(`  set language ${lang} failed: ${status}`);
      for (const path of PAGES[role]) await scan(page, role, lang, vpName, path);
    }
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
console.log('DONE', results.length, 'violation records');
