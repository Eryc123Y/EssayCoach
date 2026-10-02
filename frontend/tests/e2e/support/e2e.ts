import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

/** Every seeded account (admin and `--fixtures` users) shares this password. */
export const E2E_PASSWORD = 'E2EPass123!';
const domain = '@e2e.essaycoach.example.com';

export const accounts = {
  admin: { email: `admin${domain}`, password: E2E_PASSWORD },
  // Course lead for E2E101 and lecturer of the journeys class.
  lead: { email: `lead${domain}`, password: E2E_PASSWORD },
  // Lecturer of the journeys class without course-lead authority.
  reviewer: { email: `reviewer${domain}`, password: E2E_PASSWORD },
  // Lecturer of a different class only.
  outsider: { email: `outsider${domain}`, password: E2E_PASSWORD },
  alice: { email: `alice${domain}`, password: E2E_PASSWORD },
  bob: { email: `bob${domain}`, password: E2E_PASSWORD },
} as const;

export type Credentials = { email: string; password: string };

export const fixtures = {
  journeyClass: 'E2E Journeys Class',
  otherClass: 'E2E Other Lecturer Class',
  journeyTask: 'E2E Journey Assignment',
  rubric: 'E2E Argument Rubric',
} as const;

function backendDirectory() {
  return process.env.E2E_BACKEND_DIR || path.resolve(__dirname, '../../../../backend');
}

/** Run `manage.py seed_e2e` against the disposable E2E database. */
export function runSeed(...args: string[]) {
  const python = process.env.E2E_BACKEND_PYTHON || path.join(backendDirectory(), '.venv/bin/python');
  return execFileSync(python, ['manage.py', 'seed_e2e', ...args], {
    cwd: backendDirectory(),
    env: process.env,
    stdio: 'pipe',
  }).toString();
}

export async function visit(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

/** Sign in through the real form; `remember` mirrors the Remember me checkbox. */
export async function signIn(page: Page, credentials: Credentials, { remember = true } = {}) {
  await visit(page, '/auth/sign-in');
  await page.getByLabel(/email address/i).fill(credentials.email);
  await page.locator('input[type="password"]').fill(credentials.password);
  const rememberBox = page.getByRole('checkbox', { name: /remember me/i });
  if ((await rememberBox.isChecked()) !== remember) await rememberBox.click();
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
}

/** Drop the browser session without using the UI (use the UI where logout itself is tested). */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await visit(page, '/auth/sign-in');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/** Fetch JSON through the app's own cookie-authenticated proxy. */
export async function currentJson<T>(page: Page, url: string): Promise<T> {
  return page.evaluate(async (requestUrl) => {
    const response = await fetch(requestUrl, { credentials: 'include' });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  }, url);
}

/** Send a cookie-authenticated API request and return status plus parsed body. */
export async function apiRequest<T = unknown>(
  page: Page,
  method: string,
  url: string,
  body?: unknown,
): Promise<{ status: number; body: T }> {
  return page.evaluate(
    async ({ method: requestMethod, url: requestUrl, body: requestBody }) => {
      const csrf = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='))?.split('=')[1];
      const response = await fetch(requestUrl, {
        method: requestMethod,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
        body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
      });
      const text = await response.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        // Keep the raw text for non-JSON responses.
      }
      return { status: response.status, body: parsed as T };
    },
    { method, url, body },
  );
}

/** Collect uncaught page errors; assert none at the end of a test. */
export function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return {
    expectNone() {
      expect(errors).toEqual([]);
    },
  };
}

/**
 * `signIn`, but only after the sign-in form has hydrated. Values typed into the
 * server-rendered form before hydration are reset by React, leaving an empty,
 * invalid form. The auth provider's mount-time session check is the first
 * request issued after hydration, so wait for it before typing.
 */
export async function signInAfterHydration(page: Page, credentials: Credentials, { remember = true } = {}) {
  const hydrated = page
    .waitForResponse((response) => response.url().includes('/api/v2/auth/getUserInfo'), { timeout: 10_000 })
    .catch(() => undefined);
  await visit(page, '/auth/sign-in');
  await hydrated;
  const email = page.getByLabel(/email address/i);
  const password = page.locator('input[type="password"]');
  await email.fill(credentials.email);
  await password.fill(credentials.password);
  await expect(email).toHaveValue(credentials.email);
  await expect(password).toHaveValue(credentials.password);
  const rememberBox = page.getByRole('checkbox', { name: /remember me/i });
  if ((await rememberBox.isChecked()) !== remember) await rememberBox.click();
  await expect(rememberBox).toBeChecked({ checked: remember });
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
}
