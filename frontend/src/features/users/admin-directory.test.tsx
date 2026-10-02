import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminDirectory } from './admin-directory';

const api = vi.hoisted(() => ({
  locale: 'en',
  list: vi.fn(),
  detail: vi.fn(),
  activity: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: api.locale, changeLocale: vi.fn() }),
}));
vi.mock('@/service/api/v2/admin-users', () => ({
  adminUsersService: {
    list: api.list,
    detail: api.detail,
    activity: api.activity,
    delete: api.remove,
    action: vi.fn(),
    updateName: vi.fn(),
    issuePasswordReset: vi.fn(),
  },
}));
vi.mock('@/service/api/v2/classes', () => ({ classService: { listClasses: vi.fn() } }));
vi.mock('@/service/api/v2/invitations', () => ({ invitationLink: vi.fn(), invitationService: { create: vi.fn() } }));

const users = [
  { user_id: 11, user_email: 'empty@example.com', user_fname: 'Empty', user_lname: 'Account', user_role: 'student', user_status: 'active', date_joined: '2026-10-01T00:00:00Z' },
  { user_id: 12, user_email: 'work@example.com', user_fname: 'Has', user_lname: 'Work', user_role: 'student', user_status: 'active', date_joined: '2026-10-01T00:00:00Z' },
];

describe('AdminDirectory deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.locale = 'en';
    api.list.mockResolvedValue(users);
    api.detail.mockResolvedValue({ ...users[0], classes: [], submissions_count: 0 });
    api.activity.mockResolvedValue([]);
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('reports a partial bulk deletion with the protected account reason', async () => {
    api.remove.mockImplementation((id: number) => id === 11
      ? Promise.resolve({ success: true })
      : Promise.reject(new Error('Accounts with related records must be disabled, not deleted')));
    const user = userEvent.setup();
    render(<AdminDirectory />);

    await waitFor(() => expect(screen.getAllByText('empty@example.com').length).toBeGreaterThan(0));
    await user.click(screen.getAllByLabelText('Select empty@example.com')[0]);
    await user.click(screen.getAllByLabelText('Select work@example.com')[0]);
    await user.click(screen.getByRole('button', { name: 'Delete selected' }));

    await waitFor(() => expect(api.remove).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/1 account\(s\) deleted\. 1 could not be deleted\./)).toBeInTheDocument();
    expect(screen.getByText(/work@example.com: Accounts with related records/)).toBeInTheDocument();
  });

  it('explains the protected account in Chinese', async () => {
    api.locale = 'zh';
    api.remove.mockRejectedValue(new Error('Accounts with related records must be disabled, not deleted'));
    const user = userEvent.setup();
    render(<AdminDirectory />);
    await waitFor(() => expect(screen.getAllByText('work@example.com').length).toBeGreaterThan(0));
    await user.click(screen.getAllByLabelText('选择 work@example.com')[0]);
    await user.click(screen.getByRole('button', { name: '删除所选' }));
    expect(await screen.findByText('work@example.com: 此账号有关联记录，无法删除；可以停用账号。')).toBeInTheDocument();
  });
});
