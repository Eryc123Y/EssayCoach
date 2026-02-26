'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { StudentDashboardResponse, StudentEssay } from '@/service/api/v2/types';
import { format } from 'date-fns';
import {
  IconFile,
  IconClock,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
} from '@tabler/icons-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  return (
    <div className="space-y-6">
      {/* My Essays Section */}
      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[24px] font-medium leading-tight tracking-tight">My Essays</h2>
          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {Array.from(new Set(data.myEssays.map(e => e.unitName).filter(Boolean))).map((unitName) => (
                  <SelectItem key={unitName as string} value={unitName as string}>{`Class: ${unitName}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <MyEssaysList essays={data.myEssays} />
      </section>

      {/* Progress Tracker Section */}
      {data.myEssays.filter((e) => e.score !== null).length > 0 && (
        <section>
          {data.myEssays.filter((e) => e.score !== null).length > 1 && (
            <h2 className="mb-4 text-[24px] font-medium leading-tight tracking-tight">Progress Over Time</h2>
          )}
          <ProgressTracker essays={data.myEssays} />
        </section>
      )}
    </div>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// My Essays List Component
// ——————————————————————————————————————————————————————————————————————————————

interface MyEssaysListProps {
  essays: StudentEssay[];
}

function MyEssaysList({ essays }: MyEssaysListProps) {
  if (essays.length === 0) {
    return (
      <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <IconFile className="mb-2 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No Submissions Yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with your first essay submission.
          </p>
          <Button asChild className="mt-4 focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <Link href="/dashboard/essay">
              Submit Essay
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Recent Submissions ({essays.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {essays
            .slice(0, 10)
            .map((essay, index, list) => {
              const firstIndexForUnit = essay.unitName
                ? list.findIndex((e) => e.unitName === essay.unitName)
                : -1;

              return (
                <EssayItem
                  key={essay.id}
                  essay={essay}
                  usePlainUnitLabel={essay.unitName != null && firstIndexForUnit === index}
                />
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}

function EssayItem({
  essay,
  usePlainUnitLabel,
}: {
  essay: StudentEssay;
  usePlainUnitLabel: boolean;
}) {
  const statusConfig = getStatusConfig(essay.status);

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{essay.title}</p>
          <Badge variant={statusConfig.variant} className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconClock className="h-3 w-3" />
            {format(new Date(essay.submittedAt), 'MMM d, y')}
          </span>
          {essay.unitName && <span>{usePlainUnitLabel ? essay.unitName : `Class: ${essay.unitName}`}</span>}
          {essay.taskTitle && <span>{essay.taskTitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {essay.score !== null && (
          <div className="text-right">
            <p className="text-lg font-bold">{essay.score}</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
        )}
        <Button asChild size="sm" variant={essay.status === 'returned' ? 'default' : 'outline'} className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <Link
            href={
              essay.status === 'draft'
                ? `/dashboard/essay?edit=${essay.id}`
                : `/dashboard/essay-analysis/${essay.id}`
            }
          >
            {essay.status === 'draft' ? 'Continue' : 'View'}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function getStatusConfig(status: StudentEssay['status']): {
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  className: string;
  label: string;
  title?: string;
} {
  const configs: Record<StudentEssay['status'], ReturnType<typeof getStatusConfig>> = {
    draft: {
      variant: 'outline',
      className: 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400',
      label: 'Draft',
    },
    submitted: {
      variant: 'secondary',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      label: 'Submitted',
    },
    ai_graded: {
      variant: 'default',
      className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      label: 'AI Graded',
    },
    lecturer_reviewed: {
      variant: 'default',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      label: 'Reviewed',
    },
    returned: {
      variant: 'default',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      label: 'Returned',
    },
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
  // Get essays with scores, sorted by date
  const scoredEssays = essays.filter((e) => e.score !== null);

  if (scoredEssays.length < 2) {
    return (
      <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <IconFile className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Submit more essays to see your progress trend.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend
  const recentScores = scoredEssays.slice(-5).map((e) => e.score!);
  const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const firstScore = recentScores.length > 1
    ? Math.min(...recentScores.slice(0, -1))
    : recentScores[0];
  const lastScore = recentScores[recentScores.length - 1];
  const trend = lastScore > firstScore ? 'up' : lastScore < firstScore ? 'down' : 'stable';
  const improvement = lastScore - firstScore;

  return (
    <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Score Trend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trend Summary */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{avgScore.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Average (last 5 essays)</p>
          </div>
          <div className="flex items-center gap-2">
            {trend === 'up' && (
              <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                <IconArrowUp className="mr-1 h-4 w-4" />
                +{improvement.toFixed(1)}%
              </span>
            )}
            {trend === 'down' && (
              <span className="flex items-center text-destructive">
                <IconArrowDown className="mr-1 h-4 w-4" />
                {improvement.toFixed(1)}%
              </span>
            )}
            {trend === 'stable' && (
              <span className="flex items-center text-muted-foreground">
                <IconMinus className="mr-1 h-4 w-4" />
                No change
              </span>
            )}
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-32 w-full">
          <svg viewBox="0 0 100 50" className="h-full w-full" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                y1={i * 12.5}
                x2="100"
                y2={i * 12.5}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="0.5"
              />
            ))}

            {/* Line chart */}
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
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
                  r="3"
                  className="fill-primary stroke-white dark:stroke-slate-900"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        {/* Score List */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {recentScores.map((score, i) => (
            <div key={i} className="text-center">
              <p className="text-xs font-medium">{score}%</p>
              <p className="text-xs text-muted-foreground">
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
    <div className="space-y-6">
      {/* My Essays Skeleton */}
      <section className="space-y-4">
        <div className="h-7 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <p className="sr-only">My Essays</p>
        <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
          <CardContent className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Progress Tracker Skeleton */}
      <section className="space-y-4">
        <div className="h-7 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <p className="sr-only">Progress Over Time</p>
        <Card className="h-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </section>
    </div>
  );
}
