'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for role-based dashboard
 * Shows error state with retry option
 */
export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const router = useRouter();

  return (
    <Card className='border-destructive/50 bg-destructive/5 shadow-sm'>
      <CardHeader>
        <CardTitle className='text-destructive flex items-center gap-2 text-lg font-semibold'>
          <IconAlertCircle className='h-5 w-5' />
          Failed to Load Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <p className='text-muted-foreground text-sm'>
            An error occurred while loading your dashboard. Please try again.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className='mt-4 rounded bg-slate-900 p-4 text-xs text-slate-100'>
              {error.message || 'Unknown error'}
            </pre>
          )}
        </div>

        <div className='flex gap-2'>
          <Button onClick={reset} variant='default'>
            Try Again
          </Button>
          <Button
            onClick={() => router.push('/dashboard/overview')}
            variant='outline'
          >
            Go to Overview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
