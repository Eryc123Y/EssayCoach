import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconArrowRight, IconBook } from '@tabler/icons-react';

export function RecommendedPractice() {
  return (
    <Card className='bg-card border-slate-200 shadow-sm dark:border-slate-800'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>
          Recommended Practice
        </CardTitle>
        <IconBook className='h-4 w-4 text-indigo-500' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold text-indigo-950 dark:text-indigo-100'>
          Advanced Vocabulary
        </div>
        <p className='text-muted-foreground mt-1 mb-3 text-xs'>
          Boost your <strong>Language</strong> score (85%) with targeted
          exercises.
        </p>
        <Button
          variant='outline'
          size='sm'
          className='group w-full justify-between border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300'
        >
          Start Session
          <IconArrowRight className='h-3 w-3 transition-transform group-hover:translate-x-1' />
        </Button>
      </CardContent>
    </Card>
  );
}
