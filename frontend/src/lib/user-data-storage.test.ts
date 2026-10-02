import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearUserData, readUserData, storeUserData } from './user-data-storage';

describe('user data storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps session-only and remembered users in their own stores', () => {
    storeUserData({ email: 'remembered@example.com' }, true);
    expect(localStorage.getItem('user_data')).toContain('remembered@example.com');

    storeUserData({ email: 'session@example.com' }, false);
    expect(sessionStorage.getItem('user_data')).toContain('session@example.com');
    expect(localStorage.getItem('user_data')).toBeNull();
    expect(readUserData<{ email: string }>()?.email).toBe('session@example.com');
  });

  it('never throws when storage operations fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(() => storeUserData({ email: 'blocked@example.com' }, false)).not.toThrow();
    expect(() => clearUserData()).not.toThrow();
    expect(readUserData()).toBeNull();
  });
});
