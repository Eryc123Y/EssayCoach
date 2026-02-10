import { request } from '../request';
import type {
  DifyWorkflowRunRequest,
  DifyWorkflowRunResponse,
  DifyWorkflowStatus
} from '@/types/dify';

/**
 * Trigger Dify Workflow
 */
export function fetchDifyWorkflowRun(data: DifyWorkflowRunRequest) {
  return request<DifyWorkflowRunResponse>({
    url: '/api/v2/ai-feedback/agent/workflows/run/',
    method: 'post',
    data
  });
}

/**
 * Get Workflow Run Status
 */
export function fetchWorkflowStatus(workflowRunId: string) {
  return request<DifyWorkflowStatus>({
    url: `/api/v2/ai-feedback/agent/workflows/run/${workflowRunId}/status/`
  });
}
