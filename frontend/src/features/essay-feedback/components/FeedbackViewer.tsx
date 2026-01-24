'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { WorkflowStatusResponse } from '@/service/agent/agent-service';
import { FeedbackCharts } from './FeedbackCharts';
import { RevisionChat } from './RevisionChat';
import {
  CheckCircle2,
  FileText,
  Sparkles,
  AlertCircle,
  FileEdit
} from 'lucide-react';

interface FeedbackViewerProps {
  result: WorkflowStatusResponse | null;
  isRunning: boolean;
  progress: number;
  error: string | null;
  onRetry?: () => void;
}

/**
 * Adapts the new EssayAnalysisOutput schema to the legacy display format.
 * This ensures backward compatibility while supporting the new interface.
 */
function adaptOutputsToLegacyFormat(outputs: WorkflowStatusResponse['outputs']) {
  if (!outputs) return null;

  // If already in legacy format (has feedback_summary)
  if ('feedback_summary' in outputs) {
    return outputs as unknown as {
      overall_score: number;
      feedback_summary: string;
      structure_analysis: { score: number; comments: string; suggestions: string[] };
      content_analysis: { score: number; comments: string; suggestions: string[] };
      style_analysis: { score: number; comments: string; suggestions: string[] };
      grammar_notes: Array<{ type: string; original: string; suggestion: string; explanation: string }>;
    };
  }

  // Convert from new EssayAnalysisOutput format to legacy format
  const newOutput = outputs as {
    overall_score: number;
    percentage_score: number;
    feedback_items: Array<{
      criterion_name: string;
      score: number;
      max_score: number;
      feedback: string;
      suggestions: string[];
    }>;
    overall_feedback: string;
    strengths: string[];
    suggestions: string[];
  };

  return {
    overall_score: newOutput.percentage_score || newOutput.overall_score,
    feedback_summary: newOutput.overall_feedback,
    structure_analysis: {
      score: newOutput.feedback_items?.find(i => i.criterion_name.toLowerCase().includes('structure'))?.score || 75,
      comments: newOutput.feedback_items?.find(i => i.criterion_name.toLowerCase().includes('structure'))?.feedback || '',
      suggestions: newOutput.feedback_items?.find(i => i.criterion_name.toLowerCase().includes('structure'))?.suggestions || []
    },
    content_analysis: {
      score: newOutput.feedback_items?.find(i => i.criterion_name.toLowerCase().includes('content'))?.score || 75,
      comments: newOutput.feedback_items?.find(i => i.criterion_name.toLowerCase().includes('content'))?.feedback || '',
      suggestions: newOutput.feedback_items?.find(i => i.criterion_name.toLowerCase().includes('content'))?.suggestions || []
    },
    style_analysis: {
      score: newOutput.feedback_items?.find(i => i.criterion_name.toLowerCase().includes('style'))?.score || 75,
      comments: newOutput.feedback_items?.find(i => i.criterion_name.toLowerCase().includes('style'))?.feedback || '',
      suggestions: newOutput.feedback_items?.find(i => i.criterion_name.toLowerCase().includes('style'))?.suggestions || []
    },
    grammar_notes: [] // New schema doesn't have this, would need mapping
  };
}

