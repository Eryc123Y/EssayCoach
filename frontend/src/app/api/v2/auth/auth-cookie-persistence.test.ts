import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as login } from './login/route';
import { POST as refresh } from './refresh/route';
import { POST as logout } from './logout/route';

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

    expect(response.cookies.get('refresh_token')?.maxAge).toBe(60 * 60 * 24 * 30);
    expect(response.cookies.get('session_persistence')?.value).toBe('persistent');
    expect(response.cookies.get('session_persistence')?.maxAge).toBe(60 * 60 * 24 * 30);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ remember: true });
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
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ remember: false });
  });

  it('keeps session-only cookies session-only after a token refresh', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { access: 'new-access', refresh: 'new-refresh' } }) });
    const response = await refresh(new NextRequest('http://localhost/api/v2/auth/refresh', {
      method: 'POST', headers: { cookie: 'refresh_token=old-refresh-session; session_persistence=session' },
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
      method: 'POST', headers: { cookie: 'refresh_token=old-refresh-legacy' },
    }));

    expect(response.cookies.get('refresh_token')?.maxAge).toBe(60 * 60 * 24 * 30);
    expect(response.cookies.get('session_persistence')?.value).toBe('persistent');
  });

  it('reports a refused refresh token as unauthorized', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    const response = await refresh(new NextRequest('http://localhost/api/v2/auth/refresh', {
      method: 'POST', headers: { cookie: 'refresh_token=revoked-refresh' },
    }));

    expect(response.status).toBe(401);
    expect(response.cookies.get('access_token')).toBeUndefined();
  });

  it('clears every session cookie on logout, including the persistence marker', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const response = await logout(new NextRequest('http://localhost/api/v2/auth/logout', {
      method: 'POST', headers: { cookie: 'access_token=x.e30.y; refresh_token=r; session_persistence=persistent' },
    }));

    for (const name of ['access_token', 'refresh_token', 'session_persistence', 'user_role']) {
      expect(response.cookies.get(name)?.value).toBe('');
      expect(response.cookies.get(name)?.maxAge).toBe(0);
    }
  });

  it('ignores a caller-supplied forwarded address unless a reverse proxy is trusted', async () => {
    fetchMock.mockResolvedValue(backendLoginResponse());
    await login(new NextRequest('http://localhost/api/v2/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.9' },
      body: JSON.stringify({ email: 'student@example.com', password: 'password' }),
    }));

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('X-Forwarded-For');
  });

  it('forwards only the right-most address written by a trusted reverse proxy', async () => {
    vi.stubEnv('TRUST_PROXY_FORWARDED_FOR', 'true');
    try {
      fetchMock.mockResolvedValue(backendLoginResponse());
      await login(new NextRequest('http://localhost/api/v2/auth/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': '198.51.100.7, 203.0.113.9' },
        body: JSON.stringify({ email: 'student@example.com', password: 'password' }),
      }));

      expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ 'X-Forwarded-For': '203.0.113.9' });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
