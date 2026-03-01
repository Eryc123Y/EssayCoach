import { describe, expect, it } from 'vitest';
import { extractRoleFromPayload, validateAndDecodeToken } from './auth';

describe('auth token contract', () => {
  it('accepts legacy role claim when user_role is absent', () => {
    expect(extractRoleFromPayload({ role: 'lecturer' })).toBe('lecturer');
  });

  it('fails safely when JWT secret is missing', async () => {
    const originalSecret = process.env.JWT_SECRET;

    delete process.env.JWT_SECRET;

    try {
      const result = await validateAndDecodeToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('JWT secret is not configured');
    } finally {
      if (originalSecret) {
        process.env.JWT_SECRET = originalSecret;
      } else {
        delete process.env.JWT_SECRET;
      }
    }
  });
});
