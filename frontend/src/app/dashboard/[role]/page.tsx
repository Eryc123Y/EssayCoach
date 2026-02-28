import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader, ActivityFeed, LecturerDashboard, StudentDashboard, AdminDashboard } from '@/features/dashboard';
import { getServerApiUrl } from '@/lib/server-api';
import type {
  AdminDashboardResponse,
  DashboardRole,
  LecturerDashboardResponse,
  StudentDashboardResponse,
} from '@/service/api/v2/types';
import { fetchRoleDashboardData, isDashboardRole, type RoleDashboardData } from './page-utils';

interface RoleDashboardPageProps {
  params: Promise<{
    role: 'student' | 'lecturer' | 'admin';
  }>;
}

/**
 * Role-specific Dashboard Page
 *
 * Renders the appropriate dashboard based on user role.
 * Routes:
 * - /dashboard/student
 * - /dashboard/lecturer
 * - /dashboard/admin
 */
export default async function RoleDashboardPage({ params }: RoleDashboardPageProps) {
  const { role } = await params;
  const cookieStore = await cookies();
  const access = cookieStore.get('access_token')?.value;

  if (!access) {
    redirect('/auth/sign-in');
  }

  if (!isDashboardRole(role)) {
    redirect('/dashboard/overview');
  }

  const apiUrl = getServerApiUrl();
  let dashboardData: RoleDashboardData;
  try {
    dashboardData = await fetchRoleDashboardData(apiUrl, role, access);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    redirect('/dashboard/overview');
  }

  if (!dashboardData) {
    redirect('/dashboard/overview');
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Stats */}
      <DashboardHeader
        user={dashboardData.user}
        stats={dashboardData.stats}
        role={role}
      />

      {renderRoleSpecificDashboard(role, dashboardData)}

      {/* Activity Feed (Common to all roles) */}
      <ActivityFeed
        activities={dashboardData.recentActivity}
        title="Recent Activity"
        limit={5}
      />
    </div>
  );
}

function renderRoleSpecificDashboard(role: DashboardRole, dashboardData: RoleDashboardData) {
  if (role === 'student') {
    return <StudentDashboard data={dashboardData as StudentDashboardResponse} />;
  }

  if (role === 'lecturer') {
    return <LecturerDashboard data={dashboardData as LecturerDashboardResponse} />;
  }

  return <AdminDashboard data={dashboardData as AdminDashboardResponse} />;
}
