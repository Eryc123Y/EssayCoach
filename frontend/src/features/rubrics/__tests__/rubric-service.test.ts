import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rubricActionsService } from '@/service/api/v2/rubrics';

describe('rubricActionsService', () => {
  const mockRubricDetail = {
    rubric_id: 99,
    rubric_desc: 'Copy of Essay Rubric',
    rubric_create_time: '2025-02-28T10:00:00Z',
    rubric_items: [],
    visibility: 'private' as const,
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('duplicateRubric', () => {
    it('duplicates a rubric with default visibility', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRubricDetail,
      });

      const result = await rubricActionsService.duplicateRubric(1, {});
      expect(result.rubric_id).toBe(99);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/rubrics/1/duplicate/'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('duplicates a rubric with custom description', async () => {
      const customDesc = { ...mockRubricDetail, rubric_desc: 'Semester 2 Version' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => customDesc,
      });

      const result = await rubricActionsService.duplicateRubric(1, {
        rubric_desc: 'Semester 2 Version',
        visibility: 'public',
      });
      expect(result.rubric_desc).toBe('Semester 2 Version');
    });

    it('duplicates a rubric as public', async () => {
      const publicRubric = { ...mockRubricDetail, visibility: 'public' as const };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => publicRubric,
      });

      const result = await rubricActionsService.duplicateRubric(5, { visibility: 'public' });
      expect(result.visibility).toBe('public');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/core/rubrics/5/duplicate/'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('throws on 403 when duplicating a private rubric you do not own', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: "Cannot duplicate a private rubric you don't own" }),
      });
      await expect(rubricActionsService.duplicateRubric(7, {})).rejects.toThrow();
    });

    it('throws on 404 when rubric does not exist', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Rubric not found' }),
      });
      await expect(rubricActionsService.duplicateRubric(999, {})).rejects.toThrow();
    });
  });
});
