/**
 * useAuthRefresh Hook
 *
 * React hook for automatic JWT token refresh management.
 * Handles auto-refresh before expiry, retry with backoff on network errors,
 * and single-flight concurrent refresh requests.
 *
 * Features:
 * - Monitors access token expiry
 * - Auto-refreshes 5 minutes before expiration
 * - Handles refresh failures (401 -> triggers onAuthError)
 * - Implements exponential backoff for retries (max 3 by default)
 * - Prevents concurrent refresh requests (single flight pattern)
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { authStore, needsRefresh } from '../stores/authStore';
import type { UseAuthRefreshReturn } from '../types/auth';

// Retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second
const MAX_RETRY_DELAY_MS = 30000; // 30 seconds

// Check interval (check every 30 seconds if refresh needed)
const CHECK_INTERVAL_MS = 30000;

// Refresh buffer time (5 minutes before expiry)
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface UseAuthRefreshOptions {
  /** Callback when refresh succeeds */
  onSuccess?: (tokens: { access: string; refresh?: string; expiresAt?: string }) => void;
  /** Callback when refresh fails (401) - typically triggers logout */
  onAuthError?: () => void;
  /** Whether to enable automatic refresh checking */
  enabled?: boolean;
  /** Custom refresh buffer time in milliseconds (default: 5 minutes) */
  refreshBufferMs?: number;
}

