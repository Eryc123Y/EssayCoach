import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';
import {
  accounts, apiRequest, currentJson, fixtures, runSeed, signIn, trackPageErrors, visit, type Credentials,
} from './support/e2e';

type Assessment = {
  version: number;
  status: string;
  ai_proposal: { items: Array<{ rubric_item_id: number; score: number; comment: string }> } | null;
};
type Interaction = { id: number; content: string | null; status: string; interaction_type: string };
type Report = { id: number; interaction_id: number | null; target_type: string; target_status: string; status: string; decision: string };
type FeedEssay = { submission_id: number; status: string; task_title: string; comments_count: number };

const essayText = 'Community journeys need a clear claim. Shared drafts help classmates see how evidence supports it.';
const caption = 'E2E: my released argument essay';
const commentText = 'E2E comment from Bob: the second sentence could use a citation.';

/** A fresh browser context per person keeps each role signed in independently. */
async function pageFor(browser: Browser, credentials: Credentials) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, credentials);
  return page;
}

async function openCommunity(page: Page, mode?: 'Moderation' | 'My shares') {
  await visit(page, '/dashboard/community');
  await expect(page.getByRole('heading', { name: 'Writing together' })).toBeVisible();
  if (mode) await page.getByRole('button', { name: mode, exact: true }).click();
}

function essayCard(page: Page): Locator {
  return page.locator('article').filter({ has: page.getByRole('heading', { name: fixtures.journeyTask }) });
}

/** Expand the shared essay's responses and wait for them to load. */
async function openResponses(page: Page) {
  const card = essayCard(page);
  await expect(card).toHaveCount(1);
  const loaded = page.waitForResponse((response) => /\/api\/v2\/social\/\d+\/interactions\/?/.test(response.url()));
  await card.getByRole('button', { name: /responses$/ }).click();
  expect((await loaded).ok()).toBe(true);
  await expect(card.getByRole('button', { name: 'Post response' })).toBeVisible();
  return card;
}

/** The response block that holds the given text. */
function responseBlock(card: Locator, text: string): Locator {
  return card.getByText(text, { exact: true }).locator('..');
}

async function reportComment(page: Page) {
  await openCommunity(page);
  const card = await openResponses(page);
  const block = responseBlock(card, commentText);
  await block.getByRole('button', { name: 'Report' }).click();
  await block.getByLabel('Report reason').selectOption('offensive');
  const reported = page.waitForResponse((response) => response.url().includes('/api/v2/social/report/'));
  await block.getByRole('button', { name: 'Submit report' }).click();
  expect((await reported).ok()).toBe(true);
  await expect(block.getByRole('button', { name: 'Submit report' })).toHaveCount(0);
}

/** The open report on Bob's comment as the moderator sees it. */
async function openReport(page: Page) {
  await openCommunity(page, 'Moderation');
  const reports = page.locator('section').filter({ has: page.getByRole('heading', { name: /Reports needing review/ }) });
  await expect(reports.getByRole('heading')).toHaveText(/Reports needing review · 1$/);
  // A response report names its target type and offers response decisions only.
  await expect(reports).toContainText('Offensive · Comment · Bob Peer');
  await expect(reports.getByText(commentText, { exact: true })).toBeVisible();
  await expect(reports.getByRole('button', { name: 'Hide essay' })).toHaveCount(0);
  await expect(reports.getByRole('button', { name: 'Remove essay' })).toHaveCount(0);
  return reports;
}

/**
 * What a non-moderating student sees on the shared essay. The essay itself must
 * stay in the feed whatever happens to the comment. A hidden comment is withheld
 * from peers but, by design, still shown to its own author flagged as hidden.
 */
