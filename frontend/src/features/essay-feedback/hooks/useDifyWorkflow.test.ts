import { renderHook, act, waitFor } from '@testing-library/react';
import { useDifyWorkflow } from './useDifyWorkflow';
import * as difyApi from '@/service/api/dify';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/service/api/dify');

describe('useDifyWorkflow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should start in idle state', () => {
    const { result } = renderHook(() => useDifyWorkflow());
    expect(result.current.status).toBe('idle');
    expect(result.current.isIdle).toBe(true);
  });

  it('should handle successful workflow run', async () => {
    const mockWorkflowRunId = 'run-123';
    const mockOutputs = {
      overall_score: 85,
      feedback_summary: 'Good essay',
      structure_analysis: { score: 80, comments: 'Good', suggestions: [] },
      content_analysis: { score: 85, comments: 'Good', suggestions: [] },
      style_analysis: { score: 90, comments: 'Good', suggestions: [] },
      grammar_notes: []
    };

    // Mock fetchDifyWorkflowRun response
    vi.mocked(difyApi.fetchDifyWorkflowRun).mockResolvedValue({
      workflow_run_id: mockWorkflowRunId,
      task_id: 'task-123',
      data: {
        id: mockWorkflowRunId,
        status: 'running',
        outputs: {},
        error: null,
        elapsed_time: 0,
        total_tokens: 0,
        total_steps: 0,
        created_at: 123,
        finished_at: null,
        created_by: {
          id: 'user-1',
          user: 'user-1',
          name: 'User',
          email: 'user@example.com'
        }
      }
    });

    // Mock fetchWorkflowStatus response
    vi.mocked(difyApi.fetchWorkflowStatus).mockResolvedValue({
      id: mockWorkflowRunId,
      status: 'succeeded',
      outputs: mockOutputs,
      error: undefined,
      elapsed_time: 1,
      total_steps: 1
    });

    const { result } = renderHook(() => useDifyWorkflow());

    await act(async () => {
      await result.current.runWorkflow({
        essay_content: 'Test content',
        essay_question: 'Test question',
        response_mode: 'blocking',
        user_id: 'user-1'
      });
    });

    await waitFor(() => {
      expect(result.current.status).toBe('succeeded');
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.result?.status).toBe('succeeded');
    expect(result.current.result?.outputs).toEqual(mockOutputs);
    expect(difyApi.fetchDifyWorkflowRun).toHaveBeenCalledOnce();
    expect(difyApi.fetchWorkflowStatus).toHaveBeenCalled();
  });

  it('should handle workflow run failure on submission', async () => {
    vi.mocked(difyApi.fetchDifyWorkflowRun).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useDifyWorkflow());

    await act(async () => {
      try {
        await result.current.runWorkflow({
          essay_content: 'Test content',
          essay_question: 'Test question',
          response_mode: 'blocking',
          user_id: 'user-1'
        });
      } catch (e) {
        // Ignore
      }
    });

    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBe('Network error');
  });
});
