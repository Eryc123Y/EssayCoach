'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardRole, DashboardResponse } from '@/service/api/v2/types';
import { api } from '@/service/api/v2/client';

export interface UseDashboardDataReturn {
  data: DashboardResponse | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  role: DashboardRole;
}

const ENDPOINTS: Record<DashboardRole, string> = {
  student: '/core/dashboard/student/',
  lecturer: '/core/dashboard/lecturer/',
  admin: '/core/dashboard/admin/'
};

const MAX_RETRIES = 3;

/**
 * Hook for fetching role-specific dashboard data
 *
 * @param role - User role ('student', 'lecturer', or 'admin')
 * @param options - Optional configuration
 * @returns Dashboard data, loading state, error, and refresh function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refresh } = useDashboardData('student');
 *
 * if (loading) return <DashboardSkeleton />;
 * if (error) return <ErrorState error={error} />;
 *
 * return <StudentDashboard data={data} />;
 * ```
 */
export function useDashboardData(
  role: DashboardRole,
  options?: {
    refreshInterval?: number; // ms, default: 60000 (1 minute)
    enabled?: boolean; // default: true
  }
): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);
  const loadingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel any pending retry before starting a new fetch
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setLoading(true);
    loadingRef.current = true;

    try {
      const endpoint = ENDPOINTS[role] ?? ENDPOINTS.student;
      const response = await api.get<DashboardResponse>(endpoint);

      setData(response);
      setError(null);
      retryCountRef.current = 0;
    } catch (err) {
      const fetchError =
        err instanceof Error ? err : new Error('Failed to fetch dashboard data');
      setError(fetchError);

      if (retryCountRef.current < MAX_RETRIES - 1) {
        const delay = Math.pow(2, retryCountRef.current) * 500; // 500ms, 1s, 2s
        retryCountRef.current += 1;
        retryTimeoutRef.current = setTimeout(() => fetchData(), delay);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [role]);

  const refresh = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData();
  }, [fetchData]);

  // Cancel retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    if (options?.enabled === false) {
      setLoading(false);
      return;
    }

    fetchData();
  }, [fetchData, options?.enabled]);

  // Auto-refresh interval
  useEffect(() => {
    if (options?.enabled === false) {
      return;
    }

    const refreshInterval = options?.refreshInterval ?? 60000; // Default 1 minute

    if (refreshInterval <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!loadingRef.current) {
        fetchData();
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchData, options?.refreshInterval, options?.enabled]);

  return {
    data,
    loading,
    error,
    refresh,
    role
  };
}
