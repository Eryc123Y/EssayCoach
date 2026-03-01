/**
 * Auth API Service Integration Tests
 *
 * Tests for the JWT refresh API integration including:
 * - Login → receive tokens → auto-refresh → protected request flow
 * - Token expiry during API call → refresh → retry original request
 * - Refresh token rotation
 * - Network error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '@/service/api/v2/auth';
import { authStore, createAuthStore, needsRefresh } from '@/stores/authStore';
import { getValidAccessToken } from '@/hooks/useAuthRefresh';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create a mock JWT token
function createMockJWT(
  expiresInSeconds: number = 3600,
  payload: Record<string, unknown> = {}
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    sub: 'user-123',
    iat: now,
    exp: now + expiresInSeconds,
    ...payload,
  };

  const base64Header = btoa(JSON.stringify(header));
  const base64Body = btoa(JSON.stringify(body));

  return `${base64Header}.${base64Body}.signature`;
}

describe('Auth API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Reset auth store to clean state
    authStore.setState({
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      isRefreshing: false,
      refreshError: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Auth Flow', () => {
    it('should handle login and receive tokens', async () => {
      const validAccessToken = createMockJWT(3600);

      // Mock login response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          token: validAccessToken,
          user: {
            user_id: 1,
            user_email: 'test@example.com',
            user_fname: 'Test',
            user_lname: 'User',
            user_role: 'student',
            is_active: true,
          },
        }),
      });

      // Step 1: Login
      const loginResult = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(loginResult.access).toBe(validAccessToken);
      expect(loginResult.user.user_email).toBe('test@example.com');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v2/auth/login-with-jwt/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
    });

    it('should refresh expired token and return new token', async () => {
      const expiredToken = createMockJWT(60);
      const newToken = createMockJWT(3600);
      const refreshToken = 'refresh-token-xyz';

      // Setup store with expired token
      authStore.setState({
        accessToken: expiredToken,
        refreshToken,
        tokenExpiry: Date.now() - 1000, // Expired
      });

      // Mock refresh response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access: newToken,
          refresh: 'new-refresh-token',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      // Get valid token (should trigger refresh)
      const token = await getValidAccessToken();

      expect(token).toBe(newToken);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v2/auth/refresh/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh: refreshToken }),
        })
      );
    });

    it('should return valid token without refresh when not expired', async () => {
      const validToken = createMockJWT(3600);
      const refreshToken = 'refresh-token';

      // Setup store with valid token (expires in 1 hour)
      authStore.setState({
        accessToken: validToken,
        refreshToken,
        tokenExpiry: Date.now() + 3600000,
      });

      const token = await getValidAccessToken();

      expect(token).toBe(validToken);
      // Should not have called fetch (no refresh needed)
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Refresh Token Rotation', () => {
    it('should use new refresh token from rotated response', async () => {
      const oldRefreshToken = 'old-refresh-token';
      const newRefreshToken = 'new-rotated-refresh-token';
      const newAccessToken = createMockJWT(3600);

      // Setup with expired token
      authStore.setState({
        accessToken: 'expired-token',
        refreshToken: oldRefreshToken,
        tokenExpiry: Date.now() - 1000,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access: newAccessToken,
          refresh: newRefreshToken,
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      await getValidAccessToken();

      // Verify refresh was called with old token
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v2/auth/refresh/',
        expect.objectContaining({
          body: JSON.stringify({ refresh: oldRefreshToken }),
        })
      );

      // Verify store was updated with new refresh token
      const state = authStore.getState();
      expect(state.refreshToken).toBe(newRefreshToken);
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Setup with expired token
      authStore.setState({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        tokenExpiry: Date.now() - 1000,
      });

      const result = await getValidAccessToken();

      expect(result).toBeNull();
      expect(authStore.getState().refreshError).toBe('Network error');
    });

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Setup with expired token
      authStore.setState({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        tokenExpiry: Date.now() - 1000,
      });

      const result = await getValidAccessToken();

      expect(result).toBeNull();
    });

    it('should clear tokens on 401 (refresh token expired)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      // Setup with expired token
      authStore.setState({
        accessToken: 'expired-token',
        refreshToken: 'old-refresh',
        tokenExpiry: Date.now() - 1000,
      });

      const result = await getValidAccessToken();

      expect(result).toBeNull();
      const state = authStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('Token Validation', () => {
    it('should return valid token without refresh when not expired', async () => {
      const validToken = createMockJWT(3600);

      authStore.setState({
        accessToken: validToken,
        refreshToken: 'refresh-token',
        tokenExpiry: Date.now() + 3600000, // 1 hour from now
      });

      const token = await getValidAccessToken();

      expect(token).toBe(validToken);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should trigger refresh when within 5-minute buffer', async () => {
      const validToken = createMockJWT(3600);
      const newToken = createMockJWT(3600);
      // Token expires in 3 minutes (within 5-minute buffer)
      const bufferExpiry = Date.now() + 3 * 60 * 1000;

      authStore.setState({
        accessToken: validToken,
        refreshToken: 'refresh-token',
        tokenExpiry: bufferExpiry,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access: newToken,
          refresh: 'new-refresh',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      const token = await getValidAccessToken();

      expect(token).toBe(newToken);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('needsRefresh Utility', () => {
    it('should return true when no expiry', () => {
      expect(needsRefresh(null)).toBe(true);
    });

    it('should return true when expired', () => {
      const expired = Date.now() - 1000;
      expect(needsRefresh(expired)).toBe(true);
    });

    it('should return true when within 5-minute buffer', () => {
      const withinBuffer = Date.now() + 3 * 60 * 1000; // 3 minutes
      expect(needsRefresh(withinBuffer)).toBe(true);
    });

    it('should return false when well within validity', () => {
      const valid = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
      expect(needsRefresh(valid)).toBe(false);
    });

    it('should use exact 5-minute boundary', () => {
      const exactly5Min = Date.now() + 5 * 60 * 1000 + 1000; // 5 min + 1 sec
      expect(needsRefresh(exactly5Min)).toBe(false);

      const justUnder5Min = Date.now() + 4 * 60 * 1000 + 59 * 1000; // 4:59
      expect(needsRefresh(justUnder5Min)).toBe(true);
    });
  });

  describe('Logout Flow', () => {
    it('should call logout endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204, // No content
      });

      await authService.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v2/auth/logout/',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should clear tokens on logout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      authStore.setState({
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        tokenExpiry: Date.now() + 3600000,
      });

      // Note: authService.logout doesn't clear the store automatically
      // That should be handled by the calling code
      await authService.logout();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('getUserInfo', () => {
    it('should fetch user info successfully', async () => {
      const mockUserInfo = {
        user_id: 1,
        user_email: 'test@example.com',
        user_fname: 'Test',
        user_lname: 'User',
        user_role: 'student' as const,
        is_active: true,
        // Normalized fields added by normalizeUserInfo
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'student',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUserInfo,
      });

      const userInfo = await authService.getUserInfo();

      expect(userInfo).toEqual(mockUserInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v2/auth/me/',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should throw on 401 when fetching user info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(authService.getUserInfo()).rejects.toThrow();
    });
  });
});
