import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsSidebar } from '../components/settings-sidebar';

vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: 'en' }),
}));

describe('SettingsSidebar', () => {
  it('shows Organization tab only for admins', () => {
    const { rerender } = render(<SettingsSidebar currentSection="account" onSectionChange={() => {}} userRole="admin" />);
    expect(screen.getByText('Organization')).toBeInTheDocument();

    rerender(<SettingsSidebar currentSection="account" onSectionChange={() => {}} userRole="student" />);
    expect(screen.queryByText('Organization')).not.toBeInTheDocument();
  });
});
