import { expect, test, type Locator, type Page } from '@playwright/test';
import { accounts, currentJson, fixtures, runSeed, signIn, trackPageErrors, visit } from './support/e2e';

type RubricDetail = {
  rubric_id: number;
  rubric_desc: string;
  visibility: string;
  rubric_items: Array<{
    rubric_item_name: string;
    rubric_item_weight: string;
    level_descriptions: Array<{ level_min_score: number; level_max_score: number; level_desc: string }>;
  }>;
};
type TaskRow = { task_id: number; task_title: string; rubric_id_marking_rubric: number; class_id_class: number | null; task_status: string };

const rubricName = 'E2E Authored Argument Rubric';
const revisedName = 'E2E Authored Argument Rubric v2';
const assignmentTitle = 'E2E Revised Rubric Assignment';

/** The numbered criterion block, e.g. "01 / Criterion". */
function criterion(page: Page, number: number): Locator {
  const heading = page.getByRole('heading', { name: `${String(number).padStart(2, '0')} / Criterion` });
  return page.locator('section').filter({ has: heading });
}

async function fillCriterion(
  block: Locator,
  values: { name: string; weight: string; levels: Array<{ from: number; to: number; description: string }> },
) {
  await block.getByLabel('Name', { exact: true }).fill(values.name);
  await block.getByLabel('Weight %').fill(values.weight);
  const descriptions = block.getByLabel('Description', { exact: true });
  await expect(descriptions).toHaveCount(values.levels.length);
  for (const [index, level] of values.levels.entries()) {
    await block.getByLabel('From', { exact: true }).nth(index).fill(String(level.from));
    await block.getByLabel('To', { exact: true }).nth(index).fill(String(level.to));
    await descriptions.nth(index).fill(level.description);
  }
}

function rubricIdFrom(page: Page) {
  const id = Number(page.url().match(/\/dashboard\/rubrics\/(\d+)\/?$/)?.[1]);
  expect(Number.isInteger(id)).toBe(true);
  return id;
}

test.describe.configure({ mode: 'serial' });

