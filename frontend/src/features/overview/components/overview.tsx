import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaGraph } from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSubmissions } from './recent-submissions';
import {
  IconTrendingUp,
  IconBookOpen,
  IconPlus,
  IconFileAnalytics,
  IconSchool
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function OverViewPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Welcome Banner */}
        <div className='rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/50'>
          <div className='flex flex-col items-start justify-between gap-6 md:flex-row md:items-center'>
            <div className='space-y-2'>
              <h2 className='text-foreground text-3xl font-bold tracking-tight md:text-4xl'>
                Academic Command Center
              </h2>
              <p className='text-muted-foreground max-w-xl text-lg'>
                Ready to elevate your writing? You have{' '}
                <span className='text-foreground font-semibold'>2</span>{' '}
                assignments pending review and{' '}
                <span className='text-foreground font-semibold'>1</span> new
                feedback report available.
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <Button
                variant='outline'
                className='text-foreground gap-2 border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800'
              >
                <IconBookOpen className='size-4' />
                View Rubrics
              </Button>
              <Button className='gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg'>
                <IconPlus className='size-4' />
                Submit New Essay
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue='overview' className='space-y-6'>
          <TabsList className='border border-indigo-100 bg-indigo-50/50 p-1 dark:border-indigo-900/50 dark:bg-indigo-950/20'>
            <TabsTrigger
              value='overview'
              className='data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-indigo-950/50 dark:data-[state=active]:text-indigo-300'
            >
              Overview
            </TabsTrigger>
            <TabsTrigger value='analytics' disabled>
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            {/* KPI Cards */}
            <div className='grid grid-cols-1 gap-6 px-1 md:grid-cols-2 lg:grid-cols-4'>
              {/* Card 1: Essays Submitted */}
              <Card
                className={cn(
                  'bg-card border-slate-200 shadow-sm dark:border-slate-800',
                  'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5'
                )}
              >
                <CardHeader className='pb-2'>
                  <CardDescription className='flex items-center gap-2 font-medium text-indigo-600/80 dark:text-indigo-400/80'>
                    <IconFileAnalytics className='size-4' /> Essays Submitted
                  </CardDescription>
                  <CardTitle className='text-3xl font-bold text-indigo-950 tabular-nums dark:text-indigo-100'>
                    24
                  </CardTitle>
                  <CardAction>
                    <Badge
                      variant='outline'
                      className='border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                    >
                      <IconTrendingUp className='mr-1 size-3' />
                      +3 this week
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1 pt-0 text-sm'>
                  <div className='text-muted-foreground'>
                    Total submissions this semester
                  </div>
                </CardFooter>
              </Card>

              {/* Card 2: Academic Standing */}
              <Card
                className={cn(
                  'bg-card border-slate-200 shadow-sm dark:border-slate-800',
                  'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/5'
                )}
              >
                <CardHeader className='pb-2'>
                  <CardDescription className='flex items-center gap-2 font-medium text-violet-600/80 dark:text-violet-400/80'>
                    <IconSchool className='size-4' /> Academic Standing
                  </CardDescription>
                  <CardTitle className='text-3xl font-bold text-violet-950 tabular-nums dark:text-violet-100'>
                    Top 10%
                  </CardTitle>
                  <CardAction>
                    <Badge
                      variant='outline'
                      className='border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300'
                    >
                      A Grade
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1 pt-0 text-sm'>
                  <div className='text-muted-foreground'>
                    Based on recent performance
                  </div>
                </CardFooter>
              </Card>

              {/* Card 3: Feedback Readiness */}
              <Card
                className={cn(
                  'bg-card border-slate-200 shadow-sm dark:border-slate-800',
                  'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-fuchsia-500/5'
                )}
              >
                <CardHeader className='pb-2'>
                  <CardDescription className='flex items-center gap-2 font-medium text-fuchsia-600/80 dark:text-fuchsia-400/80'>
                    <IconBookOpen className='size-4' /> Feedback Readiness
                  </CardDescription>
                  <CardTitle className='text-3xl font-bold text-fuchsia-950 tabular-nums dark:text-fuchsia-100'>
                    95%
                  </CardTitle>
                  <CardAction>
                    <Badge
                      variant='outline'
                      className='border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-950/50 dark:text-fuchsia-300'
                    >
                      Actionable
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1 pt-0 text-sm'>
                  <div className='text-muted-foreground'>
                    3 reports waiting for review
                  </div>
                </CardFooter>
              </Card>

              {/* Card 4: Improvement Velocity */}
              <Card
                className={cn(
                  'bg-card border-slate-200 shadow-sm dark:border-slate-800',
                  'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5'
                )}
              >
                <CardHeader className='pb-2'>
                  <CardDescription className='flex items-center gap-2 font-medium text-emerald-600/80 dark:text-emerald-400/80'>
                    <IconTrendingUp className='size-4' /> Improvement Velocity
                  </CardDescription>
                  <CardTitle className='text-3xl font-bold text-emerald-950 tabular-nums dark:text-emerald-100'>
                    +12%
                  </CardTitle>
                  <CardAction>
                    <Badge
                      variant='outline'
                      className='border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    >
                      Fast Paced
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1 pt-0 text-sm'>
                  <div className='text-muted-foreground'>
                    Score increase per revision
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Charts & Lists */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7'>
              <div className='col-span-4 space-y-6'>
                {/* Bar Graph */}
                <Card className='bg-card overflow-hidden border-slate-200 shadow-sm dark:border-slate-800'>
                  <BarGraph />
                </Card>
                {/* Area Graph */}
                <Card className='bg-card overflow-hidden border-slate-200 shadow-sm dark:border-slate-800'>
                  <AreaGraph />
                </Card>
              </div>

              <div className='col-span-4 space-y-6 md:col-span-3'>
                {/* Recent Submissions */}
                <Card
                  className={cn(
                    'bg-card border-slate-200 shadow-sm dark:border-slate-800',
                    'shadow-sm transition-all duration-300 hover:shadow-md'
                  )}
                >
                  <RecentSubmissions />
                </Card>

                {/* Pie Graph (kept as placeholder for layout balance) */}
                <Card
                  className={cn(
                    'bg-card border-slate-200 shadow-sm dark:border-slate-800',
                    'shadow-sm transition-all duration-300 hover:shadow-md'
                  )}
                >
                  <PieGraph />
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
