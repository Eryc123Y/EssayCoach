'use client';

import { localized } from '@/locales';

import { useState } from 'react';
import { usePreferences } from '@/components/layout/preference-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  LecturerDashboardResponse,
  ClassOverview,
  GradingQueueItem
} from '@/service/api/v2/types';
import { format } from 'date-fns';
import {
  IconClock,
  IconUsers,
  IconFileCheck,
  IconAlertCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface LecturerDashboardProps {
  data: LecturerDashboardResponse;
}

/**
 * Lecturer Dashboard Component
 *
 * Displays grading queue, class overview cards, and lecturer stats.
 * Design: Matches EC-04B-Dashboard-Lecturer from pencil-shadcn.pen
 */
export function LecturerDashboard({ data }: LecturerDashboardProps) {
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const gradingQueue = data.gradingQueue.filter((item) => {
    if (classFilter !== 'all' && item.classId !== Number(classFilter)) return false;
    if (statusFilter === 'overdue' && !(item.dueDate && new Date(item.dueDate) < new Date())) return false;
    if (statusFilter === 'pending_review' && item.dueDate && new Date(item.dueDate) < new Date()) return false;
    return true;
  });
  return (
    <div className='space-y-6'>
      {/* Grading Queue Section */}
      <section>
        <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <h2 className='text-[24px] leading-tight font-medium tracking-tight'>
            {t('ui.gradingQueue')}
          </h2>
          <div className='flex items-center gap-2'>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className='focus:ring-primary w-[140px] focus:ring-2'>
                <SelectValue placeholder={t('ui.allClasses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('ui.allClasses')}</SelectItem>
                {data.classes.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={c.id.toString()}
                  >{t(`Class: ${c.name}`, `班级：${c.name}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='focus:ring-primary w-[140px] focus:ring-2'>
                <SelectValue placeholder={t('ui.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('ui.allStatus')}</SelectItem>
                <SelectItem value='pending_review'>{t('ui.notOverdue')}</SelectItem>
                <SelectItem value='overdue'>{t('ui.overdueReview')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <GradingQueue items={gradingQueue} filtersActive={classFilter !== 'all' || statusFilter !== 'all'} />
      </section>

      {/* Class Overview Cards */}
      <section>
        <h2 className='mb-4 text-[24px] leading-tight font-medium tracking-tight'>
          {t('ui.classOverview')}
        </h2>
        <ClassOverviewCards classes={data.classes} />
      </section>
    </div>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Grading Queue Component
// ——————————————————————————————————————————————————————————————————————————————

interface GradingQueueProps {
  items: GradingQueueItem[];
  filtersActive?: boolean;
}

function GradingQueue({ items, filtersActive = false }: GradingQueueProps) {
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  if (items.length === 0) {
    return (
      <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
        <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
          <IconFileCheck className='text-muted-foreground/50 mb-2 h-12 w-12' />
          <h3 className='text-lg font-medium'>{filtersActive ? t('ui.noMatchingReviews') : t('ui.allCaughtUp')}</h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            {filtersActive ? t('ui.tryAnotherClassOrStatus') : t('ui.noPendingReviewsAtTheMoment')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>
          {t('ui.pendingReviews')} ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='sr-only'>{t('ui.submitted')}</p>
        <div className='space-y-3'>
          {items.map((item) => (
            <GradingQueueItem key={item.submissionId} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GradingQueueItem({ item }: { item: GradingQueueItem }) {
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  const isOverdue = item.dueDate ? new Date(item.dueDate) < new Date() : false;

  return (
    <div className='flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'>
      <div className='flex-1 space-y-1'>
        <div className='flex items-center gap-2'>
          <p className='font-medium'>{item.studentName}</p>
          <StatusBadge status={item.status} />
          {isOverdue && (
            <Badge variant='destructive' className='flex items-center gap-1'>
              <IconAlertCircle className='h-3 w-3' />
              {t('ui.overdue')}
            </Badge>
          )}
        </div>
        <p className='text-muted-foreground text-sm'>{item.essayTitle}</p>
        <div className='text-muted-foreground flex items-center gap-4 text-xs'>
          <span className='flex items-center gap-1'>
            <IconClock className='h-3 w-3' />
            {format(new Date(item.submittedAt), 'MMM d, y')}
          </span>
          {item.aiScore != null && <span>{t(`AI Score: ${item.aiScore}`, `AI 建议分：${item.aiScore}`)}</span>}
        </div>
      </div>
      <Button
        asChild
        size='sm'
        className='focus:ring-primary focus:ring-2 focus:ring-offset-2'
      >
        <Link href={`/dashboard/review/${item.submissionId}`}>
          {t('ui.review')}
        </Link>
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const { locale } = usePreferences();
  const classNames: Record<string, string | undefined> = {
    ai_graded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pending_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  };

  const labels: Record<string, string> = {
    ai_graded: 'AI Graded',
    pending_review: 'Pending',
    overdue: 'Overdue'
  };

  const s = status || 'ai_graded';
  const isOverdueStatus = s === 'overdue';
  return (
    <Badge
      variant={isOverdueStatus ? 'destructive' : 'secondary'}
      className={classNames[s]}
    >
      {locale === 'zh' ? { ai_graded: 'AI 草稿', pending_review: '待复核', overdue: '已逾期' }[s] || s : labels[s] || s}
    </Badge>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Class Overview Cards Component
// ——————————————————————————————————————————————————————————————————————————————

interface ClassOverviewCardsProps {
  classes: ClassOverview[];
}

function ClassOverviewCards({ classes }: ClassOverviewCardsProps) {
  const { locale } = usePreferences();
  if (classes.length === 0) {
    return (
      <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
        <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
          <IconUsers className='text-muted-foreground/50 mb-2 h-12 w-12' />
          <h3 className='text-lg font-medium'>{locale === 'zh' ? '暂无班级' : 'No Classes Yet'}</h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            {locale === 'zh' ? '创建第一个班级即可开始。' : 'Create your first class to get started.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {classes.map((classItem) => (
        <ClassOverviewCard key={classItem.id} classItem={classItem} />
      ))}
    </div>
  );
}

function ClassOverviewCard({ classItem }: { classItem: ClassOverview }) {
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  const pendingShare = classItem.essayCount > 0
    ? Math.min(100, Math.round((classItem.pendingReviews / classItem.essayCount) * 100))
    : 0;

  return (
    <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
      <CardHeader>
        <CardTitle className='text-base font-semibold'>
          {classItem.name}
        </CardTitle>
        <p className='text-muted-foreground text-xs'>{classItem.unitName}</p>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-2'>
          <StatItem
            icon={<IconUsers className='text-muted-foreground h-4 w-4' />}
            value={classItem.studentCount.toString()}
            label={t('ui.students6d0190')}
          />
          <StatItem
            icon={<IconFileCheck className='text-muted-foreground h-4 w-4' />}
            value={classItem.essayCount.toString()}
            label={t('ui.essays')}
          />
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-muted-foreground'>{t('ui.reviewsPending')}</span>
            <span className='font-medium'>{pendingShare}%</span>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
            <div
              className='bg-primary h-full transition-all'
              style={{ width: `${pendingShare}%` }}
            />
          </div>
        </div>

        <div className='flex items-center justify-between pt-2'>
          <div className='text-xs'>
            <span className='text-muted-foreground'>{t('ui.avgScore334b7c')}</span>
            <span className='font-medium'>
              {classItem.avgScore?.toFixed(1) ?? 'N/A'}
            </span>
          </div>
          {classItem.pendingReviews > 0 && (
            <Badge
              variant='secondary'
              className='bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            >
              {t(`${classItem.pendingReviews} pending`, `${classItem.pendingReviews} 篇待复核`)}
            </Badge>
          )}
        </div>

        <Button
          asChild
          className='focus:ring-primary w-full focus:ring-2 focus:ring-offset-2'
          size='sm'
        >
          <Link href={`/dashboard/classes/${classItem.id}`}>{t('ui.viewClass')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function StatItem({
  icon,
  value,
  label
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className='flex items-center gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800'>
      {icon}
      <div>
        <p className='text-lg font-bold'>{value}</p>
        <p className='text-muted-foreground text-xs'>{label}</p>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Loading Skeleton
// ——————————————————————————————————————————————————————————————————————————————

export function LecturerDashboardSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Grading Queue Skeleton */}
      <section className='space-y-4'>
        <div className='h-7 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
        <p className='sr-only'>Grading Queue</p>
        <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
          <CardContent className='space-y-3 py-6'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='h-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800'
              />
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Class Overview Skeleton */}
      <section className='space-y-4'>
        <div className='h-7 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
        <p className='sr-only'>Class Overview</p>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className='h-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800'
            />
          ))}
        </div>
      </section>
    </div>
  );
}
