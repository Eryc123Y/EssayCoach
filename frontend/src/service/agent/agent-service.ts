/**
 * Abstract AI Agent Service Layer
 *
 * This module provides a unified interface for AI essay feedback services,
 * abstracting away the specific AI provider (Dify, LangChain, etc.).
 *
 * This enables seamless provider switching without affecting frontend components.
 */

import { request } from '@/service/request';

// === Types (mirroring backend schemas) ===

export interface EssayAnalysisInput {
  essay_question: string;
  essay_content: string;
  language?: string;
  rubric_id?: number;
  user_id?: string;
  response_mode?: 'blocking' | 'streaming';
}

export interface FeedbackItem {
  criterion_name: string;
  score: number;
  max_score: number;
  feedback: string;
  suggestions: string[];
  level_name?: string;
  level_description?: string;
}

export interface EssayAnalysisOutput {
  overall_score: number;
  total_possible: number;
  percentage_score: number;
  feedback_items: FeedbackItem[];
  overall_feedback: string;
  strengths: string[];
  suggestions: string[];
  analysis_metadata: Record<string, unknown>;
  rubric_name?: string;
  rubric_id?: number;
}

export interface WorkflowRunResponse {
  workflow_run_id: string;
  task_id: string;
  status: string;
  data: Record<string, unknown>;
  inputs: Record<string, unknown>;
  response_mode: string;
}

export interface WorkflowStatusResponse {
  workflow_run_id: string;
  task_id: string;
  status: string;
  outputs: EssayAnalysisOutput | null;
  error_message: string | null;
  elapsed_time_seconds: number | null;
  token_usage: Record<string, number> | null;
}

// === Agent Service Interface ===

export interface AgentService {
  /**
   * Analyze an essay and generate feedback
   */
  analyzeEssay(input: EssayAnalysisInput): Promise<WorkflowRunResponse>;

  /**
   * Get the status of a workflow run
   */
  getWorkflowStatus(runId: string): Promise<WorkflowStatusResponse>;

  /**
   * Check if the AI service is healthy
   */
  healthCheck(): Promise<boolean>;
}

// === Dify Service Implementation ===

class DifyService implements AgentService {
  private baseUrl = '/api/v2/ai-feedback';

  async analyzeEssay(input: EssayAnalysisInput): Promise<WorkflowRunResponse> {
    const response = await request<WorkflowRunResponse>({
      url: `${this.baseUrl}/agent/workflows/run/`,
      method: 'POST',
      data: {
        essay_question: input.essay_question,
        essay_content: input.essay_content,
        language: input.language || 'English',
        response_mode: input.response_mode || 'blocking',
        user_id: input.user_id,
        rubric_id: input.rubric_id
      }
    });

    return response;
  }

  async getWorkflowStatus(runId: string): Promise<WorkflowStatusResponse> {
    const response = await request<WorkflowStatusResponse>({
      url: `${this.baseUrl}/agent/workflows/run/${runId}/status/`,
      method: 'GET'
    });

    return response;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to run a simple analysis with minimal input
      await this.analyzeEssay({
        essay_question: 'Test question',
        essay_content: 'Test content',
        response_mode: 'blocking'
      });
      return true;
    } catch {
      return false;
    }
  }
}

// === Service Factory ===

// Current implementation - can be switched to LangChain later
export const agentService: AgentService = new DifyService();

// === Utility Functions ===

/**
 * Calculate percentage score
 */
export function calculatePercentage(score: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((score / total) * 100 * 100) / 100;
}

/**
 * Get grade letter from percentage
 */
export function getGradeLetter(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Format elapsed time from seconds
 */
export function formatElapsedTime(seconds: number | null): string {
  if (seconds === null) return 'N/A';

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  return `${minutes}m ${remainingSeconds}s`;
}

// === Export for testing ===

export { DifyService };
