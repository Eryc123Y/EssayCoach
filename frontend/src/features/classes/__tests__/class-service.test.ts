import { describe, it, expect, vi } from 'vitest';
import { classService } from '@/service/api/v2/classes';
import type { ClassItem } from '@/service/api/v2/types';

describe('classService', () => {
  const mockClass: ClassItem = {
    class_id: 1,
    unit_id_unit: 'ENG101',
    class_name: 'English Composition',
    class_desc: 'Introduction to academic writing',
    class_join_code: 'ENG101',
    class_term: 'fall',
    class_year: 2025,
    class_status: 'active',
    class_archived_at: null,
    class_size: 25,
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('listClasses', () => {
    it('fetches classes successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockClass],
      });

      const classes = await classService.listClasses();
      expect(classes).toHaveLength(1);
      expect(classes[0].class_name).toBe('English Composition');
    });

    it('filters by status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockClass],
      });

      await classService.listClasses({ class_status: 'active' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('class_status=active'),
        expect.any(Object)
      );
    });
  });

  describe('getClass', () => {
    it('fetches a single class', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClass,
      });

      const cls = await classService.getClass(1);
      expect(cls.class_id).toBe(1);
    });
  });

  describe('createClass', () => {
    it('creates a new class', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClass,
      });

      const cls = await classService.createClass({
        unit_id_unit: 'ENG101',
        class_name: 'New Class',
      });

      expect(cls.class_name).toBe('English Composition');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/classes/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('joinClass', () => {
    it('joins a class with code', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClass,
      });

      const cls = await classService.joinClass('ENG101');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('join_code=ENG101'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('leaveClass', () => {
    it('leaves a class', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Left class' }),
      });

      const result = await classService.leaveClass(1);
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/classes/1/leave/'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('getClassStudents', () => {
    it('fetches class students', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ user_id: 1, user_email: 'student@example.com' }],
      });

      const students = await classService.getClassStudents(1);
      expect(students).toHaveLength(1);
    });
  });

  describe('archiveClass', () => {
    it('archives a class', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockClass, class_status: 'archived' as const }),
      });

      const cls = await classService.archiveClass(1);
      expect(cls.class_status).toBe('archived');
    });
  });
});
