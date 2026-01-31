# Hybrid Token Authentication Architecture

## Overview

EssayCoach implements a **Hybrid Token Authentication** system that combines:
- **HttpOnly Cookie-based storage** on the frontend (Next.js)
- **Token-based authentication** in the backend (Django REST Framework)
- **Custom API Route Proxy** for secure token forwarding

## Architecture Flow

```
┌─────────────────┐         ┌─────────────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Next.js API Route    │         │   Backend (Django)│
│   (Next.js 15)  │         │   Proxy Handler         │         │   (Django 4.2)  │
└────────┬────────┘         └───────────┬─────────────┘         └────────┬────────┘
         │                            │                                 │
         │ 1. User logs in           │                                 │
         ├────────────────────────────>│                                 │
         │                            │                                 │
         │ 2. Server sets cookie        │                                 │
         │    (access_token)          │                                 │
         │    httpOnly: true          │                                 │
         │    secure: true            │                                 │
         │                            │                                 │
         │                            │ 3. Client requests          │
         │                            │    /api/v1/...             │
         │                            ├─────────────────────────────>│
         │                            │                                 │
         │                            │ 4. Proxy reads cookie        │
         │                            │    from request.cookies     │
         │                            │                                 │
         │                            │ 5. Extract token            │
         │                            │    from access_token       │
         │                            │                                 │
         │                            │ 6. Inject Authorization    │
         │                            │    header:                  │
         │                            │    Authorization: Token ... │
         │                            │                                 │
         │                            │ 7. Forward to Django        │
         │                            ├────────────────────────────────────>│
         │                            │                                 │
         │ 8. Django validates token  │<──────────────────────────────┤
         │    via TokenAuthentication    │                                 │
         │                            │                                 │
         │ 9. Response returns         │<──────────────────────────────────┤
         │                            │                                 │
         ├─────────────────────────────┤                                 │
         │                            │                                 │
```

## Component Details

### Frontend (Next.js 15)

**Location**: `frontend/src/app/api/v1/[...path]/route.ts`

**Role**: Acts as a secure proxy that bridges HttpOnly cookies to standard HTTP headers.

**Key Functions**:
1. **Cookie Reading**: Extracts `access_token` from `request.cookies`
2. **Token Injection**: Converts cookie to `Authorization: Token <token_value>` header
3. **Request Forwarding**: Proxies requests to Django backend at `http://127.0.0.1:8000`
4. **Response Proxying**: Returns Django responses transparently to client

**Security Benefits**:
- **HttpOnly Cookies**: Prevents client-side JavaScript access (XSS protection)
- **Secure Flag**: Ensures cookies are only sent over HTTPS (production)
- **No Client-Side Token Exposure**: Frontend components never read auth tokens directly

### Backend (Django 4.2 + DRF)

**Authentication Backend**: `TokenAuthentication` from Django REST Framework

**Configuration** (backend/essay_coach/settings.py):
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        # Additional backends can be prioritized
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

**Token Flow**:
1. Backend receives `Authorization: Token <token_value>` header from proxy
2. DRF `TokenAuthentication` validates token against database
3. If valid, `request.user` is populated
4. If invalid, returns `401 Unauthorized`
5. Protected views require `@permission_classes([IsAuthenticated])`

## Why Not Next.js Rewrites?

**Question**: Why use API Route Handlers instead of Next.js `rewrites` in `next.config.ts`?

**Answer**: `rewrites` **cannot inject custom headers** (like Authorization tokens).

**Technical Explanation**:
- `rewrites` only supports URL pattern matching and path rewriting
- `rewrites` cannot modify request headers
- `rewrites` cannot read cookies and convert them to headers
- API Route Handlers have full access to `NextRequest` object
- API Route Handlers can modify headers before proxying

**Impact**:
- ❌ **With rewrites**: Tokens would be exposed to client-side JavaScript (security risk)
- ✅ **With API Route Proxy**: Tokens remain HttpOnly and server-side only

## Security Considerations

### Current Implementation (MVP)
- ✅ HttpOnly cookies prevent XSS token theft
- ✅ Tokens never exposed to client-side JavaScript
- ✅ Backend validates every request
- ⚠️ Tokens currently have no expiration (future enhancement)
- ⚠️ No refresh token mechanism (future enhancement)

### Recommended Enhancements (Production)
1. **Token Expiration**: Implement short-lived access tokens (e.g., 15 minutes)
2. **Refresh Tokens**: Add refresh token mechanism for automatic token renewal
3. **CSRF Protection**: Add CSRF tokens for state-changing operations
4. **Middleware Validation**: Add Next.js middleware for route-level authentication checks
5. **Rate Limiting**: Implement rate limiting on authentication endpoints

## Configuration Requirements

### Environment Variables

**Backend** (.env):
```bash
# No additional config required for TokenAuthentication
# Tokens stored in Django's default `authtoken_token` table
```

**Frontend** (frontend/.env.local):
```bash
# Backend URL for API proxy
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Port Configuration

- **Frontend**: Port 5100 (configurable)
- **Backend**: Port 8000 (standard Django dev server)
- **PostgreSQL**: Port 5432 (development)

## Troubleshooting Common Issues

### Issue: "Failed to fetch" 401 Unauthorized

**Symptoms**: API requests return 401 status code

**Possible Causes**:
1. `access_token` cookie not set
2. Token expired (if expiration implemented)
3. Token manually deleted from database
4. API Route proxy not forwarding headers correctly

**Debugging Steps**:
1. Check browser DevTools Application → Cookies for `access_token`
2. Verify API Route handler logs token extraction
3. Verify Django receives `Authorization` header in server logs
4. Test token directly via Django Admin: `http://localhost:8000/admin/`

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Symptoms**: Browser blocks cross-origin requests

**Solution**: Ensure CORS is configured in Django settings:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5100",
    "http://127.0.0.1:5100",
]
```

## Related Documentation

- [Django REST Framework Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [HTTP Cookies Security](https://oweb.org/en-us/articles/set-cookie-secure-httponly-flag)

## Version History

- **v1.0** (Jan 2026): Initial Hybrid Token Authentication implementation
  - API Route proxy for token injection
  - HttpOnly cookie storage
  - Django TokenAuthentication backend
