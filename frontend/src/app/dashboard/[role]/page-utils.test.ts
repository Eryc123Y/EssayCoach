import { describe, expect, it } from 'vitest';
import {
  buildDashboardUrl,
  isAuthFailure,
  isDashboardRole
} from './page-utils';

describe('dashboard role page utils', () => {
  it('validates dashboard roles correctly', () => {
    expect(isDashboardRole('student')).toBe(true);
    expect(isDashboardRole('lecturer')).toBe(true);
    expect(isDashboardRole('admin')).toBe(true);
    expect(isDashboardRole('owner')).toBe(false);
  });

  it('builds role dashboard URL', () => {
    expect(buildDashboardUrl('http://127.0.0.1:8000', 'student')).toBe(
      'http://127.0.0.1:8000/api/v2/core/dashboard/student/'
    );
  });

  it('detects auth failure statuses', () => {
    expect(isAuthFailure(401)).toBe(true);
    expect(isAuthFailure(403)).toBe(true);
    expect(isAuthFailure(500)).toBe(false);
  });
});
