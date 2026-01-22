import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { recentSubmissionsData } from '@/constants/data';
import { IconClock, IconSparkles, IconEdit } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function RecentSubmissions() {
  return (
    <Card className='h-full border-none bg-transparent shadow-none'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold text-indigo-950 dark:text-indigo-100'>
          Recent Submissions
        </CardTitle>
        <CardDescription>
          Latest graded essays and pending assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {recentSubmissionsData.map((submission, index) => {
            // Status Logic
            let statusBadge;

            if (submission.status === 'Graded') {
              statusBadge = (
                <Badge
                  variant='outline'
                  className='border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                >
                  Graded
                </Badge>
              );
            } else if (submission.status === 'Pending') {
              statusBadge = (
                <Badge
                  variant='outline'
                  className='border-amber-500/30 bg-amber-50 text-amber-600 dark:bg-amber-950/30'
                >
                  Pending
                </Badge>
              );
            } else {
              statusBadge = (
                <Badge
                  variant='outline'
                  className='border-red-500/30 bg-red-50 text-red-600 dark:bg-red-950/30'
                >
                  Late
                </Badge>
              );
            }

            // AI Status Logic
            let aiBadge;
            if (submission.aiStatus === 'Feedback Ready') {
              aiBadge = (
                <Badge className='border-0 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'>
                  <IconSparkles className='mr-1 size-3' /> Feedback Ready
                </Badge>
              );
            } else if (submission.aiStatus === 'Processing') {
              aiBadge = (
                <Badge
                  variant='outline'
                  className='animate-pulse border-indigo-400 text-indigo-500'
                >
                  <IconClock className='mr-1 size-3' /> Processing AI
                </Badge>
              );
            } else if (submission.aiStatus === 'Draft') {
              aiBadge = (
                <Badge variant='secondary' className='text-muted-foreground'>
                  <IconEdit className='mr-1 size-3' /> Draft
                </Badge>
              );
            }

            return (
              <div
                key={index}
                className='flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50'
              >
                <Avatar className='h-10 w-10 ring-2 ring-indigo-100 dark:ring-indigo-900'>
                  <AvatarImage src={submission.image} alt='Avatar' />
                  <AvatarFallback className='bg-indigo-50 font-medium text-indigo-600'>
                    {submission.initials}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='text-sm leading-none font-semibold text-slate-900 dark:text-slate-100'>
                      {submission.name}
                    </p>
                    {statusBadge}
                  </div>
                  <p className='text-muted-foreground text-xs font-medium'>
                    {submission.assignment}
                  </p>
                </div>
                <div className='space-y-1 text-right'>
                  <div
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      submission.score === 'Pending'
                        ? 'text-amber-600'
                        : 'text-slate-900 dark:text-slate-100'
                    )}
                  >
                    {submission.score}
                  </div>
                  <div className='flex items-center justify-end'>{aiBadge}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