async function expectStudentSees(page: Page, comment: 'visible' | 'hidden-to-author' | 'absent') {
  await openCommunity(page);
  const card = await openResponses(page);
  await expect(card.getByText(essayText, { exact: false })).toBeVisible();
  await expect(card).toContainText(caption);
  const shown = comment !== 'absent';
  await expect(card.getByText(commentText, { exact: true })).toHaveCount(shown ? 1 : 0);
  await expect(card.getByRole('button', { name: /responses$/ })).toHaveText(shown ? '1 responses' : '0 responses');
  if (shown) {
    const block = responseBlock(card, commentText);
    await expect(block.getByText('Hidden', { exact: true })).toHaveCount(comment === 'hidden-to-author' ? 1 : 0);
    await expect(block.getByRole('button', { name: 'Restore response' })).toHaveCount(0);
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('community sharing and response moderation', () => {
  test.setTimeout(150_000);
  // seed_e2e clears E2E shared essays and reports before resetting accounts.
  test.beforeAll(() => runSeed('--fixtures'));

  let submissionId = 0;
  let commentId = 0;

  test('a released essay is shared, answered by a classmate, and the response reported', async ({ page, browser }) => {
    const errors = trackPageErrors(page);

    // Setup through the API: Alice submits, the deterministic test double scores,
    // and the course lead reviews and publishes. Sharing requires a released grade.
    await signIn(page, accounts.alice);
    const me = await currentJson<{ user_id: number }>(page, '/api/v2/core/users/me/');
    type TaskRow = { task_id: number; task_title: string };
    const payload = await currentJson<TaskRow[] | { results: TaskRow[] }>(page, '/api/v2/core/tasks/');
    const tasks = Array.isArray(payload) ? payload : payload.results;
    const task = tasks.find((item) => item.task_title === fixtures.journeyTask);
    expect(task).toBeTruthy();
    const submitted = await apiRequest<{ submission_id: number }>(page, 'POST', '/api/v2/core/submissions/', {
      task_id_task: task!.task_id, user_id_user: me.user_id, submission_txt: essayText,
    });
    expect(submitted.status).toBe(200);
    submissionId = submitted.body.submission_id;
    const job = await currentJson<{ job_id: string; status: string }>(page, `/api/v2/ai-feedback/jobs/submission/${submissionId}/`);
    expect(job.status).toBe('pending');
    runSeed('--process-job', job.job_id);

    const lead = await pageFor(browser, accounts.lead);
    const draft = await currentJson<Assessment>(lead, `/api/v2/core/assessments/${submissionId}/`);
    expect(draft.ai_proposal?.items.length).toBeGreaterThan(0);
    const reviewed = await apiRequest<Assessment>(lead, 'POST', `/api/v2/core/assessments/${submissionId}/review/`, {
      expected_version: draft.version,
      items: draft.ai_proposal!.items.map(({ rubric_item_id, score, comment }) => ({ rubric_item_id, score, comment })),
    });
    expect(reviewed.status).toBe(200);
    const published = await apiRequest<Assessment>(lead, 'POST', `/api/v2/core/assessments/${submissionId}/publish/`, {
      expected_version: reviewed.body.version,
    });
    expect(published.status).toBe(200);
    expect(published.body.status).toBe('published');
    await lead.context().close();

    // Alice shares the released essay with her class.
    await openCommunity(page);
    await page.getByRole('button', { name: 'Share an essay' }).click();
    const dialog = page.getByRole('dialog', { name: 'Share your writing' });
    await expect(dialog.getByRole('combobox', { name: 'Essay', exact: true })).toContainText(fixtures.journeyTask);
    await dialog.getByRole('combobox', { name: 'Essay', exact: true }).selectOption(String(submissionId));
    await expect(dialog.getByRole('combobox', { name: 'Who can see it' })).toHaveValue('class');
    await dialog.getByLabel('Caption').fill(caption);
    await dialog.getByRole('button', { name: 'Share essay', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(essayCard(page)).toContainText(caption);
    await expect(essayCard(page)).toContainText(`${fixtures.journeyClass} · Class`);

    // Bob, a classmate, finds it in the feed and comments.
    const bob = await pageFor(browser, accounts.bob);
    await openCommunity(bob);
    const bobCard = await openResponses(bob);
    await expect(bobCard).toContainText('Alice Author');
    await bobCard.getByLabel('What works well? What could be clearer?').fill(commentText);
    await bobCard.getByLabel('Response type').selectOption('comment');
    await bobCard.getByRole('button', { name: 'Post response' }).click();
    await expect(bobCard.getByText(commentText, { exact: true })).toBeVisible();
    await expect(responseBlock(bobCard, commentText)).toContainText('Bob Peer · Comment');
    await bob.context().close();

    // Alice reports Bob's comment, not her essay.
    await reportComment(page);
    const mine = await currentJson<Report[]>(page, '/api/v2/social/reports/me/');
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ target_type: 'comment', status: 'open', target_status: 'visible' });
    commentId = mine[0].interaction_id!;
    expect(commentId).toBeGreaterThan(0);
    errors.expectNone();
  });

  test('hiding a reported comment keeps the essay visible; restoring brings the comment back', async ({ page, browser }) => {
    test.skip(!submissionId || !commentId, 'requires the shared essay and reported comment');
    const errors = trackPageErrors(page);
    await signIn(page, accounts.lead);

    const reports = await openReport(page);
    await reports.getByRole('button', { name: 'Hide response' }).click();
    await expect(reports).toContainText('No open reports.');

    // The moderator still sees the comment, marked hidden, with a restore action.
    const card = await openResponses(page);
    const hidden = responseBlock(card, commentText);
    await expect(hidden.getByText('Hidden', { exact: true })).toBeVisible();
    await expect(hidden.getByRole('button', { name: 'Restore response' })).toBeVisible();

    // Alice (a peer of the commenter) no longer sees the comment; the essay stays.
    const alice = await pageFor(browser, accounts.alice);
    await expectStudentSees(alice, 'absent');
    const aliceResponses = await currentJson<Interaction[]>(alice, `/api/v2/social/${submissionId}/interactions/`);
    expect(aliceResponses.map((item) => item.id)).not.toContain(commentId);

    // Bob still finds the essay in his class feed; his own comment is flagged as hidden.
    const bob = await pageFor(browser, accounts.bob);
    await expectStudentSees(bob, 'hidden-to-author');
    const bobFeed = await currentJson<FeedEssay[]>(bob, '/api/v2/social/feed/');
    expect(bobFeed.find((item) => item.submission_id === submissionId)).toMatchObject({ status: 'visible' });
    const bobResponses = await currentJson<Interaction[]>(bob, `/api/v2/social/${submissionId}/interactions/`);
    expect(bobResponses.find((item) => item.id === commentId)).toMatchObject({ status: 'hidden' });

    await hidden.getByRole('button', { name: 'Restore response' }).click();
    await expect(hidden.getByText('Hidden', { exact: true })).toHaveCount(0);
    await expect(hidden.getByRole('button', { name: 'Restore response' })).toHaveCount(0);
    await expect(card.getByText(commentText, { exact: true })).toBeVisible();

    await expectStudentSees(bob, 'visible');
    await expectStudentSees(alice, 'visible');
    await bob.context().close();
    await alice.context().close();
    errors.expectNone();
  });

  test('removing a comment on a second report deletes only the comment', async ({ page, browser }) => {
    test.skip(!submissionId || !commentId, 'requires the shared essay and reported comment');
    const errors = trackPageErrors(page);

    const alice = await pageFor(browser, accounts.alice);
    await reportComment(alice);

    await signIn(page, accounts.lead);
    const reports = await openReport(page);
    await reports.getByRole('button', { name: 'Remove response' }).click();
    await expect(reports).toContainText('No open reports.');

    const card = await openResponses(page);
    await expect(card.getByText(commentText, { exact: true })).toHaveCount(0);
    await expect(card).toContainText(caption);

    const history = await currentJson<Report[]>(page, '/api/v2/social/moderation/reports/?status=all');
    const commentReports = history.filter((item) => item.interaction_id === commentId);
    expect(commentReports).toHaveLength(2);
    for (const report of commentReports) {
      expect(report).toMatchObject({ target_type: 'comment', target_status: 'removed', status: 'resolved' });
    }
    expect(commentReports.map((item) => item.decision).sort()).toEqual(['hide', 'remove']);
    const essay = await currentJson<FeedEssay>(page, `/api/v2/social/feed/${submissionId}/`);
    expect(essay.status).toBe('visible');

    // Removal is final for everyone, including the comment's author.
    const bob = await pageFor(browser, accounts.bob);
    await expectStudentSees(bob, 'absent');
    await expectStudentSees(alice, 'absent');
    await bob.context().close();
    await alice.context().close();
    errors.expectNone();
  });
});
