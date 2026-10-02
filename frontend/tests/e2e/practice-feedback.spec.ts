import { expect, test } from '@playwright/test';
import { accounts, apiRequest, runSeed, signInAfterHydration, trackPageErrors, visit } from './support/e2e';

type PracticeRun = {
  run_id: string;
  status: string;
  report: { overall_score: number; headline: string } | null;
};

const goal = 'Argue that public libraries deserve more funding';
const essay =
  'Public libraries deserve more funding because they give every resident free access to books, ' +
  'quiet study space and reliable internet. Cutting their budgets removes one of the few civic spaces open to all.';
const headline = 'E2E deterministic practice feedback';

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  runSeed('--fixtures');
});

let essayId = '';
let runId = '';

test('a student recovers from a failed practice analysis and reads the report', async ({ page }) => {
  const errors = trackPageErrors(page);
  await signInAfterHydration(page, accounts.alice);
  await visit(page, '/dashboard/essay-analysis');
  await expect(page.getByRole('heading', { name: 'Writing studio' })).toBeVisible();

  await page.getByLabel('What are you trying to write?').fill(goal);
  await page.getByRole('textbox', { name: 'Essay draft' }).fill(essay);

  const analyzeResponse = page.waitForResponse(
    (response) => /\/api\/v2\/practice\/essays\/[^/]+\/analyze\/$/.test(new URL(response.url()).pathname)
      && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Get practice feedback' }).click();
  const started = await analyzeResponse;
  expect(started.status()).toBe(200);
  const startedRun = (await started.json()) as PracticeRun;
  runId = startedRun.run_id;
  essayId = new URL(started.url()).pathname.split('/').at(-3) ?? '';
  expect(startedRun.status).toBe('pending');
  await expect(page.getByRole('heading', { name: 'Reading your draft' })).toBeVisible();

  // The provider outage is processed out of band; the studio polls the run.
  runSeed('--process-practice', 'fail');
  await expect(page.getByRole('heading', { name: 'Analysis stopped' })).toBeVisible({ timeout: 15_000 });
  // The failure is explained without leaking the raw provider error.
  const stopped = page.locator('.practice-wait');
  await expect(stopped.getByRole('paragraph')).not.toBeEmpty();
  await expect(stopped).not.toContainText('E2E simulated provider outage');

  const retryResponse = page.waitForResponse(
    (response) => response.url().includes(`/api/v2/practice/runs/${runId}/retry/`),
  );
  await page.getByRole('button', { name: 'Retry analysis' }).click();
  expect((await retryResponse).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Reading your draft' })).toBeVisible();

  runSeed('--process-practice', 'succeed');
  await expect(page.getByRole('heading', { name: headline })).toBeVisible({ timeout: 15_000 });
  const scoreCard = page.locator('.practice-score');
  await expect(scoreCard).toHaveText('74/100');
  await expect(page.getByText('The claim is clear; add one more piece of evidence.')).toBeVisible();
  await expect(page.getByText('Clear claim', { exact: true })).toBeVisible();
  await expect(page.getByText('Support the claim with a cited source')).toBeVisible();
  await expect(page.getByRole('img', { name: /writing skills/i })).toBeVisible();

  const stored = await apiRequest<PracticeRun>(page, 'GET', `/api/v2/practice/runs/${runId}/`);
  expect(stored.status).toBe(200);
  expect(stored.body.status).toBe('succeeded');
  expect(stored.body.report?.overall_score).toBe(74);

  // After a reload the saved draft and its feedback history are still there.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('What are you trying to write?')).toHaveValue(goal);
  await expect(page.getByRole('textbox', { name: 'Essay draft' })).toHaveValue(essay);
  await page.getByRole('button', { name: /Revision 1/ }).click();
  await expect(page.getByRole('heading', { name: headline })).toBeVisible();
  await expect(scoreCard).toHaveText('74/100');

  errors.expectNone();
});

test('another student cannot read or retry the practice run', async ({ page }) => {
  expect(runId, 'the first test must have created a run').not.toBe('');
  await signInAfterHydration(page, accounts.bob);

  const run = await apiRequest(page, 'GET', `/api/v2/practice/runs/${runId}/`);
  expect(run.status).toBe(404);
  const history = await apiRequest(page, 'GET', `/api/v2/practice/essays/${essayId}/runs/`);
  expect(history.status).toBe(404);
  const draft = await apiRequest(page, 'GET', `/api/v2/practice/essays/${essayId}/`);
  expect(draft.status).toBe(404);
  const chat = await apiRequest(page, 'GET', `/api/v2/practice/runs/${runId}/chat/`);
  expect(chat.status).toBe(404);
  const retry = await apiRequest(page, 'POST', `/api/v2/practice/runs/${runId}/retry/`);
  expect([403, 404, 409]).toContain(retry.status);

  const own = await apiRequest<Array<{ essay_id: string }>>(page, 'GET', '/api/v2/practice/essays/');
  expect(own.status).toBe(200);
  expect(own.body.map((item) => item.essay_id)).not.toContain(essayId);

  // Bob's studio opens empty rather than showing Alice's draft.
  await visit(page, '/dashboard/essay-analysis');
  await expect(page.getByLabel('What are you trying to write?')).toHaveValue('');
  await expect(page.getByRole('button', { name: goal })).toHaveCount(0);
});
