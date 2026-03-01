import { request } from '@/service/request';
import type {
  LecturerDashboardResponse,
  StudentDashboardResponse,
  AdminDashboardResponse,
} from './types';

const BASE_URL = '/api/v2/core';

export const dashboardService = {
  /**
   * Get lecturer dashboard data
   * Includes: stats, class overviews, grading queue, recent activity
   * Permissions: Lecturer and Admin only
   */
  async getLecturerDashboard(): Promise<LecturerDashboardResponse> {
    return request<LecturerDashboardResponse>({
      url: `${BASE_URL}/dashboard/lecturer/`,
      method: 'GET',
    });
  },

  /**
   * Get student dashboard data
   * Includes: stats, my essays list, recent activity
   * Permissions: Student only
   */
  async getStudentDashboard(): Promise<StudentDashboardResponse> {
    return request<StudentDashboardResponse>({
      url: `${BASE_URL}/dashboard/student/`,
      method: 'GET',
    });
  },

  /**
   * Get admin dashboard data
   * Includes: system stats, user metrics, recent activity, system status
   * Permissions: Admin only
   */
  async getAdminDashboard(): Promise<AdminDashboardResponse> {
    return request<AdminDashboardResponse>({
      url: `${BASE_URL}/dashboard/admin/`,
      method: 'GET',
    });
  },

  /**
   * Get role-aware dashboard data (legacy endpoint)
   * Returns different data based on user role
   * @deprecated Use role-specific endpoints instead
   */
  async getDashboard(): Promise<
    LecturerDashboardResponse | StudentDashboardResponse | AdminDashboardResponse
  > {
    return request({
      url: `${BASE_URL}/dashboard/`,
      method: 'GET',
    });
  },
};
