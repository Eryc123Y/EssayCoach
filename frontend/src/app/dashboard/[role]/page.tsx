import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader, ActivityFeed, LecturerDashboard, StudentDashboard, AdminDashboard } from '@/features/dashboard';
import { dashboardService } from '@/service/api/v2';

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

  // Validate role parameter
  const validRoles = ['student', 'lecturer', 'admin'] as const;
  if (!validRoles.includes(role as typeof validRoles[number])) {
    redirect('/dashboard/overview');
  }

  // Fetch dashboard data based on role
  let dashboardData;
  try {
    switch (role) {
      case 'student':
        dashboardData = await dashboardService.getStudentDashboard();
        break;
      case 'lecturer':
        dashboardData = await dashboardService.getLecturerDashboard();
        break;
      case 'admin':
        dashboardData = await dashboardService.getAdminDashboard();
        break;
    }
  } catch (error) {
    // TODO: Log error and show error state
    console.error('Failed to fetch dashboard data:', error);
    // For now, redirect to overview on error
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

      {/* Role-Specific Dashboard Content */}
      {role === 'student' && (
        <StudentDashboard data={dashboardData as import('@/service/api/v2/types').StudentDashboardResponse} />
      )}

      {role === 'lecturer' && (
        <LecturerDashboard data={dashboardData as import('@/service/api/v2/types').LecturerDashboardResponse} />
      )}

      {role === 'admin' && (
        <AdminDashboard data={dashboardData as import('@/service/api/v2/types').AdminDashboardResponse} />
      )}

      {/* Activity Feed (Common to all roles) */}
      <ActivityFeed
        activities={dashboardData.recentActivity}
        title="Recent Activity"
        limit={5}
      />
    </div>
  );
}
