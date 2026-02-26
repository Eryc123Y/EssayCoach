'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardActivityItem } from '@/service/api/v2/types';
import { formatDistanceToNow } from 'date-fns';
import {
  IconFile,
  IconMessage,
  IconStar,
  IconUserCheck,
} from '@tabler/icons-react';

interface ActivityFeedProps {
  activities: DashboardActivityItem[];
  title?: string;
  limit?: number;
  emptyMessage?: string;
}

/**
 * Activity Feed Component
 *
 * Displays a timeline of recent activities.
 * Design: Matches EC-04A-ActivityFeed from pencil-shadcn.pen
 *
 * Features:
 * - Timeline layout with icons
 * - Relative timestamps
 * - Loading skeleton
 * - Empty state
 * - Error state
 */
export function ActivityFeed({
  activities,
  title = 'Recent Activity',
  limit = 10,
  emptyMessage = 'No recent activity.',
}: ActivityFeedProps) {
  const limitedActivities = activities.slice(0, limit);

  return (
    <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {limitedActivities.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <div className="space-y-4">
            {limitedActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Internal Components
// ——————————————————————————————————————————————————————————————————————————————

interface ActivityItemProps {
  activity: DashboardActivityItem;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const icon = getActivityIcon(activity.type);
  const bgColor = getActivityBgColor(activity.type);
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  });

  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bgColor}`}>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium leading-none">{activity.title}</p>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <IconFile className="mb-2 h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Helper Functions
// ——————————————————————————————————————————————————————————————————————————————

function getActivityIcon(type: DashboardActivityItem['type']) {
  switch (type) {
    case 'submission':
      return <IconFile className="h-4 w-4" />;
    case 'feedback':
      return <IconMessage className="h-4 w-4" />;
    case 'grade':
      return <IconStar className="h-4 w-4" />;
    case 'comment':
      return <IconUserCheck className="h-4 w-4" />;
    default:
      return <IconFile className="h-4 w-4" />;
  }
}

function getActivityBgColor(type: DashboardActivityItem['type']) {
  switch (type) {
    case 'submission':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'feedback':
      return 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400';
    case 'grade':
      return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'comment':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
}

// ——————————————————————————————————————————————————————————————————————————————
// Loading Skeleton
// ——————————————————————————————————————————————————————————————————————————————

export function ActivityFeedSkeleton() {
  return (
    <Card className="border-slate-200 bg-card shadow-sm dark:border-slate-800">
      <CardHeader>
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ——————————————————————————————————————————————————————————————————————————————
// Error State
// ——————————————————————————————————————————————————————————————————————————————

export function ActivityFeedError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <Card className="border-destructive/50 bg-destructive/5 shadow-sm">
      <CardHeader className="border-destructive/50 bg-destructive/5">
        <CardTitle className="text-lg font-semibold text-destructive">
          Failed to Load Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </CardContent>
    </Card>
  );
}
