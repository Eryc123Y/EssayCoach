'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

export const description = 'Writing Dimensions Analysis';

// Writing dimensions data
const chartData = [
  { dimension: 'Evidence', score: 92, avg: 85 },
  { dimension: 'Analysis', score: 88, avg: 82 },
  { dimension: 'Organization', score: 95, avg: 88 },
  { dimension: 'Language', score: 85, avg: 84 },
  { dimension: 'Thesis', score: 90, avg: 80 }
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

export function BarGraph() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <Card className='h-full border-indigo-100 bg-white dark:border-indigo-900/50 dark:bg-slate-950/50'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div className='flex flex-col space-y-1'>
          <CardTitle className='text-lg font-semibold text-indigo-950 dark:text-indigo-100'>
            Writing Dimensions
          </CardTitle>
          <CardDescription className='text-sm'>
            Performance across key rubric categories
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[280px] w-full'
        >
          <BarChart
            data={chartData}
            layout='vertical'
            margin={{
              left: 20,
              right: 20,
              top: 0,
              bottom: 0
            }}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray='3 3'
              strokeOpacity={0.2}
            />
            <YAxis
              dataKey='dimension'
              type='category'
              tickLine={false}
              axisLine={false}
              width={80}
              tick={{ fontSize: 12, fill: 'var(--foreground)' }}
            />
            <XAxis type='number' hide />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
              content={<ChartTooltipContent indicator='line' />}
            />
            <Bar
              dataKey='avg'
              name='Class Average'
              fill='#cbd5e1'
              radius={[0, 4, 4, 0]}
              barSize={12}
            />
            <Bar
              dataKey='score'
              name='Your Score'
              fill='url(#fillGradient)'
              radius={[0, 4, 4, 0]}
              barSize={12}
            ></Bar>
            <defs>
              <linearGradient id='fillGradient' x1='0' y1='0' x2='1' y2='0'>
                <stop offset='0%' stopColor='#8b5cf6' />
                <stop offset='100%' stopColor='#6366f1' />
              </linearGradient>
            </defs>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
