'use client';

import { useEffect, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { authService, settingsService } from '@/service/api/v2/auth';
import type { UserInfo } from '@/service/api/v2/types';

export function useSettings() {
  const {
    preferences,
    isLoading,
    isSaving,
    sessions,
    isLoadingSessions,
    loginHistory,
    isLoadingHistory,
    fetchPreferences,
    updatePreferences,
    fetchSessions,
    revokeSession,
    fetchLoginHistory,
  } = useSettingsStore();

  // Fetch current user info
  const fetchUserInfo = useCallback(async (): Promise<UserInfo | null> => {
    try {
      return await authService.getUserInfo();
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return null;
    }
  }, []);

  // Initialize settings data
  useEffect(() => {
    fetchPreferences();
    fetchSessions();
    fetchLoginHistory();
  }, [fetchPreferences, fetchSessions, fetchLoginHistory]);

  // Upload avatar
  const uploadAvatar = useCallback(
    async (file: File): Promise<string> => {
      try {
        const response = await settingsService.uploadAvatar(file);
        if (response.success) {
          return response.avatar_url;
        }
        throw new Error('Avatar upload failed');
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        throw error;
      }
    },
    []
  );

  // Change password
  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
      newPasswordConfirm: string
    ): Promise<void> => {
      try {
        await settingsService.changePassword({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirm: newPasswordConfirm,
        });
      } catch (error) {
        console.error('Failed to change password:', error);
        throw error;
      }
    },
    []
  );

  // Update current user info
  const updateUser = useCallback(
    async (data: { user_fname: string; user_lname: string }): Promise<void> => {
      try {
        await authService.updateUser({
          first_name: data.user_fname,
          last_name: data.user_lname,
        });
      } catch (error) {
        console.error('Failed to update user info:', error);
        throw error;
      }
    },
    []
  );

  return {
    // State
    preferences,
    isLoading,
    isSaving,
    sessions,
    isLoadingSessions,
    loginHistory,
    isLoadingHistory,

    // Actions
    fetchPreferences,
    updatePreferences,
    fetchSessions,
    revokeSession,
    fetchLoginHistory,
    fetchUserInfo,
    updateUser,
    uploadAvatar,
    changePassword,
  };
}
