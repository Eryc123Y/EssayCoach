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
type Assessment = {
  status: string;
  version: number;
  final_score: string | null;
  can_publish: boolean;
  can_review: boolean;
  items: Array<{ rubric_item_id: number; score: number; comment: string; source: string }>;
  ai_proposal: { items: Array<{ score: number }> } | null;
};
type AuditEvent = { action: string; actor_id: number | null };

const essayText = 'Clear claims need evidence; this essay offers a claim and one supporting source.';
const overrideComment = 'Reviewer override: the evidence is thin, so the score is lowered.';
// The deterministic E2E scorer proposes max-1 (9 / 10); the reviewer lowers it.
const aiScore = 9;
const overriddenScore = 6;

async function signedInId(page: Page) {
  return (await currentJson<Identity>(page, '/api/v2/auth/me/jwt/')).data.id;
}

test.describe.configure({ mode: 'serial' });

test.describe('lecturer override and course-lead publication', () => {
  test.setTimeout(180_000);
  test.beforeAll(() => runSeed('--fixtures'));

  test('a non-lead reviewer overrides the AI score, only the course lead publishes, and the student sees the override', async ({ page }) => {
    const pageErrors = trackPageErrors(page);

    // Student submits the journey assignment through the rendered form.
    await signIn(page, accounts.alice);
    await visit(page, '/dashboard/tasks');
    await expect(page.getByText(fixtures.journeyTask, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /view assignment/i }).click();
    await page.waitForURL(/\/dashboard\/tasks\/\d+\/?$/, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/formal essay text/i).fill(essayText);
    await page.getByRole('button', { name: /review and submit/i }).click();
    await page.getByRole('button', { name: /submit essay/i }).click();
    await expect(page.getByText(/submitted successfully/i)).toBeVisible();
    await page.getByRole('link', { name: /view submission and result/i }).click();
    await page.waitForURL(/\/dashboard\/submissions\/\d+\/?$/, { waitUntil: 'domcontentloaded' });
    const submissionId = Number(page.url().match(/submissions\/(\d+)/)?.[1]);
    expect(Number.isInteger(submissionId)).toBe(true);

    const job = await currentJson<{ job_id: string; status: string }>(page, `/api/v2/ai-feedback/jobs/submission/${submissionId}/`);
    expect(job.status).toBe('pending');
    // Deterministic test double through the durable queue, not a live model.
    runSeed('--process-job', job.job_id);

    // Non-lead reviewer overrides the AI proposal in the review workspace.
    await clearSession(page);
    await signIn(page, accounts.reviewer);
    const reviewerId = await signedInId(page);
    await visit(page, `/dashboard/review/${submissionId}`);
    await expect(page.getByText('AI proposal ready for review')).toBeVisible();
    await expect(page.getByText(`AI suggested ${aiScore} / 10`)).toBeVisible();
    const score = page.getByLabel('Reviewed score');
    await expect(score).toHaveValue(String(aiScore));
    await score.fill(String(overriddenScore));
    await page.getByLabel('Teacher comment').fill(overrideComment);
    await page.getByRole('button', { name: 'Save teacher review' }).click();
    await expect(page.getByText('Reviewed; awaiting course lead release')).toBeVisible();

    // The reviewer gets no release control, and the API refuses a direct publish.
    await expect(page.getByText('A course lead must publish this result.')).toBeVisible();
    await expect(page.getByRole('button', { name: /confirm release/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /publish final grade/i })).toHaveCount(0);
    const reviewed = await currentJson<Assessment>(page, `/api/v2/core/assessments/${submissionId}/`);
    expect(reviewed).toMatchObject({ status: 'lecturer_reviewed', can_publish: false, can_review: true });
    expect(reviewed.items).toEqual([expect.objectContaining({ score: overriddenScore, comment: overrideComment, source: 'revised' })]);
    expect(reviewed.ai_proposal?.items[0].score).toBe(aiScore);
    const refused = await apiRequest(page, 'POST', `/api/v2/core/assessments/${submissionId}/publish/`, {
      expected_version: reviewed.version,
    });
    expect(refused.status).toBe(403);

    // Before release the student still sees no grade.
    await clearSession(page);
    await signIn(page, accounts.alice);
    await visit(page, `/dashboard/submissions/${submissionId}`);
    await expect(page.getByText('Awaiting teacher review and release')).toBeVisible();
    await expect(page.getByText(/\/ 100/)).toHaveCount(0);
    await expect(page.getByText(overrideComment)).toHaveCount(0);
    expect((await apiRequest(page, 'GET', `/api/v2/core/assessments/${submissionId}/`)).status).toBe(404);

    // Course lead confirms and publishes the reviewer's score unchanged.
    await clearSession(page);
    await signIn(page, accounts.lead);
    const leadId = await signedInId(page);
    await visit(page, `/dashboard/review/${submissionId}`);
    await expect(page.getByText('Reviewed; awaiting course lead release')).toBeVisible();
    await expect(page.getByLabel('Reviewed score')).toHaveValue(String(overriddenScore));
    await page.getByRole('button', { name: 'Confirm release' }).click();
    await page.getByRole('button', { name: 'Publish final grade' }).click();
    await expect(page.getByText('Published to student')).toBeVisible();
    await expect(page.getByText(/Final score: 60(\.0+)? \/ 100/)).toBeVisible();

    const audit = await currentJson<AuditEvent[]>(page, `/api/v2/core/assessments/${submissionId}/audit/`);
    expect(audit.map((event) => [event.action, event.actor_id])).toEqual([
      ['ai_proposal_recorded', null],
      ['lecturer_reviewed', reviewerId],
      ['lead_confirmed', leadId],
      ['published', leadId],
    ]);

    // The student now sees the overridden score and comment, not the AI proposal.
    await clearSession(page);
    await signIn(page, accounts.alice);
    await visit(page, `/dashboard/submissions/${submissionId}`);
    await expect(page.getByText('Result published')).toBeVisible();
    await expect(page.getByText(`${overriddenScore} / 10`, { exact: true })).toBeVisible();
    await expect(page.getByText(`${aiScore} / 10`, { exact: true })).toHaveCount(0);
    await expect(page.getByText(overrideComment)).toBeVisible();
    const published = await currentJson<Assessment>(page, `/api/v2/core/assessments/${submissionId}/`);
    expect(published.status).toBe('published');
    expect(Number(published.final_score)).toBe(60);
    expect(published.ai_proposal).toBeNull();
    pageErrors.expectNone();
  });
});
