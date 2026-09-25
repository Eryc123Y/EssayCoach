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
import { useRouter } from 'next/navigation';
import { usePreferences } from '@/components/layout/preference-provider';

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
  const router = useRouter();
  const { locale } = usePreferences();
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  return (
    <div className="space-y-6">
      {/* Platform Stats Section */}
      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[24px] font-medium leading-tight tracking-tight">{t('Platform Overview', '平台概览')}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/analytics')} className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <IconExternalLink className="mr-2 h-4 w-4" />
              {t('View analytics', '查看分析')}
            </Button>
          </div>
        </div>
        <PlatformStats data={data} />
      </section>

      {/* System Health Section */}
      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[24px] font-medium leading-tight tracking-tight">{t('System Health', '系统状态')}</h2>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/observability')} className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
            {t('View Logs', '查看日志')}
          </Button>
        </div>
        <SystemHealth status={data.systemStatus} health={data.stats.systemHealth} />
      </section>

      {/* User Metrics Section */}
      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[24px] font-medium leading-tight tracking-tight">{t('User Metrics', '用户统计')}</h2>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/users')} className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
            {t('Manage Users', '管理用户')}
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
  const { locale } = usePreferences();
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<span className="text-blue-500"><IconUsers className="h-4 w-4" /></span>}
        value={data.stats.totalUsers.toLocaleString()}
        label={t('Total Users', '用户总数')}
        trend={t(`${data.stats.activeStudents} students, ${data.stats.activeLecturers} lecturers`, `${data.stats.activeStudents} 名学生，${data.stats.activeLecturers} 名讲师`)}
      />
      <StatCard
        icon={<span className="text-emerald-500"><IconDatabase className="h-4 w-4" /></span>}
        value={data.stats.totalEssays.toLocaleString()}
        label={t('Total Essays', '作文总数')}
      />
      <StatCard
        icon={<span className="text-violet-500"><IconActivity className="h-4 w-4" /></span>}
        value={data.systemStatus.submissionsLast24h.toString()}
        label={t('Last 24h', '最近 24 小时')}
        trend={t('Essay submissions', '作文提交')}
      />
      <StatCard
        icon={<span className="text-amber-500"><IconCheck className="h-4 w-4" /></span>}
        value={data.stats.totalClasses.toString()}
        label={t('Active Classes', '活跃班级')}
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
  const { locale } = usePreferences();
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  const healthConfig = getHealthConfig(health);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* System Status Card */}
      <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('System Status', '系统状态')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {healthConfig.icon}
              <span className="font-medium">{t('Overall Health', '整体状态')}</span>
            </div>
            <Badge variant={healthConfig.variant} className={healthConfig.className}>
              {locale === 'zh' ? { Healthy: '正常', Degraded: '降级', Critical: '严重' }[healthConfig.label] || healthConfig.label : healthConfig.label}
            </Badge>
          </div>

          <div className="space-y-2">
            <HealthItem
              label={t('Database', '数据库')}
              status={status.database}
              goodStatus="healthy"
            />
            <HealthItem
              label={t('API Server', 'API 服务')}
              status={health === 'healthy' ? 'healthy' : 'degraded'}
              goodStatus="healthy"
            />
            <HealthItem
              label={t('Feedback Processing', '反馈处理')}
              status={status.feedbacksLast24h > 0 ? 'active' : 'idle'}
              goodStatus="active"
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats Card */}
      <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('Activity (24h)', '最近 24 小时活动')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ActivityItem
            icon={<IconDatabase className="h-4 w-4 text-muted-foreground" />}
            label={t('Submissions', '提交')}
            value={status.submissionsLast24h}
          />
          <ActivityItem
            icon={<IconActivity className="h-4 w-4 text-muted-foreground" />}
            label={t('Feedback Generated', '生成反馈')}
            value={status.feedbacksLast24h}
          />
          <ActivityItem
            icon={<IconUsers className="h-4 w-4 text-muted-foreground" />}
            label={t('Active Users', '活跃用户')}
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
  const { locale } = usePreferences();
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
        <span className="text-sm font-medium capitalize">{locale === 'zh' ? { healthy: '正常', degraded: '降级', active: '活跃', idle: '空闲', critical: '严重' }[status] || status : status}</span>
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
  const { locale } = usePreferences();
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  const total = data.stats.activeStudents + data.stats.activeLecturers;
  const studentPercent = total > 0 ? Math.round((data.stats.activeStudents / total) * 100) : 0;
  const lecturerPercent = total > 0 ? Math.round((data.stats.activeLecturers / total) * 100) : 0;

  const activeStudentsDisplay = data.stats.activeStudents === 0
    ? t('0 lecturers', '0')
    : data.stats.activeStudents.toLocaleString();
  const activeLecturersDisplay = data.stats.activeLecturers === 0
    ? '0'
    : data.stats.activeLecturers.toLocaleString();

  return (
    <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('User Distribution', '用户分布')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-2xl font-bold">{activeStudentsDisplay}</p>
            <p className="text-xs text-muted-foreground">{t('Active Students', '活跃学生')}</p>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">{activeLecturersDisplay}</p>
            <p className="text-xs text-muted-foreground">{t('Active Lecturers', '活跃讲师')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('Students', '学生')}</span>
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
            <span className="text-muted-foreground">{t('Lecturers', '讲师')}</span>
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
