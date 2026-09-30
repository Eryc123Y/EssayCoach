'use client';

import { localized } from '@/locales';

import { useState } from 'react';
import { usePreferences } from '@/components/layout/preference-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  StudentDashboardResponse,
  StudentEssay
} from '@/service/api/v2/types';
import {
  IconFile,
  IconClock,
  IconArrowUp,
  IconArrowDown,
  IconMinus
} from '@tabler/icons-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface StudentDashboardProps {
  data: StudentDashboardResponse;
}

/**
 * Student Dashboard Component
 *
 * Displays my essays list, progress tracking, and student stats.
 * Design: Matches EC-04A-Dashboard-Student from pencil-shadcn.pen
 */
export function StudentDashboard({ data }: StudentDashboardProps) {
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  const [unitFilter, setUnitFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const now = Date.now();
  const filteredEssays = data.myEssays.filter((essay) => {
    if (unitFilter !== 'all' && essay.unitName !== unitFilter) return false;
    const submitted = new Date(essay.submittedAt).getTime();
    if (timeFilter === 'this_week' && submitted < now - 7 * 86400_000) return false;
    if (timeFilter === 'this_month' && submitted < now - 30 * 86400_000) return false;
    return true;
  });
  return (
    <div className='space-y-6'>
      {/* My Essays Section */}
      <section>
        <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <h2 className='text-[24px] leading-tight font-medium tracking-tight'>
            {t('ui.myEssays')}
          </h2>
          <div className='flex items-center gap-2'>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger aria-label={t('ui.filterByClass')} className='focus:ring-primary w-[140px] focus:ring-2'>
                <SelectValue placeholder={t('ui.allClasses6355a0')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('ui.allClasses6355a0')}</SelectItem>
                {Array.from(
                  new Set(data.myEssays.map((e) => e.unitName).filter(Boolean))
                ).map((unitName) => (
                  <SelectItem
                    key={unitName as string}
                    value={unitName as string}
                  >{localized(locale, 'ui.unitWithName', { name: String(unitName) })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger aria-label={t('ui.filterByTime')} className='focus:ring-primary w-[140px] focus:ring-2'>
                <SelectValue placeholder={t('ui.allTime')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('ui.allTime')}</SelectItem>
                <SelectItem value='this_week'>{t('ui.last7Days')}</SelectItem>
                <SelectItem value='this_month'>{t('ui.last30Days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <MyEssaysList essays={filteredEssays} filtersActive={unitFilter !== 'all' || timeFilter !== 'all'} />
      </section>

      {/* Progress Tracker Section */}
      {(() => {
        const scoredEssays = data.myEssays.filter((e) => e.score !== null);
        return scoredEssays.length > 0 ? (
          <section>
            {scoredEssays.length > 1 && (
              <h2 className='mb-4 text-[24px] leading-tight font-medium tracking-tight'>
                {t('ui.progressOverTime7ee7d8')}
              </h2>
            )}
            <ProgressTracker essays={data.myEssays} />
          </section>
        ) : null;
      })()}
    </div>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// My Essays List Component
// ——————————————————————————————————————————————————————————————————————————————

interface MyEssaysListProps {
  essays: StudentEssay[];
  filtersActive?: boolean;
}

function MyEssaysList({ essays, filtersActive = false }: MyEssaysListProps) {
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  if (essays.length === 0) {
    return (
      <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
        <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
          <IconFile className='text-muted-foreground/50 mb-2 h-12 w-12' />
          <h3 className='text-lg font-medium'>{filtersActive ? t('ui.noMatchingEssays') : t('ui.noSubmissionsYet')}</h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            {filtersActive ? t('ui.tryAnotherClassOrTimeRange') : t('ui.startWithYourFirstEssaySubmission')}
          </p>
          {!filtersActive && <Button
            asChild
            className='focus:ring-primary mt-4 focus:ring-2 focus:ring-offset-2'
          >
            <Link href='/dashboard/essay'>{t('ui.submitEssay')}</Link>
          </Button>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>
          {t('ui.recentSubmissions')} ({essays.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {(() => {
            // Pre-compute the set of unit names whose first essay we've seen
            const seenUnits = new Set<string>();
            return essays.slice(0, 10).map((essay) => {
              const isFirstForUnit =
                essay.unitName != null && !seenUnits.has(essay.unitName);
              if (essay.unitName) seenUnits.add(essay.unitName);
              return (
                <EssayItem
                  key={essay.id}
                  essay={essay}
                  usePlainUnitLabel={isFirstForUnit}
                />
              );
            });
          })()}
        </div>
      </CardContent>
    </Card>
  );
}

function EssayItem({
  essay,
  usePlainUnitLabel
}: {
  essay: StudentEssay;
  usePlainUnitLabel: boolean;
}) {
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  const statusConfig = getStatusConfig(essay.status, locale);

  return (
    <div className='flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'>
      <div className='flex-1 space-y-1'>
        <div className='flex items-center gap-2'>
          <p className='font-medium'>{essay.title}</p>
          <Badge
            variant={statusConfig.variant}
            className={statusConfig.className}
          >
            {statusConfig.label}
          </Badge>
        </div>
        <div className='text-muted-foreground flex items-center gap-4 text-xs'>
          <span className='flex items-center gap-1'>
            <IconClock className='h-3 w-3' />
            {new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
              year: 'numeric', month: 'short', day: 'numeric'
            }).format(new Date(essay.submittedAt))}
          </span>
          {essay.unitName && (
            <span>
              {usePlainUnitLabel ? essay.unitName : localized(locale, 'ui.unitWithName', { name: essay.unitName })}
            </span>
          )}
          {essay.taskTitle && <span>{essay.taskTitle}</span>}
        </div>
      </div>
      <div className='flex items-center gap-3'>
        {essay.score !== null && (
          <div className='text-right'>
            <p className='text-lg font-bold'>{essay.score}</p>
            <p className='text-muted-foreground text-xs'>{t('ui.score')}</p>
          </div>
        )}
        <Button
          asChild
          size='sm'
          variant={essay.status === 'returned' ? 'default' : 'outline'}
          className='focus:ring-primary focus:ring-2 focus:ring-offset-2'
        >
          <Link
            href={
              essay.status === 'draft'
                ? `/dashboard/essay?edit=${essay.id}`
                : `/dashboard/submissions/${essay.id}`
            }
          >
            {essay.status === 'draft' ? t('ui.continue') : t('ui.view')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function getStatusConfig(status: StudentEssay['status'], locale: 'en' | 'zh'): {
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  className: string;
  label: string;
  title?: string;
} {
  const configs: Record<
    StudentEssay['status'],
    ReturnType<typeof getStatusConfig>
  > = {
    draft: {
      variant: 'outline',
      className:
        'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400',
      label: localized(locale, 'ui.draft')
    },
    submitted: {
      variant: 'secondary',
      className:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      label: localized(locale, 'ui.submitted667f11')
    },
    ai_graded: {
      variant: 'default',
      className:
        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      label: localized(locale, 'ui.awaitingReview')
    },
    lecturer_reviewed: {
      variant: 'default',
      className:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      label: localized(locale, 'ui.reviewed')
    },
    returned: {
      variant: 'default',
      className:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      label: localized(locale, 'ui.returned')
    }
  };

  return configs[status];
}
// ——————————————————————————————————————————————————————————————————————————————
// Progress Tracker Component
// ——————————————————————————————————————————————————————————————————————————————

interface ProgressTrackerProps {
  essays: StudentEssay[];
}

function ProgressTracker({ essays }: ProgressTrackerProps) {
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  // Get essays with scores, sorted by date
  const scoredEssays = essays
    .filter((e) => e.score !== null)
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  if (scoredEssays.length < 2) {
    return (
      <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
        <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
          <IconFile className='text-muted-foreground/50 mb-2 h-8 w-8' />
          <p className='text-muted-foreground text-sm'>
            {t('ui.submitMoreEssaysToSeeYourProgressTrend')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend
  const recentScores = scoredEssays.slice(-5).map((e) => e.score!);
  const avgScore =
    recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const firstScore = recentScores[0];
  const lastScore = recentScores[recentScores.length - 1];
  const trend =
    lastScore > firstScore ? 'up' : lastScore < firstScore ? 'down' : 'stable';
  const improvement = lastScore - firstScore;

  return (
    <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>{t('ui.scoreTrend')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Trend Summary */}
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-2xl font-bold'>{avgScore.toFixed(1)}%</p>
            <p className='text-muted-foreground text-xs'>
              {t('ui.averageLast5Essays')}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {trend === 'up' && (
              <span className='flex items-center text-emerald-600 dark:text-emerald-400'>
                <IconArrowUp className='mr-1 h-4 w-4' />+
                {improvement.toFixed(1)}%
              </span>
            )}
            {trend === 'down' && (
              <span className='text-destructive flex items-center'>
                <IconArrowDown className='mr-1 h-4 w-4' />
                {improvement.toFixed(1)}%
              </span>
            )}
            {trend === 'stable' && (
              <span className='text-muted-foreground flex items-center'>
                <IconMinus className='mr-1 h-4 w-4' />
                {t('ui.noChange')}
              </span>
            )}
          </div>
        </div>

        {/* Mini Chart */}
        <div className='h-32 w-full'>
          <svg
            viewBox='0 0 100 50'
            className='h-full w-full'
            preserveAspectRatio='none'
          >
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1='0'
                y1={i * 12.5}
                x2='100'
                y2={i * 12.5}
                stroke='currentColor'
                strokeOpacity='0.1'
                strokeWidth='0.5'
              />
            ))}

            {/* Line chart */}
            <polyline
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              className='text-primary'
              points={recentScores
                .map((score, i) => {
                  const x = (i / (recentScores.length - 1)) * 100;
                  const y = 50 - (score / 100) * 50;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Data points */}
            {recentScores.map((score, i) => {
              const x = (i / (recentScores.length - 1)) * 100;
              const y = 50 - (score / 100) * 50;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r='3'
                  className='fill-primary stroke-white dark:stroke-slate-900'
                  strokeWidth='2'
                />
              );
            })}
          </svg>
        </div>

        {/* Score List */}
        <div className='grid grid-cols-5 gap-2 pt-2'>
          {recentScores.map((score, i) => (
            <div key={i} className='text-center'>
              <p className='text-xs font-medium'>{score}%</p>
              <p className='text-muted-foreground text-xs'>
                {essays.length > 10 ? `Score ${i + 1}` : `Essay ${i + 1}`}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Loading Skeleton
// ——————————————————————————————————————————————————————————————————————————————

export function StudentDashboardSkeleton() {
  return (
    <div className='space-y-6'>
      {/* My Essays Skeleton */}
      <section className='space-y-4'>
        <div className='h-7 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
        <p className='sr-only'>My Essays</p>
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

      {/* Progress Tracker Skeleton */}
      <section className='space-y-4'>
        <div className='h-7 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
        <p className='sr-only'>Progress Over Time</p>
        <Card className='h-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800' />
      </section>
    </div>
  );
}
