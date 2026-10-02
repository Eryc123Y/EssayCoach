import { expect, test } from '@playwright/test';
import {
  accounts,
  apiRequest,
  clearSession,
  currentJson,
  runSeed,
  signIn,
  trackPageErrors,
  visit,
} from './support/e2e';

type Ticket = { id: number; user_id: number; subject: string; status: string; staff_reply: string };

// The fixture reset deletes the authors' tickets; a unique subject still keeps
// the shared admin queue unambiguous if other tickets exist in the database.
const subject = `E2E cannot open my assignment ${Date.now()}`;
const description = 'The assignment page shows a spinner and never loads the essay form.';
const reply = 'Thanks Alice, please reload the page; the assignment is open again.';

test.describe.configure({ mode: 'serial' });

test.describe('help centre support tickets', () => {
  test.setTimeout(120_000);
  test.beforeAll(() => runSeed('--fixtures'));

  test('a student request is answered by an admin and stays private to its author', async ({ page }) => {
    const pageErrors = trackPageErrors(page);

    // Student sends a request from the help centre.
    await signIn(page, accounts.alice);
    await visit(page, '/dashboard/help');
    await expect(page.getByRole('heading', { name: 'Your requests' })).toBeVisible();
    await page.getByLabel('Subject').fill(subject);
    await page.getByLabel('Description').fill(description);
    await page.getByRole('button', { name: 'Send request' }).click();
    const ownTicket = page.locator('article').filter({ hasText: subject });
    await expect(ownTicket).toBeVisible();
    await expect(ownTicket).toContainText('Open');
    const [ticket] = (await currentJson<Ticket[]>(page, '/api/v2/help/tickets/me/')).filter((item) => item.subject === subject);
    expect(ticket).toMatchObject({ status: 'open', staff_reply: '' });

    // Admin finds it in the support queue and replies through the prompt.
    await clearSession(page);
    await signIn(page, accounts.admin);
    await visit(page, '/dashboard/help');
    await expect(page.getByRole('heading', { name: 'Support queue' })).toBeVisible();
    const queueEntry = page.getByText(`#${ticket.id} · ${subject}`, { exact: true });
    await expect(queueEntry).toBeVisible();
    const queueRow = queueEntry.locator('xpath=../..');
    await expect(queueRow).toContainText(description);
    page.once('dialog', (dialog) => {
      expect(dialog.type()).toBe('prompt');
      void dialog.accept(reply);
    });
    await queueRow.getByRole('button', { name: 'Reply & resolve' }).click();
    await expect(queueRow.getByRole('button', { name: 'Edit reply' })).toBeVisible();
    const queue = await currentJson<Ticket[]>(page, '/api/v2/help/admin/tickets/');
    expect(queue.find((item) => item.id === ticket.id)).toMatchObject({ status: 'resolved', staff_reply: reply });

    // Student sees the resolution and the reply.
    await clearSession(page);
    await signIn(page, accounts.alice);
    await visit(page, '/dashboard/help');
    await expect(ownTicket).toContainText('Resolved');
    await expect(ownTicket).toContainText(reply);

    // Another student sees nothing of it in the UI or through the API.
    await clearSession(page);
    await signIn(page, accounts.bob);
    await visit(page, '/dashboard/help');
    await expect(page.getByText('No requests yet.')).toBeVisible();
    await expect(page.getByText(subject)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Support queue' })).toHaveCount(0);
    const bobTickets = await currentJson<Ticket[]>(page, '/api/v2/help/tickets/me/');
    expect(bobTickets.map((item) => item.id)).not.toContain(ticket.id);
    expect((await apiRequest(page, 'GET', '/api/v2/help/admin/tickets/')).status).toBe(403);
    // There is no per-ticket read endpoint; only the author's own list exposes a ticket.
    expect((await apiRequest(page, 'GET', `/api/v2/help/tickets/${ticket.id}/`)).status).toBe(404);
    const tamper = await apiRequest(page, 'PATCH', `/api/v2/help/admin/tickets/${ticket.id}/`, {
      status: 'closed',
      staff_reply: 'Bob should not be able to change this.',
    });
    expect(tamper.status).toBe(403);
    pageErrors.expectNone();

    // The refused write left alice's ticket untouched.
    await clearSession(page);
    await signIn(page, accounts.alice);
    const [after] = (await currentJson<Ticket[]>(page, '/api/v2/help/tickets/me/')).filter((item) => item.id === ticket.id);
    expect(after).toMatchObject({ status: 'resolved', staff_reply: reply });
  });
});
