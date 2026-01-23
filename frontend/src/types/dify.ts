export interface DifyWorkflowRunRequest {
  essay_question: string;
  essay_content: string;
  language?: string;
  response_mode: 'blocking' | 'streaming';
  user_id?: string;
  rubric_id?: number;
}

export interface SectionAnalysis {
  score: number;
  comments: string;
  suggestions: string[];
}

export interface DifyWorkflowRunResponse {
  workflow_run_id: string;
  task_id: string;
  status: 'running' | 'succeeded' | 'failed';
  data: {
    id: string;
    outputs?: {
      overall_score: number;
      feedback_summary: string;
      structure_analysis: SectionAnalysis;
      content_analysis: SectionAnalysis;
      style_analysis: SectionAnalysis;
      grammar_notes: Array<{
        type: string;
        original: string;
        suggestion: string;
        explanation: string;
      }>;
      text?: string; // Fallback for markdown text output
    };
  };
  inputs?: DifyWorkflowRunRequest;
}

export interface DifyWorkflowStatus {
  id: string;
  status: 'running' | 'succeeded' | 'failed' | 'stopped';
  outputs?: DifyWorkflowRunResponse['data']['outputs'];
  total_steps: number;
  elapsed_time?: number;
  error?: string;
}

export type WorkflowStatus =
  | 'idle'
  | 'submitting'
  | 'running'
  | 'succeeded'
  | 'failed';
