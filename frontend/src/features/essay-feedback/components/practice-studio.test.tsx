import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PracticeStudio } from './practice-studio';
import type { PracticeEssay, PracticeRun } from '@/service/api/v2/types';

const service = vi.hoisted(() => ({
  listEssays: vi.fn(),
  listPublicRubrics: vi.fn(),
  listRuns: vi.fn(),
  getRun: vi.fn(),
  listChat: vi.fn()
}));

vi.mock('@/service/api/v2/practice', () => ({ practiceService: service }));
vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: 'en', changeLocale: vi.fn() })
}));

function essay(id: string, goal: string): PracticeEssay {
  return {
    essay_id: id, goal, content: `${goal} text`, language: 'en', audience: '', tone: '', rubric_id: null,
    version: 1, updated_at: '2026-09-30T00:00:00Z'
  } as PracticeEssay;
}

function run(essayId: string, revision: number, status: PracticeRun['status'] = 'failed'): PracticeRun {
  return {
    run_id: `run-${essayId}-${revision}`, essay_id: essayId, revision_number: revision, revision_goal: '',
    revision_content: '', revision_rubric: null, status, attempts: 1, model: 'm', report: null, evidence: [],
    error_category: null, error_message: null, created_at: '2026-09-30T00:00:00Z', started_at: null, finished_at: null
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('PracticeStudio draft history', () => {
  beforeEach(() => {
    Object.values(service).forEach((mock) => mock.mockReset());
    service.listEssays.mockResolvedValue([essay('a', 'Essay A'), essay('b', 'Essay B'), essay('c', 'Essay C')]);
    service.listPublicRubrics.mockResolvedValue([]);
    service.listChat.mockResolvedValue([]);
  });

  it('ignores a late history response for a draft the student has already left', async () => {
    const slowB = deferred<PracticeRun[]>();
    service.listRuns.mockImplementation((id: string) => {
      if (id === 'a') return Promise.resolve([run('a', 1)]);
      if (id === 'b') return slowB.promise; // still in flight when the student moves on
      return Promise.resolve([run('c', 3)]);
    });
    const user = userEvent.setup();
    render(<PracticeStudio />);

    await screen.findByRole('button', { name: 'Essay B' });
    await waitFor(() => expect(screen.getByText('Revision 1')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Essay B' }));
    await user.click(screen.getByRole('button', { name: 'Essay C' }));
    await waitFor(() => expect(screen.getByText('Revision 3')).toBeInTheDocument());

    await act(async () => {
      slowB.resolve([run('b', 2)]); // B's answer arrives after C is already open
    });

    expect(screen.getByText('Revision 3')).toBeInTheDocument();
    expect(screen.queryByText('Revision 2')).not.toBeInTheDocument();
  });

  it('clears the previous draft history while the next one loads', async () => {
    const slowB = deferred<PracticeRun[]>();
    service.listRuns.mockImplementation((id: string) =>
      id === 'a' ? Promise.resolve([run('a', 1)]) : slowB.promise
    );
    const user = userEvent.setup();
    render(<PracticeStudio />);
    await waitFor(() => expect(screen.getByText('Revision 1')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Essay B' }));

    expect(screen.queryByText('Revision 1')).not.toBeInTheDocument(); // A's feedback must not sit under B
    await act(async () => {
      slowB.resolve([run('b', 2)]);
    });
    expect(screen.getByText('Revision 2')).toBeInTheDocument();
  });
});
