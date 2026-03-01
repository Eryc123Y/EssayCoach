/**
 * JWT Auth Store with Auto-Refresh
 *
 * Manages JWT access and refresh tokens with automatic refresh before expiry.
 * Uses Zustand for state management.
 */

import { createStore } from 'zustand';

// Token refresh buffer time (refresh 5 minutes before expiry)
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export interface TokenState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null; // Timestamp when access token expires
  isRefreshing: boolean;
  refreshError: string | null;
}

export interface TokenActions {
  setTokens: (access: string, refresh: string, expiryInMs: number) => void;
  clearTokens: () => void;
  refreshTokens: () => Promise<boolean>;
  markRefreshError: (error: string) => void;
  clearRefreshError: () => void;
}

export type AuthStore = TokenState & TokenActions;

// Helper to decode JWT and get expiry
function getJwtExpiry(token: string): number | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    // Check if exp exists and is a number
    if (!payload.exp || typeof payload.exp !== 'number') {
      return null;
    }
    // Convert from seconds to milliseconds
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

// Check if token needs refresh (within buffer window)
function needsRefresh(expiryMs: number | null): boolean {
  if (!expiryMs) return true;
  const now = Date.now();
  return now >= expiryMs - REFRESH_BUFFER_MS;
}

// Module-level Promise cache for single-flight refresh (prevents race conditions)
let refreshPromise: Promise<boolean> | null = null;

// Internal function to reset the refresh promise cache (for testing)
// DO NOT use in production code
export function _resetRefreshPromiseCache(): void {
  refreshPromise = null;
}

// Create the store
export const createAuthStore = (
  initialAccessToken: string | null = null,
  initialRefreshToken: string | null = null
) => {
  return createStore<AuthStore>()((set, get) => {
    // Calculate initial expiry from token if available
    let initialExpiry: number | null = null;
    if (initialAccessToken) {
      initialExpiry = getJwtExpiry(initialAccessToken);
    }

    return {
      // State
      accessToken: initialAccessToken,
      refreshToken: initialRefreshToken,
      tokenExpiry: initialExpiry,
      isRefreshing: false,
      refreshError: null,

      // Actions
      setTokens: (access, refresh, expiryInMs) => {
        const expiryTimestamp = Date.now() + expiryInMs;
        set({
          accessToken: access,
          refreshToken: refresh,
          tokenExpiry: expiryTimestamp,
          isRefreshing: false,
          refreshError: null,
        });
      },

      clearTokens: () => {
        set({
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
          isRefreshing: false,
          refreshError: null,
        });
      },

      refreshTokens: async (): Promise<boolean> => {
        const { refreshToken, tokenExpiry } = get();

        // Don't refresh if no refresh token
        if (!refreshToken) return false;

        // Don't refresh if not needed (outside buffer window)
        if (!needsRefresh(tokenExpiry)) return true;

        // If a refresh is already in flight, return the existing promise
        // This prevents the "thundering herd" problem where multiple
        // concurrent requests trigger duplicate refresh calls
        if (refreshPromise) return refreshPromise;

        set({ isRefreshing: true, refreshError: null });

        // Create and store the promise so concurrent callers can await it
        refreshPromise = (async () => {
          try {
            const response = await fetch('/api/v2/auth/refresh/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ refresh: refreshToken }),
            });

            if (!response.ok) {
              if (response.status === 401) {
                // Refresh token expired/invalid - clear all tokens
                get().clearTokens();
                throw new Error('Refresh token expired');
              }
              throw new Error(`Refresh failed with status ${response.status}`);
            }

            const data = await response.json();

            // New tokens received - update store
            const { access, refresh, expiresAt, expires_at } = data;
            const normalizedExpiresAt = expiresAt ?? expires_at;

            // Parse expiry from ISO string or fall back to JWT decoding
            let newExpiry: number | null = null;
            if (normalizedExpiresAt) {
              const expiryDate = new Date(normalizedExpiresAt);
              if (!isNaN(expiryDate.getTime())) {
                newExpiry = expiryDate.getTime();
              }
            }
            if (!newExpiry) {
              newExpiry = getJwtExpiry(access);
            }

            set({
              accessToken: access,
              refreshToken: refresh, // Always use new rotated refresh token
              tokenExpiry: newExpiry,
              isRefreshing: false,
            });

            return true;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Refresh failed';
            set({
              isRefreshing: false,
              refreshError: errorMessage,
            });
            return false;
          } finally {
            // Clear the promise reference when done
            refreshPromise = null;
          }
        })();

        return refreshPromise;
      },

      markRefreshError: (error: string) => {
        set({ refreshError: error, isRefreshing: false });
      },

      clearRefreshError: () => {
        set({ refreshError: null });
      },
    };
  });
};

// Default store instance (can be overridden)
export const authStore = createAuthStore();

// Utility to check if token should be refreshed
export { needsRefresh, getJwtExpiry };
