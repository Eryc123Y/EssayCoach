import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader, ActivityFeed, LecturerDashboard, StudentDashboard, AdminDashboard } from '@/features/dashboard';
import { getServerApiUrl } from '@/lib/server-api';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';
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
    redirect('/dashboard');
  }

  // Send a signed-in user who opens another role's dashboard to their own one,
  // rather than treating the backend's 403 as an expired session.
  const accountRole = await resolveDashboardRole(access);
  if (!accountRole) {
    redirect('/auth/sign-in');
  }
  if (accountRole !== role) {
    redirect(`/dashboard/${accountRole}`);
  }

  const apiUrl = getServerApiUrl();
  const dashboardData: RoleDashboardData = await fetchRoleDashboardData(apiUrl, role, access);

  if (!dashboardData) {
    throw new Error('Dashboard data is unavailable');
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
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
