import PageContainer from '@/components/layout/page-container';
import { RecommendedPractice } from '@/features/overview/components/recommended-practice';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  IconAward,
  IconListCheck,
  IconPencil,
  IconTrendingUp
} from '@tabler/icons-react';
import React from 'react';

export default function OverViewLayout({
  submissions,
  pie_stats,
  bar_stats,
  area_stats
}: {
  submissions: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100'>
            Academic Command Center
          </h2>
        </div>

        <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-muted-foreground text-sm font-medium'>
                Current Grade
              </CardTitle>
              <IconAward className='h-4 w-4 text-emerald-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                91% (A-)
              </div>
              <p className='mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400'>
                <IconTrendingUp className='mr-1 h-3 w-3' />
                Top 10% of class
              </p>
            </CardContent>
          </Card>

          <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-muted-foreground text-sm font-medium'>
                Pending Tasks
              </CardTitle>
              <IconListCheck className='h-4 w-4 text-amber-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                2
              </div>
              <p className='text-muted-foreground mt-1 text-xs'>
                Due in 3 days
              </p>
            </CardContent>
          </Card>

          <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-muted-foreground text-sm font-medium'>
                Writing Activity
              </CardTitle>
              <IconPencil className='h-4 w-4 text-violet-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                3.5k
              </div>
              <p className='text-muted-foreground mt-1 text-xs'>
                Words written this week
              </p>
            </CardContent>
          </Card>

          <RecommendedPractice />
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>{submissions}</div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
