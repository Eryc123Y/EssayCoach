/**
 * useAuthRefresh Hook Unit Tests
 *
 * Tests for the JWT refresh hook covering key functionality:
 * - Hook initialization
 * - Auto-refresh triggers
 * - Token state access
 * - Logout/clear auth
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuthRefresh, getValidAccessToken } from './useAuthRefresh';
import { authStore, needsRefresh } from '../stores/authStore';

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
    ...payload
  };

  const base64Header = btoa(JSON.stringify(header));
  const base64Body = btoa(JSON.stringify(body));

  return `${base64Header}.${base64Body}.signature`;
}

describe('useAuthRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Reset auth store to clean state
    authStore.setState({
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      isRefreshing: false,
      refreshError: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with token from store', () => {
      const validToken = createMockJWT(3600);

      authStore.setState({
        accessToken: validToken,
        refreshToken: 'refresh-token-123',
        tokenExpiry: Date.now() + 3600000,
        isRefreshing: false,
        refreshError: null
      });

      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      expect(result.current.accessToken).toBe(validToken);
      expect(result.current.refreshToken).toBe('refresh-token-123');
    });

    it('should initialize with null tokens when not authenticated', () => {
      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
    });

    it('should expose clearError function', () => {
      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      expect(result.current.clearError).toBeDefined();
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('Auto-Refresh Behavior', () => {
    it('should trigger refresh when enabled and token needs refresh', async () => {
      const newToken = createMockJWT(3600);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access: newToken,
          refresh: 'new-refresh',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        })
      });

      // Setup with token expiring in 3 minutes (within buffer)
      authStore.setState({
        accessToken: 'old-token',
        refreshToken: 'refresh-123',
        tokenExpiry: Date.now() + 3 * 60 * 1000,
        isRefreshing: false,
        refreshError: null
      });

      renderHook(() => useAuthRefresh({ enabled: true }));

      // Wait for refresh to be triggered
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Manual Refresh', () => {
    it('should allow manual refresh via refresh() method', async () => {
      const newToken = createMockJWT(3600);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access: newToken,
          refresh: 'new-refresh'
        })
      });

      authStore.setState({
        accessToken: 'expired-token',
        refreshToken: 'old-refresh',
        tokenExpiry: Date.now() - 1000,
        isRefreshing: false,
        refreshError: null
      });

      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      await act(async () => {
        const success = await result.current.refresh();
        expect(success).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v2/auth/refresh/',
        expect.anything()
      );
    });

    it('should handle refresh failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      authStore.setState({
        accessToken: 'expired-token',
        refreshToken: null, // No refresh token
        tokenExpiry: Date.now() - 1000,
        isRefreshing: false,
        refreshError: null
      });

      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      await act(async () => {
        const success = await result.current.refresh();
        expect(success).toBe(false);
      });
    });
  });

  describe('Token Access', () => {
    it('should return current token via getAccessToken()', async () => {
      const validToken = createMockJWT(3600);

      authStore.setState({
        accessToken: validToken,
        refreshToken: 'refresh-123',
        tokenExpiry: Date.now() + 3600000,
        isRefreshing: false,
        refreshError: null
      });

      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      const token = await result.current.getAccessToken();

      expect(token).toBe(validToken);
    });

    it('should return null when no token available', async () => {
      authStore.setState({
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      });

      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      const token = await result.current.getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('Clear Auth', () => {
    it('should clear tokens via clearAuth()', async () => {
      authStore.setState({
        accessToken: 'valid-token',
        refreshToken: 'refresh-123',
        tokenExpiry: Date.now() + 3600000
      });

      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      await act(async () => {
        await result.current.clearAuth();
      });

      const state = authStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should expose error state', () => {
      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      expect(result.current.error).toBeDefined();
    });

    it('should expose isRefreshing state', () => {
      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      expect(result.current.isRefreshing).toBeDefined();
      expect(result.current.isRefreshing).toBe(false);
    });
  });

  describe('checkAndRefresh', () => {
    it('should refresh when token needs refresh', async () => {
      const newToken = createMockJWT(3600);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access: newToken,
          refresh: 'new-refresh'
        })
      });

      authStore.setState({
        accessToken: 'old-token',
        refreshToken: 'refresh-123',
        tokenExpiry: Date.now() + 3 * 60 * 1000 // Within buffer
      });

      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      await act(async () => {
        await result.current.checkAndRefresh();
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should not refresh when token is valid', async () => {
      authStore.setState({
        accessToken: 'valid-token',
        refreshToken: 'refresh-123',
        tokenExpiry: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
      });

      const { result } = renderHook(() => useAuthRefresh({ enabled: false }));

      await act(async () => {
        await result.current.checkAndRefresh();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('needsRefresh utility', () => {
    it('should return true when expiry is null', () => {
      expect(needsRefresh(null)).toBe(true);
    });

    it('should return true when expired', () => {
      expect(needsRefresh(Date.now() - 1000)).toBe(true);
    });

    it('should return true when within buffer', () => {
      expect(needsRefresh(Date.now() + 3 * 60 * 1000)).toBe(true);
    });

    it('should return false when valid', () => {
      expect(needsRefresh(Date.now() + 2 * 60 * 60 * 1000)).toBe(false);
    });
  });

  describe('getValidAccessToken (standalone)', () => {
    it('should return valid token without refresh', async () => {
      const validToken = createMockJWT(3600);

      authStore.setState({
        accessToken: validToken,
        refreshToken: 'refresh-123',
        tokenExpiry: Date.now() + 3600000
      });

      const token = await getValidAccessToken();

      expect(token).toBe(validToken);
    });

    it('should return null when no refresh token available', async () => {
      authStore.setState({
        accessToken: 'expired-token',
        refreshToken: null,
        tokenExpiry: Date.now() - 1000
      });

      const token = await getValidAccessToken();

      expect(token).toBeNull();
    });
  });
});
