# Authentication Architecture (v2)

## Overview

EssayCoach uses a hybrid authentication model:

- Access/refresh tokens are stored in secure httpOnly cookies.
- Frontend server proxy forwards authenticated requests to backend API v2.
- Backend validates JWT and applies role-based access control.

## Request Flow

```text
Browser UI -> Next.js Route Handler (/api/v2/[...path]) -> Django API v2
```

1. User signs in through `/api/v2/auth/login/`.
2. Frontend stores tokens in cookies (`access_token`, `refresh_token`).
3. Client calls `/api/v2/...` in Next.js app.
4. Proxy route reads `access_token` from cookies.
5. Proxy injects `Authorization: Bearer <token>` to backend request.
6. Backend validates JWT and resolves `request.auth` user.

## Frontend Proxy

- File: `frontend/src/app/api/v2/[...path]/route.ts`
- Behavior:
  - Uses backend base URL from `getServerApiUrl()`.
  - Forwards only safe headers (`accept`, `content-type`, `origin`, `referer`, `x-csrftoken`, `x-requested-with`).
  - Forwards only safe cookies (`csrftoken`, `sessionid`).
  - Derives Authorization from `access_token` cookie (does not trust client-supplied Authorization header).

## Backend Auth

- API root: `backend/api_v2/api.py` (`/api/v2/`)
- Auth implementation:
  - `backend/api_v2/utils/jwt_auth.py`
  - `backend/api_v2/utils/auth.py`
- Common auth-protected modules:
  - `/api/v2/ai-feedback/*`
  - `/api/v2/core/*`
  - `/api/v2/auth/settings/*`

## Required Environment

Backend (`.env`):

```bash
SECRET_KEY=your-secret
ALLOWED_HOSTS=localhost,127.0.0.1
```

Frontend (`frontend/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Common Failure Modes

### 401 Unauthorized

- Check `access_token` cookie exists.
- Check token is not expired.
- Check backend receives `Authorization: Bearer ...` via proxy.

### 502 from proxy

- `NEXT_PUBLIC_API_URL` invalid or backend unavailable.
- Verify backend service is reachable at configured host/port.

### CSRF issues on mutating requests

- Ensure `csrftoken` cookie exists.
- Ensure `X-CSRFToken` is forwarded by frontend request layer.
