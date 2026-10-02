import { expect, test, type Page } from '@playwright/test';
import { accounts, apiRequest, runSeed, signIn, trackPageErrors, visit } from './support/e2e';

const AUTH_COOKIES = [
  'access_token',
  'refresh_token',
  'session_persistence',
  'user_email',
  'user_first_name',
  'user_last_name',
  'user_role',
  'user_id',
];
const DAY_SECONDS = 24 * 60 * 60;

async function cookieMap(page: Page) {
  const cookies = await page.context().cookies();
  return new Map(cookies.map((cookie) => [cookie.name, cookie]));
}

async function storedUserData(page: Page) {
  return page.evaluate(() => ({
    session: sessionStorage.getItem('user_data'),
    local: localStorage.getItem('user_data'),
  }));
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  runSeed('--fixtures');
});

test('a session-only sign-in keeps tokens in browser-session cookies', async ({ page }) => {
  await signIn(page, accounts.alice, { remember: false });

  const cookies = await cookieMap(page);
  for (const name of ['access_token', 'refresh_token']) {
    const cookie = cookies.get(name);
    expect(cookie, `${name} cookie`).toBeDefined();
    expect(cookie?.httpOnly, `${name} is httpOnly`).toBe(true);
    expect(cookie?.sameSite).toBe('Strict');
    expect(cookie?.expires, `${name} is a session cookie`).toBe(-1);
  }
  expect(cookies.get('session_persistence')?.value).toBe('session');
  expect(cookies.get('user_role')?.expires).toBe(-1);

  const stored = await storedUserData(page);
  expect(stored.local).toBeNull();
  expect(JSON.parse(stored.session ?? 'null')).toMatchObject({ email: accounts.alice.email });
});

test('a remembered sign-in keeps the refresh cookie for 30 days', async ({ page }) => {
  await signIn(page, accounts.alice, { remember: true });
  const now = Date.now() / 1000;

  const cookies = await cookieMap(page);
  const refresh = cookies.get('refresh_token');
  const access = cookies.get('access_token');
  expect(refresh?.httpOnly).toBe(true);
  expect(access?.httpOnly).toBe(true);
  expect(refresh?.expires ?? 0).toBeGreaterThan(now + 30 * DAY_SECONDS - 300);
  expect(refresh?.expires ?? 0).toBeLessThan(now + 30 * DAY_SECONDS + 300);
  // The access cookie stays short-lived; the refresh cookie renews it.
  expect(access?.expires ?? 0).toBeGreaterThan(now);
  expect(access?.expires ?? 0).toBeLessThan(now + 2 * 60 * 60);
  expect(cookies.get('session_persistence')?.value).toBe('persistent');

  const stored = await storedUserData(page);
  expect(stored.session).toBeNull();
  expect(JSON.parse(stored.local ?? 'null')).toMatchObject({ email: accounts.alice.email });
});

test('a missing access cookie is renewed from the refresh cookie', async ({ page }) => {
  const errors = trackPageErrors(page);
  await signIn(page, accounts.alice, { remember: false });
  const before = await cookieMap(page);
  const oldRefresh = before.get('refresh_token')?.value;
  expect(oldRefresh).toBeTruthy();

  // Leave the dashboard first, as a returning user would: an open dashboard
  // keeps polling and prefetching, and those requests would race this one to
  // rotate the same refresh token. A navigation that loses that race is
  // currently sent to sign-in although the session is valid.
  await page.goto('about:blank');
  // Dashboard page: the middleware renews the session instead of redirecting.
  await page.context().clearCookies({ name: 'access_token' });
  expect((await cookieMap(page)).has('access_token')).toBe(false);
  await visit(page, '/dashboard/essay-analysis');
  await expect(page).toHaveURL(/\/dashboard\/essay-analysis\/?$/);
  await expect(page.getByRole('heading', { name: 'Writing studio' })).toBeVisible();

  const renewed = await cookieMap(page);
  const access = renewed.get('access_token');
  const refresh = renewed.get('refresh_token');
  expect(access?.value).toBeTruthy();
  expect(refresh?.value).toBeTruthy();
  expect(refresh?.value, 'the refresh token rotates').not.toBe(oldRefresh);
  // A session-only sign-in stays session-only after renewal.
  expect(access?.expires).toBe(-1);
  expect(refresh?.expires).toBe(-1);

  // API route handlers renew the session the same way. The favicon is a
  // same-origin document that issues no requests of its own.
  await visit(page, '/favicon.ico');
  await page.context().clearCookies({ name: 'access_token' });
  const essays = await apiRequest(page, 'GET', '/api/v2/practice/essays/');
  expect(essays.status).toBe(200);
  const renewedAgain = await cookieMap(page);
  expect(renewedAgain.get('access_token')?.value).toBeTruthy();
  expect(renewedAgain.get('refresh_token')?.value).not.toBe(refresh?.value);

  errors.expectNone();
});

