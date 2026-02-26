/**
 * Tests for Settings API service.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { settingsService } from '../auth';

// Mock the request module
vi.mock('@/service/request', () => ({
  request: vi.fn(),
}));

const { request } = await import('@/service/request');

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getPreferences', () => {
    it('should fetch user preferences successfully', async () => {
      const mockPreferences = {
        success: true,
        data: {
          email_notifications: true,
          in_app_notifications: true,
          submission_alerts: true,
          grading_alerts: false,
          weekly_digest: false,
          language: 'en',
          theme: 'system' as const,
        },
      };

      vi.mocked(request).mockResolvedValue(mockPreferences);

      const result = await settingsService.getPreferences();

      expect(request).toHaveBeenCalledWith({
        url: '/api/v2/auth/settings/preferences/',
        method: 'GET',
      });
      expect(result).toEqual(mockPreferences);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          email_notifications: false,
          in_app_notifications: true,
          submission_alerts: true,
          grading_alerts: false,
          weekly_digest: true,
          language: 'zh',
          theme: 'dark' as const,
        },
        message: 'Preferences updated successfully',
      };

      vi.mocked(request).mockResolvedValue(mockResponse);

      const result = await settingsService.updatePreferences({
        email_notifications: false,
        weekly_digest: true,
        language: 'zh',
        theme: 'dark',
      });

      expect(request).toHaveBeenCalledWith({
        url: '/api/v2/auth/settings/preferences/',
        method: 'PUT',
        data: {
          email_notifications: false,
          weekly_digest: true,
          language: 'zh',
          theme: 'dark',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle partial preference updates', async () => {
      const mockResponse = {
        success: true,
        data: {
          email_notifications: false,
          in_app_notifications: true,
          submission_alerts: true,
          grading_alerts: false,
          weekly_digest: false,
          language: 'en',
          theme: 'system',
        },
      };

      vi.mocked(request).mockResolvedValue(mockResponse);

      await settingsService.updatePreferences({
        email_notifications: false,
      });

      expect(request).toHaveBeenCalledWith({
        url: '/api/v2/auth/settings/preferences/',
        method: 'PUT',
        data: {
          email_notifications: false,
        },
      });
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      const mockFile = new File(['test content'], 'avatar.png', {
        type: 'image/png',
      });

      const mockResponse = {
        success: true,
        avatar_url: '/media/avatars/123_abc123.png',
        message: 'Avatar uploaded successfully',
      };

      vi.mocked(request).mockResolvedValue(mockResponse);

      const result = await settingsService.uploadAvatar(mockFile);

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/v2/auth/settings/avatar/',
          method: 'POST',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSessions', () => {
    it('should fetch active sessions successfully', async () => {
      const mockSessions = {
        success: true,
        data: [
          {
            session_key: 'abc123',
            device: 'Desktop',
            ip_address: '192.168.1.1',
            created_at: '2024-01-01T00:00:00Z',
            last_activity: '2024-01-01T12:00:00Z',
            is_current: true,
          },
          {
            session_key: 'def456',
            device: 'Mobile',
            ip_address: '192.168.1.2',
            created_at: '2024-01-01T00:00:00Z',
            last_activity: '2024-01-01T10:00:00Z',
            is_current: false,
          },
        ],
      };

      vi.mocked(request).mockResolvedValue(mockSessions);

      const result = await settingsService.getSessions();

      expect(request).toHaveBeenCalledWith({
        url: '/api/v2/auth/settings/sessions/',
        method: 'GET',
      });
      expect(result).toEqual(mockSessions);
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Session revoked successfully',
      };

      vi.mocked(request).mockResolvedValue(mockResponse);

      const result = await settingsService.revokeSession('abc123');

      expect(request).toHaveBeenCalledWith({
        url: '/api/v2/auth/settings/sessions/abc123/',
        method: 'DELETE',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getLoginHistory', () => {
    it('should fetch login history successfully', async () => {
      const mockHistory = {
        success: true,
        data: [
          {
            login_time: '2024-01-01T12:00:00Z',
            ip_address: '192.168.1.1',
            device: 'Desktop',
            success: true,
          },
          {
            login_time: '2024-01-01T10:00:00Z',
            ip_address: '192.168.1.2',
            device: 'Mobile',
            success: true,
          },
        ],
      };

      vi.mocked(request).mockResolvedValue(mockHistory);

      const result = await settingsService.getLoginHistory();

      expect(request).toHaveBeenCalledWith({
        url: '/api/v2/auth/settings/login-history/',
        method: 'GET',
      });
      expect(result).toEqual(mockHistory);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      vi.mocked(request).mockResolvedValue(mockResponse);

      const result = await settingsService.changePassword({
        current_password: 'OldPassword123!',
        new_password: 'NewPassword456!',
        new_password_confirm: 'NewPassword456!',
      });

      expect(request).toHaveBeenCalledWith({
        url: '/api/v2/auth/password-change/',
        method: 'POST',
        data: {
          current_password: 'OldPassword123!',
          new_password: 'NewPassword456!',
          new_password_confirm: 'NewPassword456!',
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
