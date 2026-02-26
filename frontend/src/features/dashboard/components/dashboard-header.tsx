'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardUserInfo, DashboardStats, LecturerStats, StudentStats, AdminStats } from '@/service/api/v2/types';
import { IconAward, IconListCheck, IconPencil, IconTrendingUp } from '@tabler/icons-react';
import { format } from 'date-fns';

interface DashboardHeaderProps {
  user: DashboardUserInfo;
  stats: DashboardStats | LecturerStats | StudentStats | AdminStats;
  role?: 'student' | 'lecturer' | 'admin';
}

/**
 * Dashboard Header Component
 *
 * Displays personalized greeting, user info, and quick stats summary.
 * Design: Matches EC-04A-Header, EC-04B-Header, EC-04C-Header from pencil-shadcn.pen
 */
export function DashboardHeader({ user, stats, role }: DashboardHeaderProps) {
  const currentDate = format(new Date(), 'EEEE, MMMM d, y · h:mm a');

  // Get role-specific stat cards
  const getStatCards = () => {
    if (role === 'lecturer') {
      const lectStats = stats as LecturerStats;
      const reviewedToday = lectStats.essaysReviewedToday ?? stats.totalEssays ?? 0;
      const pendingReviews = lectStats.pendingReviews ?? stats.pendingGrading ?? 0;
      const activeClasses = lectStats.activeClasses ?? 0;
      const avgScore = lectStats.avgGradingTime ?? stats.averageScore;
      return (
        <>
          <StatCard
            icon={<IconAward className="h-4 w-4 text-emerald-500" />}
            value={reviewedToday.toString()}
            label="Essays Reviewed Today"
            trend={avgScore != null ? `${avgScore}% avg score` : undefined}
          />
          <StatCard
            icon={<IconListCheck className="h-4 w-4 text-amber-500" />}
            value={pendingReviews.toString()}
            label="Pending Reviews"
            trend="Due in 3 days"
          />
          <StatCard
            icon={<IconPencil className="h-4 w-4 text-violet-500" />}
            value={activeClasses.toString()}
            label="Active Classes"
            trend="This semester"
          />
        </>
      );
    }

    if (role === 'admin') {
      const adminStats = stats as AdminStats;
      const totalEssays = stats.totalEssays ?? adminStats.totalUsers ?? 0;
      const pendingGrading = stats.pendingGrading ?? adminStats.activeStudents ?? 0;
      const avgScore = stats.averageScore ?? adminStats.activeLecturers ?? 0;
      return (
        <>
          <StatCard
            icon={<IconAward className="h-4 w-4 text-emerald-500" />}
            value={totalEssays.toLocaleString()}
            label="Total Essays"
            trend="All time submissions"
          />
          <StatCard
            icon={<IconListCheck className="h-4 w-4 text-amber-500" />}
            value={pendingGrading.toString()}
            label="Pending Grading"
            trend="Needs review"
          />
          <StatCard
            icon={<IconTrendingUp className="h-4 w-4 text-blue-500" />}
            value={avgScore?.toString() ?? '0'}
            label="Avg Score"
            trend="Platform-wide"
          />
        </>
      );
    }

    // Default (student)
    const studentStats = stats as StudentStats;
    const studentAvgScore = studentStats.avgScore ?? stats.averageScore;
    const pendingTasks = stats.pendingGrading ?? 0;
    const essaysSubmitted = studentStats.essaysSubmitted ?? stats.totalEssays ?? 0;
    return (
      <>
        <StatCard
          icon={<IconAward className="h-4 w-4 text-emerald-500" />}
          value={studentAvgScore?.toFixed(1) ?? 'N/A'}
          label="Average Score"
          trend={studentAvgScore != null && studentAvgScore >= 80 ? 'Top 20%' : undefined}
        />
        <StatCard
          icon={<IconListCheck className="h-4 w-4 text-amber-500" />}
          value={pendingTasks.toString()}
          label="Pending Tasks"
          trend={pendingTasks > 0 ? 'Due soon' : 'All clear'}
        />
        <StatCard
          icon={<IconPencil className="h-4 w-4 text-violet-500" />}
          value={essaysSubmitted.toString()}
          label="Essays Submitted"
          trend="All time"
        />
      </>
    );
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            {getGreeting(user.name)}
          </h1>
          {role && (
            <RoleBadge role={role} />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{currentDate}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {getStatCards()}
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Internal Components
// ——————————————————————————————————————————————————————————————————————————————

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  trend?: string;
  trendValue?: 'up' | 'down' | 'stable';
}

function StatCard({ icon, value, label, trend, trendValue }: StatCardProps) {
  return (
    <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {value}
        </div>
        {trend && (
          <p className={`mt-1 flex items-center text-xs ${
            trendValue === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
            trendValue === 'down' ? 'text-destructive' :
            'text-muted-foreground'
          }`}>
            {trendValue === 'up' && <IconTrendingUp className="mr-1 h-3 w-3" />}
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RoleBadge({ role }: { role: 'student' | 'lecturer' | 'admin' }) {
  const variants = {
    student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    lecturer: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    admin: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${variants[role]}`}>
      {role}
    </span>
  );
}

function getGreeting(name: string | null): string {
  if (!name) return 'Welcome';

  const hour = new Date().getHours();
  let greeting = 'Good morning';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17) {
    greeting = 'Good evening';
  }

  return `${greeting}, ${name.split(' ')[0]}`;
}
