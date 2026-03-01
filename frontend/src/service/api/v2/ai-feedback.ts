import { request } from '@/service/request';
import type {
  WorkflowRunRequest,
  WorkflowRunResponse,
  WorkflowStatusResponse,
} from './types';

const BASE_URL = '/api/v2';

export const aiFeedbackService = {
  async analyzeEssay(data: WorkflowRunRequest): Promise<WorkflowRunResponse> {
    return request<WorkflowRunResponse>({
      url: `${BASE_URL}/ai-feedback/agent/workflows/run/`,
      method: 'POST',
      data: {
        essay_question: data.essay_question,
        essay_content: data.essay_content,
        language: data.language || 'English',
        response_mode: data.response_mode || 'blocking',
        user_id: data.user_id,
        rubric_id: data.rubric_id,
      },
    });
  },

  async getWorkflowStatus(runId: string): Promise<WorkflowStatusResponse> {
    return request<WorkflowStatusResponse>({
      url: `${BASE_URL}/ai-feedback/agent/workflows/run/${runId}/status/`,
      method: 'GET',
    });
  },

  async healthCheck(): Promise<boolean> {
    try {
      await this.analyzeEssay({
        essay_question: 'Test',
        essay_content: 'Test',
        response_mode: 'blocking',
      });
      return true;
    } catch {
      return false;
    }
  },
};
