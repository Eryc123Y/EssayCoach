import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserAuthForm from './user-auth-form';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const fetchMock = vi.fn();

vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: 'en' }),
}));
vi.mock('sonner', () => ({ toast }));

describe('UserAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
    sessionStorage.clear();
  });

  it('toggles password visibility with an accessible pressed button', async () => {
    const user = userEvent.setup();
    render(<UserAuthForm />);

    const password = screen.getByPlaceholderText('••••••••');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(password).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the password label and form validation attributes on the input', async () => {
    const user = userEvent.setup();
    render(<UserAuthForm />);

    const password = screen.getByLabelText('Password');
    expect(password.tagName).toBe('INPUT');
    expect(password).toHaveAttribute('name', 'password');

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-describedby');

    await user.type(password, 'password');
    expect(password).toHaveValue('password');
  });

  it('uses persistent login by default and sends an unchecked choice to the proxy', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ user: { id: 7, email: 'student@example.com' } }) });
    render(<UserAuthForm />);

    const remember = screen.getByRole('checkbox', { name: 'Remember me' });
    expect(remember).toBeChecked();
    await user.click(remember);
    await user.type(screen.getByLabelText('Email address'), 'student@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/v2/auth/login', expect.objectContaining({
      body: JSON.stringify({ email: 'student@example.com', password: 'password', remember: false }),
    }));
    // A session-only sign-in must not leave user metadata in persistent storage.
    await waitFor(() => expect(sessionStorage.getItem('user_data')).toContain('student@example.com'));
    expect(localStorage.getItem('user_data')).toBeNull();
  });

  it('keeps remembered sign-ins in persistent storage', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('user_data', JSON.stringify({ email: 'previous@example.com' }));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ user: { id: 8, email: 'lecturer@example.com' } }) });
    render(<UserAuthForm />);

    await user.type(screen.getByLabelText('Email address'), 'lecturer@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(localStorage.getItem('user_data')).toContain('lecturer@example.com'));
    expect(sessionStorage.getItem('user_data')).toBeNull();
  });

  it('shows a localized wait message for a rate-limited login', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    render(<UserAuthForm />);

    await user.type(screen.getByLabelText('Email address'), 'student@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(toast.error).toHaveBeenCalledWith('Too many sign-in attempts. Please wait before trying again.');
  });
});
