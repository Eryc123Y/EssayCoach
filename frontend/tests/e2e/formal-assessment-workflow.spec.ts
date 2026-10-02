import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const admin = { email: 'admin@e2e.essaycoach.example.com', password: 'E2EPass123!' };
const teacher = { email: 'teacher@e2e.essaycoach.example.com', password: 'TeacherPass123!' };
const student = { email: 'student@e2e.essaycoach.example.com', password: 'StudentPass123!' };
const className = 'E2E Composition Workshop';
const assignmentTitle = 'E2E Formal Argument';

function backendDirectory() {
  return process.env.E2E_BACKEND_DIR || path.resolve(__dirname, '../../../backend');
}

function runSeed(...args: string[]) {
  const python = process.env.E2E_BACKEND_PYTHON || path.join(backendDirectory(), '.venv/bin/python');
  execFileSync(python, ['manage.py', 'seed_e2e', ...args], {
    cwd: backendDirectory(),
    env: process.env,
    stdio: 'pipe',
  });
}

async function visit(page: Page, url: string) {
  // A rendered route is ready for the following UI assertion once its document
  // is parsed; no route relies on long lived client connections settling.
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

async function signIn(page: Page, credentials: { email: string; password: string }) {
  // The rendered sign-in form becomes interactive after the client restores
  // the unauthenticated session.  Wait for that real application request,
  // rather than using a timing delay in the dev server.
  const sessionCheck = page.waitForResponse(
    (response) => response.url().includes('/api/v2/auth/getUserInfo/'),
    { timeout: 3_000 },
  ).catch(() => undefined);
  await visit(page, '/auth/sign-in');
  await sessionCheck;
  await page.getByLabel(/email address/i).fill(credentials.email);
  await page.locator('input[type="password"]').fill(credentials.password);
  // Keyboard traversal crosses the password visibility control and the
  // Remember me checkbox before reaching submit. Each focused control must
  // retain an accessible name.
  const submit = page.getByRole('button', { name: /sign in/i });
  for (let index = 0; index < 6 && !(await submit.evaluate((element) => document.activeElement === element)); index += 1) {
    await page.keyboard.press('Tab');
    const focusedName = await page.locator(':focus').evaluate((element) =>
      element.getAttribute('aria-label') || element.textContent ||
      (element instanceof HTMLInputElement
        ? Array.from(element.labels ?? []).map((label) => label.textContent ?? '').join(' ')
        : '') ||
      element.getAttribute('name') || '',
    );
    expect(focusedName.trim()).not.toBe('');
  }
  await expect(submit).toBeFocused();
  await submit.click();
  await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
}

async function signOutBrowser(page: Page) {
  await page.context().clearCookies();
  await visit(page, '/auth/sign-in');
  await page.evaluate(() => localStorage.clear());
}

async function activateInvitation(page: Page, invitationUrl: string, first: string, last: string, password: string) {
  await visit(page, invitationUrl);
  await expect(page.getByRole('heading', { name: /invitation/i })).toBeVisible();
  await page.getByLabel(/first name/i).fill(first);
  await page.getByLabel(/last name/i).fill(last);
  await page.locator('input[type="password"]').nth(0).fill(password);
  await page.locator('input[type="password"]').nth(1).fill(password);
  await page.getByRole('button', { name: /activate invitation/i }).click();
  await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
}

async function currentJson<T>(page: Page, url: string): Promise<T> {
  return page.evaluate(async (requestUrl) => {
    const response = await fetch(requestUrl, { credentials: 'include' });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  }, url);
}

test.describe.configure({ mode: 'serial' });

test.describe('invite-only formal assessment workflow', () => {
  // The browser workflow covers four independently rendered roles. Production
  // startup happens outside this budget in CI, so it cannot mask a slow build.
  test.setTimeout(180_000);
  test.beforeAll(() => runSeed());

  test('admin invitation through course-lead publication is reproducible and keeps grades private until release', async ({ page }, testInfo) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));

    // Admin creates a real one-time lecturer invitation in the browser.
    await signIn(page, admin);
    const classes = await currentJson<Array<{ class_id: number; class_name: string }>>(page, '/api/v2/core/classes/');
    const staging = classes.find(item => item.class_name === 'E2E invitation staging class');
    expect(staging).toBeTruthy();
    await visit(page, `/dashboard/classes/${staging!.class_id}`);
    await page.getByRole('button', { name: /invite lecturer/i }).click();
    await page.locator('#lecturer-email').fill(teacher.email);
    await page.getByLabel(/make course lead/i).click();
    await page.getByRole('button', { name: /create invitation link/i }).click();
    const teacherInvitation = await page.locator('#lecturer-invitation-link').inputValue();
    expect(teacherInvitation).toContain('/auth/sign-up#token=');
    expect(teacherInvitation).not.toContain(teacher.email);

    // The invitation activation form, class creation form, and assignment form
    // are all exercised through rendered controls.
    await signOutBrowser(page);
    await activateInvitation(page, teacherInvitation, 'Taylor', 'Teacher', teacher.password);
    await visit(page, '/dashboard/classes/new');
    await page.locator('#unit').click();
    const classUnit = page.getByRole('option', { name: /E2E101/ });
    await expect(classUnit).toBeVisible();
    await classUnit.click();
    await page.locator('#name').fill(className);
    await page.locator('#desc').fill('A class created by the E2E acceptance flow.');
    const createClass = page.getByRole('button', { name: /create class/i });
    await expect(createClass).toBeEnabled();
    await createClass.click();
    await page.waitForURL(/\/dashboard\/classes\/?$/, { waitUntil: 'domcontentloaded' });

    const teacherClasses = await currentJson<Array<{ class_id: number; class_name: string }>>(page, '/api/v2/core/classes/');
    const e2eClass = teacherClasses.find(item => item.class_name === className);
    expect(e2eClass).toBeTruthy();

    await visit(page, '/dashboard/tasks/new');
    await page.locator('#title').fill(assignmentTitle);
    await page.locator('#desc').fill('Write a concise evidence-based argument.');
    await page.locator('#instructions').fill('State a claim and support it with one source.');
    await page.locator('#unit').click();
    await page.getByRole('option', { name: /E2E101/ }).click();
    await page.locator('#rubric').click();
    await page.getByRole('option', { name: 'E2E Argument Rubric' }).click();
    await page.locator('#class').click();
    await page.getByRole('option', { name: className }).click();
    await page.locator('#due').fill('2035-01-01T12:00');
    await page.locator('#status').click();
    await page.getByRole('option', { name: /^Published$/ }).click();
    const createAssignment = page.getByRole('button', { name: /create assignment/i });
    await expect(createAssignment).toBeEnabled();
    await createAssignment.click();
    await page.waitForURL(/\/dashboard\/tasks\/?$/, { waitUntil: 'domcontentloaded' });

    // Lecturer invites a student to the newly created class.  This stays in the
    // browser so activation covers the actual invitation contract.
    await visit(page, `/dashboard/classes/${e2eClass!.class_id}`);
    await page.getByRole('button', { name: /invite students/i }).click();
    await page.locator('#student-emails').fill(student.email);
    await page.getByRole('button', { name: /create invitation links/i }).click();
    const studentInvitation = await page.getByLabel(`${student.email} invitation link`).inputValue();
    expect(studentInvitation).toContain('/auth/sign-up#token=');
    expect(studentInvitation).not.toContain(student.email);

    await signOutBrowser(page);
    await activateInvitation(page, studentInvitation, 'Sam', 'Student', student.password);
    await visit(page, '/dashboard/tasks');
    await expect(page.getByText(assignmentTitle, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /view assignment/i }).click();
    await page.waitForURL(/\/dashboard\/tasks\/\d+\/?$/, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/formal essay text/i).fill('A clear claim with evidence makes an argument persuasive.');
    await page.getByRole('button', { name: /review and submit/i }).click();
    await page.getByRole('button', { name: /submit essay/i }).click();
    await expect(page.getByText(/submitted successfully/i)).toBeVisible();
    const submissionLink = page.getByRole('link', { name: /view submission and result/i });
    await submissionLink.click();
    await page.waitForURL(/\/dashboard\/submissions\/\d+\/?$/, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/awaiting.*review|awaiting teacher review/i)).toBeVisible();
    await expect(page.getByText(/\/ 100/)).toHaveCount(0);

    const submissionId = Number(page.url().match(/submissions\/(\d+)/)?.[1]);
    expect(Number.isInteger(submissionId)).toBe(true);
    const job = await currentJson<{ job_id: string; status: string }>(page, `/api/v2/ai-feedback/jobs/submission/${submissionId}/`);
    expect(job.status).toBe('pending');
    // This command uses DeterministicE2EScoringProvider through the normal durable
    // queue.  It is a test double, not a live Codex/AI verification.
    runSeed('--process-job', job.job_id);

    await signOutBrowser(page);
    await signIn(page, teacher);
    await visit(page, `/dashboard/review/${submissionId}`);
    await expect(page.getByText(/ai proposal ready for review/i)).toBeVisible();
    await page.getByRole('button', { name: /save teacher review/i }).click();
    await expect(page.getByText(/reviewed.*awaiting.*release/i)).toBeVisible();
    await page.getByRole('button', { name: /confirm release/i }).click();
    await page.getByRole('button', { name: /publish final grade/i }).click();
    await expect(page.getByText(/published to student/i)).toBeVisible();

    // The same teacher is course lead, so the UI performs review and release as
    // separate actions.  The API audit is the durable proof of both events.
    const audit = await currentJson<Array<{ action: string }>>(page, `/api/v2/core/assessments/${submissionId}/audit/`);
    expect(audit.map(event => event.action)).toEqual([
      'ai_proposal_recorded', 'lecturer_reviewed', 'lead_confirmed', 'published',
    ]);

    await signOutBrowser(page);
    await signIn(page, student);
    await visit(page, `/dashboard/submissions/${submissionId}`);
    await expect(page.getByText(/result published/i)).toBeVisible();
    await expect(page.getByText(/\/ 100/)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('formal-assessment-published-en.png'), fullPage: true });
    await page.getByRole('button', { name: '中文' }).click();
    await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('formal-assessment-published-zh-mobile.png'), fullPage: true });
    expect(runtimeErrors).toEqual([]);
  });
});
