import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invitationService } from '@/service/api/v2/invitations';

describe('invitationService', () => {
  beforeEach(() => { global.fetch = vi.fn(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('creates a scoped course lead invitation without creating an account', async () => {
    const invitation = {
      id: 7, token: 'one-time-token', email: 'lead@example.com',
      role: 'lecturer', expires_at: '2026-10-01T00:00:00Z'
    };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true, json: async () => invitation
    } as Response);

    const result = await invitationService.create({
      email: 'lead@example.com', role: 'lecturer', lead_unit_id: 'ENG101'
    });

    expect(result.token).toBe('one-time-token');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v2/auth/invitations/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'lead@example.com', role: 'lecturer', lead_unit_id: 'ENG101' })
      })
    );
  });

  it('creates student invitation links for a class', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ created: [{ id: 1, token: 'student-token', email: 'a@example.com' }], failed: [] })
    } as Response);

    const result = await invitationService.batchStudents(3, ['a@example.com']);

    expect(result.created[0].token).toBe('student-token');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v2/auth/invitations/batch/',
      expect.objectContaining({
        method: 'POST', body: JSON.stringify({ class_id: 3, emails: ['a@example.com'] })
      })
    );
  });
});
