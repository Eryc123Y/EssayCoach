// Opens dialogs, confirmations and error states in both languages. For each it
// records the visible text, axe-core (WCAG 2.x A/AA) violations and, for dialogs,
// whether focus moves into the dialog, Esc closes it, and focus returns to the
// page afterwards. Needs the seeded accounts (`make seed-db`) and a running
// stack. See scripts/a11y/README.md.
//
//   node axe-states.mjs [out.json] [state-id,state-id]
//
// Keyboard focus order and screen-reader wording still need a person.
import { chromium } from 'playwright-core';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5100';
const OUT = process.argv[2] || 'axe-states.json';
const ONLY = process.argv[3] ? new Set(process.argv[3].split(',')) : null;

const ACCOUNTS = { lecturer: ['lecturer@example.com', 'lecturer123'], admin: ['admin@example.com', 'admin123'], student: ['student@example.com', 'student123'] };
const re = (en, zh) => new RegExp(`${en}|${zh}`, 'i');

// Each state: who, where, and how to reach it. `dialog` states are checked for keyboard behaviour too.
const STATES = [
  { id: 'task-duplicate', role: 'lecturer', path: '/dashboard/tasks', kind: 'dialog', open: async (p) => { await p.getByRole('button', { name: re('Assignment actions', '作业操作') }).first().click(); await p.getByRole('menuitem').nth(2).click(); } },
  { id: 'task-extend-deadline', role: 'lecturer', path: '/dashboard/tasks', kind: 'dialog', open: async (p) => { await p.getByRole('button', { name: re('Assignment actions', '作业操作') }).first().click(); await p.getByRole('menuitem').nth(3).click(); } },
  { id: 'task-delete-confirm', role: 'lecturer', path: '/dashboard/tasks', kind: 'native', open: async (p, cap) => { await p.getByRole('button', { name: re('Assignment actions', '作业操作') }).first().click(); await p.getByRole('menuitem').nth(4).click(); } },
  { id: 'class-delete', role: 'lecturer', path: '/dashboard/classes', kind: 'dialog', open: async (p) => { await p.getByRole('button', { name: re('Class actions', '班级操作') }).first().click(); await p.getByRole('menuitem').nth(3).click(); } },
  { id: 'class-invite-students', role: 'lecturer', path: '/dashboard/classes/1', kind: 'dialog', open: async (p) => { await p.getByRole('button', { name: re('Invite students', '邀请学生') }).first().click(); } },
  { id: 'class-invite-lecturer', role: 'admin', path: '/dashboard/classes/1', kind: 'dialog', open: async (p) => { await p.getByRole('button', { name: re('Invite lecturer', '邀请讲师') }).first().click(); } },
  { id: 'class-join', role: 'student', path: '/dashboard/classes', kind: 'dialog', open: async (p) => { await p.getByRole('button', { name: re('Join Class', '加入班级') }).first().click(); } },
  { id: 'users-invite', role: 'admin', path: '/dashboard/users', kind: 'dialog', open: async (p) => { await p.getByRole('button', { name: re('Invite person', '邀请') }).first().click(); } },
  { id: 'task-form-empty-submit', role: 'lecturer', path: '/dashboard/tasks/new', kind: 'inline', open: async (p) => { await p.locator('form button[type="submit"]').first().click(); } },
  { id: 'class-form-empty-submit', role: 'lecturer', path: '/dashboard/classes/new', kind: 'inline', open: async (p) => { const submit = p.locator('form button[type="submit"]').first(); if (await submit.isDisabled()) return 'submit-disabled'; await submit.click(); } },
  { id: 'community-share', role: 'student', path: '/dashboard/community', kind: 'dialog', open: async (p) => { await p.getByRole('button', { name: re('Share', '分享') }).first().click(); } },
  { id: 'settings-password-form', role: 'student', path: '/dashboard/settings', kind: 'inline', open: async (p) => { await p.getByRole('button', { name: re('Change password', '更改密码') }).first().click(); } },
  { id: 'student-confirm-submission', role: 'student', path: '/dashboard/tasks/1', kind: 'inline', open: async (p) => { await p.locator('textarea').first().fill('A short practice essay used to reach the confirmation step.'); await p.getByRole('button', { name: re('Review and submit', '检查并提交') }).first().click(); } }
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: process.env.CI ? ['--no-sandbox'] : [] });
const results = [];

async function login(role) {
  const [email, password] = ACCOUNTS[role];
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  for (let i = 0; i < 3; i++) {
    await page.goto(BASE + '/auth/sign-in', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('button[type="submit"]').first().click();
    if (await page.waitForURL(/\/dashboard/, { timeout: 60000 }).then(() => true).catch(() => false)) return page;
  }
  throw new Error('login failed for ' + role);
}

for (const role of Object.keys(ACCOUNTS)) {
  const states = STATES.filter((s) => s.role === role && (!ONLY || ONLY.has(s.id)));
  if (!states.length) continue;
  const page = await login(role);
  for (const lang of ['en', 'zh']) {
    await page.evaluate(async (language) => (await fetch('/api/v2/auth/settings/preferences/', { method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language }) })).status, lang);
    for (const state of states) {
      const row = { id: state.id, lang, role, kind: state.kind };
      try {
        await page.goto(BASE + state.path, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(1000);
        let nativeMessage = null;
        const onNative = async (d) => { nativeMessage = d.message(); await d.dismiss().catch(() => {}); };
        if (state.kind === 'native') page.on('dialog', onNative);
        const note = await state.open(page);
        if (note) row.note = note;
        await page.waitForTimeout(700);
        page.off('dialog', onNative);
        if (state.kind === 'native') {
          row.nativeMessage = nativeMessage;
        } else if (state.kind === 'dialog') {
          const dialog = page.locator('[role="dialog"],[role="alertdialog"]').last();
          row.dialogText = (await dialog.innerText().catch(() => '')).replace(/[ \t]+/g, ' ').trim();
          row.focusInside = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"],[role="alertdialog"]'));
        } else {
          row.alertText = (await page.locator('[role="alert"]').allInnerTexts().catch(() => [])).map((t) => t.replace(/\s+/g, ' ').trim());
          row.bodyText = (await page.evaluate(() => document.body.innerText.replace(/[ \t]+/g, ' ').trim())).slice(0, 4000);
        }
        if (state.kind !== 'native') {
          await page.evaluate(axeSource);
          const res = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
          row.axe = res.violations.map((v) => ({ rule: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(' ')) }));
        }
        if (state.kind === 'dialog') {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          row.escapeCloses = (await page.locator('[role="dialog"],[role="alertdialog"]').count()) === 0;
          row.focusReturned = await page.evaluate(() => document.activeElement !== document.body && !document.activeElement?.closest('[role="dialog"],[role="alertdialog"]'));
        }
      } catch (error) {
        row.error = String(error).split('\n')[0].slice(0, 200);
      }
      results.push(row);
      console.log(`${role}/${lang} ${state.id}: ${row.error ? 'ERROR ' + row.error : 'ok'}${row.axe ? ' axe=' + row.axe.length : ''}${row.escapeCloses === false ? ' ESC-DOES-NOT-CLOSE' : ''}${row.focusInside === false ? ' FOCUS-NOT-IN-DIALOG' : ''}`);
    }
  }
}
await browser.close();
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
console.log('DONE', results.length);
