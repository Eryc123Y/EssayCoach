'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserProgress, ProgressEntry } from '@/service/api/v2/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Legend
} from 'recharts';

interface ProfileProgressTabProps {
  progress: UserProgress | null;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit'
  });
}

/**
 * Mock progress data for demonstration when no data is available
 */
const MOCK_PROGRESS_DATA: ProgressEntry[] = [
  { date: '2024-09-01', essay_count: 2, average_score: 72 },
  { date: '2024-10-01', essay_count: 4, average_score: 75 },
  { date: '2024-11-01', essay_count: 5, average_score: 78 },
  { date: '2024-12-01', essay_count: 6, average_score: 82 },
  { date: '2025-01-01', essay_count: 8, average_score: 85 },
  { date: '2025-02-01', essay_count: 10, average_score: 88 }
];

/**
 * Custom tooltip for the chart
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const essayCount =
      payload.find((p) => p.dataKey === 'essay_count')?.value || 0;
    const avgScore =
      payload.find((p) => p.dataKey === 'average_score')?.value || 0;

    return (
      <div className='rounded-lg border border-slate-200 bg-white p-3 shadow-md dark:border-slate-700 dark:bg-slate-800'>
        <p className='mb-2 font-medium text-slate-900 dark:text-white'>
          {label}
        </p>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 rounded-full bg-blue-500' />
            <span className='text-sm text-slate-600 dark:text-slate-300'>
              Essays: {essayCount}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 rounded-full bg-emerald-500' />
            <span className='text-sm text-slate-600 dark:text-slate-300'>
              Avg Score: {Math.round(avgScore)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Profile Progress Tab Component
 *
 * Displays user's writing progress over time with dual-axis chart
 */
export function ProfileProgressTab({ progress }: ProfileProgressTabProps) {
  const data =
    progress?.entries && progress.entries.length > 0
      ? progress.entries
      : MOCK_PROGRESS_DATA;

  // Calculate summary stats
  const totalEssays = data.reduce((sum, entry) => sum + entry.essay_count, 0);
  const avgScore =
    data.length > 0
      ? Math.round(
          data
            .filter((e) => e.average_score !== null)
            .reduce((sum, e) => sum + (e.average_score || 0), 0) /
            data.filter((e) => e.average_score !== null).length
        )
      : null;

  // Calculate trend
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const firstHalf = sortedData.slice(0, Math.ceil(sortedData.length / 2));
  const secondHalf = sortedData.slice(Math.ceil(sortedData.length / 2));

  const firstHalfAvg =
    firstHalf.filter((e) => e.average_score !== null).length > 0
      ? firstHalf
          .filter((e) => e.average_score !== null)
          .reduce((sum, e) => sum + (e.average_score || 0), 0) /
        firstHalf.filter((e) => e.average_score !== null).length
      : 0;

  const secondHalfAvg =
    secondHalf.filter((e) => e.average_score !== null).length > 0
      ? secondHalf
          .filter((e) => e.average_score !== null)
          .reduce((sum, e) => sum + (e.average_score || 0), 0) /
        secondHalf.filter((e) => e.average_score !== null).length
      : 0;

  const trend =
    secondHalfAvg > firstHalfAvg
      ? 'up'
      : secondHalfAvg < firstHalfAvg
        ? 'down'
        : 'stable';

  return (
    <div className='space-y-6'>
      {/* Summary Stats */}
      <div className='grid gap-4 sm:grid-cols-3'>
        <Card className='border-slate-200 dark:border-slate-700'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-500'>Total Essays</p>
                <p className='text-2xl font-bold text-slate-900 dark:text-white'>
                  {totalEssays}
                </p>
              </div>
              <div className='rounded-lg bg-blue-50 p-2 dark:bg-blue-950/30'>
                <svg
                  className='h-5 w-5 text-blue-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='border-slate-200 dark:border-slate-700'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-500'>Avg Score</p>
                <p className='text-2xl font-bold text-slate-900 dark:text-white'>
                  {avgScore !== null ? `${avgScore}%` : 'N/A'}
                </p>
              </div>
              <div className='rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30'>
                <svg
                  className='h-5 w-5 text-emerald-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='border-slate-200 dark:border-slate-700'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-500'>Trend</p>
                <p className='text-2xl font-bold text-slate-900 capitalize dark:text-white'>
                  {trend === 'up'
                    ? 'Improving'
                    : trend === 'down'
                      ? 'Declining'
                      : 'Stable'}
                </p>
              </div>
              <div
                className={`rounded-lg p-2 ${
                  trend === 'up'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : trend === 'down'
                      ? 'bg-red-50 dark:bg-red-950/30'
                      : 'bg-slate-50 dark:bg-slate-900/30'
                }`}
              >
                {trend === 'up' ? (
                  <svg
                    className='h-5 w-5 text-emerald-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                    />
                  </svg>
                ) : trend === 'down' ? (
                  <svg
                    className='h-5 w-5 text-red-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                    />
                  </svg>
                ) : (
                  <svg
                    className='h-5 w-5 text-slate-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 12h14'
                    />
                  </svg>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      <Card className='border-slate-200 dark:border-slate-700'>
        <CardHeader>
          <CardTitle className='text-lg'>Progress Over Time</CardTitle>
          <p className='text-sm text-slate-500'>
            Monthly essay submissions and average scores
          </p>
        </CardHeader>
        <CardContent>
          <div className='h-[300px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <ComposedChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id='colorScore' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#10b981' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='#10b981' stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id='colorEssays' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='#3b82f6' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  className='stroke-slate-200 dark:stroke-slate-700'
                />
                <XAxis
                  dataKey='date'
                  tickFormatter={formatDate}
                  className='text-xs text-slate-500'
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  yAxisId='left'
                  className='text-xs text-slate-500'
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  label={{
                    value: 'Essays',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 12
                  }}
                />
                <YAxis
                  yAxisId='right'
                  orientation='right'
                  domain={[0, 100]}
                  className='text-xs text-slate-500'
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  label={{
                    value: 'Score (%)',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#64748b',
                    fontSize: 12
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId='left'
                  dataKey='essay_count'
                  fill='#3b82f6'
                  name='Essays'
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='average_score'
                  stroke='#10b981'
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name='Avg Score'
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
