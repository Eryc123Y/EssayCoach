'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserStats } from '@/service/api/v2/types';
import { IconFileText, IconTrendingUp, IconAward } from '@tabler/icons-react';

interface ProfileStatsProps {
  stats: UserStats | null;
  badgeCount?: number;
}

/**
 * Format number with locale string
 */
function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Profile Stats Cards Component
 *
 * Displays key metrics: Total Essays, Average Score, Badge Count
 */
export function ProfileStats({ stats, badgeCount = 0 }: ProfileStatsProps) {
  const statsCards = [
    {
      title: 'Total Essays',
      value: formatNumber(stats?.total_essays ?? 0),
      icon: IconFileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30'
    },
    {
      title: 'Average Score',
      value:
        stats?.average_score != null
          ? `${Math.round(stats.average_score)}%`
          : 'N/A',
      icon: IconTrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30'
    },
    {
      title: 'Badges Earned',
      value: formatNumber(badgeCount),
      icon: IconAward,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30'
    }
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {statsCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className='border-slate-200 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700'
          >
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-slate-900 dark:text-white'>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
