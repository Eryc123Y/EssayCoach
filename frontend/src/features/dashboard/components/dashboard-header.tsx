'use client';

import { localized } from '@/locales';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardUserInfo, DashboardStats, LecturerStats, StudentStats, AdminStats } from '@/service/api/v2/types';
import { IconAward, IconListCheck, IconPencil, IconTrendingUp } from '@tabler/icons-react';
import { format } from 'date-fns';
import { usePreferences } from '@/components/layout/preference-provider';
import { useEffect, useState } from 'react';

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
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  const currentDate = currentTime && (locale === 'zh'
    ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full', timeStyle: 'short' }).format(currentTime)
    : format(currentTime, 'EEEE, MMMM d, y · h:mm a'));

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
            label={t('ui.essaysReviewedToday')}
            trend={avgScore != null ? localized(locale, 'ui.avgScorePercent', { score: avgScore }) : undefined}
          />
          <StatCard
            icon={<IconListCheck className="h-4 w-4 text-amber-500" />}
            value={pendingReviews.toString()}
            label={t('ui.pendingReviews')}
          />
          <StatCard
            icon={<IconPencil className="h-4 w-4 text-violet-500" />}
            value={activeClasses.toString()}
            label={t('ui.activeClassesf9a013')}
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
            label={t('ui.totalEssays')}
          />
          <StatCard
            icon={<IconListCheck className="h-4 w-4 text-amber-500" />}
            value={pendingGrading.toString()}
            label={t('ui.pendingGrading')}
            trend={t('ui.needsReview')}
          />
          <StatCard
            icon={<IconTrendingUp className="h-4 w-4 text-blue-500" />}
            value={avgScore?.toString() ?? '0'}
            label={t('ui.avgScore')}
            trend={t('ui.publishedGrades')}
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
          value={studentAvgScore?.toFixed(1) ?? t('ui.nA')}
          label={t('ui.averageScore272cc1')}
          trend={studentAvgScore != null ? t('ui.publishedGrades') : undefined}
        />
        <StatCard
          icon={<IconListCheck className="h-4 w-4 text-amber-500" />}
          value={pendingTasks.toString()}
          label={t('ui.awaitingResults')}
          trend={pendingTasks > 0 ? t('ui.teacherReview') : t('ui.allClear')}
        />
        <StatCard
          icon={<IconPencil className="h-4 w-4 text-violet-500" />}
          value={essaysSubmitted.toString()}
          label={t('ui.essaysSubmitted')}
        />
      </>
    );
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          <h1 className="min-w-0 max-w-full break-words text-2xl font-semibold leading-tight tracking-tight text-slate-900 [overflow-wrap:anywhere] dark:text-slate-100 sm:text-[32px]">
            {getGreeting(user.name, locale, currentTime)}
          </h1>
          {role && (
            <RoleBadge role={role} locale={locale} />
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

function RoleBadge({ role, locale }: { role: 'student' | 'lecturer' | 'admin'; locale: 'en' | 'zh' }) {
  const variants = {
    student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    lecturer: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    admin: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${variants[role]}`}>
      {localized(locale, { student: 'ui.student', lecturer: 'ui.lecturer', admin: 'ui.admin' }[role])}
    </span>
  );
}

function getGreeting(name: string | null, locale: 'en' | 'zh', currentTime: Date | null): string {
  if (!name) return localized(locale, 'ui.welcome');
  const displayName = name.includes('@') ? name.split('@')[0] : name.split(' ')[0];

  if (!currentTime) return `${localized(locale, 'ui.welcome')}, ${displayName}`;

  const hour = currentTime.getHours();
  let greeting = 'Good morning';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17) {
    greeting = 'Good evening';
  }

  if (locale === 'zh') {
    const zhGreeting = hour < 12 ? '早上好' : hour < 17 ? '下午好' : '晚上好';
    return `${zhGreeting}，${displayName}`;
  }
  return `${greeting}, ${displayName}`;
}
