export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh?: string;
  expiresAt?: string;
  user: UserInfo;
}

export interface RefreshTokenResponse {
  access: string;
  refresh: string;
  expiresAt: string;
}

export interface UserInfo {
  user_id: number;
  user_email: string;
  user_fname: string | null;
  user_lname: string | null;
  user_role: 'admin' | 'lecturer' | 'teacher' | 'student';
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
  user_id_user: number;
  visibility?: 'public' | 'private';
}

export interface RubricDetail {
  rubric_id: number;
  rubric_desc: string;
  rubric_create_time: string;
  rubric_items: RubricItem[];
  visibility?: 'public' | 'private';
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

// ============================================================================
// Dashboard Types (PRD-04 Refactor)
// ============================================================================

export type DashboardRole = 'student' | 'lecturer' | 'admin';

export interface DashboardUserInfo {
  id: number;
  name: string;
  role: 'student' | 'lecturer' | 'admin';
  email: string;
}

// Common stats base
export interface DashboardStats {
  totalEssays: number;
  averageScore: number | null;
  pendingGrading: number;
}

// Lecturer-specific stats
export interface LecturerStats extends DashboardStats {
  essaysReviewedToday: number;
  pendingReviews: number;
  activeClasses: number;
  avgGradingTime: number | null;
}

// Student-specific stats
export interface StudentStats extends DashboardStats {
  essaysSubmitted: number;
  avgScore: number | null;
  improvementTrend: 'up' | 'down' | 'stable';
  feedbackReceived: number;
}

// Admin-specific stats
export interface AdminStats extends DashboardStats {
  totalUsers: number;
  activeStudents: number;
  activeLecturers: number;
  totalClasses: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

// Class overview for lecturer dashboard
export interface ClassOverview {
  id: number;
  name: string;
  unitName: string;
  studentCount: number;
  essayCount: number;
  avgScore: number | null;
  pendingReviews: number;
}

// Grading queue item
export interface GradingQueueItem {
  submissionId: number;
  studentName: string;
  essayTitle: string;
  submittedAt: string;
  dueDate?: string;
  status?: string;
  aiScore?: number | null;
}

// Student essay item
export interface StudentEssay {
  id: number;
  title: string;
  status: 'draft' | 'submitted' | 'ai_graded' | 'lecturer_reviewed' | 'returned';
  submittedAt: string;
  score: number | null;
  unitName: string | null;
  taskTitle: string | null;
}

// Activity feed item
export interface DashboardActivityItem {
  id: number;
  type: 'submission' | 'feedback' | 'grade' | 'comment';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

// System status for admin
export interface SystemStatus {
  database: 'healthy' | 'critical';
  submissionsLast24h: number;
  feedbacksLast24h: number;
  activeUsers: number;
}

// Lecturer Dashboard Response
export interface LecturerDashboardResponse {
  user: DashboardUserInfo;
  stats: LecturerStats;
  classes: ClassOverview[];
  gradingQueue: GradingQueueItem[];
  recentActivity: DashboardActivityItem[];
}

// Student Dashboard Response
export interface StudentDashboardResponse {
  user: DashboardUserInfo;
  stats: StudentStats;
  myEssays: StudentEssay[];
  recentActivity: DashboardActivityItem[];
}

// Admin Dashboard Response
export interface AdminDashboardResponse {
  user: DashboardUserInfo;
  stats: AdminStats;
  recentActivity: DashboardActivityItem[];
  systemStatus: SystemStatus;
}

// Union type for any dashboard response
export type DashboardResponse =
  | LecturerDashboardResponse
  | StudentDashboardResponse
  | AdminDashboardResponse;

// =============================================================================
// Task Types (PRD-09)
// =============================================================================

export interface Task {
  task_id: number;
  unit_id_unit: string;
  rubric_id_marking_rubric: number;
  task_publish_datetime: string;
  task_due_datetime: string;
  task_title: string;
  task_desc: string | null;
  task_instructions: string;
  class_id_class: number | null;
  task_status: 'draft' | 'published' | 'unpublished' | 'archived';
  task_allow_late_submission: boolean;
}

export interface TaskCreateInput {
  unit_id_unit: string;
  rubric_id_marking_rubric: number;
  task_due_datetime: string;
  task_title: string;
  task_desc?: string | null;
  task_instructions: string;
  class_id_class?: number | null;
  task_status?: 'draft' | 'published' | 'unpublished' | 'archived';
  task_allow_late_submission?: boolean;
}

export interface TaskUpdateInput {
  unit_id_unit?: string;
  rubric_id_marking_rubric?: number;
  task_due_datetime?: string;
  task_title?: string;
  task_desc?: string | null;
  task_instructions?: string;
  class_id_class?: number | null;
  task_status?: 'draft' | 'published' | 'unpublished' | 'archived';
  task_allow_late_submission?: boolean;
}

export interface TaskSubmission {
  submission_id: number;
  task_id_task: number;
  user_id_user: number;
  submission_time: string;
  submission_txt: string;
  student_name?: string;
  student_email?: string;
}

// =============================================================================
// Class Types (PRD-10)
// =============================================================================

export interface ClassItem {
  class_id: number;
  unit_id_unit: string;
  class_name: string;
  class_desc: string | null;
  class_join_code: string | null;
  class_term: string;
  class_year: number | null;
  class_status: 'active' | 'archived';
  class_archived_at: string | null;
  class_size: number;
}

export interface ClassCreateInput {
  unit_id_unit: string;
  class_name: string;
  class_desc?: string | null;
  class_join_code?: string | null;
  class_term?: string;
  class_year?: number | null;
  class_size?: number;
}

export interface ClassUpdateInput {
  unit_id_unit?: string;
  class_name?: string;
  class_desc?: string | null;
  class_join_code?: string | null;
  class_term?: string;
  class_year?: number | null;
  class_size?: number;
}

export interface ClassDetail extends ClassItem {
  unit_name: string | null;
}

export interface StudentInfo {
  user_id: number;
  user_email: string;
  user_fname: string | null;
  user_lname: string | null;
  user_role: string;
}

export interface JoinClassRequest {
  join_code: string;
}

export interface LeaveClassResponse {
  success: boolean;
  message: string;
}
