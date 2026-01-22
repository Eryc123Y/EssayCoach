'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

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
  { category: 'Grammar', count: 12, fill: 'var(--primary)' },
  { category: 'Citations', count: 8, fill: 'var(--primary-light)' },
  { category: 'Structure', count: 15, fill: 'var(--primary-lighter)' },
  { category: 'Thesis', count: 5, fill: 'var(--primary-dark)' },
  { category: 'Style', count: 10, fill: 'var(--primary-darker)' }
];

const chartConfig = {
  count: {
    label: 'Issues'
  },
  Grammar: {
    label: 'Grammar',
    color: 'var(--primary)'
  },
  Citations: {
    label: 'Citations',
    color: 'var(--primary)'
  },
  Structure: {
    label: 'Structure',
    color: 'var(--primary)'
  },
  Thesis: {
    label: 'Thesis',
    color: 'var(--primary)'
  },
  Style: {
    label: 'Style',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function PieGraph() {
  const totalIssues = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, []);

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Common Error Categories</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Distribution of feedback issues in recent submissions
          </span>
          <span className='@[540px]/card:hidden'>Error distribution</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <defs>
              {['Grammar', 'Citations', 'Structure', 'Thesis', 'Style'].map(
                (category, index) => (
                  <linearGradient
                    key={category}
                    id={`fill${category}`}
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop
                      offset='0%'
                      stopColor='var(--primary)'
                      stopOpacity={1 - index * 0.15}
                    />
                    <stop
                      offset='100%'
                      stopColor='var(--primary)'
                      stopOpacity={0.8 - index * 0.15}
                    />
                  </linearGradient>
                )
              )}
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData.map((item) => ({
                ...item,
                fill: `url(#fill${item.category})`
              }))}
              dataKey='count'
              nameKey='category'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {totalIssues.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Total Issues
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 leading-none font-medium'>
          Structure needs attention{' '}
          <IconTrendingUp className='h-4 w-4 text-amber-500' />
        </div>
        <div className='text-muted-foreground leading-none'>
          Based on last 5 graded essays
        </div>
      </CardFooter>
    </Card>
  );
}