test.describe('rubric authoring', () => {
  test.setTimeout(120_000);
  test.beforeAll(() => runSeed('--fixtures'));

  test('a course lead builds a rubric, revises a copy, and assigns the revision to a class', async ({ page }) => {
    const errors = trackPageErrors(page);
    await signIn(page, accounts.lead);

    // Build the first rubric by hand from the library.
    await visit(page, '/dashboard/rubrics');
    await page.getByRole('button', { name: 'Create rubric' }).click();
    await page.waitForURL(/\/dashboard\/rubrics\/new\/?$/, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Build a rubric' })).toBeVisible();
    await page.getByLabel('Rubric name').fill(rubricName);
    await expect(page.getByLabel('Visibility')).toHaveValue('private');

    await fillCriterion(criterion(page, 1), {
      name: 'Thesis and claim',
      weight: '60',
      levels: [
        { from: 0, to: 4, description: 'The claim is missing or unclear.' },
        { from: 5, to: 10, description: 'A precise, arguable claim frames the essay.' },
      ],
    });
    await page.getByRole('button', { name: 'Add criterion' }).click();
    const second = criterion(page, 2);
    await expect(second).toBeVisible();
    await second.getByRole('button', { name: 'Add level' }).click();
    await fillCriterion(second, {
      name: 'Evidence',
      weight: '40',
      levels: [
        { from: 0, to: 3, description: 'Little or no supporting evidence.' },
        { from: 4, to: 7, description: 'Relevant evidence with partial analysis.' },
        { from: 8, to: 10, description: 'Well-chosen evidence that is analysed.' },
      ],
    });
    await expect(page.getByText('Total weight 100.0%')).toBeVisible();
    await page.getByRole('button', { name: 'Create rubric' }).click();
    await page.waitForURL(/\/dashboard\/rubrics\/\d+\/?$/, { waitUntil: 'domcontentloaded' });
    const originalId = rubricIdFrom(page);

    await expect(page.getByRole('heading', { level: 1, name: rubricName })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thesis and claim' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evidence', exact: true })).toBeVisible();
    await expect(page.getByText('8–10 pts')).toBeVisible();
    await expect(page.getByText('Well-chosen evidence that is analysed.')).toBeVisible();

    // The library lists the new private rubric; opening it returns to the same guide.
    await visit(page, '/dashboard/rubrics');
    const row = page.getByRole('row').filter({ hasText: rubricName });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Private');
    await row.getByRole('button', { name: 'View' }).click();
    await page.waitForURL(new RegExp(`/dashboard/rubrics/${originalId}/?$`), { waitUntil: 'domcontentloaded' });

    // Revising produces a separate copy prefilled from the original.
    await page.getByRole('button', { name: 'Create revised copy' }).click();
    await page.waitForURL(new RegExp(`/dashboard/rubrics/new/?\\?from=${originalId}$`), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Create a revised copy' })).toBeVisible();
    await expect(page.getByLabel('Rubric name')).toHaveValue(`${rubricName} · revision`);
    await expect(criterion(page, 1).getByLabel('Name', { exact: true })).toHaveValue('Thesis and claim');
    await expect(criterion(page, 2).getByLabel('Description', { exact: true })).toHaveCount(3);

    await page.getByLabel('Rubric name').fill(revisedName);
    await criterion(page, 1).getByLabel('Weight %').fill('50');
    await criterion(page, 2).getByLabel('Name', { exact: true }).fill('Evidence and sourcing');
    await criterion(page, 2).getByLabel('Weight %').fill('50');
    await expect(page.getByText('Total weight 100.0%')).toBeVisible();
    await page.getByRole('button', { name: 'Create rubric' }).click();
    await page.waitForURL(/\/dashboard\/rubrics\/\d+\/?$/, { waitUntil: 'domcontentloaded' });
    const revisedId = rubricIdFrom(page);
    expect(revisedId).not.toBe(originalId);
    await expect(page.getByRole('heading', { level: 1, name: revisedName })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evidence and sourcing' })).toBeVisible();

    // The original is untouched by the revision.
    const original = await currentJson<RubricDetail>(page, `/api/v2/core/rubrics/${originalId}/detail/`);
    const revised = await currentJson<RubricDetail>(page, `/api/v2/core/rubrics/${revisedId}/detail/`);
    expect(original.rubric_items.map((item) => [item.rubric_item_name, Number(item.rubric_item_weight)])).toEqual([
      ['Thesis and claim', 60], ['Evidence', 40],
    ]);
    expect(revised.rubric_items.map((item) => [item.rubric_item_name, Number(item.rubric_item_weight)])).toEqual([
      ['Thesis and claim', 50], ['Evidence and sourcing', 50],
    ]);
    expect(revised.rubric_items[1].level_descriptions.map((level) => [level.level_min_score, level.level_max_score]))
      .toEqual([[0, 3], [4, 7], [8, 10]]);

    await visit(page, '/dashboard/rubrics');
    await expect(page.getByRole('row').filter({ hasText: rubricName })).toHaveCount(2);
    await expect(page.getByRole('row').filter({ hasText: revisedName })).toHaveCount(1);

    // The revised rubric is offered when creating an assignment for the journeys class.
    await visit(page, '/dashboard/tasks/new');
    await page.locator('#title').fill(assignmentTitle);
    await page.locator('#desc').fill('An assignment marked with the revised rubric.');
    await page.locator('#instructions').fill('Argue one claim and cite your evidence.');
    await page.locator('#unit').click();
    await page.getByRole('option', { name: /E2E101/ }).click();
    await page.locator('#rubric').click();
    await expect(page.getByRole('option', { name: rubricName, exact: true })).toBeVisible();
    await page.getByRole('option', { name: revisedName, exact: true }).click();
    await page.locator('#class').click();
    await page.getByRole('option', { name: fixtures.journeyClass }).click();
    await page.locator('#due').fill('2035-01-01T12:00');
    await page.locator('#status').click();
    await page.getByRole('option', { name: /^Published$/ }).click();
    const create = page.getByRole('button', { name: /create assignment/i });
    await expect(create).toBeEnabled();
    await create.click();
    await page.waitForURL(/\/dashboard\/tasks\/?$/, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(assignmentTitle, { exact: true })).toBeVisible();

    const payload = await currentJson<TaskRow[] | { results: TaskRow[] }>(page, '/api/v2/core/tasks/?page_size=100');
    const tasks = Array.isArray(payload) ? payload : payload.results;
    const task = tasks.find((item) => item.task_title === assignmentTitle);
    expect(task).toMatchObject({ rubric_id_marking_rubric: revisedId, task_status: 'published' });
    const classes = await currentJson<Array<{ class_id: number; class_name: string }>>(page, '/api/v2/core/classes/');
    expect(task!.class_id_class).toBe(classes.find((item) => item.class_name === fixtures.journeyClass)?.class_id);
    errors.expectNone();
  });
});
