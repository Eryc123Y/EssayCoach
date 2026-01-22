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
    <Card className='h-full border-none shadow-none bg-transparent'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold text-indigo-950 dark:text-indigo-100'>Recent Submissions</CardTitle>
        <CardDescription>Latest graded essays and pending assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {recentSubmissionsData.map((submission, index) => {
            // Status Logic
            let statusBadge;
            
            if (submission.status === 'Graded') {
              statusBadge = <Badge variant='outline' className='border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'>Graded</Badge>;
            } else if (submission.status === 'Pending') {
              statusBadge = <Badge variant='outline' className='border-amber-500/30 text-amber-600 bg-amber-50 dark:bg-amber-950/30'>Pending</Badge>;
            } else {
              statusBadge = <Badge variant='outline' className='border-red-500/30 text-red-600 bg-red-50 dark:bg-red-950/30'>Late</Badge>;
            }

            // AI Status Logic
            let aiBadge;
            if (submission.aiStatus === 'Feedback Ready') {
              aiBadge = (
                <Badge className='bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-sm'>
                  <IconSparkles className='size-3 mr-1' /> Feedback Ready
                </Badge>
              );
            } else if (submission.aiStatus === 'Processing') {
              aiBadge = (
                <Badge variant='outline' className='border-indigo-400 text-indigo-500 animate-pulse'>
                  <IconClock className='size-3 mr-1' /> Processing AI
                </Badge>
              );
            } else if (submission.aiStatus === 'Draft') {
               aiBadge = (
                <Badge variant='secondary' className='text-muted-foreground'>
                  <IconEdit className='size-3 mr-1' /> Draft
                </Badge>
              );
            }

            return (
              <div key={index} className='flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'>
                <Avatar className='h-10 w-10 ring-2 ring-indigo-100 dark:ring-indigo-900'>
                  <AvatarImage src={submission.image} alt='Avatar' />
                  <AvatarFallback className='bg-indigo-50 text-indigo-600 font-medium'>{submission.initials}</AvatarFallback>
                </Avatar>
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center flex-wrap gap-2'>
                    <p className='text-sm leading-none font-semibold text-slate-900 dark:text-slate-100'>{submission.name}</p>
                    {statusBadge}
                  </div>
                  <p className='text-xs text-muted-foreground font-medium'>{submission.assignment}</p>
                </div>
                <div className='text-right space-y-1'>
                  <div className={cn(
                    'text-sm font-bold tabular-nums',
                    submission.score === 'Pending' ? 'text-amber-600' : 'text-slate-900 dark:text-slate-100'
                  )}>
                    {submission.score}
                  </div>
                  <div className='flex items-center justify-end'>
                    {aiBadge}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
