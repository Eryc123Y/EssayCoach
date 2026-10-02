import { expect, test, type Page } from '@playwright/test';
import {
  accounts,
  apiRequest,
  clearSession,
  currentJson,
  fixtures,
  runSeed,
  signIn,
  trackPageErrors,
  visit,
} from './support/e2e';

type Identity = { data: { id: number; role: string } };
type ClassSummary = { class_id: number; class_name: string };
type TaskSummary = { task_id: number; task_title: string };
type SubmissionSummary = { submission_id: number };

const essayText = 'Permission boundaries keep a private essay inside its own course scope.';

// Filled by the first test; the serial mode skips later tests if it fails.
let journeyClassId = 0;
let aliceSubmissionId = 0;

async function signedInIdentity(page: Page) {
  return (await currentJson<Identity>(page, '/api/v2/auth/me/jwt/')).data;
}

test.describe.configure({ mode: 'serial' });

test.describe('permission boundaries', () => {
  test.setTimeout(120_000);
  test.beforeAll(() => runSeed('--fixtures'));

  test('a student is redirected away from admin pages and sees only student scope on shared pages', async ({ page }) => {
    const pageErrors = trackPageErrors(page);
    await signIn(page, accounts.alice);
    const alice = await signedInIdentity(page);
    expect(alice.role).toBe('student');

    // Setup only: a real formal submission whose review page alice will probe.
    const classes = await currentJson<ClassSummary[]>(page, '/api/v2/core/classes/');
    journeyClassId = classes.find((item) => item.class_name === fixtures.journeyClass)!.class_id;
    const tasks = await currentJson<TaskSummary[]>(page, '/api/v2/core/tasks/');
    const task = tasks.find((item) => item.task_title === fixtures.journeyTask)!;
    const created = await apiRequest<SubmissionSummary>(page, 'POST', '/api/v2/core/submissions/', {
      task_id_task: task.task_id,
      user_id_user: alice.id,
      submission_txt: essayText,
    });
    expect(created.status).toBe(200);
    aliceSubmissionId = created.body.submission_id;

    // Admin-only pages redirect a student to their own dashboard on the server.
    for (const adminPage of ['/dashboard/users', '/dashboard/observability']) {
      await visit(page, adminPage);
      await expect(page).toHaveURL(/\/dashboard\/student\/?$/);
    }
    // Assignment creation sends a student back to the assignment list.
    await visit(page, '/dashboard/tasks/new');
    await expect(page).toHaveURL(/\/dashboard\/tasks\/?$/);

    // Staff role dashboards never render for a student; she is sent to her own
    // dashboard and stays signed in.
    for (const staffDashboard of ['/dashboard/lecturer', '/dashboard/admin']) {
      await visit(page, staffDashboard);
      await expect(page).toHaveURL(/\/dashboard\/student\/?$/);
    }
    expect((await apiRequest(page, 'GET', '/api/v2/auth/me/jwt/')).status).toBe(200);

    // The class form has no page guard, but offers a student no course and the
    // API refuses the create.
    await visit(page, '/dashboard/classes/new');
    await expect(page.getByText(/no courses available for class creation/i)).toBeVisible();
    const classCreate = await apiRequest(page, 'POST', '/api/v2/core/classes/', {
      unit_id_unit: 'E2E101',
      class_name: 'Student-made class',
    });
    expect(classCreate.status).toBe(403);

    // Analytics is shared by every role, but a student gets only personal scope:
    // no class picker and no institution overview.
    await visit(page, '/dashboard/analytics');
    await expect(page).toHaveURL(/\/dashboard\/analytics\/?$/);
    await expect(page.getByRole('heading', { name: 'Writing progress' })).toBeVisible();
    await expect(page.getByLabel('Class', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'Institution overview' })).toHaveCount(0);

    // Students may draft private rubrics, but cannot publish one institution-wide.
    await visit(page, '/dashboard/rubrics/new');
    const visibility = page.getByLabel('Visibility');
    await expect(visibility).toBeVisible();
    await expect(visibility.getByRole('option')).toHaveText(['Private']);

    // The staff review page for the student's own unpublished submission exposes
    // no review controls: the assessment API refuses it before publication.
    await visit(page, `/dashboard/review/${aliceSubmissionId}`);
    await expect(page.getByRole('alert').filter({ hasText: /not published/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save teacher review/i })).toHaveCount(0);
    await expect(page.getByLabel('Reviewed score')).toHaveCount(0);
    await expect(page.getByText('AI suggested')).toHaveCount(0);

    // API: staff and admin endpoints refuse a student token.
    expect((await apiRequest(page, 'GET', '/api/v2/admin/users/')).status).toBe(403);
    expect((await apiRequest(page, 'GET', '/api/v2/analytics/institution/')).status).toBe(403);
    expect((await apiRequest(page, 'GET', `/api/v2/core/assessments/${aliceSubmissionId}/audit/`)).status).toBe(403);
    expect((await apiRequest(page, 'GET', `/api/v2/core/assessments/${aliceSubmissionId}/`)).status).toBe(404);
    pageErrors.expectNone();
  });

  test('a lecturer from another class cannot open the journeys class or its submissions', async ({ page }) => {
    const pageErrors = trackPageErrors(page);
    await clearSession(page);
    await signIn(page, accounts.outsider);
    expect((await signedInIdentity(page)).role).toBe('lecturer');

    // Class list and class page: only the outsider's own class is reachable.
    await visit(page, '/dashboard/classes');
    await expect(page.getByText(fixtures.otherClass).first()).toBeVisible();
    await expect(page.getByText(fixtures.journeyClass)).toHaveCount(0);
    await visit(page, `/dashboard/classes/${journeyClassId}`);
    await expect(page.getByRole('alert').filter({ hasText: 'Could not load this class' })).toBeVisible();
    await expect(page.getByRole('heading', { name: fixtures.journeyClass })).toHaveCount(0);

    // Review workspace and the submission page reveal neither essay nor scores.
    await visit(page, `/dashboard/review/${aliceSubmissionId}`);
    await expect(page.getByRole('alert').filter({ hasText: /outside your/i })).toBeVisible();
    await expect(page.getByText(essayText)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /save teacher review/i })).toHaveCount(0);
    const submissionPage = await page.goto(`/dashboard/submissions/${aliceSubmissionId}`);
    expect(submissionPage?.status()).toBe(404);
    await expect(page.getByText(essayText)).toHaveCount(0);

    // API: every course-scoped read or write is refused.
    for (const url of [
      `/api/v2/core/classes/${journeyClassId}/`,
      `/api/v2/core/classes/${journeyClassId}/students/`,
      `/api/v2/core/submissions/${aliceSubmissionId}/`,
      `/api/v2/core/assessments/${aliceSubmissionId}/`,
      `/api/v2/core/assessments/${aliceSubmissionId}/audit/`,
    ]) {
      expect((await apiRequest(page, 'GET', url)).status, url).toBe(403);
    }
    const visible = await currentJson<SubmissionSummary[]>(page, '/api/v2/core/submissions/');
    expect(visible.map((item) => item.submission_id)).not.toContain(aliceSubmissionId);
    const review = await apiRequest(page, 'POST', `/api/v2/core/assessments/${aliceSubmissionId}/review/`, {
      expected_version: 1,
      items: [],
    });
    expect(review.status).toBe(403);
    pageErrors.expectNone();
  });

  test('the removed advanced batch-update endpoint is gone even for an admin', async ({ page }) => {
    await clearSession(page);
    await signIn(page, accounts.admin);
    expect((await signedInIdentity(page)).role).toBe('admin');
    // Contrast: the admin is authorised for the admin users directory.
    expect((await apiRequest(page, 'GET', '/api/v2/admin/users/')).status).toBe(200);
    const removed = await apiRequest(page, 'POST', '/api/v2/advanced/batch-update/', { updates: [] });
    expect(removed.status).toBe(404);
  });
});
