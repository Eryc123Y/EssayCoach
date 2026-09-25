import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveDashboardRole } from './server-dashboard-auth';

describe('resolveDashboardRole', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the backend to validate an authenticated role', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ data: { role: 'student' } })
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await resolveDashboardRole('signed-token')).toBe('student');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/v2/auth/me/jwt/',
      { headers: { Authorization: 'Bearer signed-token' }, cache: 'no-store' }
    );
  });

  it('rejects missing or revoked credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 401, ok: false });
    vi.stubGlobal('fetch', fetchMock);
    expect(await resolveDashboardRole(undefined)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await resolveDashboardRole('revoked-token')).toBeNull();
  });

  it('does not choose a role from an invalid backend response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ data: { role: 'unknown' } })
    }));
    await expect(resolveDashboardRole('signed-token')).rejects.toThrow('unsupported role');
  });
});
