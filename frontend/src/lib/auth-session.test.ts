import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { accessTokenNeedsRefresh, resolveSession } from './auth-session';

vi.mock('@/lib/server-api', () => ({ getServerApiUrl: () => 'http://127.0.0.1:8000' }));

const fetchMock = vi.fn();

function jwtExpiringIn(seconds: number) {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })).toString('base64url');
  return `header.${payload}.signature`;
}

function requestWith(cookie: string) {
  return new NextRequest('http://localhost/dashboard', { headers: { cookie } });
}

function refreshed(access: string, refresh: string) {
  return { ok: true, status: 200, json: async () => ({ access, refresh, expires_at: '2026-10-03T00:00:00Z' }) };
}

describe('auth session refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('refreshes only missing or nearly expired access tokens', () => {
    expect(accessTokenNeedsRefresh(undefined)).toBe(true);
    expect(accessTokenNeedsRefresh(jwtExpiringIn(30))).toBe(true);
    expect(accessTokenNeedsRefresh(jwtExpiringIn(3600))).toBe(false);
  });

  it('keeps a valid access token without calling the backend', async () => {
    const access = jwtExpiringIn(3600);
    const session = await resolveSession(requestWith(`access_token=${access}; refresh_token=r-valid`));

    expect(session).toEqual({ accessToken: access });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renews a remembered session whose access cookie has expired', async () => {
    fetchMock.mockResolvedValue(refreshed('new-access', 'new-refresh'));
    const session = await resolveSession(requestWith('refresh_token=r-remembered; session_persistence=persistent'));

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8000/api/v2/auth/refresh/', expect.objectContaining({
      body: JSON.stringify({ refresh: 'r-remembered' }),
    }));
    expect(session.accessToken).toBe('new-access');
    expect(session.refreshed).toMatchObject({ access: 'new-access', refresh: 'new-refresh', remember: true });
  });

  it('shares one rotation between concurrent requests holding the same refresh token', async () => {
    fetchMock.mockResolvedValue(refreshed('shared-access', 'shared-refresh'));
    const [first, second] = await Promise.all([
      resolveSession(requestWith('refresh_token=r-concurrent; session_persistence=session')),
      resolveSession(requestWith('refresh_token=r-concurrent; session_persistence=session')),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.refreshed).toEqual(second.refreshed);
    expect(first.refreshed?.remember).toBe(false);
  });

  it('never replays a settled rotation for a spent refresh token', async () => {
    fetchMock
      .mockResolvedValueOnce(refreshed('first-access', 'first-refresh'))
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    const first = await resolveSession(requestWith('refresh_token=r-spent'));
    const replay = await resolveSession(requestWith('refresh_token=r-spent'));

    expect(first.refreshed?.access).toBe('first-access');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(replay.refreshed).toBeUndefined();
    expect(replay.rejected).toBe(true);
  });

  it('marks a refused refresh token as rejected', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    const session = await resolveSession(requestWith('refresh_token=r-revoked'));

    expect(session).toEqual({ accessToken: undefined, rejected: true });
  });

  it('keeps the existing token when the backend is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('connection refused'));
    const access = jwtExpiringIn(10);
    const session = await resolveSession(requestWith(`access_token=${access}; refresh_token=r-offline`));

    expect(session).toEqual({ accessToken: access });
  });
});
