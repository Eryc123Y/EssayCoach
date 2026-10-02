import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { OperationsWorkspace } from '@/features/observability/operations-workspace';

const overview = vi.fn();
const traces = vi.fn();

vi.mock('@/components/layout/preference-provider', () => ({
  usePreferences: () => ({ locale: 'en', applyLocale: vi.fn() }),
}));

vi.mock('@/service/api/v2/observability', () => ({
  observabilityService: { overview: () => overview(), traces: (jobId?: string) => traces(jobId) },
}));

const baseOverview = {
  database_ok: true,
  worker_ok: true,
  worker_last_seen_at: '2026-10-01T10:00:00Z',
  worker_processed_jobs: 3,
  codex_binary_found: true,
  counts: { formal: {}, practice: {}, chat: {} },
  jobs: [],
};

describe('OperationsWorkspace', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['valid', 'Healthy', 'Signed in and ready for AI work.'],
    ['not_logged_in', 'Needs attention', 'Sign in to Codex on this machine, then refresh.'],
    ['unknown_timeout', 'Needs attention', 'The login check timed out. Refresh to try again.'],
  ] as const)('shows %s Codex login status accurately', async (codex_login_status, health, guidance) => {
    overview.mockResolvedValue({ ...baseOverview, codex_login_status });
    traces.mockResolvedValue([]);

    render(<OperationsWorkspace />);

    await waitFor(() => expect(screen.getByText(guidance)).toBeInTheDocument());
    const runtimeCard = screen.getByText('Codex runtime').closest('div.rounded-2xl');
    expect(runtimeCard).toHaveTextContent(health);
  });
});
