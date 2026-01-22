'use client';

import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

const chartData = [
  { assignment: 'Narrative', score: 75, avg: 72 },
  { assignment: 'Critique', score: 78, avg: 75 },
  { assignment: 'Research', score: 82, avg: 76 },
  { assignment: 'Midterm', score: 85, avg: 79 },
  { assignment: 'Persuasive', score: 84, avg: 81 },
  { assignment: 'Analysis', score: 89, avg: 83 },
  { assignment: 'Final', score: 92, avg: 85 }
];

const chartConfig = {
  score: {
    label: 'Your Score',
    color: '#8b5cf6' // violet-500
  },
  avg: {
    label: 'Class Avg',
    color: '#6366f1' // indigo-500
  }
} satisfies ChartConfig;

export function AreaGraph() {
  return (
    <Card className='h-full border-indigo-100 bg-white dark:border-indigo-900/50 dark:bg-slate-950/50'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold text-indigo-950 dark:text-indigo-100'>
          Score Improvement
        </CardTitle>
        <CardDescription>
          Tracking performance across the semester
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 10
            }}
          >
            <defs>
              <linearGradient id='fillScore' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.8} />
                <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id='fillAvg' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#6366f1' stopOpacity={0.3} />
                <stop offset='95%' stopColor='#6366f1' stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray='3 3'
              strokeOpacity={0.2}
            />
            <XAxis
              dataKey='assignment'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value}
              tick={{ fontSize: 12, fill: 'var(--foreground)' }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='avg'
              type='monotone'
              fill='url(#fillAvg)'
              stroke='#6366f1'
              strokeWidth={2}
              stackId='1'
            />
            <Area
              dataKey='score'
              type='monotone'
              fill='url(#fillScore)'
              stroke='#8b5cf6'
              strokeWidth={3}
              stackId='2'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium text-emerald-600 dark:text-emerald-400'>
              Consistent improvement trend{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              Outperforming class average by 7%
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
