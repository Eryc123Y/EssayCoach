import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ForgotPasswordPage from './forgot-password/page';
import VerifyEmailPage from './verify-email/page';

const services = vi.hoisted(() => ({
  previewPasswordReset: vi.fn(),
  previewEmailChange: vi.fn(),
}));

vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: 'en', applyLocale: vi.fn() }),
}));

vi.mock('@/service/api/v2/password-reset', () => ({
  passwordResetService: {
    preview: services.previewPasswordReset,
    complete: vi.fn(),
  },
}));

vi.mock('@/service/api/v2/email-change', () => ({
  emailChangeService: {
    preview: services.previewEmailChange,
    complete: vi.fn(),
  },
}));

describe('fragment-token auth pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    services.previewPasswordReset.mockResolvedValue({ email: 'student@example.com' });
    services.previewEmailChange.mockResolvedValue({ new_email: 'new@example.com' });
  });

  it('uses a valid reset token and removes it from the address', async () => {
    window.history.pushState(null, '', '/auth/forgot-password?source=email#token=reset%2Ftoken');
    render(<ForgotPasswordPage />);

    await waitFor(() => expect(services.previewPasswordReset).toHaveBeenCalledWith('reset/token'));
    expect(window.location.pathname + window.location.search).toBe('/auth/forgot-password?source=email');
    expect(window.location.hash).toBe('');
  });

  it('shows an invalid reset-link state without calling the API for a malformed token', async () => {
    window.history.pushState(null, '', '/auth/forgot-password#token=%');
    render(<ForgotPasswordPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(services.previewPasswordReset).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#token=%');
  });

  it('uses a valid email-change token and removes it from the address', async () => {
    window.history.pushState(null, '', '/auth/verify-email#token=verify%2Ftoken');
    render(<VerifyEmailPage />);

    await waitFor(() => expect(services.previewEmailChange).toHaveBeenCalledWith('verify/token'));
    expect(window.location.pathname).toBe('/auth/verify-email');
    expect(window.location.hash).toBe('');
  });

  it('shows an invalid verification-link state without calling the API for a malformed token', async () => {
    window.history.pushState(null, '', '/auth/verify-email#token=%');
    render(<VerifyEmailPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(services.previewEmailChange).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#token=%');
  });
});
