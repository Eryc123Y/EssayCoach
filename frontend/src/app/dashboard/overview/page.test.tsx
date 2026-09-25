import { describe, expect, it, vi } from 'vitest';
import DashboardOverviewPage from './page';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('legacy overview route', () => {
  it('routes users to the authenticated dashboard instead of fixture statistics', async () => {
    const { redirect } = await import('next/navigation');
    DashboardOverviewPage();
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });
});
