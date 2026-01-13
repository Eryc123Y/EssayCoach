import { useState, useCallback, useEffect } from 'react';
import { fetchDifyWorkflowRun, fetchWorkflowStatus } from '@/service/api/dify';
import type {
  DifyWorkflowRunRequest,
  DifyWorkflowStatus,
  WorkflowStatus
} from '@/types/dify';

const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_TIME = 300000; // 5 minutes

export function useDifyWorkflow() {
  const [status, setStatus] = useState<WorkflowStatus>('idle');
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null);
  const [result, setResult] = useState<DifyWorkflowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const runWorkflow = useCallback(async (data: DifyWorkflowRunRequest) => {
    try {
      setStatus('submitting');
      setError(null);
      setProgress(0);

      const response = await fetchDifyWorkflowRun({
        ...data,
        response_mode: 'blocking'
      });

      setWorkflowRunId(response.workflow_run_id);
      setStatus('running');
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Submission failed');
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

        const response = await fetchWorkflowStatus(workflowRunId);
        setResult(response);
        // Simulate progress based on time, cap at 95% until done
        setProgress(Math.min((elapsed / MAX_POLLING_TIME) * 100 * 5, 95)); // Accelerate visual progress a bit

        if (response.status === 'succeeded') {
          setStatus('succeeded');
          setProgress(100);
        } else if (
          response.status === 'failed' ||
          response.status === 'stopped'
        ) {
          setStatus('failed');
          setError(response.error || 'Processing failed');
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
