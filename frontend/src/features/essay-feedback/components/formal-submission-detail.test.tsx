import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormalSubmissionDetail } from './formal-submission-detail';

vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: 'en', changeLocale: vi.fn() }),
}));

const submission = {
  submission_id: 42,
  submission_time: '2026-09-25T00:00:00Z',
  task_id_task: 7,
  submission_txt: 'The submitted essay is immutable.'
};

describe('FormalSubmissionDetail', () => {
  it('keeps assessment information hidden until publication', () => {
    render(<FormalSubmissionDetail submission={submission} assessment={null} />);
    expect(screen.getByText('The submitted essay is immutable.')).toBeInTheDocument();
    expect(screen.getByText('Awaiting teacher review and release')).toBeInTheDocument();
    expect(screen.queryByText('Final assessment')).not.toBeInTheDocument();
  });

  it('shows the reviewed result and criterion comments after publication', () => {
    render(<FormalSubmissionDetail submission={submission} assessment={{
      status: 'published', final_score: '82.50', published_at: '2026-09-25T01:00:00Z',
      rubric_snapshot: [{ id: 5, name: 'Argument', max_score: 10 }],
      items: [{ rubric_item_id: 5, score: 8, comment: 'Use stronger evidence.' }]
    }} />);
    expect(screen.getByText('Result published')).toBeInTheDocument();
    expect(screen.getByText('82.50')).toBeInTheDocument();
    expect(screen.getByText('Argument')).toBeInTheDocument();
    expect(screen.getByText('Use stronger evidence.')).toBeInTheDocument();
  });
});
