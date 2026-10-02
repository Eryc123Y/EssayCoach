import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './simple-auth-context';

const fetchMock = vi.fn();

function Probe() {
  const { isAuthenticated, user } = useAuth();
  return <p>{isAuthenticated ? `signed in as ${user?.email}` : 'signed out'}</p>;
}

const cachedUser = { id: '7', email: 'previous@example.com', firstName: 'P', lastName: 'U', role: 'student' };

describe('AuthProvider cached user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
    sessionStorage.clear();
  });

  it('drops a cached user once the server reports the session is gone', async () => {
    localStorage.setItem('user_data', JSON.stringify(cachedUser));
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByText('signed out')).toBeInTheDocument());
    expect(localStorage.getItem('user_data')).toBeNull();
  });

  it('keeps the cached user when the session check cannot reach the server', async () => {
    localStorage.setItem('user_data', JSON.stringify(cachedUser));
    fetchMock.mockRejectedValue(new Error('offline'));
    render(<AuthProvider><Probe /></AuthProvider>);

    expect(screen.getByText('signed in as previous@example.com')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(localStorage.getItem('user_data')).not.toBeNull();
  });

  it('replaces a cached user when the cookies now belong to a different account', async () => {
    sessionStorage.setItem('user_data', JSON.stringify(cachedUser));
    fetchMock.mockImplementation(async (url: string) =>
      url === '/api/v2/auth/getUserInfo'
        ? { ok: true, status: 200, json: async () => ({ success: true, data: { user_id: 9, user_email: 'other@example.com', user_role: 'lecturer' } }) }
        : { ok: false, status: 404, json: async () => ({}) }
    );
    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByText('signed in as other@example.com')).toBeInTheDocument());
    expect(sessionStorage.getItem('user_data')).toContain('other@example.com');
  });
});
