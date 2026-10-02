import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@/lib/server-api', () => ({ getServerApiUrl: () => 'http://127.0.0.1:8000' }));

const fetchMock = vi.fn();

describe('API v2 proxy session refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renews an expired access cookie before forwarding and returns the rotated cookies', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ access: 'proxy-access', refresh: 'proxy-refresh' }) })
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }));

    const response = await GET(
      new NextRequest('http://localhost/api/v2/core/tasks', {
        headers: { cookie: 'refresh_token=proxy-old; session_persistence=session' },
      }),
      { params: Promise.resolve({ path: ['core', 'tasks'] }) }
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const forwarded = fetchMock.mock.calls[1];
    expect(forwarded[0]).toBe('http://127.0.0.1:8000/api/v2/core/tasks/');
    expect((forwarded[1].headers as Headers).get('Authorization')).toBe('Bearer proxy-access');
    expect(response.status).toBe(200);
    expect(response.cookies.get('access_token')?.value).toBe('proxy-access');
    expect(response.cookies.get('refresh_token')?.maxAge).toBeUndefined();
  });

  it('does not clear cookies when a refresh is refused', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce(new Response('{}', { status: 401 }));

    const response = await GET(
      new NextRequest('http://localhost/api/v2/core/tasks', {
        headers: { cookie: 'refresh_token=proxy-rotated-elsewhere' },
      }),
      { params: Promise.resolve({ path: ['core', 'tasks'] }) }
    );

    expect(response.status).toBe(401);
    expect(response.cookies.get('refresh_token')).toBeUndefined();
  });
});
