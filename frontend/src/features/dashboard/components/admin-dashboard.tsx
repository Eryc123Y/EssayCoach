'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AdminDashboardResponse } from '@/service/api/v2/types';
import {
  IconUsers,
  IconDatabase,
  IconServer,
  IconActivity,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconExternalLink,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminDashboardProps {
  data: AdminDashboardResponse;
}

/**
 * Admin Dashboard Component
 *
 * Displays platform stats, system health, and admin metrics.
 * Design: Matches EC-04C-Dashboard-Admin from pencil-shadcn.pen
 */
export function AdminDashboard({ data }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Platform Stats Section */}
      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[24px] font-medium leading-tight tracking-tight">Platform Overview</h2>
          <div className="flex items-center gap-2">
            <Select defaultValue="30d">
              <SelectTrigger className="w-[140px] focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <IconExternalLink className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
        <PlatformStats data={data} />
      </section>

      {/* System Health Section */}
      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[24px] font-medium leading-tight tracking-tight">System Health</h2>
          <Button variant="outline" size="sm" className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
            View Logs
          </Button>
        </div>
        <SystemHealth status={data.systemStatus} health={data.stats.systemHealth} />
      </section>

      {/* User Metrics Section */}
      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[24px] font-medium leading-tight tracking-tight">User Metrics</h2>
          <Button variant="outline" size="sm" className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
            Manage Users
          </Button>
        </div>
        <UserMetrics data={data} />
      </section>
    </div>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Platform Stats Component
// ——————————————————————————————————————————————————————————————————————————————

function PlatformStats({ data }: { data: AdminDashboardResponse }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<span className="text-blue-500"><IconUsers className="h-4 w-4" /></span>}
        value={data.stats.totalUsers.toLocaleString()}
        label="Total Users"
        trend={`${data.stats.activeStudents} students, ${data.stats.activeLecturers} lecturers`}
      />
      <StatCard
        icon={<span className="text-emerald-500"><IconDatabase className="h-4 w-4" /></span>}
        value={data.stats.totalEssays.toLocaleString()}
        label="Total Essays"
        trend="All time submissions"
      />
      <StatCard
        icon={<span className="text-violet-500"><IconActivity className="h-4 w-4" /></span>}
        value={data.systemStatus.submissionsLast24h.toString()}
        label="Last 24h"
        trend="Essay submissions"
      />
      <StatCard
        icon={<span className="text-amber-500"><IconCheck className="h-4 w-4" /></span>}
        value={data.stats.totalClasses.toString()}
        label="Active Classes"
        trend="This semester"
      />
    </div>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// System Health Component
// ——————————————————————————————————————————————————————————————————————————————

function SystemHealth({
  status,
  health,
}: {
  status: { database: string; submissionsLast24h: number; feedbacksLast24h: number; activeUsers: number };
  health: string;
}) {
  const healthConfig = getHealthConfig(health);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* System Status Card */}
      <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {healthConfig.icon}
              <span className="font-medium">Overall Health</span>
            </div>
            <Badge variant={healthConfig.variant} className={healthConfig.className}>
              {healthConfig.label}
            </Badge>
          </div>

          <div className="space-y-2">
            <HealthItem
              label="Database"
              status={status.database}
              goodStatus="healthy"
            />
            <HealthItem
              label="API Server"
              status={health === 'healthy' ? 'healthy' : 'degraded'}
              goodStatus="healthy"
            />
            <HealthItem
              label="Feedback Processing"
              status={status.feedbacksLast24h > 0 ? 'active' : 'idle'}
              goodStatus="active"
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats Card */}
      <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Activity (24h)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ActivityItem
            icon={<IconDatabase className="h-4 w-4 text-muted-foreground" />}
            label="Submissions"
            value={status.submissionsLast24h}
          />
          <ActivityItem
            icon={<IconActivity className="h-4 w-4 text-muted-foreground" />}
            label="Feedback Generated"
            value={status.feedbacksLast24h}
          />
          <ActivityItem
            icon={<IconUsers className="h-4 w-4 text-muted-foreground" />}
            label="Active Users"
            value={status.activeUsers}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function HealthItem({
  label,
  status,
  goodStatus,
}: {
  label: string;
  status: string;
  goodStatus: string;
}) {
  const isGood = status === goodStatus;

  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 p-2 dark:bg-slate-800">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className={`h-1.5 w-1.5 rounded-full ${
            isGood ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
        <span className="text-sm font-medium capitalize">{status}</span>
      </div>
    </div>
  );
}

function ActivityItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// User Metrics Component
// ——————————————————————————————————————————————————————————————————————————————

function UserMetrics({ data }: { data: AdminDashboardResponse }) {
  const total = data.stats.activeStudents + data.stats.activeLecturers;
  const studentPercent = total > 0 ? Math.round((data.stats.activeStudents / total) * 100) : 0;
  const lecturerPercent = total > 0 ? Math.round((data.stats.activeLecturers / total) * 100) : 0;

  const activeStudentsDisplay = data.stats.activeStudents === 0
    ? '0'
    : data.stats.activeStudents.toLocaleString();
  const activeLecturersDisplay = data.stats.activeLecturers === 0
    ? '0 lecturers'
    : data.stats.activeLecturers.toLocaleString();

  return (
    <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">User Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-2xl font-bold">{activeStudentsDisplay}</p>
            <p className="text-xs text-muted-foreground">Active Students</p>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">{activeLecturersDisplay}</p>
            <p className="text-xs text-muted-foreground">Active Lecturers</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Students</span>
            <span className="font-medium">{studentPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${studentPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Lecturers</span>
            <span className="font-medium">{lecturerPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-violet-500 transition-all"
              style={{ width: `${lecturerPercent}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Helper Functions
// ——————————————————————————————————————————————————————————————————————————————

function getHealthConfig(health: string): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  label: string;
  icon: React.ReactNode;
} {
  const configs: Record<string, ReturnType<typeof getHealthConfig>> = {
    healthy: {
      variant: 'default',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      label: 'Healthy',
      icon: <IconServer className="h-5 w-5 text-emerald-500" />,
    },
    degraded: {
      variant: 'secondary',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      label: 'Degraded',
      icon: <IconAlertTriangle className="h-5 w-5 text-amber-500" />,
    },
    critical: {
      variant: 'destructive',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      label: 'Critical',
      icon: <IconAlertCircle className="h-5 w-5 text-red-500" />,
    },
  };

  return configs[health] || configs.healthy;
}

// ——————————————————————————————————————————————————————————————————————————————
// Internal Stat Card Component
// ——————————————————————————————————————————————————————————————————————————————

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  trend?: string;
}

function StatCard({ icon, value, label, trend }: StatCardProps) {
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
        {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
      </CardContent>
    </Card>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Loading Skeleton
// ——————————————————————————————————————————————————————————————————————————————

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Platform Stats Skeleton */}
      <section>
        <div className="mb-4 h-7 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <p className="sr-only">Platform Overview</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </section>

      {/* System Health Skeleton */}
      <section>
        <div className="mb-4 h-7 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <p className="sr-only">System Health</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="h-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </section>

      {/* User Metrics Skeleton */}
      <section>
        <div className="mb-4 h-7 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <p className="sr-only">User Metrics</p>
        <Card className="h-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </section>
    </div>
  );
}
