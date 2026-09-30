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
  avatar?: string | null;
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
  exemplar_text?: string;
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

export interface PracticeEssay {
  essay_id: string;
  goal: string;
  content: string;
  language: 'en' | 'zh';
  audience: string;
  tone: string;
  rubric_id: number | null;
  version: number;
  created_at: string;
  updated_at: string;
  revision_count: number;
}

export interface PracticeEvidence {
  claim: string;
  query: string;
  verdict: 'supported' | 'contradicted' | 'unresolved';
  rationale: string;
  source_title: string;
  source_url: string;
  source_excerpt: string;
  supporting_quote: string;
  retrieved_at: string | null;
}

export interface PracticeReport {
  overall_score: number;
  headline: string;
  general_feedback: string;
  strengths: string[];
  next_steps: string[];
  skills: Record<'grammar' | 'logic' | 'tone' | 'structure' | 'vocabulary', number>;
  annotations: Array<{
    quote: string;
    category: string;
    explanation: string;
    suggestion: string;
  }>;
  rubric_results: Array<{
    criterion: string;
    score: number;
    max_score: number;
    justification: string;
  }>;
}

export interface PracticeRubricCriterion {
  id: number;
  name: string;
  weight: string;
  max_score: number;
  exemplar_text?: string;
  levels: Array<{ min: number; max: number; description: string }>;
}

export interface PracticeRun {
  run_id: string;
  essay_id: string;
  revision_number: number;
  revision_goal: string;
  revision_content: string;
  revision_rubric: PracticeRubricCriterion[] | null;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  attempts: number;
  model: string;
  report: PracticeReport | null;
  evidence: PracticeEvidence[];
  error_category: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface PracticeChatTurn {
  turn_id: string;
  run_id: string;
  question: string;
  answer: string | null;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  attempts: number;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
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
  classId?: number | null;
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
  task_allow_resubmission: boolean;
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
  task_allow_resubmission?: boolean;
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
  task_allow_resubmission?: boolean;
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

export interface ClassCreatableUnit {
  unit_id: string;
  unit_name: string;
  unit_desc: string | null;
}

export interface ClassLeaveRequest {
  id: number;
  student_id: number;
  student_name: string;
  status: 'pending' | 'approved' | 'declined';
  reason: string;
  requested_at: string;
  decided_at: string | null;
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

// =============================================================================
// Settings Types (PRD-07)
// =============================================================================

export interface UserPreferences {
  email_notifications: boolean;
  in_app_notifications: boolean;
  submission_alerts: boolean;
  grading_alerts: boolean;
  social_alerts: boolean;
  weekly_digest: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface UserPreferencesInput {
  email_notifications?: boolean;
  in_app_notifications?: boolean;
  submission_alerts?: boolean;
  grading_alerts?: boolean;
  social_alerts?: boolean;
  weekly_digest?: boolean;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
}

export interface UserPreferencesResponse {
  success: boolean;
  data: UserPreferences;
  message?: string;
}

export interface AvatarUploadResponse {
  success: boolean;
  avatar_url: string;
  message: string;
}

export interface SessionInfo {
  session_key: string;
  device: string;
  ip_address: string | null;
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

export interface SessionListResponse {
  success: boolean;
  data: SessionInfo[];
}

export interface LoginHistoryItem {
  login_time: string;
  ip_address: string | null;
  device: string;
  success: boolean;
}

export interface LoginHistoryResponse {
  success: boolean;
  data: LoginHistoryItem[];
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// Profile Types (PRD-08)
// =============================================================================

export interface UserStats {
  total_essays: number;
  average_score: number | null;
  total_submissions: number;
  last_activity: string | null;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned_at: string | null;
}

export interface ProgressEntry {
  date: string;
  essay_count: number;
  average_score: number | null;
}

export interface UserProgress {
  user_id: number;
  entries: ProgressEntry[];
}

export interface ProfileTab {
  id: 'essays' | 'achievements' | 'progress';
  label: string;
}

// =============================================================================
// Advanced Task Action Types (PRD-09)
// =============================================================================

export interface TaskDuplicateInput {
  class_id_class?: number | null;
  task_title?: string | null;
  task_deadline?: string | null;
}

export interface TaskExtendInput {
  new_deadline: string;
  student_id?: number | null;
  reason?: string;
}

export interface DeadlineExtension {
  extension_id: number;
  task_id: number;
  user_id: number;
  original_deadline: string;
  extended_deadline: string;
  reason: string;
  granted_by: number;
  created_at: string;
}

export interface TaskExtendResponse {
  task: Task;
  extension: DeadlineExtension | null;
}

export interface TaskEligibleStudent {
  user_id: number;
  user_email: string;
  display_name: string;
}

export interface TaskStudentDeadline {
  task_id: number;
  global_deadline: string;
  effective_deadline: string;
  is_extended: boolean;
  submission_count: number;
}

export interface TaskSubmissionSummary {
  task_id: number;
  eligible_students: number;
  submitted_students: number;
  submission_versions: number;
}

export interface InvitationCreateInput {
  email: string;
  role: 'student' | 'lecturer';
  class_id?: number;
  lead_unit_id?: string;
}

export interface InvitationCreateResult {
  id: number;
  token: string;
  email: string;
  role: 'student' | 'lecturer';
  expires_at: string;
}

export interface BatchStudentInvitationResult {
  created: InvitationCreateResult[];
  failed: { email: string; reason: string }[];
}

// =============================================================================
// Advanced Rubric Action Types (PRD-06)
// =============================================================================

export interface RubricDuplicateInput {
  rubric_desc?: string | null;
  visibility?: 'public' | 'private';
}
