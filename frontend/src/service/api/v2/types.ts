export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  user: UserInfo;
}

export interface UserInfo {
  user_id: number;
  user_email: string;
  user_fname: string | null;
  user_lname: string | null;
  user_role: 'admin' | 'teacher' | 'student';
  is_active: boolean;
}

export interface RubricLevelDesc {
  level_desc_id: number;
  level_min_score: number;
  level_max_score: number;
  level_desc: string;
}

export interface RubricItem {
  rubric_item_id: number;
  rubric_item_name: string;
  rubric_item_weight: string;
  level_descriptions: RubricLevelDesc[];
}

export interface RubricListItem {
  rubric_id: number;
  rubric_desc: string;
  rubric_create_time: string;
  user_id: number;
}

export interface RubricDetail {
  rubric_id: number;
  rubric_desc: string;
  rubric_create_time: string;
  rubric_items: RubricItem[];
}

export interface RubricImportResponse {
  success: boolean;
  rubric_id: number;
  rubric_name: string;
  items_count: number;
  levels_count: number;
  ai_parsed: boolean;
  ai_model: string;
  detection: {
    is_rubric: boolean;
    confidence: number;
    reason?: string;
  };
  error?: string;
}

export interface RubricListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RubricListItem[];
}

export interface WorkflowRunRequest {
  essay_question: string;
  essay_content: string;
  language?: string;
  rubric_id?: number;
  user_id?: string;
  response_mode?: 'blocking' | 'streaming';
}

export interface WorkflowRunResponse {
  workflow_run_id: string;
  task_id: string;
  status: string;
  data: Record<string, unknown>;
  inputs: Record<string, unknown>;
  response_mode: string;
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

export interface WorkflowStatusResponse {
  workflow_run_id: string;
  task_id: string;
  status: string;
  outputs: EssayAnalysisOutput | null;
  error_message: string | null;
  elapsed_time_seconds: number | null;
  token_usage: Record<string, number> | null;
}

export interface PaginatedResponse<T> {
  count: number;
  results: T[];
}
