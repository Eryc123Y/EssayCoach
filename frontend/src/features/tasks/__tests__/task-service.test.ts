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

  describe('duplicateTask', () => {
    it('duplicates a task with minimal input', async () => {
      const duplicatedTask = { ...mockTask, task_id: 99, task_title: 'Copy of Test Essay' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => duplicatedTask,
      });

      const result = await taskService.duplicateTask(1, {});
      expect(result.task_id).toBe(99);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/tasks/1/duplicate/'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('passes optional fields when duplicating', async () => {
      const duplicatedTask = {
        ...mockTask,
        task_id: 99,
        task_title: 'Custom Title',
        class_id_class: 5,
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => duplicatedTask,
      });

      const result = await taskService.duplicateTask(1, {
        task_title: 'Custom Title',
        class_id_class: 5,
        task_deadline: '2025-04-01T23:59:59Z',
      });
      expect(result.task_title).toBe('Custom Title');
    });

    it('throws on API error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Task not found' }),
      });
      await expect(taskService.duplicateTask(999, {})).rejects.toThrow();
    });
  });

  describe('extendDeadline', () => {
    it('extends deadline globally (no student_id)', async () => {
      const extendedTask = { ...mockTask, task_due_datetime: '2025-04-01T23:59:59Z' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: extendedTask, extension: null }),
      });

      const result = await taskService.extendDeadline(1, {
        new_deadline: '2025-04-01T23:59:59Z',
      });
      expect(result.task.task_due_datetime).toBe('2025-04-01T23:59:59Z');
      expect(result.extension).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/tasks/1/extend/'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('creates per-student extension when student_id provided', async () => {
      const mockExtension = {
        extension_id: 1,
        task_id: 1,
        user_id: 42,
        original_deadline: '2025-03-15T23:59:59Z',
        extended_deadline: '2025-04-01T23:59:59Z',
        reason: 'Medical leave',
        granted_by: 2,
        created_at: '2025-02-28T10:00:00Z',
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: mockTask, extension: mockExtension }),
      });

      const result = await taskService.extendDeadline(1, {
        new_deadline: '2025-04-01T23:59:59Z',
        student_id: 42,
        reason: 'Medical leave',
      });
      expect(result.extension).not.toBeNull();
      expect(result.extension?.user_id).toBe(42);
      expect(result.extension?.reason).toBe('Medical leave');
    });

    it('throws on API error (403 for non-admin/lecturer)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      });
      await expect(
        taskService.extendDeadline(1, { new_deadline: '2025-04-01T23:59:59Z' })
      ).rejects.toThrow();
    });
  });
});
