/**
 * Client-side cache of the signed-in user's display metadata.
 *
 * Remembered sign-ins use localStorage so new tabs render immediately.
 * Session-only sign-ins use sessionStorage so nothing outlives the browser
 * session on a shared machine. Authorization never relies on this cache.
 */

export const USER_DATA_KEY = 'user_data';

function storages(): Storage[] {
  if (typeof window === 'undefined') return [];
  const result: Storage[] = [];
  try {
    result.push(window.sessionStorage);
  } catch {
    // Storage can be unavailable in private modes.
  }
  try {
    result.push(window.localStorage);
  } catch {
    // Storage can be unavailable in private modes.
  }
  return result;
}

export function storeUserData(user: unknown, persistent: boolean) {
  if (typeof window === 'undefined') return;
  clearUserData();
  try {
    const target = persistent ? window.localStorage : window.sessionStorage;
    target.setItem(USER_DATA_KEY, JSON.stringify(user));
  } catch {
    // Ignore quota or availability errors; the server session is authoritative.
  }
}

export function readUserData<T>(): T | null {
  for (const storage of storages()) {
    const raw = storage.getItem(USER_DATA_KEY);
    if (!raw) continue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      storage.removeItem(USER_DATA_KEY);
    }
  }
  return null;
}

export function clearUserData() {
  for (const storage of storages()) {
    storage.removeItem(USER_DATA_KEY);
  }
}
