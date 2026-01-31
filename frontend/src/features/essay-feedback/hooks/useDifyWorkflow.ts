/**
 * Hook for managing Dify workflow execution with EssayAgentInterface abstraction.
 *
 * This hook provides a unified interface for essay analysis workflows,
 * abstracting away the specific AI provider implementation.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  agentService,
  type EssayAnalysisInput,
  type WorkflowStatusResponse
} from '@/service/agent/agent-service';

const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_TIME = 300000; // 5 minutes

export type WorkflowStatus =
  | 'idle'
  | 'submitting'
  | 'running'
  | 'succeeded'
  | 'failed';

export interface DifyWorkflowRunRequest {
  essay_question: string;
  essay_content: string;
  language?: string;
  response_mode: 'blocking' | 'streaming';
  user_id?: string;
  rubric_id?: number;
}

export function useDifyWorkflow() {
  const [status, setStatus] = useState<WorkflowStatus>('idle');
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null);
  const [result, setResult] = useState<WorkflowStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const runWorkflow = useCallback(async (data: DifyWorkflowRunRequest) => {
    try {
      setStatus('submitting');
      setError(null);
      setProgress(0);

      // Convert request to EssayAnalysisInput for the agent service
      const input: EssayAnalysisInput = {
        essay_question: data.essay_question,
        essay_content: data.essay_content,
        language: data.language,
        response_mode: data.response_mode,
        user_id: data.user_id,
        rubric_id: data.rubric_id
      };

      // Use the unified agent service interface
      const response = await agentService.analyzeEssay(input);

      setWorkflowRunId(response.workflow_run_id);
      setStatus('running');
    } catch (err) {
      setStatus('failed');
      const errorMessage =
        err instanceof Error ? err.message : 'Submission failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Poll for status
  useEffect(() => {
    if (status !== 'running' || !workflowRunId) return;

    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const elapsed = Date.now() - startTime;
        if (elapsed > MAX_POLLING_TIME) {
          setStatus('failed');
          setError('Processing timeout. Please try again later.');
          return;
        }

        // Use the unified agent service for status check
        const response = await agentService.getWorkflowStatus(workflowRunId);
        setResult(response);

        // Simulate progress based on time, cap at 95% until done
        setProgress(Math.min((elapsed / MAX_POLLING_TIME) * 100 * 5, 95));

        if (response.status === 'succeeded') {
          setStatus('succeeded');
          setProgress(100);
        } else if (
          response.status === 'failed' ||
          response.status === 'stopped'
        ) {
          setStatus('failed');
          setError(response.error_message || 'Processing failed');
        } else {
          // Continue polling
          timeoutId = setTimeout(poll, POLLING_INTERVAL);
        }
      } catch (err) {
        setStatus('failed');
        setError(err instanceof Error ? err.message : 'Failed to get status');
      }
    };

    poll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status, workflowRunId]);

  const reset = useCallback(() => {
    setStatus('idle');
    setWorkflowRunId(null);
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    status,
    result,
    error,
    progress,
    runWorkflow,
    reset,
    isIdle: status === 'idle',
    isSubmitting: status === 'submitting',
    isRunning: status === 'running',
    isSuccess: status === 'succeeded',
    isFailed: status === 'failed'
  };
}
