import { expect, test, type Browser, type Page } from '@playwright/test';
import { accounts, apiRequest, currentJson, runSeed, signIn, trackPageErrors, visit, type Credentials } from './support/e2e';

type Organization = { name: string; logo_url: string; primary_color: string };

const genericSignInError = 'Sign in failed. Check your email and password, then try again.';

/** A fresh browser context per person keeps each role signed in independently. */
async function pageFor(browser: Browser, credentials: Credentials) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, credentials);
  return page;
}

/** Submit the real sign-in form and wait for its login response. */
async function attemptSignIn(page: Page, credentials: Credentials) {
  await visit(page, '/auth/sign-in');
  const email = page.getByLabel(/email address/i);
  // Type only after hydration, as signIn does.
  await expect.poll(() => email.evaluate((element) => Object.keys(element).some((key) => key.startsWith('__reactProps$'))))
    .toBe(true);
  await email.fill(credentials.email);
  await page.locator('input[type="password"]').fill(credentials.password);
  await expect(email).toHaveValue(credentials.email);
  // The form posts to /api/v2/auth/login, which the trailing-slash redirect forwards.
  const login = page.waitForResponse(
    (response) => /\/api\/v2\/auth\/login\/?$/.test(new URL(response.url()).pathname) && response.status() !== 308,
  );
  await page.getByRole('button', { name: /sign in/i }).click();
  return (await login).status();
}

/** The institution name sits in the sidebar header; open a collapsed sidebar to read it. */
async function expectShellName(page: Page, name: string) {
  const sidebar = page.locator('[data-slot="sidebar"]');
  await expect(sidebar).toBeVisible();
  if ((await sidebar.getAttribute('data-state')) === 'collapsed') {
    await page.getByRole('button', { name: 'Toggle Sidebar' }).first().click();
  }
  await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  await expect(sidebar.getByText(name, { exact: true })).toBeVisible();
}

async function openAccount(page: Page, email: string) {
  await visit(page, '/dashboard/users');
  await expect(page.getByRole('heading', { name: 'People & access' })).toBeVisible();
  await page.getByLabel('Search users').fill(email);
  const row = page.getByRole('row').filter({ hasText: email });
  await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: 'View' }).click();
  const detail = page.locator('section').filter({ has: page.getByRole('heading', { name: email }) });
  await expect(detail).toBeVisible();
  return { row, detail };
}

test.describe.configure({ mode: 'serial' });

test.describe('admin account and institution management', () => {
  test.setTimeout(120_000);
  test.beforeAll(() => runSeed('--fixtures'));

  test('a suspended student cannot sign in until an admin restores the account', async ({ page, browser }) => {
    const errors = trackPageErrors(page);
    // Every confirmation here is the directory's own window.confirm guard.
    page.on('dialog', (dialog) => void dialog.accept());
    await signIn(page, accounts.admin);

    const { row, detail } = await openAccount(page, accounts.bob.email);
    await expect(detail).toContainText('Student · Active');
    await detail.getByRole('button', { name: 'Suspend account' }).click();
    await expect(detail.getByRole('button', { name: 'Restore account' })).toBeVisible();
    await expect(detail).toContainText('Student · Suspended');
    await expect(row).toContainText('Suspended');
    await expect(detail).toContainText('disable user');

    // Bob's sign-in looks exactly like a wrong password: same generic message and
    // the same 401 from the login API, so the response never confirms the password.
    const bobContext = await browser.newContext();
    const bobPage = await bobContext.newPage();
    expect(await attemptSignIn(bobPage, accounts.bob)).toBe(401);
    await expect(bobPage.getByText(genericSignInError)).toBeVisible();
    await expect(bobPage).toHaveURL(/\/auth\/sign-in/);
    const suspended = await apiRequest<{ message: string }>(bobPage, 'POST', '/api/v2/auth/login/', accounts.bob);
    const wrongPassword = await apiRequest<{ message: string }>(bobPage, 'POST', '/api/v2/auth/login/', {
      email: accounts.bob.email,
      password: 'Not-the-password-1!',
    });
    expect(suspended.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(suspended.body).toEqual(wrongPassword.body);
    expect((await bobContext.cookies()).some((cookie) => cookie.name === 'access_token')).toBe(false);

    await detail.getByRole('button', { name: 'Restore account' }).click();
    await expect(detail.getByRole('button', { name: 'Suspend account' })).toBeVisible();
    await expect(detail).toContainText('Student · Active');
    await expect(detail).toContainText('enable user');

    await signIn(bobPage, accounts.bob);
    await expect(bobPage).toHaveURL(/\/dashboard/);
    await bobContext.close();
    errors.expectNone();
  });

  test('institution branding saved by an admin reaches another user and is restored', async ({ page, browser }) => {
    const errors = trackPageErrors(page);
    await signIn(page, accounts.admin);
    const original = await currentJson<Organization>(page, '/api/v2/admin/organization/');
    const brandedName = `E2E Branding Institute ${Date.now().toString(36)}`;
    const brandedColor = '#7c3aed';
    expect(original.name).not.toBe(brandedName);

    const saveBranding = async (name: string, color: string) => {
      await visit(page, '/dashboard/settings');
      await page.getByRole('button', { name: 'Organization' }).click();
      await expect(page.getByRole('heading', { name: 'Institution branding' })).toBeVisible();
      const nameInput = page.getByLabel('Institution name');
      await expect(nameInput).not.toHaveValue('');
      await nameInput.fill(name);
      await page.getByLabel('Primary color').fill(color);
      await page.getByRole('button', { name: 'Save branding' }).click();
      await expect(page.getByRole('status')).toHaveText('Organization settings saved.');
    };

    let restored = false;
    try {
      await saveBranding(brandedName, brandedColor);
      // The saving admin's own shell updates without a reload.
      await expectShellName(page, brandedName);

      const alicePage = await pageFor(browser, accounts.alice);
      await alicePage.reload({ waitUntil: 'domcontentloaded' });
      await expectShellName(alicePage, brandedName);
      await expect.poll(() => alicePage.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
      )).toBe(brandedColor);
      // The public branding endpoint is what the sign-in page reads before authentication.
      await visit(alicePage, '/auth/sign-in');
      await expect(alicePage.getByText(brandedName, { exact: true }).first()).toBeVisible();

      await saveBranding(original.name, original.primary_color);
      restored = true;
      const after = await currentJson<Organization>(page, '/api/v2/admin/organization/');
      expect(after).toMatchObject({ name: original.name, logo_url: original.logo_url, primary_color: original.primary_color });
      await signIn(alicePage, accounts.alice);
      await expectShellName(alicePage, original.name);
      await expect(alicePage.getByText(brandedName, { exact: true })).toHaveCount(0);
      await alicePage.context().close();
    } finally {
      if (!restored) {
        await apiRequest(page, 'PUT', '/api/v2/admin/organization/', {
          name: original.name, logo_url: original.logo_url, primary_color: original.primary_color,
        });
      }
    }
    errors.expectNone();
  });
});
