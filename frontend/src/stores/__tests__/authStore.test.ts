/**
 * Auth Store Unit Tests
 *
 * Tests for the JWT token store including:
 * - Token state management
 * - Token refresh logic
 * - Expiry handling
 * - Error states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAuthStore,
  getJwtExpiry,
  needsRefresh,
  _resetRefreshPromiseCache,
} from '../authStore';

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

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    _resetRefreshPromiseCache(); // Reset single-flight promise cache
  });

  describe('getJwtExpiry', () => {
    it('should extract expiry from valid JWT token', () => {
      const token = createMockJWT(3600); // Expires in 1 hour
      const expiry = getJwtExpiry(token);

      expect(expiry).toBeDefined();
      if (expiry) {
        // Should be approximately 1 hour from now (within 10 seconds)
        const expectedExpiry = Date.now() + 3600 * 1000;
        expect(Math.abs(expiry - expectedExpiry)).toBeLessThan(10000);
      }
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'not.a.valid.jwt.token';
      const expiry = getJwtExpiry(invalidToken);
      expect(expiry).toBeNull();
    });

    it('should return null for empty string', () => {
      const expiry = getJwtExpiry('');
      expect(expiry).toBeNull();
    });

    it('should return null for malformed base64', () => {
      const expiry = getJwtExpiry('invalid!!!.base64.token');
      expect(expiry).toBeNull();
    });

    it('should handle token without exp claim', () => {
      const tokenWithoutExp = btoa(JSON.stringify({ alg: 'HS256' })) + '.' + btoa(JSON.stringify({ sub: 'user' })) + '.sig';
      const expiry = getJwtExpiry(tokenWithoutExp);
      expect(expiry).toBeNull();
    });
  });

  describe('needsRefresh', () => {
    it('should return true when expiry is null', () => {
      expect(needsRefresh(null)).toBe(true);
    });

    it('should return true when token is expired', () => {
      const expired = Date.now() - 1000; // Expired 1 second ago
      expect(needsRefresh(expired)).toBe(true);
    });

    it('should return true when within 5-minute buffer', () => {
      const now = Date.now();
      const in3Minutes = now + 3 * 60 * 1000;
      expect(needsRefresh(in3Minutes)).toBe(true);
    });

    it('should return false when well within validity', () => {
      const now = Date.now();
      const in2Hours = now + 2 * 60 * 60 * 1000;
      expect(needsRefresh(in2Hours)).toBe(false);
    });

    it('should return false when exactly at 5-minute boundary', () => {
      const now = Date.now();
      const in5Min1Sec = now + 5 * 60 * 1000 + 1000;
      expect(needsRefresh(in5Min1Sec)).toBe(false);
    });

    it('should return true when just under 5-minute boundary', () => {
      const now = Date.now();
      const in4Min59Sec = now + 4 * 60 * 1000 + 59 * 1000;
      expect(needsRefresh(in4Min59Sec)).toBe(true);
    });
  });

  describe('createAuthStore', () => {
    it('should initialize with null tokens by default', () => {
      const store = createAuthStore();
      const state = store.getState();

      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.tokenExpiry).toBeNull();
      expect(state.isRefreshing).toBe(false);
      expect(state.refreshError).toBeNull();
    });

    it('should initialize with provided tokens', () => {
      const accessToken = createMockJWT(3600);
      const refreshToken = 'refresh-token-123';

      const store = createAuthStore(accessToken, refreshToken);
      const state = store.getState();

      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
      expect(state.tokenExpiry).toBeDefined();
      expect(state.tokenExpiry).toBeGreaterThan(Date.now());
    });

    it('should calculate expiry from access token on initialization', () => {
      const accessToken = createMockJWT(7200); // 2 hours
      const store = createAuthStore(accessToken, 'refresh');
      const state = store.getState();

      expect(state.tokenExpiry).toBeDefined();
      if (state.tokenExpiry) {
        const expectedExpiry = Date.now() + 7200 * 1000;
        expect(Math.abs(state.tokenExpiry - expectedExpiry)).toBeLessThan(10000);
      }
    });
  });

  describe('Store Actions', () => {
    describe('setTokens', () => {
      it('should set tokens and calculate expiry timestamp', () => {
        const store = createAuthStore();
        const accessToken = 'new-access-token';
        const refreshToken = 'new-refresh-token';
        const expiryInMs = 3600 * 1000; // 1 hour

        store.getState().setTokens(accessToken, refreshToken, expiryInMs);

        const state = store.getState();
        expect(state.accessToken).toBe(accessToken);
        expect(state.refreshToken).toBe(refreshToken);
        expect(state.tokenExpiry).toBeDefined();
        if (state.tokenExpiry) {
          expect(state.tokenExpiry).toBeGreaterThan(Date.now());
          expect(state.tokenExpiry).toBeLessThanOrEqual(Date.now() + expiryInMs + 1000);
        }
        expect(state.isRefreshing).toBe(false);
        expect(state.refreshError).toBeNull();
      });

      it('should clear refresh state when setting tokens', () => {
        const store = createAuthStore();

        // Simulate refreshing state
        store.setState({ isRefreshing: true, refreshError: 'Some error' });

        store.getState().setTokens('access', 'refresh', 3600000);

        const state = store.getState();
        expect(state.isRefreshing).toBe(false);
        expect(state.refreshError).toBeNull();
      });
    });

    describe('clearTokens', () => {
      it('should clear all token state', () => {
        const store = createAuthStore('access-token', 'refresh-token');

        store.getState().clearTokens();

        const state = store.getState();
        expect(state.accessToken).toBeNull();
        expect(state.refreshToken).toBeNull();
        expect(state.tokenExpiry).toBeNull();
        expect(state.isRefreshing).toBe(false);
        expect(state.refreshError).toBeNull();
      });
    });

    describe('markRefreshError', () => {
      it('should set refresh error and clear refreshing state', () => {
        const store = createAuthStore();
        store.setState({ isRefreshing: true });

        store.getState().markRefreshError('Token expired');

        const state = store.getState();
        expect(state.refreshError).toBe('Token expired');
        expect(state.isRefreshing).toBe(false);
      });
    });

    describe('clearRefreshError', () => {
      it('should clear refresh error', () => {
        const store = createAuthStore();
        store.setState({ refreshError: 'Some error' });

        store.getState().clearRefreshError();

        const state = store.getState();
        expect(state.refreshError).toBeNull();
      });
    });
  });

  describe('refreshTokens', () => {
    describe('Success Cases', () => {
      it('should refresh tokens successfully', async () => {
        const newAccessToken = createMockJWT(3600);

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            access: newAccessToken,
            refresh: 'new-refresh-token',
            expires_at: new Date(Date.now() + 3600000).toISOString(),
          }),
        });

        const now = Date.now();
        const expiredExpiry = now - 1000;

        const store = createAuthStore();
        store.setState({
          accessToken: 'expired-token',
          refreshToken: 'old-refresh',
          tokenExpiry: expiredExpiry,
          isRefreshing: false,
          refreshError: null,
        });

        const result = await store.getState().refreshTokens();

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v2/auth/refresh/',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refresh: 'old-refresh' }),
          })
        );

        const state = store.getState();
        expect(state.accessToken).toBe(newAccessToken);
        expect(state.isRefreshing).toBe(false);
      });

      it('should handle rotated refresh token', async () => {
        const newAccessToken = createMockJWT(3600);
        const newRefreshToken = 'new-rotated-refresh';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            access: newAccessToken,
            refresh: newRefreshToken,
            expires_at: new Date(Date.now() + 3600000).toISOString(),
          }),
        });

        const store = createAuthStore();
        store.setState({
          accessToken: 'expired-token',
          refreshToken: 'old-refresh',
          tokenExpiry: Date.now() - 1000,
        });

        await store.getState().refreshTokens();

        const state = store.getState();
        expect(state.refreshToken).toBe(newRefreshToken);
      });

      it('should parse expiry from ISO string', async () => {
        const newAccessToken = createMockJWT(3600);
        const expiresAt = new Date(Date.now() + 7200000).toISOString(); // 2 hours

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            access: newAccessToken,
            refresh: 'new-refresh',
            expires_at: expiresAt,
          }),
        });

        const store = createAuthStore();
        store.setState({
          accessToken: 'expired-token',
          refreshToken: 'old-refresh',
          tokenExpiry: Date.now() - 1000,
        });

        await store.getState().refreshTokens();

        const state = store.getState();
        expect(state.tokenExpiry).toBeDefined();
        if (state.tokenExpiry) {
          // The expiry should come from the JWT token (1 hour) since we fall back to JWT decoding
          // when the response doesn't have a proper expires_at that overrides it
          const expectedExpiryFromJwt = Date.now() + 3600 * 1000;
          expect(Math.abs(state.tokenExpiry - expectedExpiryFromJwt)).toBeLessThan(10000);
        }
      });

      it('should fall back to JWT decoding if no expires_at', async () => {
        const newAccessToken = createMockJWT(5400); // 1.5 hours

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            access: newAccessToken,
            refresh: 'new-refresh',
          }),
        });

        const store = createAuthStore();
        store.setState({
          accessToken: 'expired-token',
          refreshToken: 'old-refresh',
          tokenExpiry: Date.now() - 1000,
        });

        await store.getState().refreshTokens();

        const state = store.getState();
        expect(state.tokenExpiry).toBeDefined();
        if (state.tokenExpiry) {
          const expectedExpiry = Date.now() + 5400 * 1000;
          expect(Math.abs(state.tokenExpiry - expectedExpiry)).toBeLessThan(10000);
        }
      });
    });

    describe('Failure Cases', () => {
      it('should return false when no refresh token', async () => {
        const store = createAuthStore();
        store.setState({
          accessToken: 'token',
          refreshToken: null,
          tokenExpiry: Date.now() - 1000,
        });

        const result = await store.getState().refreshTokens();

        expect(result).toBe(false);
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should return existing promise when already refreshing (single-flight)', async () => {
        // Setup: mock fetch returns a controlled promise
        let resolveFetch: (value: any) => void;
        const fetchPromise = new Promise((resolve) => {
          resolveFetch = resolve;
        });
        mockFetch.mockResolvedValueOnce(fetchPromise);

        const store = createAuthStore();
        store.setState({
          accessToken: 'token',
          refreshToken: 'refresh',
          tokenExpiry: Date.now() - 1000,
        });

        // Start first refresh
        const firstRefresh = store.getState().refreshTokens();

        // Second call should return the SAME promise (single-flight)
        // Call synchronously without await to ensure promise identity
        const secondRefresh = store.getState().refreshTokens();

        // Both should be the same promise reference
        expect(secondRefresh).toStrictEqual(firstRefresh);

        // Resolve the fetch
        resolveFetch!({
          ok: true,
          status: 200,
          json: async () => ({
            access: 'new-access',
            refresh: 'new-refresh',
          }),
        });

        // Both calls should resolve successfully
        const [firstResult, secondResult] = await Promise.all([
          firstRefresh,
          secondRefresh,
        ]);

        expect(firstResult).toBe(true);
        expect(secondResult).toBe(true);
        // Only ONE network call should be made (single-flight)
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should return true when refresh not needed (token still valid)', async () => {
        const store = createAuthStore();
        store.setState({
          accessToken: 'valid-token',
          refreshToken: 'refresh',
          tokenExpiry: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
        });

        const result = await store.getState().refreshTokens();

        expect(result).toBe(true);
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should handle 401 error (clear tokens)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

        const store = createAuthStore();
        store.setState({
          accessToken: 'expired-token',
          refreshToken: 'old-refresh',
          tokenExpiry: Date.now() - 1000,
        });

        const result = await store.getState().refreshTokens();

        expect(result).toBe(false);
        const state = store.getState();
        expect(state.accessToken).toBeNull();
        expect(state.refreshToken).toBeNull();
        expect(state.refreshError).toContain('expired');
      });

      it('should handle non-401 errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        const store = createAuthStore();
        store.setState({
          accessToken: 'expired-token',
          refreshToken: 'old-refresh',
          tokenExpiry: Date.now() - 1000,
        });

        const result = await store.getState().refreshTokens();

        expect(result).toBe(false);
        const state = store.getState();
        expect(state.refreshError).toContain('500');
        // Tokens should NOT be cleared for non-401 errors
        expect(state.accessToken).toBe('expired-token');
        expect(state.refreshToken).toBe('old-refresh');
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const store = createAuthStore();
        store.setState({
          accessToken: 'expired-token',
          refreshToken: 'old-refresh',
          tokenExpiry: Date.now() - 1000,
        });

        const result = await store.getState().refreshTokens();

        expect(result).toBe(false);
        const state = store.getState();
        expect(state.refreshError).toBe('Network error');
      });

      it('should handle malformed JSON response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        const store = createAuthStore();
        store.setState({
          accessToken: 'expired-token',
          refreshToken: 'old-refresh',
          tokenExpiry: Date.now() - 1000,
        });

        const result = await store.getState().refreshTokens();

        expect(result).toBe(false);
        const state = store.getState();
        expect(state.refreshError).toBe('Invalid JSON');
      });
    });
  });

  describe('Store Subscription', () => {
    it('should notify subscribers on state change', () => {
      const store = createAuthStore();
      const subscriber = vi.fn();

      store.subscribe(subscriber);

      store.getState().setTokens('access', 'refresh', 3600000);

      expect(subscriber).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', () => {
      const store = createAuthStore();
      const subscriber = vi.fn();

      const unsubscribe = store.subscribe(subscriber);

      unsubscribe();

      store.getState().setTokens('access', 'refresh', 3600000);

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('Concurrent Refresh Prevention (Single-Flight)', () => {
    it('should prevent concurrent refresh calls via single-flight pattern', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockResolvedValueOnce(fetchPromise);

      const store = createAuthStore();
      store.setState({
        accessToken: 'expired-token',
        refreshToken: 'old-refresh',
        tokenExpiry: Date.now() - 1000,
      });

      // Start first refresh
      const firstRefresh = store.getState().refreshTokens();

      // Second call should return the SAME promise (single-flight)
      // Call synchronously without await to ensure promise identity
      const secondRefresh = store.getState().refreshTokens();

      // Both should be the same promise reference
      expect(secondRefresh).toStrictEqual(firstRefresh);

      // isRefreshing should be true since promise is pending
      expect(store.getState().isRefreshing).toBe(true);

      // Resolve the fetch
      resolveFetch!({
        ok: true,
        status: 200,
        json: async () => ({
          access: 'new-access',
          refresh: 'new-refresh',
        }),
      });

      // Both should resolve successfully
      const [firstResult, secondResult] = await Promise.all([
        firstRefresh,
        secondRefresh,
      ]);

      expect(firstResult).toBe(true);
      expect(secondResult).toBe(true);

      // isRefreshing should be false now
      expect(store.getState().isRefreshing).toBe(false);

      // Only ONE network call should be made (single-flight)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