test('signing out through the user menu ends the session', async ({ page }) => {
  await signIn(page, accounts.alice);
  await visit(page, '/dashboard/essay-analysis');
  await expect(page.getByRole('heading', { name: 'Writing studio' })).toBeVisible();
  const refreshCookie = (await cookieMap(page)).get('refresh_token');
  expect(refreshCookie).toBeDefined();

  await page.getByRole('button', { name: new RegExp(accounts.alice.email) }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await page.waitForURL(/\/auth\/sign-in/, { waitUntil: 'domcontentloaded' });

  const cookies = await cookieMap(page);
  for (const name of AUTH_COOKIES) expect(cookies.has(name), `${name} cleared`).toBe(false);
  expect(await storedUserData(page)).toEqual({ session: null, local: null });

  await visit(page, '/dashboard');
  await expect(page).toHaveURL(/\/auth\/sign-in\/?\?callbackUrl=%2Fdashboard(%2F)?$/);

  // The server revoked the session: replaying the old refresh cookie cannot renew it.
  await page.context().addCookies([refreshCookie!]);
  expect((await cookieMap(page)).get('refresh_token')?.value).toBe(refreshCookie!.value);
  await visit(page, '/dashboard/essay-analysis');
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  expect((await cookieMap(page)).has('access_token')).toBe(false);
});

test('the signed-out dashboard redirect stays on the host the browser used', async ({ page }) => {
  // Next's internal request URL says localhost; the middleware must build its
  // redirect from the Host the browser (or a reverse proxy) supplied instead.
  // Next itself rewrites loopback hosts to localhost, so use a real hostname.
  const response = await page.request.get('/dashboard/', {
    maxRedirects: 0,
    headers: { 'x-forwarded-host': 'essays.example.edu', 'x-forwarded-proto': 'https' },
  });
  expect(response.status()).toBe(307);
  const location = new URL(response.headers().location);
  expect(location.origin).toBe('https://essays.example.edu');
  expect(location.pathname).toBe('/auth/sign-in/');
});

test('changing the password signs the user out and the new password works', async ({ page }) => {
  const newPassword = 'E2ENewPass456!';
  await signIn(page, accounts.bob);
  await visit(page, '/dashboard/settings');
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Change password' }).click();
  // The email-change form below also has a "Current password" field.
  await page.getByPlaceholder('Enter current password').fill(accounts.bob.password);
  await page.getByLabel('New password', { exact: true }).fill(newPassword);
  await page.getByLabel('Confirm new password').fill(newPassword);
  const change = page.waitForResponse((response) => response.url().includes('/api/v2/auth/password-change/'));
  await page.getByRole('button', { name: 'Confirm change' }).click();
  expect((await change).status()).toBe(200);
  await expect(page.getByText('Your old sessions have been signed out. Use your new password to sign in.')).toBeVisible();

  await page.waitForURL(/\/auth\/sign-in/, { waitUntil: 'domcontentloaded' });
  const cookies = await cookieMap(page);
  expect(cookies.has('access_token')).toBe(false);
  expect(cookies.has('refresh_token')).toBe(false);

  // The old password is refused through the real form.
  const hydrated = page.waitForResponse((response) => response.url().includes('/api/v2/auth/getUserInfo'));
  await visit(page, '/auth/sign-in');
  await hydrated;
  await page.getByLabel(/email address/i).fill(accounts.bob.email);
  await page.locator('input[type="password"]').fill(accounts.bob.password);
  const refused = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/v2/auth/login/' && response.status() !== 308,
  );
  await page.getByRole('button', { name: /sign in/i }).click();
  expect((await refused).status()).toBe(401);
  await expect(page.getByText('Sign in failed. Check your email and password, then try again.')).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/sign-in/);

  await signIn(page, { email: accounts.bob.email, password: newPassword });
  await visit(page, '/dashboard/settings');
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
});
