import { useEffect, useState, useCallback } from 'react';
import { dashboardService } from '@/service/api/v2/dashboard';
import { authService } from '@/service/api/v2/auth';
import type {
  LecturerDashboardResponse,
  StudentDashboardResponse,
  AdminDashboardResponse,
  DashboardActivityItem,
  UserInfo
} from '@/service/api/v2/types';

type DashboardData =
  | LecturerDashboardResponse
  | StudentDashboardResponse
  | AdminDashboardResponse;

interface UseDashboardReturn<T extends DashboardData> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  recentActivity: DashboardActivityItem[];
  user: UserInfo | null;
}

/**
 * Hook to fetch role-specific dashboard data
 * Automatically determines which endpoint to call based on user role
 */
export function useDashboard<T extends DashboardData>(): UseDashboardReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First get user info to determine role
      const userInfo = await authService.getUserInfo();
      setUser(userInfo);

      let response: DashboardData;

      switch (userInfo.user_role) {
        case 'lecturer':
        case 'admin':
          response = await dashboardService.getLecturerDashboard();
          break;
        case 'student':
          response = await dashboardService.getStudentDashboard();
          break;
        default:
          // Fallback to generic endpoint for unknown roles
          response = await dashboardService.getDashboard();
      }

      setData(response as T);
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('Failed to fetch dashboard data');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const recentActivity = data?.recentActivity ?? [];

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
    recentActivity,
    user
  };
}

/**
 * Hook to fetch lecturer dashboard data specifically
 */
export function useLecturerDashboard(): UseDashboardReturn<LecturerDashboardResponse> {
  return useDashboard<LecturerDashboardResponse>();
}

/**
 * Hook to fetch student dashboard data specifically
 */
export function useStudentDashboard(): UseDashboardReturn<StudentDashboardResponse> {
  return useDashboard<StudentDashboardResponse>();
}

/**
 * Hook to fetch admin dashboard data specifically
 */
export function useAdminDashboard(): UseDashboardReturn<AdminDashboardResponse> {
  return useDashboard<AdminDashboardResponse>();
}
