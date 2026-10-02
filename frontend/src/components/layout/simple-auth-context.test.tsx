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
});
