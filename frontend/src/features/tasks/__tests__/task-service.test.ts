import { describe, it, expect, vi } from 'vitest';
import { taskService } from '@/service/api/v2/tasks';
import type { Task } from '@/service/api/v2/types';

describe('taskService', () => {
  const mockTask: Task = {
    task_id: 1,
    unit_id_unit: 'ENG101',
    rubric_id_marking_rubric: 1,
    task_publish_datetime: '2025-02-26T00:00:00Z',
    task_due_datetime: '2025-03-15T23:59:59Z',
    task_title: 'Test Essay',
    task_desc: 'Test Description',
    task_instructions: 'Use APA format',
    class_id_class: null,
    task_status: 'published',
    task_allow_late_submission: true,
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('listTasks', () => {
    it('fetches tasks successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockTask],
      });

      const tasks = await taskService.listTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].task_title).toBe('Test Essay');
    });

    it('passes filters to API', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockTask],
      });

      await taskService.listTasks({ task_status: 'published' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('task_status=published'),
        expect.any(Object)
      );
    });
  });

  describe('getTask', () => {
    it('fetches a single task', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      });

      const task = await taskService.getTask(1);
      expect(task.task_id).toBe(1);
    });
  });

  describe('createTask', () => {
    it('creates a new task', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      });

      const task = await taskService.createTask({
        unit_id_unit: 'ENG101',
        rubric_id_marking_rubric: 1,
        task_due_datetime: '2025-03-15T23:59:59Z',
        task_title: 'New Task',
        task_instructions: 'Instructions',
      });

      expect(task.task_title).toBe('Test Essay');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/tasks/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('publishTask', () => {
    it('publishes a task', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockTask, task_status: 'published' as const }),
      });

      const task = await taskService.publishTask(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/tasks/1/publish/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('unpublishTask', () => {
    it('unpublishes a task', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockTask, task_status: 'unpublished' as const }),
      });

      const task = await taskService.unpublishTask(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/tasks/1/unpublish/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('getTaskSubmissions', () => {
    it('fetches task submissions', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ submission_id: 1, task_id_task: 1, user_id_user: 5 }],
      });

      const submissions = await taskService.getTaskSubmissions(1);
      expect(submissions).toHaveLength(1);
    });
  });
});
