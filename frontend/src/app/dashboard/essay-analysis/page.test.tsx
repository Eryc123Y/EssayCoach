import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EssayAnalysisPage from './page';
import { practiceService } from '@/service/api/v2/practice';
import { PreferenceProvider } from '@/components/layout/preference-provider';

vi.mock('next-themes', () => {
  const setTheme = vi.fn();
  return { useTheme: () => ({ setTheme }) };
});

vi.mock('@/service/api/v2/auth', () => ({
  settingsService: { updatePreferences: vi.fn().mockResolvedValue({}) }
}));

vi.mock('@/service/api/v2/practice', () => ({
  practiceService: {
    listEssays: vi.fn(), listPublicRubrics: vi.fn(), listRuns: vi.fn(),
    createEssay: vi.fn(), saveEssay: vi.fn(), analyze: vi.fn(), getRun: vi.fn(), retryRun: vi.fn(),
    listChat: vi.fn(), askCoach: vi.fn(), retryCoach: vi.fn()
  }
}));

vi.mock('@/features/settings/store/settingsStore', () => ({
  useSettingsStore: (selector: (state: object) => unknown) => selector({
    preferences: { language: 'en' }, fetchPreferences: vi.fn()
  })
}));

const essay = {
  essay_id: 'essay-1', goal: 'Explain climate change', content: 'Carbon dioxide absorbs infrared radiation.',
  language: 'en', audience: '', tone: '', rubric_id: null, version: 1,
  created_at: '2026-09-25T00:00:00Z', updated_at: '2026-09-25T00:00:00Z', revision_count: 0
};

const run = {
  run_id: 'run-1', essay_id: 'essay-1', revision_number: 1,
  revision_goal: essay.goal, revision_content: essay.content,
  revision_rubric: [{ id: 1, name: 'Evidence', weight: '100.0', max_score: 10, exemplar_text: 'A precise claim with a cited source.', levels: [{ min: 0, max: 10, description: 'Evidence quality' }] }],
  status: 'succeeded', attempts: 1, model: 'gpt-6-luna',
  report: {
    overall_score: 78, headline: 'A clear starting point', general_feedback: 'Build on your evidence.',
    strengths: ['Clear claim'], next_steps: ['Add a source'],
    skills: { grammar: 80, logic: 70, tone: 78, structure: 75, vocabulary: 82 },
    annotations: [{ quote: 'Carbon dioxide', category: 'fact', explanation: 'Check the claim', suggestion: 'Cite a source' }],
    rubric_results: [{ criterion: 'Evidence', score: 8, max_score: 10, justification: 'Clear claim' }]
  },
  evidence: [{
    claim: 'Carbon dioxide absorbs infrared radiation', query: 'carbon dioxide infrared', verdict: 'supported',
    rationale: 'The source supports this.', source_title: 'NASA', source_url: 'https://science.nasa.gov/',
    source_excerpt: 'Carbon dioxide absorbs infrared radiation.',
    supporting_quote: 'Carbon dioxide absorbs infrared radiation.', retrieved_at: '2026-09-25T00:00:00Z'
  }],
  error_category: null, error_message: null,
  created_at: '2026-09-25T00:00:00Z', started_at: '2026-09-25T00:00:01Z', finished_at: '2026-09-25T00:00:03Z'
};

describe('Practice studio', () => {
  const renderPractice = () => render(<PreferenceProvider hasInitialPreferences><EssayAnalysisPage /></PreferenceProvider>);
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(practiceService.listEssays).mockResolvedValue([]);
    vi.mocked(practiceService.listPublicRubrics).mockResolvedValue([]);
    vi.mocked(practiceService.listChat).mockResolvedValue([]);
    vi.mocked(practiceService.createEssay).mockResolvedValue(essay as never);
    vi.mocked(practiceService.analyze).mockResolvedValue(run as never);
  });

  it('saves a draft and shows real analysis with a source link', async () => {
    renderPractice();
    fireEvent.change(await screen.findByLabelText('What are you trying to write?'), {
      target: { value: essay.goal }
    });
    fireEvent.change(screen.getByLabelText('Essay draft'), {
      target: { value: essay.content }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Get practice feedback' }));

    await waitFor(() => {
      expect(practiceService.createEssay).toHaveBeenCalledWith(expect.objectContaining({
        goal: essay.goal, content: essay.content
      }));
      expect(practiceService.analyze).toHaveBeenCalledWith('essay-1', 1);
    });
    expect(await screen.findByText('A clear starting point')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'NASA' })).toHaveAttribute('href', 'https://science.nasa.gov/');
    expect(screen.getByText('This is not a formal grade.', { exact: false })).toBeInTheDocument();
    fireEvent.click(screen.getByText('View high-scoring exemplar'));
    expect(screen.getByText('A precise claim with a cited source.')).toBeVisible();
  });

  it('can show the Chinese interface without changing the essay language', async () => {
    renderPractice();
    await screen.findByLabelText('What are you trying to write?');
    fireEvent.click(screen.getByRole('button', { name: 'Switch interface language' }));
    expect(screen.getByLabelText('这次你想写什么？')).toBeInTheDocument();
    expect(screen.getByLabelText('文章草稿')).toBeInTheDocument();
  });
});