export function FeedbackViewer({
  result,
  isRunning,
  progress,
  error,
  onRetry
}: FeedbackViewerProps) {
  if (error) {
    return (
      <Alert
        variant='destructive'
        className='animate-in fade-in slide-in-from-top-2 duration-300'
      >
        <AlertCircle className='h-4 w-4' />
        <AlertDescription className='flex flex-col gap-2'>
          <span className='font-medium'>Error analyzing essay: {error}</span>
          <span className='text-sm opacity-90'>
            Please try submitting your essay again.
          </span>
          {onRetry && (
            <Button
              variant='outline'
              size='sm'
              onClick={onRetry}
              className='bg-background/20 hover:bg-background/40 border-background/40 mt-2 w-fit text-inherit'
            >
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const getAnalysisStep = (progress: number) => {
    if (progress < 30) return 'Analyzing essay structure...';
    if (progress < 60) return 'Checking grammar and style...';
    if (progress < 90) return 'Generating detailed feedback...';
    return 'Finalizing report...';
  };

  if (isRunning) {
    return (
      <Card className='bg-background/60 border-none shadow-xl backdrop-blur-md'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-xl font-medium tracking-tight'>
            Analyzing Essay...
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6 pt-4'>
          <div className='relative'>
            <Progress value={progress} className='bg-secondary h-2 w-full' />
            <div className='absolute top-0 left-0 h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent' />
          </div>
          <div className='text-muted-foreground flex items-center justify-between text-sm'>
            <span className='flex items-center gap-2'>
              <Sparkles className='animate-spin-slow h-4 w-4 text-indigo-500' />
              <span className='animate-in fade-in key={getAnalysisStep(progress)} duration-300'>
                {getAnalysisStep(progress)}
              </span>
            </span>
            <span className='font-mono font-medium'>
              {Math.round(progress)}%
            </span>
          </div>

          <div className='grid grid-cols-4 gap-2 pt-2'>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className='flex flex-col items-center gap-1'>
                <div
                  className={`h-1.5 w-full rounded-full transition-colors duration-500 ${
                    progress > i * 25 ? 'bg-indigo-500/80' : 'bg-secondary'
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result?.outputs) {
    return (
      <Card className='bg-muted/30 border-2 border-dashed'>
        <CardContent className='text-muted-foreground flex flex-col items-center justify-center space-y-4 py-12 text-center'>
          <div className='bg-background rounded-full border p-4 shadow-sm'>
            <FileEdit className='text-muted-foreground/50 h-8 w-8' />
          </div>
          <div className='space-y-1'>
            <h3 className='text-foreground text-lg font-semibold'>
              No feedback yet
            </h3>
            <p className='mx-auto max-w-sm text-sm'>
              Submit an essay to receive comprehensive AI-powered analysis,
              grading, and revision suggestions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Adapt new schema to legacy format for display
  const outputs = adaptOutputsToLegacyFormat(result.outputs);

  if (!outputs) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Unable to parse feedback results. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
            Feedback Report
            <CheckCircle2 className='h-6 w-6 text-green-500' />
          </h2>
          <p className='text-muted-foreground text-sm'>
            Generated by EssayCoach AI
          </p>
        </div>

        {outputs.overall_score !== undefined && (
          <div className='flex flex-col items-end'>
            <span className='text-muted-foreground text-sm font-medium tracking-wider uppercase'>
              Overall Score
            </span>
            <span className='text-4xl font-extrabold text-indigo-600 dark:text-indigo-400'>
              {outputs.overall_score}
              <span className='text-muted-foreground text-lg font-normal'>
                /100
              </span>
            </span>
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='space-y-6 lg:col-span-1'>
          <FeedbackCharts outputs={outputs} />

          <div className='sticky top-4'>
            <RevisionChat />
          </div>
        </div>

        <div className='space-y-6 lg:col-span-2'>
          <Card className='border-border/60 h-full shadow-md'>
            <CardHeader className='border-border/40 border-b pb-4'>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <FileText className='h-5 w-5 text-indigo-500' />
                  Detailed Analysis
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className='pt-6'>
              {outputs.feedback_summary ? (
                <div className='prose prose-indigo dark:prose-invert max-w-none'>
                  <div className='text-foreground/90 leading-relaxed whitespace-pre-wrap'>
                    {outputs.feedback_summary}
                  </div>
                </div>
              ) : (
                <div className='text-muted-foreground flex flex-col items-center justify-center py-12'>
                  <p>No text feedback available.</p>
                </div>
              )}

              {outputs.overall_score && (
                <div className='border-border/40 mt-8 border-t pt-6'>
                  <h4 className='text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase'>
                    Score Breakdown
                  </h4>
                  <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                    <ScoreBadge
                      label='Structure'
                      score={outputs.structure_analysis?.score}
                    />
                    <ScoreBadge
                      label='Content'
                      score={outputs.content_analysis?.score}
                    />
                    <ScoreBadge
                      label='Style'
                      score={outputs.style_analysis?.score}
                    />
                    <ScoreBadge
                      label='Grammar'
                      score={100 - (outputs.grammar_notes?.length || 0) * 5}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ label, score }: { label: string; score?: number }) {
  if (score === undefined) return null;
  return (
    <div className='bg-secondary/30 border-border/50 flex flex-col rounded-lg border p-3 text-center'>
      <span className='text-muted-foreground mb-1 text-xs font-medium'>
        {label}
      </span>
      <span className='text-foreground text-xl font-bold'>{score}</span>
    </div>
  );
}
