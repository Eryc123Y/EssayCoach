import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AccountSection } from '../components/account-section';

describe('AccountSection', () => {
  it('calls onSaveUser when the profile form is submitted', async () => {
    const mockOnSaveUser = vi.fn().mockResolvedValue(undefined);
    const mockUser = {
      user_id: 1,
      user_email: 'test@test.com',
      user_fname: 'John',
      user_lname: 'Doe',
      user_role: 'student',
      is_active: true
    };

    render(
      <AccountSection
        user={mockUser as any}
        isLoading={false}
        onSaveUser={mockOnSaveUser}
        onUploadAvatar={vi.fn()}
        onChangePassword={vi.fn()}
      />
    );

    const editButton = screen.getByRole('button', { name: /Edit Profile/i });
    await userEvent.click(editButton);

    const firstNameInput = screen.getByLabelText(/First Name/i);
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, 'Jane');

    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSaveUser).toHaveBeenCalledWith({
        user_fname: 'Jane',
        user_lname: 'Doe',
        user_email: 'test@test.com'
      });
    });
  });
});
