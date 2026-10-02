/**
 * Client-side cache of the signed-in user's display metadata.
 *
 * Remembered sign-ins use localStorage so new tabs render immediately.
 * Session-only sign-ins use sessionStorage so nothing outlives the browser
 * session on a shared machine. Authorization never relies on this cache.
 *
 * Every storage call is guarded: storage can be missing or throw (blocked
 * site data, privacy modes, sandboxed frames), and a cache failure must never
 * turn a successful sign-in or sign-out into an error.
 */

export const USER_DATA_KEY = 'user_data';

type StorageKind = 'sessionStorage' | 'localStorage';

function attempt<T>(operation: () => T, fallback: T): T {
  try {
    return operation();
  } catch {
    return fallback;
  }
}

function storage(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') return null;
  return attempt(() => window[kind], null);
}

export function storeUserData(user: unknown, persistent: boolean) {
  clearUserData();
  const target = storage(persistent ? 'localStorage' : 'sessionStorage');
  attempt(() => target?.setItem(USER_DATA_KEY, JSON.stringify(user)), undefined);
}

export function readUserData<T>(): T | null {
  for (const kind of ['sessionStorage', 'localStorage'] as const) {
    const store = storage(kind);
    const raw = attempt(() => store?.getItem(USER_DATA_KEY) ?? null, null);
    if (!raw) continue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      attempt(() => store?.removeItem(USER_DATA_KEY), undefined);
    }
  }
  return null;
}

export function clearUserData() {
  for (const kind of ['sessionStorage', 'localStorage'] as const) {
    const store = storage(kind);
    attempt(() => store?.removeItem(USER_DATA_KEY), undefined);
  }
}
