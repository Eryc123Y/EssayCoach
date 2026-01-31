import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentSubmissionsSkeleton() {
  return (
    <Card className='h-full border-none bg-transparent shadow-none'>
      <CardHeader>
        <CardTitle>
          <Skeleton className='h-6 w-40' />
        </CardTitle>
        <Skeleton className='mt-2 h-4 w-60' />
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex items-center gap-4 rounded-lg p-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-2'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-5 w-16' />
                </div>
                <Skeleton className='h-3 w-24' />
              </div>
              <div className='flex flex-col items-end space-y-2'>
                <Skeleton className='h-4 w-12' />
                <Skeleton className='h-5 w-24' />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
