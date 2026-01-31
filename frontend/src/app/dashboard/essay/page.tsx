'use client';

import { useDifyWorkflow } from '@/features/essay-feedback/hooks/useDifyWorkflow';
import { EssayForm } from '@/features/essay-feedback/components/EssayForm';
import { FeedbackViewer } from '@/features/essay-feedback/components/FeedbackViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { DifyWorkflowRunRequest } from '@/types/dify';

export default function EssaySubmissionPage() {
  const {
    result,
    error,
    progress,
    runWorkflow,
    reset,
    isSubmitting,
    isRunning,
    isSuccess
  } = useDifyWorkflow();

  const handleSubmit = async (data: DifyWorkflowRunRequest) => {
    await runWorkflow(data);
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className='container mx-auto max-w-4xl space-y-8 py-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Essay Analysis</h1>
        <p className='text-muted-foreground'>
          Get AI-powered feedback on your essays with detailed analysis and
          actionable suggestions.
        </p>
      </div>

      <div className='grid gap-8 md:grid-cols-1'>
        {/* Conditional Rendering: Show Form or Result */}
        {!isSuccess && !isRunning && (
          <EssayForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}

        {/* Loading State or Result */}
        {(isRunning || isSuccess) && (
          <div className='space-y-6'>
            <FeedbackViewer
              result={result}
              isRunning={isRunning}
              progress={progress}
              error={error}
            />

            {isSuccess && (
              <Card>
                <CardContent className='flex justify-center pt-6'>
                  <Button onClick={handleReset} variant='outline' size='lg'>
                    Analyze Another Essay
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