export function useAuthRefresh(options: UseAuthRefreshOptions = {}): UseAuthRefreshReturn {
  const {
    onSuccess,
    onAuthError,
    enabled = true,
    refreshBufferMs = REFRESH_BUFFER_MS,
  } = options;

  // Local state for tracking
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Refs for managing async operations
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Custom needsRefresh that uses configurable buffer
  const customNeedsRefresh = useCallback(
    (expiryMs: number | null): boolean => {
      if (!expiryMs) return true;
      const now = Date.now();
      return now >= expiryMs - refreshBufferMs;
    },
    [refreshBufferMs]
  );

  // Single-flight refresh - ensures only one refresh request at a time
  const refreshWithSingleFlight = useCallback(async (): Promise<boolean> => {
    // If already refreshing, return existing promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    // Create new refresh promise
    refreshPromiseRef.current = authStore.getState().refreshTokens();

    try {
      const result = await refreshPromiseRef.current;
      return result;
    } finally {
      // Clear the promise reference after completion
      refreshPromiseRef.current = null;
    }
  }, []);

  // Refresh with retry backoff
  const refreshWithRetry = useCallback(async (): Promise<boolean> => {
    try {
      const success = await refreshWithSingleFlight();

      if (success) {
        // Reset retry count on success
        retryCountRef.current = 0;
        setLastRefreshAt(new Date());
        setRefreshCount((prev) => prev + 1);
        setIsRefreshing(false);
        setError(null);

        // Get the new tokens for callback
        const state = authStore.getState();
        if (onSuccess && state.accessToken && state.refreshToken && state.tokenExpiry) {
          onSuccess({
            access: state.accessToken,
            refresh: state.refreshToken,
            expiresAt: new Date(state.tokenExpiry).toISOString(),
          });
        }
        return true;
      }

      // Refresh failed but not 401 - retry with backoff
      const currentRetry = retryCountRef.current;
      if (currentRetry < MAX_RETRY_ATTEMPTS) {
        const delay = Math.min(
          INITIAL_RETRY_DELAY_MS * Math.pow(2, currentRetry),
          MAX_RETRY_DELAY_MS
        );

        retryTimerRef.current = setTimeout(() => {
          retryCountRef.current += 1;
          refreshWithRetry();
        }, delay);
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Refresh failed';

      // Check if it's a 401 error (invalid/expired refresh token)
      if (errorMessage.includes('401') || errorMessage.includes('expired')) {
        setIsRefreshing(false);
        setError(errorMessage);
        onAuthError?.();
        return false;
      }

      // Network error or other exception - retry
      const currentRetry = retryCountRef.current;
      if (currentRetry < MAX_RETRY_ATTEMPTS) {
        const delay = Math.min(
          INITIAL_RETRY_DELAY_MS * Math.pow(2, currentRetry),
          MAX_RETRY_DELAY_MS
        );

        retryTimerRef.current = setTimeout(() => {
          retryCountRef.current += 1;
          refreshWithRetry();
        }, delay);
      } else {
        // Max retries exceeded
        setIsRefreshing(false);
        setError(errorMessage);
        onAuthError?.();
      }

      return false;
    }
  }, [refreshWithSingleFlight, onSuccess, onAuthError]);

  // Force refresh - immediate refresh attempt
  const forceRefresh = useCallback(async (): Promise<boolean> => {
    // Cancel any pending retries
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
      retryCountRef.current = 0;
    }

    setIsRefreshing(true);
    return refreshWithRetry();
  }, [refreshWithRetry]);

  // Check and refresh if needed
  const checkAndRefresh = useCallback(async (): Promise<boolean> => {
    const state = authStore.getState();
    if (customNeedsRefresh(state.tokenExpiry)) {
      setIsRefreshing(true);
      return refreshWithRetry();
    }
    return true; // No refresh needed, consider it success
  }, [refreshWithRetry, customNeedsRefresh]);

  // Setup periodic refresh check
  useEffect(() => {
    if (!enabled) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      return;
    }

    // Initial check
    checkAndRefresh();

    // Periodic checks
    checkIntervalRef.current = setInterval(() => {
      checkAndRefresh();
    }, CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, checkAndRefresh]);

  // Listen for 401 errors from store and trigger logout
  useEffect(() => {
    const unsubscribe = authStore.subscribe((state) => {
      // If refresh error indicates auth failure, trigger logout
      if (
        state.refreshError &&
        (state.refreshError.includes('401') || state.refreshError.includes('expired'))
      ) {
        setError(state.refreshError);
        onAuthError?.();
      }
    });

    return () => unsubscribe();
  }, [onAuthError]);

  // Sync with store state
  useEffect(() => {
    const unsubscribe = authStore.subscribe((state) => {
      setIsRefreshing(state.isRefreshing);
      if (state.refreshError && !state.refreshError.includes('401')) {
        setError(state.refreshError);
      }
    });

    return () => unsubscribe();
  }, []);

  // Get current token (auto-refresh if needed)
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const state = authStore.getState();

    // Return current token if valid
    if (state.accessToken && !customNeedsRefresh(state.tokenExpiry)) {
      return state.accessToken;
    }

    // Need to refresh first
    const success = await forceRefresh();
    if (success) {
      return authStore.getState().accessToken;
    }

    return null;
  }, [forceRefresh, customNeedsRefresh]);

  // Clear all state (for logout)
  const clearAuth = useCallback(async (): Promise<boolean> => {
    // Cancel pending operations
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    retryCountRef.current = 0;

    // Clear store
    authStore.getState().clearTokens();

    // Clear local state
    setIsRefreshing(false);
    setError(null);
    setLastRefreshAt(null);
    setRefreshCount(0);

    return true;
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
    retryCountRef.current = 0;
    authStore.getState().clearRefreshError();
  }, []);

  // Get current store state for return
  const currentState = authStore.getState();

  return {
    // Current state from store
    accessToken: currentState.accessToken,
    refreshToken: currentState.refreshToken,
    tokenExpiry: currentState.tokenExpiry,
    isRefreshing: currentState.isRefreshing,
    error: error || currentState.refreshError,
    lastRefreshAt,
    refreshCount,

    // Actions
    clearError,
    refresh: forceRefresh,
    checkAndRefresh,
    getAccessToken,
    clearAuth,

    // Utility
    needsRefresh: () => customNeedsRefresh(currentState.tokenExpiry),
  };
}

// Interceptor helper - use before API requests
export async function getValidAccessToken(): Promise<string | null> {
  const state = authStore.getState();

  if (state.accessToken && !needsRefresh(state.tokenExpiry)) {
    return state.accessToken;
  }

  const success = await authStore.getState().refreshTokens();
  if (success) {
    return authStore.getState().accessToken;
  }

  return null;
}
