import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsWorkspace from '../settings-workspace';

const logout = vi.fn().mockResolvedValue(undefined);
const changePassword = vi.fn();
const fetchUserInfo = vi.fn().mockResolvedValue({ user_id: 1, user_email: 'a@b.c', user_role: 'student' });

vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: 'en' })
}));
vi.mock('@/components/layout/simple-auth-context', () => ({
  useAuth: () => ({ logout })
}));
vi.mock('@/components/layout/page-container', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));
vi.mock('@/features/settings/hooks/useSettings', () => ({
  useSettings: () => ({
    preferences: null,
    isLoading: false,
    isSaving: false,
    sessions: [],
    isLoadingSessions: false,
    loginHistory: [],
    isLoadingHistory: false,
    updatePreferences: vi.fn(),
    revokeSession: vi.fn(),
    fetchUserInfo,
    updateUser: vi.fn(),
    uploadAvatar: vi.fn(),
    changePassword
  })
}));
vi.mock('@/features/settings/components/settings-sidebar', () => ({ SettingsSidebar: () => null }));
vi.mock('@/features/settings/components/email-change-section', () => ({ EmailChangeSection: () => null }));
vi.mock('@/features/settings/components/account-section', () => ({
  AccountSection: ({ onChangePassword }: { onChangePassword: (a: string, b: string, c: string) => Promise<void> }) => (
    <button
      onClick={() => {
        // The real section reports failures itself, so the stub swallows the rejection.
        onChangePassword('old', 'new-password', 'new-password').catch(() => undefined);
      }}
    >
      change password
    </button>
  )
}));

describe('SettingsWorkspace password change', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    logout.mockClear();
    changePassword.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  async function clickChange() {
    render(<SettingsWorkspace />);
    const button = await screen.findByRole('button', { name: 'change password' });
    await act(async () => {
      button.click();
    });
  }

  it('signs the user out after the server revokes every session', async () => {
    changePassword.mockResolvedValue(undefined);
    await clickChange();

    expect(changePassword).toHaveBeenCalledWith('old', 'new-password', 'new-password');
    expect(logout).not.toHaveBeenCalled(); // the confirmation stays visible first
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('keeps the session when the change is rejected', async () => {
    changePassword.mockRejectedValue(new Error('Current password is incorrect'));
    await clickChange();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(logout).not.toHaveBeenCalled();
  });
});
