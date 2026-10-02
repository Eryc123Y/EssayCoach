import { describe, expect, it } from 'vitest';
import { safeInternalCallbackUrl } from './auth-navigation';

describe('safeInternalCallbackUrl', () => {
  it('keeps an internal callback path with its query and hash', () => {
    expect(
      safeInternalCallbackUrl('/dashboard/tasks/42?tab=review#submission')
    ).toBe('/dashboard/tasks/42?tab=review#submission');
  });

  it.each([
    'https://example.com',
    '//example.com',
    '\\\\example.com',
    'dashboard/tasks/42',
    null
  ])('falls back to the dashboard for an unsafe callback %s', (value) => {
    expect(safeInternalCallbackUrl(value)).toBe('/dashboard');
  });
});
