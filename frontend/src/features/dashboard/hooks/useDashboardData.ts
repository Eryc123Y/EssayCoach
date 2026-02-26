'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DashboardRole,
  DashboardResponse,
} from '@/service/api/v2/types';
import { api } from '@/service/api/v2/client';

export interface UseDashboardDataReturn {
  data: DashboardResponse | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  role: DashboardRole;
}

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
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;

  // Determine endpoint based on role
  const getEndpoint = useCallback((userRole: DashboardRole): string => {
    switch (userRole) {
      case 'student':
        return '/core/dashboard/student/';
      case 'lecturer':
        return '/core/dashboard/lecturer/';
      case 'admin':
        return '/core/dashboard/admin/';
      default:
        return '/core/dashboard/student/';
    }
  }, []);

  // Fetch dashboard data
  const fetchData = useCallback(
    async (isRetry = false) => {
      try {
        setLoading(true);
        setError(null);

        const endpoint = getEndpoint(role);
        const response = await api.get<DashboardResponse>(endpoint);

        setData(response);
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch dashboard data');
        setError(error);

        if (!isRetry && retryCount < MAX_RETRIES - 1) {
          setRetryCount((prev) => prev + 1);
          await fetchData(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [role, getEndpoint, retryCount]
  );

  // Refresh function for manual refresh
  const refresh = useCallback(async () => {
    setRetryCount(0);
    await fetchData();
  }, [fetchData]);

  // Initial fetch and retry on failure
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
      // Only refresh if not already loading
      if (!loading) {
        fetchData();
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchData, loading, options?.refreshInterval, options?.enabled]);

  return {
    data,
    loading,
    error,
    refresh,
    role,
  };
}
