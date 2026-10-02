import type { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { getServerApiUrl } from '@/lib/server-api';

/**
 * Shared cookie-session handling for the route handlers and middleware.
 *
 * The access cookie is short-lived. When it is missing or its JWT is about to
 * expire, the session is renewed with the httpOnly refresh cookie so that a
 * "remember me" sign-in lasts for the remembered window instead of one hour.
 * The backend still verifies every token; decoding `exp` here only decides
 * whether to refresh.
 */

export const ACCESS_COOKIE_MAX_AGE = 60 * 60;
export const REMEMBERED_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const REFRESH_SKEW_SECONDS = 60;

export const SESSION_COOKIE_NAMES = [
  'access_token',
  'refresh_token',
  'session_persistence',
  'user_email',
  'user_first_name',
  'user_last_name',
  'user_role',
  'user_id'
] as const;

export const authCookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/'
};

export type SessionTokens = {
  access: string;
  refresh: string;
  expiresAt?: string;
  remember: boolean;
};

type RefreshResult =
  | { status: 'ok'; tokens: SessionTokens }
  | { status: 'rejected' }
  | { status: 'error' };

export type ResolvedSession = {
  /** Token to send to the backend, if any. */
  accessToken?: string;
  /** New tokens that must be written back to the browser. */
  refreshed?: SessionTokens;
  /** The refresh token was refused (expired, revoked, or already rotated). */
  rejected?: boolean;
};

type CookieReader = Pick<NextRequest, 'cookies'>;

export function isRememberedSession(req: CookieReader): boolean {
  // Missing markers come from older logins and keep the persistent behavior.
  return req.cookies.get('session_persistence')?.value !== 'session';
}

export function setSessionCookies(res: NextResponse, tokens: SessionTokens) {
  const remember = tokens.remember;
  res.cookies.set('access_token', tokens.access, {
    ...authCookieOptions,
    ...(remember ? { maxAge: ACCESS_COOKIE_MAX_AGE } : {})
  });
  res.cookies.set('refresh_token', tokens.refresh, {
    ...authCookieOptions,
    ...(remember ? { maxAge: REMEMBERED_SESSION_MAX_AGE } : {})
  });
  res.cookies.set('session_persistence', remember ? 'persistent' : 'session', {
    ...authCookieOptions,
    ...(remember ? { maxAge: REMEMBERED_SESSION_MAX_AGE } : {})
  });
}

export function clearSessionCookies(res: NextResponse) {
  for (const name of SESSION_COOKIE_NAMES) {
    res.cookies.set(name, '', { ...authCookieOptions, maxAge: 0 });
  }
}

function decodeExp(token: string): number | null {
  try {
    // Unverified decode only decides when to refresh; Django verifies every token.
    const { exp } = decodeJwt(token);
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

export function accessTokenNeedsRefresh(
  token: string | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!token) return true;
  const exp = decodeExp(token);
  if (exp === null) return false;
  return exp * 1000 - nowMs <= REFRESH_SKEW_SECONDS * 1000;
}

// Requests that race on the same refresh token share one in-flight rotation.
// Settled results are never kept: replaying a spent token must not return the
// credentials that replaced it.
const pendingRefreshes = new Map<string, Promise<RefreshResult>>();

async function requestRefresh(
  refreshToken: string,
  remember: boolean
): Promise<RefreshResult> {
  try {
    const response = await fetch(`${getServerApiUrl()}/api/v2/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken })
    });
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return { status: 'rejected' };
    }
    if (!response.ok) return { status: 'error' };
    const result = await response.json();
    const payload = result?.data ?? result;
    if (!payload?.access || !payload?.refresh) return { status: 'error' };
    return {
      status: 'ok',
      tokens: {
        access: payload.access,
        refresh: payload.refresh,
        expiresAt: payload.expires_at,
        remember
      }
    };
  } catch {
    return { status: 'error' };
  }
}

export function refreshSessionTokens(
  refreshToken: string,
  remember: boolean
): Promise<RefreshResult> {
  const pending = pendingRefreshes.get(refreshToken);
  if (pending) return pending;

  const promise = requestRefresh(refreshToken, remember).finally(() => {
    pendingRefreshes.delete(refreshToken);
  });
  pendingRefreshes.set(refreshToken, promise);
  return promise;
}

export async function resolveSession(req: CookieReader): Promise<ResolvedSession> {
  const access = req.cookies.get('access_token')?.value;
  if (access && !accessTokenNeedsRefresh(access)) {
    return { accessToken: access };
  }

  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (!refreshToken) return { accessToken: access };

  const result = await refreshSessionTokens(refreshToken, isRememberedSession(req));
  if (result.status === 'ok') {
    return { accessToken: result.tokens.access, refreshed: result.tokens };
  }
  // A request that lost a rotation race may still hold a usable access token.
  if (result.status === 'rejected') return { accessToken: access, rejected: true };
  // Backend unavailable: keep whatever we had and let the request fail normally.
  return { accessToken: access };
}

/** Make refreshed tokens visible to server components rendered for this request. */
export function applyRefreshedRequestCookies(req: NextRequest, tokens: SessionTokens) {
  req.cookies.set('access_token', tokens.access);
  req.cookies.set('refresh_token', tokens.refresh);
}

/** Run a route handler with a fresh access token and persist any rotation. */
export function withSession(
  handler: (req: NextRequest, accessToken: string | undefined) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const session = await resolveSession(req);
    const response = await handler(req, session.accessToken);
    if (session.refreshed) setSessionCookies(response, session.refreshed);
    return response;
  };
}
