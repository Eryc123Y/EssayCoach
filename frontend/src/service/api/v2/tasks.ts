import { request } from '@/service/request';
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskSubmission,
  TaskDuplicateInput,
  TaskExtendInput,
  TaskExtendResponse,
  TaskEligibleStudent,
  TaskStudentDeadline,
  TaskSubmissionSummary,
} from './types';

const BASE_URL = '/api/v2';

export type TaskRubric = {
  rubric_id: number;
  description: string;
  version: number;
  items: Array<{
    id: number;
    name: string;
    weight: string;
    max_score: number;
    levels: Array<{ min: number; max: number; description: string }>;
  }>;
};

export const taskService = {
  async listTasks(params?: {
    unit_id_unit?: string;
    rubric_id_marking_rubric?: number;
    task_due_datetime__gte?: string;
    task_due_datetime__lte?: string;
    class_id_class?: number;
    task_status?: string;
    task_title?: string;
  }): Promise<Task[]> {
    return request<Task[]>({
      url: `${BASE_URL}/core/tasks/`,
      method: 'GET',
      params,
    });
  },

  async getTask(taskId: number): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/${taskId}/`,
      method: 'GET',
    });
  },

  async getTaskRubric(taskId: number): Promise<TaskRubric> {
    return request<TaskRubric>({ url: `${BASE_URL}/core/tasks/${taskId}/rubric/` });
  },

  async submitEssay(taskId: number, userId: number, content: string): Promise<TaskSubmission> {
    return request<TaskSubmission>({
      url: `${BASE_URL}/core/submissions/`, method: 'POST',
      data: { task_id_task: taskId, user_id_user: userId, submission_txt: content }
    });
  },

  async createTask(data: TaskCreateInput): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/`,
      method: 'POST',
      data,
    });
  },

  async updateTask(taskId: number, data: TaskUpdateInput): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/${taskId}/`,
      method: 'PUT',
      data,
    });
  },

  async deleteTask(taskId: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>({
      url: `${BASE_URL}/core/tasks/${taskId}/`,
      method: 'DELETE',
    });
  },

  async publishTask(taskId: number): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/${taskId}/publish/`,
      method: 'POST',
    });
  },

  async unpublishTask(taskId: number): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/${taskId}/unpublish/`,
      method: 'POST',
    });
  },

  async getTaskSubmissions(taskId: number): Promise<TaskSubmission[]> {
    return request<TaskSubmission[]>({
      url: `${BASE_URL}/core/tasks/${taskId}/submissions/`,
      method: 'GET',
    });
  },

  async duplicateTask(taskId: number, data: TaskDuplicateInput): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/${taskId}/duplicate/`,
      method: 'POST',
      data,
    });
  },

  async extendDeadline(taskId: number, data: TaskExtendInput): Promise<TaskExtendResponse> {
    return request<TaskExtendResponse>({
      url: `${BASE_URL}/core/tasks/${taskId}/extend/`,
      method: 'POST',
      data,
    });
  },

  async getEligibleStudents(taskId: number): Promise<TaskEligibleStudent[]> {
    return request<TaskEligibleStudent[]>({ url: `${BASE_URL}/core/tasks/${taskId}/eligible-students/` });
  },

  async getMyDeadline(taskId: number): Promise<TaskStudentDeadline> {
    return request<TaskStudentDeadline>({ url: `${BASE_URL}/core/tasks/${taskId}/my-deadline/` });
  },

  async getSubmissionSummary(taskId: number): Promise<TaskSubmissionSummary> {
    return request<TaskSubmissionSummary>({ url: `${BASE_URL}/core/tasks/${taskId}/submission-summary/` });
  },

  async exportSubmissions(taskId: number): Promise<Blob> {
    const response = await fetch(`${BASE_URL}/core/tasks/${taskId}/submissions-export/`, { credentials: 'include' });
    if (!response.ok) throw new Error(`Export failed (${response.status})`);
    return response.blob();
  },
};
