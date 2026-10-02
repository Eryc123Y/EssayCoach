import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@/lib/server-api', () => ({ getServerApiUrl: () => 'http://127.0.0.1:8000' }));

const fetchMock = vi.fn();

describe('API v2 proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('forwards the access cookie as a bearer token and never rotates the session itself', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }));

    const response = await GET(
      new NextRequest('http://localhost/api/v2/core/tasks', {
        headers: { cookie: 'access_token=renewed-by-middleware; refresh_token=r-untouched' },
      }),
      { params: Promise.resolve({ path: ['core', 'tasks'] }) }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:8000/api/v2/core/tasks/');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer renewed-by-middleware');
    expect((init.headers as Headers).get('Cookie')).toBeNull();
    expect(response.status).toBe(200);
    expect(response.cookies.get('refresh_token')).toBeUndefined();
  });
});
