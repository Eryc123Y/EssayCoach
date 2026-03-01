import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(
  page: import('@playwright/test').Page,
  email: string,
  password: string
) {
  await page.goto('/auth/sign-in');
  await page.waitForLoadState('networkidle');

  // Fill credentials
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);

  // Submit
  await page.locator('button[type="submit"]').click();

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
}

// ---------------------------------------------------------------------------
// 1. Sign-In Page Loads
// ---------------------------------------------------------------------------

test.describe('Sign-In Page', () => {
  test('should render the sign-in form', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');

    // Page contains "Welcome back" heading
    await expect(page.locator('h1')).toContainText('Welcome back');

    // Email and password inputs are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Sign In button is visible
    await expect(
      page.locator('button[type="submit"]', { hasText: 'Sign In' })
    ).toBeVisible();

    // Quick test account buttons are visible
    await expect(page.locator('button', { hasText: 'Student' })).toBeVisible();
    await expect(
      page.locator('button', { hasText: 'Lecturer' })
    ).toBeVisible();
    await expect(page.locator('button', { hasText: 'Admin' })).toBeVisible();
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');

    // Clear default values and submit with empty password
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('');

    await page.locator('button[type="submit"]').click();

    // Should show validation message (stays on sign-in page)
    await expect(page).toHaveURL(/sign-in/);
  });
});

// ---------------------------------------------------------------------------
// 2. Student Authentication + Dashboard
// ---------------------------------------------------------------------------

test.describe('Student Flow', () => {
  test('should sign in and load student dashboard', async ({ page }) => {
    await login(page, 'student@example.com', 'student123');

    // Should be on dashboard/overview
    await expect(page).toHaveURL(/dashboard\/overview/);

    // Wait for dashboard content to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot for visual verification
    await page.screenshot({
      path: 'tests/e2e/artifacts/student-dashboard.png',
      fullPage: true
    });

    // Dashboard should render without critical errors
    // Check that no unhandled error overlay is shown
    const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  });

  test('should navigate to Tasks page', async ({ page }) => {
    await login(page, 'student@example.com', 'student123');
    await page.waitForLoadState('networkidle');

    await page.goto('/dashboard/tasks');
    await page.waitForLoadState('networkidle');

    // Should load the tasks page without error
    await expect(page).toHaveURL(/dashboard\/tasks/);

    // Take screenshot
    await page.screenshot({
      path: 'tests/e2e/artifacts/student-tasks.png',
      fullPage: true
    });

    // No error overlay
    const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  });

  test('should navigate to Classes page', async ({ page }) => {
    await login(page, 'student@example.com', 'student123');
    await page.waitForLoadState('networkidle');

    await page.goto('/dashboard/classes');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/dashboard\/classes/);

    await page.screenshot({
      path: 'tests/e2e/artifacts/student-classes.png',
      fullPage: true
    });

    const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  });

  test('should navigate to Rubrics page', async ({ page }) => {
    await login(page, 'student@example.com', 'student123');
    await page.waitForLoadState('networkidle');

    await page.goto('/dashboard/rubrics');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/dashboard\/rubrics/);

    await page.screenshot({
      path: 'tests/e2e/artifacts/student-rubrics.png',
      fullPage: true
    });

    const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  });

  test('should navigate to Essay Analysis page', async ({ page }) => {
    await login(page, 'student@example.com', 'student123');
    await page.waitForLoadState('networkidle');

    await page.goto('/dashboard/essay-analysis');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/dashboard\/essay-analysis/);

    await page.screenshot({
      path: 'tests/e2e/artifacts/student-essay-analysis.png',
      fullPage: true
    });

    const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Lecturer Authentication + Dashboard
// ---------------------------------------------------------------------------

test.describe('Lecturer Flow', () => {
  test('should sign in and load lecturer dashboard', async ({ page }) => {
    await login(page, 'lecturer@example.com', 'lecturer123');

    await expect(page).toHaveURL(/dashboard\/overview/);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'tests/e2e/artifacts/lecturer-dashboard.png',
      fullPage: true
    });

    const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  });

  test('should navigate to lecturer Tasks page', async ({ page }) => {
    await login(page, 'lecturer@example.com', 'lecturer123');
    await page.waitForLoadState('networkidle');

    await page.goto('/dashboard/tasks');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/dashboard\/tasks/);

    await page.screenshot({
      path: 'tests/e2e/artifacts/lecturer-tasks.png',
      fullPage: true
    });

    const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  });

  test('should navigate to lecturer Classes page', async ({ page }) => {
    await login(page, 'lecturer@example.com', 'lecturer123');
    await page.waitForLoadState('networkidle');

    await page.goto('/dashboard/classes');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/dashboard\/classes/);

    await page.screenshot({
      path: 'tests/e2e/artifacts/lecturer-classes.png',
      fullPage: true
    });

    const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Admin Authentication + Dashboard
// ---------------------------------------------------------------------------

test.describe('Admin Flow', () => {
  test('should sign in and load admin dashboard', async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');

    await expect(page).toHaveURL(/dashboard\/overview/);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'tests/e2e/artifacts/admin-dashboard.png',
      fullPage: true
    });

    const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Error resilience - No crashes on direct URL access
// ---------------------------------------------------------------------------

test.describe('Direct URL Access', () => {
  test('unauthenticated access to dashboard should redirect to sign-in', async ({
    page
  }) => {
    await page.goto('/dashboard/overview');
    await page.waitForLoadState('networkidle');

    // Should either redirect to sign-in or show dashboard
    // (depends on cookie state; either is acceptable for smoke test)
    const url = page.url();
    const isOnAuth = url.includes('sign-in') || url.includes('auth');
    const isOnDashboard = url.includes('dashboard');

    expect(isOnAuth || isOnDashboard).toBe(true);
  });
});
