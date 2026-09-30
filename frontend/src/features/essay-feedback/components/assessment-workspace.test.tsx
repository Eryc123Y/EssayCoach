import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssessmentWorkspace } from './assessment-workspace';
import type { FormalAssessment } from '@/service/api/v2/assessment';

const service = vi.hoisted(() => ({
  getSubmission: vi.fn(),
  getAssessment: vi.fn(),
  getJob: vi.fn(),
  review: vi.fn(),
  publish: vi.fn(),
  retryJob: vi.fn()
}));

vi.mock('@/service/api/v2/assessment', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/service/api/v2/assessment')>()),
  assessmentService: service
}));
vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: 'en', changeLocale: vi.fn() })
}));

function assessment(overrides: Partial<FormalAssessment> = {}): FormalAssessment {
  return {
    submission_id: 7, status: 'ai_draft', version: 1, final_score: null,
    items: [{ rubric_item_id: 1, score: 6, comment: 'Clear claim', source: 'ai' }],
    ai_proposal: { model: 'test-model', run_id: 'r1', items: [{ rubric_item_id: 1, score: 6, comment: 'Clear claim', source: 'ai' }] },
    rubric_snapshot: [{ id: 1, name: 'Argument', weight: '100.0', max_score: 10 }],
    can_publish: false, can_review: true, reviewed_by: null, reviewed_at: null, published_by: null, published_at: null,
    ...overrides
  };
}

describe('AssessmentWorkspace review controls', () => {
  beforeEach(() => {
    Object.values(service).forEach((mock) => mock.mockReset());
    service.getSubmission.mockResolvedValue({
      submission_id: 7, submission_time: '2026-09-30T00:00:00Z', submission_txt: 'An essay.', task_id_task: 1, user_id_user: 2
    });
    service.getJob.mockResolvedValue(null);
  });

  it('lets a lecturer edit scores and save the review', async () => {
    service.getAssessment.mockResolvedValue(assessment({ can_review: true }));
    render(<AssessmentWorkspace submissionId={7} />);

    expect(await screen.findByRole('button', { name: 'Save teacher review' })).toBeEnabled();
    expect(screen.getByLabelText('Reviewed score')).toBeEnabled();
    expect(screen.queryByText(/Only a lecturer can review/)).not.toBeInTheDocument();
  });

  it('shows a read-only view with an explanation to someone who cannot review', async () => {
    service.getAssessment.mockResolvedValue(assessment({ can_review: false }));
    render(<AssessmentWorkspace submissionId={7} />);

    expect(await screen.findByText('Only a lecturer can review and score this essay.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save teacher review' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Reviewed score')).toBeDisabled();
  });

  it('keeps a published result read-only for a lecturer too', async () => {
    service.getAssessment.mockResolvedValue(assessment({ status: 'published', final_score: '60.0', can_review: true }));
    render(<AssessmentWorkspace submissionId={7} />);

    expect(await screen.findByText(/Final score/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save teacher review' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Reviewed score')).toBeDisabled();
  });
});
