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

/**
 * Chat with AI about essay
 */
export interface ChatMessageRequest {
  message: string;
  context?: {
    essay_id?: string;
    essay_question?: string;
    essay_content?: string;
    feedback_summary?: string;
    conversation_id?: string;
  };
}

export interface ChatMessageResponse {
  message: string;
  role: 'assistant' | 'system';
  timestamp: string;
}

export function fetchChatMessage(data: ChatMessageRequest) {
  return request<ChatMessageResponse>({
    url: '/api/v2/ai-feedback/chat/',
    method: 'post',
    data
  });
}
