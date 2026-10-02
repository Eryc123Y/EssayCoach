import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import middleware from './middleware';

vi.mock('@/lib/server-api', () => ({ getServerApiUrl: () => 'http://127.0.0.1:8000' }));

const fetchMock = vi.fn();

function dashboardRequest(cookie?: string) {
  return new NextRequest('http://localhost/dashboard/tasks', cookie ? { headers: { cookie } } : undefined);
}

describe('dashboard middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('redirects to sign-in without a session', async () => {
    const response = await middleware(dashboardRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/auth/sign-in?callbackUrl=%2Fdashboard%2Ftasks');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renews an expired access cookie from the refresh cookie and forwards it to the page', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ access: 'mw-access', refresh: 'mw-refresh' }) });
    const response = await middleware(dashboardRequest('refresh_token=mw-old; session_persistence=persistent'));

    expect(response.headers.get('location')).toBeNull();
    expect(response.cookies.get('access_token')?.value).toBe('mw-access');
    expect(response.cookies.get('refresh_token')?.value).toBe('mw-refresh');
    expect(response.cookies.get('refresh_token')?.maxAge).toBe(60 * 60 * 24 * 30);
    // Server components read the overridden request cookies.
    expect(response.headers.get('x-middleware-request-cookie')).toContain('access_token=mw-access');
  });

  it('redirects without clearing cookies when the refresh token is refused', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    const response = await middleware(dashboardRequest('refresh_token=mw-revoked; session_persistence=persistent'));

    expect(response.headers.get('location')).toContain('/auth/sign-in');
    // A losing concurrent rotation must not erase the winner's new cookies.
    expect(response.cookies.get('refresh_token')).toBeUndefined();
  });

  it('lets a request that lost a rotation race through while its access token is still valid', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 30 })).toString('base64url');
    const response = await middleware(dashboardRequest(`access_token=h.${payload}.s; refresh_token=mw-rotated`));

    expect(response.headers.get('location')).toBeNull();
  });

  it('ignores routes outside the dashboard', async () => {
    const response = await middleware(new NextRequest('http://localhost/auth/sign-in'));

    expect(response.headers.get('location')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
