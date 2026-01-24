'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { EssaySubmissionForm } from '@/features/essay-analysis/components/essay-submission-form';
import { AnalysisProgress } from '@/features/essay-analysis/components/analysis-progress';
import {
  FeedbackDashboard,
  ScoreData
} from '@/features/essay-analysis/components/feedback-dashboard';
import {
  InsightsList,
  Insight
} from '@/features/essay-analysis/components/insights-list';
import { RevisionChat } from '@/features/essay-analysis/components/revision-chat';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { fetchDifyWorkflowRun } from '@/service/api/dify';
import { useAuth } from '@/components/layout/simple-auth-context';

type AnalysisState = 'input' | 'analyzing' | 'results';

interface AnalysisResult {
  overallScore: number;
  scores: ScoreData[];
  insights: Insight[];
}

export default function AIAnalysisPage() {
  const [state, setState] = useState<AnalysisState>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [essayData, setEssayData] = useState<{
    question: string;
    content: string;
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );

  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Check for view=results URL parameter to show demo results
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && viewParam.toString() === 'results') {
      const mockScores: ScoreData[] = [
        {
          category: 'Structure',
          score: 75,
          fullMark: 100,
          description: 'Your essay has a clear introduction, well-developed body paragraphs, and a concise conclusion. The logical flow between paragraphs could be improved with better transitions.'
        },
        {
          category: 'Content',
          score: 82,
          fullMark: 100,
          description: 'Strong argument development with relevant examples. Some claims would benefit from additional evidence and citations to support your points.'
        },
        {
          category: 'Style',
          score: 68,
          fullMark: 100,
          description: 'Good vocabulary usage but occasional wordiness. Consider varying sentence structure and reducing repetitive phrases for more engaging writing.'
        }
      ];

      const mockInsights: Insight[] = [
        {
          id: 'insight-1',
          type: 'critical',
          category: 'Structure',
          title: 'Missing Transition Words',
          description: 'The connection between paragraph 2 and paragraph 3 is abrupt. Consider adding transitional phrases like "Furthermore" or "In addition to this".',
          location: 'Paragraph 3'
        },
        {
          id: 'insight-2',
          type: 'suggestion',
          category: 'Content',
          title: 'Add More Evidence',
          description: 'Your claim about economic impact would be stronger with specific statistics or a real-world example.',
          location: 'Paragraph 2'
        },
        {
          id: 'insight-3',
          type: 'strength',
          category: 'Style',
          title: 'Strong Thesis Statement',
          description: 'Your thesis is clear, specific, and effectively outlines the main arguments that follow.',
          location: 'Introduction'
        }
      ];

      setEssayData({
        question: 'The Impact of Technology on Modern Education',
        content: 'This is a sample essay content used for demonstration purposes.'
      });

      setAnalysisResult({
        overallScore: 75,
        scores: mockScores,
        insights: mockInsights
      });

      setState('results');
    }
  }, [searchParams]);

  const handleSubmit = async (data: {
    question: string;
    content: string;
    rubricId?: number;
  }) => {
    setEssayData(data);
    setState('analyzing');
    setIsLoading(true);

    try {
      // Submit essay to start workflow (blocking mode waits for completion)
      const submitResponse = await fetchDifyWorkflowRun({
        essay_question: data.question,
        essay_content: data.content,
        language: 'English',
        response_mode: 'blocking',
        user_id: user?.id || 'anonymous-student',
        rubric_id: data.rubricId
      });

      // In blocking mode, outputs should be returned directly
      const outputs = submitResponse.data?.outputs;

      if (!outputs) {
        throw new Error('Analysis completed but no results returned. Please try again.');
      }

      // Transform scores
      let scores: ScoreData[] = [];
      let insights: Insight[] = [];
      let overallScore = 0;

      // Case 1: Structured JSON output (Ideal)
      if (outputs.structure_analysis) {
        scores = [
          {
            category: 'Structure',
            score: outputs.structure_analysis?.score || 0,
            fullMark: 100,
            description: outputs.structure_analysis?.comments
          },
          {
            category: 'Content',
            score: outputs.content_analysis?.score || 0,
            fullMark: 100,
            description: outputs.content_analysis?.comments
          },
          {
            category: 'Style',
            score: outputs.style_analysis?.score || 0,
            fullMark: 100,
            description: outputs.style_analysis?.comments
          }
        ];
        overallScore = outputs.overall_score || 0;

        // Transform grammar notes to insights
        insights = (outputs.grammar_notes || []).map(
          (note: any, index: number) => ({
            id: `grammar-${index}`,
            type: 'critical',
            category: 'Grammar',
            title: note.type || 'Correction',
            description: `${note.explanation} (Original: "${note.original}" -> Suggestion: "${note.suggestion}")`,
            location: undefined
          })
        );
      }
      // Case 2: Markdown Text output (Fallback for current Dify App)
      else if (outputs.text) {
        // Attempt to parse Markdown table for scores
        // Look for | Criterion | Score |
        const text = outputs.text;

        // Helper to extract score from "X/Y" format
        const extractScore = (regex: RegExp): number => {
          const match = text.match(regex);
          if (match && match[1]) {
            const [num, den] = match[1].split('/').map(Number);
            return den ? Math.round((num / den) * 100) : 0;
          }
          return 0;
        };

        const structureScore = extractScore(
          /\| Organization & Flow \| (\d+\/\d+) \|/
        );
        const contentScore =
          (extractScore(/\| Topic Focus \| (\d+\/\d+) \|/) +
            extractScore(/\| Evidence & Support \| (\d+\/\d+) \|/)) /
          2;
        const styleScore = extractScore(
          /\| Language & Mechanics \| (\d+\/\d+) \|/
        );

        // Extract Total Score
        const totalMatch = text.match(
          /\|\s*\*\*TOTAL\*\*\s*\|\s*\*\*(\d+\/\d+)\*\*\s*\|/
        );
        if (totalMatch) {
          const [num, den] = totalMatch[1].split('/').map(Number);
          overallScore = den ? Math.round((num / den) * 100) : 0;
        }

        scores = [
          {
            category: 'Structure',
            score: structureScore,
            fullMark: 100,
            description: 'Derived from Organization & Flow'
          },
          {
            category: 'Content',
            score: contentScore,
            fullMark: 100,
            description: 'Derived from Topic Focus & Evidence'
          },
          {
            category: 'Style',
            score: styleScore,
            fullMark: 100,
            description: 'Derived from Language & Mechanics'
          }
        ];

        // Create a generic insight pointing to the full report
        insights = [
          {
            id: 'full-report',
            type: 'info',
            category: 'General',
            title: 'Full Assessment',
            description: 'See the detailed Markdown report for full feedback.'
          }
        ];
      } else {
        throw new Error('Unable to parse analysis results.');
      }

      setAnalysisResult({
        overallScore,
        scores,
        insights
      });
    } catch (error) {
      // Type error for proper message access
      const err = error as { message?: string; error?: unknown };

      // Check if it's a Dify API error (has "error" field in response)
      const isDifyError = error && typeof error === 'object' && 'error' in error;

      // Check if it's a backend validation error (missing rubric)
      const isRubricError =
        err.message?.includes('No rubrics found') ||
        err.message?.includes('Please upload a rubric');

      let errorMessage = '';

      if (isDifyError) {
        // Dify API returned an error
        errorMessage = err.message || 'Dify workflow failed';
      } else if (isRubricError) {
        // Backend validation error - no rubric selected
        errorMessage = 'No rubric available. Please upload a rubric first before submitting essays.';
      } else if (error instanceof Error) {
        // Generic error
        errorMessage = error.message || 'Failed to analyze essay. Please try again.';
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }

      toast.error(errorMessage);

      // If rubric error, go back to input state
      if (isRubricError) {
        setState('input');
      } else {
        // Keep in current state for other errors
        setState('input');
      }

      return; // Stop here
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisComplete = () => {
    if (!isLoading && analysisResult) {
      setState('results');
    }
  };

  const handleReset = () => {
    setState('input');
    setEssayData(null);
    setAnalysisResult(null);
  };

  return (
    <PageContainer>
      <div className='relative min-h-[calc(100vh-4rem)] w-full'>
        {state === 'results' && (
          <div className='mb-6'>
            <Button
              variant='ghost'
              onClick={handleReset}
              className='text-muted-foreground hover:text-foreground'
            >
              <ChevronLeft className='mr-1 h-4 w-4' />
              New Analysis
            </Button>
          </div>
        )}

        <AnimatePresence mode='wait'>
          {state === 'input' && (
            <motion.div
              key='input'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className='flex h-full items-center justify-center pt-8'
            >
              <EssaySubmissionForm onSubmit={handleSubmit} />
            </motion.div>
          )}

          {state === 'analyzing' && (
            <motion.div
              key='analyzing'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='flex h-full items-center justify-center'
            >
              <AnalysisProgress
                isLoading={isLoading}
                onComplete={handleAnalysisComplete}
              />
            </motion.div>
          )}

          {state === 'results' && analysisResult && (
            <motion.div
              key='results'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className='space-y-6 pb-8'
            >
              <div className='mb-2 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
                <div>
                  <h1 className='text-3xl font-bold tracking-tight'>
                    {essayData?.question}
                  </h1>
                  <p className='text-muted-foreground'>
                    AI Analysis Report • {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline'>Export PDF</Button>
                  <Button>Save to Portfolio</Button>
                </div>
              </div>

              <div className='grid h-[800px] grid-cols-1 gap-6 lg:grid-cols-12'>
                {/* Left Column: Visuals & Feedback (7 cols) */}
                <div className='flex h-full flex-col space-y-6 overflow-y-auto lg:col-span-7'>
                  <FeedbackDashboard
                    scores={analysisResult.scores}
                    overallScore={analysisResult.overallScore}
                  />
                  <div className='min-h-0 flex-1'>
                    <InsightsList insights={analysisResult.insights} />
                  </div>
                </div>

                {/* Right Column: Chat & Revision (5 cols) */}
                <div className='sticky top-6 h-[800px] lg:col-span-5'>
                  <RevisionChat />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  );
}
