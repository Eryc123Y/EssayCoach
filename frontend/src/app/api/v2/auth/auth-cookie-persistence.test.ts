import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as login } from './login/route';
import { POST as refresh } from './refresh/route';

const fetchMock = vi.fn();

vi.mock('@/lib/server-api', () => ({ getServerApiUrl: () => 'http://127.0.0.1:8000' }));

function backendLoginResponse() {
  return {
    ok: true,
    json: async () => ({ data: {
      token: 'access-token', refresh: 'refresh-token', expires_at: '2026-10-01T12:00:00Z',
      user: { id: 7, email: 'student@example.com', role: 'student' },
    } }),
  };
}

describe('auth cookie persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('keeps the existing persistent cookie behavior when remember is omitted', async () => {
    fetchMock.mockResolvedValue(backendLoginResponse());
    const response = await login(new NextRequest('http://localhost/api/v2/auth/login', {
      method: 'POST', body: JSON.stringify({ email: 'student@example.com', password: 'password' }),
    }));

    expect(response.cookies.get('refresh_token')?.maxAge).toBe(60 * 60 * 24 * 7);
    expect(response.cookies.get('session_persistence')?.value).toBe('persistent');
    expect(response.cookies.get('session_persistence')?.maxAge).toBe(60 * 60 * 24 * 7);
    const payload = await response.json();
    expect(payload).toMatchObject({
      expiresAt: '2026-10-01T12:00:00Z',
      user: { id: 7, email: 'student@example.com' },
    });
    expect(payload).not.toHaveProperty('access');
    expect(payload).not.toHaveProperty('refresh');
    expect(response.cookies.get('access_token')?.value).toBe('access-token');
    expect(response.cookies.get('refresh_token')?.value).toBe('refresh-token');
  });

  it('sets all login cookies as session cookies when remember is unchecked', async () => {
    fetchMock.mockResolvedValue(backendLoginResponse());
    const response = await login(new NextRequest('http://localhost/api/v2/auth/login', {
      method: 'POST', body: JSON.stringify({ email: 'student@example.com', password: 'password', remember: false }),
    }));

    expect(response.cookies.get('access_token')?.maxAge).toBeUndefined();
    expect(response.cookies.get('refresh_token')?.maxAge).toBeUndefined();
    expect(response.cookies.get('user_email')?.maxAge).toBeUndefined();
    expect(response.cookies.get('session_persistence')?.value).toBe('session');
    expect(response.cookies.get('session_persistence')?.maxAge).toBeUndefined();
  });

  it('keeps session-only cookies session-only after a token refresh', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { access: 'new-access', refresh: 'new-refresh' } }) });
    const response = await refresh(new NextRequest('http://localhost/api/v2/auth/refresh', {
      method: 'POST', headers: { cookie: 'refresh_token=old-refresh; session_persistence=session' },
    }));

    expect(response.cookies.get('access_token')?.maxAge).toBeUndefined();
    expect(response.cookies.get('refresh_token')?.maxAge).toBeUndefined();
    expect(response.cookies.get('session_persistence')?.value).toBe('session');
    expect(response.cookies.get('session_persistence')?.maxAge).toBeUndefined();
    const payload = await response.json();
    expect(payload).not.toHaveProperty('access');
    expect(payload).not.toHaveProperty('refresh');
    expect(response.cookies.get('access_token')?.value).toBe('new-access');
    expect(response.cookies.get('refresh_token')?.value).toBe('new-refresh');
  });

  it('treats refreshes from older logins without a marker as persistent', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { access: 'new-access', refresh: 'new-refresh' } }) });
    const response = await refresh(new NextRequest('http://localhost/api/v2/auth/refresh', {
      method: 'POST', headers: { cookie: 'refresh_token=old-refresh' },
    }));

    expect(response.cookies.get('refresh_token')?.maxAge).toBe(60 * 60 * 24 * 7);
    expect(response.cookies.get('session_persistence')?.value).toBe('persistent');
  });
});
