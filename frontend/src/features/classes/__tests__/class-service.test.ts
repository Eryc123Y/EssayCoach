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
    class_size: 25
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
        json: async () => [mockClass]
      });

      const classes = await classService.listClasses();
      expect(classes).toHaveLength(1);
      expect(classes[0].class_name).toBe('English Composition');
    });

    it('filters by status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockClass]
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
        json: async () => mockClass
      });

      const cls = await classService.getClass(1);
      expect(cls.class_id).toBe(1);
    });
  });

  describe('createClass', () => {
    it('creates a new class', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClass
      });

      const cls = await classService.createClass({
        unit_id_unit: 'ENG101',
        class_name: 'New Class'
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
        json: async () => mockClass
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
        json: async () => ({ success: true, message: 'Left class' })
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
        json: async () => [{ user_id: 1, user_email: 'student@example.com' }]
      });

      const students = await classService.getClassStudents(1);
      expect(students).toHaveLength(1);
    });
  });

  describe('archiveClass', () => {
    it('archives a class', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockClass, class_status: 'archived' as const })
      });

      const cls = await classService.archiveClass(1);
      expect(cls.class_status).toBe('archived');
    });
  });

  describe('batchEnrollStudents', () => {
    it('batch enrolls students by email', async () => {
      const mockResult = {
        success: true,
        message: 'Enrolled 2 students',
        enrolled_count: 2,
        created_count: 1,
        already_enrolled: [],
        newly_created: ['new@example.com'],
        failed: []
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      });

      const result = await classService.batchEnrollStudents({
        class_id: 1,
        student_emails: ['existing@example.com', 'new@example.com']
      });
      expect(result.enrolled_count).toBe(2);
      expect(result.created_count).toBe(1);
      expect(result.newly_created).toContain('new@example.com');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/admin/classes/batch-enroll/'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('reports failed enrollments in result', async () => {
      const mockResult = {
        success: true,
        message: 'Partial enroll',
        enrolled_count: 0,
        created_count: 0,
        already_enrolled: [],
        newly_created: [],
        failed: ['bad-email']
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      });

      const result = await classService.batchEnrollStudents({
        class_id: 1,
        student_emails: ['bad-email']
      });
      expect(result.failed).toContain('bad-email');
    });

    it('throws on API error (403 for non-admin)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Only admins can batch enroll students' })
      });
      await expect(
        classService.batchEnrollStudents({
          class_id: 1,
          student_emails: ['x@y.com']
        })
      ).rejects.toThrow();
    });
  });

  describe('inviteLecturer', () => {
    it('invites a new lecturer by email', async () => {
      const mockResult = {
        success: true,
        message: 'Lecturer invited',
        user_id: 55,
        email: 'newlecturer@example.com',
        status: 'created' as const
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      });

      const result = await classService.inviteLecturer({
        email: 'newlecturer@example.com',
        first_name: 'Dr',
        last_name: 'Smith'
      });
      expect(result.status).toBe('created');
      expect(result.user_id).toBe(55);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/admin/users/invite-lecturer/'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('returns "existing" status for existing user', async () => {
      const mockResult = {
        success: true,
        message: 'Lecturer already exists',
        user_id: 10,
        email: 'existing@example.com',
        status: 'existing' as const
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      });

      const result = await classService.inviteLecturer({
        email: 'existing@example.com'
      });
      expect(result.status).toBe('existing');
    });

    it('throws on API error (403 for non-admin)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' })
      });
      await expect(
        classService.inviteLecturer({ email: 'lecturer@example.com' })
      ).rejects.toThrow();
    });
  });
});
