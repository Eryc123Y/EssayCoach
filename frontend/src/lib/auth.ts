/**
 * Secure Authentication Utilities
 *
 * Provides JWT validation with signature verification for server-side use.
 * All token operations follow security best practices:
 * - Signature verification using JWT_SECRET
 * - Expiration validation
 * - Issuer/audience claim verification
 * - Safe error handling without information leakage
 */

import { jwtVerify, errors } from 'jose';

// JWT Configuration - matches backend settings
const JWT_ISSUER = 'essaycoach-backend';
const JWT_AUDIENCE = 'essaycoach-frontend';

function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;
  if (typeof secret === 'string' && secret.trim().length > 0) {
    return secret;
  }
  return null;
}

// Valid roles in the system
export type UserRole = 'student' | 'lecturer' | 'admin';

export interface TokenValidationResult {
  valid: boolean;
  role?: UserRole;
  error?: string;
  payload?: Record<string, unknown>;
}

/**
 * Validate and decode JWT token with full signature verification
 *
 * Security features:
 * - Verifies HMAC-SHA256 signature
 * - Validates expiration (exp claim)
 * - Validates issuer (iss claim)
 * - Validates audience (aud claim)
 * - Validates user_role claim exists and is valid
 *
 * @param token - JWT token string to validate
 * @returns TokenValidationResult with validation status and decoded payload
 *
 * @example
 * const result = await validateAndDecodeToken(accessToken);
 * if (result.valid && result.role) {
 *   redirect(`/dashboard/${result.role}`);
 * }
 */
export async function validateAndDecodeToken(
  token: string
): Promise<TokenValidationResult> {
  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    return {
      valid: false,
      error: 'Server auth misconfiguration: JWT secret is not configured',
    };
  }

  try {
    // Verify signature and standard claims
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret),
      {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        algorithms: ['HS256'], // Only allow HMAC-SHA256
      }
    );

    const userRole = verified.payload.user_role ?? verified.payload.role;
    const validRoles = ['student', 'lecturer', 'admin', 'teacher'] as const;

    if (!userRole || typeof userRole !== 'string') {
      return {
        valid: false,
        error: 'Invalid token: missing role claim',
      };
    }

    if (!validRoles.includes(userRole as (typeof validRoles)[number])) {
      return {
        valid: false,
        error: 'Invalid token: unrecognized user_role',
      };
    }

    // Normalize 'teacher' to 'lecturer' for frontend consistency
    const normalizedRole: UserRole = userRole === 'teacher' ? 'lecturer' : (userRole as UserRole);

    return {
      valid: true,
      role: normalizedRole,
      payload: verified.payload as Record<string, unknown>,
    };
  } catch (error) {
    // Handle specific JWT errors without exposing internal details
    if (error instanceof errors.JOSEAlgNotAllowed) {
      return { valid: false, error: 'Invalid token: algorithm not allowed' };
    }
    if (error instanceof errors.JWEDecryptionFailed) {
      return { valid: false, error: 'Invalid token: signature verification failed' };
    }
    if (error instanceof errors.JWTExpired) {
      return { valid: false, error: 'Invalid token: token has expired' };
    }
    if (error instanceof errors.JWTClaimValidationFailed) {
      return { valid: false, error: 'Invalid token: claim validation failed' };
    }
    if (error instanceof errors.JWSSignatureVerificationFailed) {
      return { valid: false, error: 'Invalid token: signature verification failed' };
    }

    // Generic error for security (don't expose internal error details)
    return { valid: false, error: 'Invalid token: verification failed' };
  }
}

/**
 * Extract role from validated token payload
 *
 * @param payload - Decoded JWT payload
 * @returns Normalized role or null if invalid
 */
export function extractRoleFromPayload(
  payload: Record<string, unknown>
): UserRole | null {
  const userRole = payload.user_role ?? payload.role;
  const validRoles = ['student', 'lecturer', 'admin', 'teacher'] as const;

  if (!userRole || typeof userRole !== 'string') {
    return null;
  }

  if (!validRoles.includes(userRole as (typeof validRoles)[number])) {
    return null;
  }

  // Normalize 'teacher' to 'lecturer'
  return userRole === 'teacher' ? 'lecturer' : (userRole as UserRole);
}

/**
 * Check if a role has access to a specific feature
 *
 * @param userRole - User's role
 * @param allowedRoles - Array of roles that can access the feature
 * @returns boolean indicating access permission
 */
export function hasRoleAccess(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Get CSRF token from cookies
 *
 * Used for Django CSRF protection on state-changing requests.
 *
 * @returns CSRF token string or null if not found
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Create headers for authenticated API requests
 *
 * Includes Content-Type, CSRF token (if available), and credentials
 *
 * @param method - HTTP method (determines if CSRF token is needed)
 * @returns HeadersInit for fetch requests
 */
export function createAuthHeaders(method: string = 'GET'): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Include CSRF token for state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }

  return headers;
}
