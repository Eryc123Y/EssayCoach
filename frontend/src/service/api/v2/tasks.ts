import { request } from '@/service/request';
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskSubmission,
  TaskDuplicateInput,
  TaskExtendInput,
  TaskExtendResponse
} from './types';

const BASE_URL = '/api/v2';

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
      params
    });
  },

  async getTask(taskId: number): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/${taskId}/`,
      method: 'GET'
    });
  },

  async createTask(data: TaskCreateInput): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/`,
      method: 'POST',
      data
    });
  },

  async updateTask(taskId: number, data: TaskUpdateInput): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/${taskId}/`,
      method: 'PUT',
      data
    });
  },

  async deleteTask(taskId: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>({
      url: `${BASE_URL}/core/tasks/${taskId}/`,
      method: 'DELETE'
    });
  },

  async publishTask(taskId: number): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/${taskId}/publish/`,
      method: 'POST'
    });
  },

  async unpublishTask(taskId: number): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/${taskId}/unpublish/`,
      method: 'POST'
    });
  },

  async getTaskSubmissions(taskId: number): Promise<TaskSubmission[]> {
    return request<TaskSubmission[]>({
      url: `${BASE_URL}/core/tasks/${taskId}/submissions/`,
      method: 'GET'
    });
  },

  async duplicateTask(taskId: number, data: TaskDuplicateInput): Promise<Task> {
    return request<Task>({
      url: `${BASE_URL}/core/tasks/${taskId}/duplicate/`,
      method: 'POST',
      data
    });
  },

  async extendDeadline(
    taskId: number,
    data: TaskExtendInput
  ): Promise<TaskExtendResponse> {
    return request<TaskExtendResponse>({
      url: `${BASE_URL}/core/tasks/${taskId}/extend/`,
      method: 'POST',
      data
    });
  }
};
