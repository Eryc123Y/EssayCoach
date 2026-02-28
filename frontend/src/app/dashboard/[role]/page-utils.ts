import { redirect } from 'next/navigation';
import type {
  AdminDashboardResponse,
  DashboardRole,
  LecturerDashboardResponse,
  StudentDashboardResponse,
} from '@/service/api/v2/types';

export type RoleDashboardData =
  | LecturerDashboardResponse
  | StudentDashboardResponse
  | AdminDashboardResponse;

export function isDashboardRole(role: string): role is DashboardRole {
  return role === 'student' || role === 'lecturer' || role === 'admin';
}

export function isAuthFailure(status: number): boolean {
  return status === 401 || status === 403;
}

export function buildDashboardUrl(apiBaseUrl: string, role: DashboardRole): string {
  return `${apiBaseUrl}/api/v2/core/dashboard/${role}/`;
}

export async function fetchRoleDashboardData(
  apiBaseUrl: string,
  role: DashboardRole,
  accessToken: string
): Promise<RoleDashboardData> {
  const response = await fetch(buildDashboardUrl(apiBaseUrl, role), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (isAuthFailure(response.status)) {
    redirect('/auth/sign-in');
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
  }

  return response.json();
}
