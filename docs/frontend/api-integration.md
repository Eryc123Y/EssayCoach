# Frontend API Integration (v2)

## Overview

The frontend uses a server-side proxy route for backend communication:

- Proxy route: `frontend/src/app/api/v2/[...path]/route.ts`
- Backend API prefix: `/api/v2/`

This keeps auth token handling on the server side and avoids exposing sensitive headers directly from browser code.

## Environment Configuration

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Request Flow

1. Frontend code requests `/api/v2/...`.
2. Route handler forwards request to backend `${NEXT_PUBLIC_API_URL}/api/v2/...`.
3. Proxy reads `access_token` cookie and injects `Authorization: Bearer <token>`.
4. Response is streamed back to frontend.

## Auth Integration

- Login endpoint: `POST /api/v2/auth/login/`
- Current user endpoint: `GET /api/v2/auth/me/`
- JWT refresh endpoint: `POST /api/v2/auth/refresh/`

## Error Handling

- 401: token missing/expired, or auth header invalid.
- 502: backend unavailable or invalid backend URL config.
- 500: server-side failure in backend route.

## Notes

- The proxy only forwards a safe allowlist of headers and cookies.
- Direct client-provided `Authorization` headers are not trusted for backend pass-through.
