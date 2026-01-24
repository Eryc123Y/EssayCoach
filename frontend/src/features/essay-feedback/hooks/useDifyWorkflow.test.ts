import { renderHook, act, waitFor } from '@testing-library/react';
import { useDifyWorkflow } from './useDifyWorkflow';
import * as agentService from '@/service/agent/agent-service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/service/agent/agent-service');

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
      percentage_score: 85,
      total_possible: 100,
      feedback_items: [
        {
          criterion_name: 'Structure',
          score: 8,
          max_score: 10,
          feedback: 'Well organized essay',
          suggestions: ['Add more transitions'],
        },
        {
          criterion_name: 'Content',
          score: 9,
          max_score: 10,
          feedback: 'Strong arguments',
          suggestions: ['Add more examples'],
        },
      ],
      overall_feedback: 'Great essay overall',
      strengths: ['Clear thesis', 'Good structure'],
      suggestions: ['Add more citations'],
      analysis_metadata: {},
    };

    // Mock agentService.analyzeEssay response
    vi.mocked(agentService.agentService.analyzeEssay).mockResolvedValue({
      workflow_run_id: mockWorkflowRunId,
      task_id: 'task-123',
      status: 'running',
      data: { id: mockWorkflowRunId },
      inputs: {},
      response_mode: 'blocking'
    });

    // Mock agentService.getWorkflowStatus response
    vi.mocked(agentService.agentService.getWorkflowStatus).mockResolvedValue({
      workflow_run_id: mockWorkflowRunId,
      task_id: 'task-123',
      status: 'succeeded',
      outputs: mockOutputs,
      error_message: null,
      elapsed_time_seconds: 12.5,
      token_usage: { total: 1500, prompt: 800, completion: 700 }
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
    expect(agentService.agentService.analyzeEssay).toHaveBeenCalledOnce();
    expect(agentService.agentService.getWorkflowStatus).toHaveBeenCalled();
  });

  it('should handle workflow run failure on submission', async () => {
    vi.mocked(agentService.agentService.analyzeEssay).mockRejectedValue(
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
