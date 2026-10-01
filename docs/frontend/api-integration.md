# API Integration

## Request flow

Browser requests use relative `/api/v2/...` URLs. Next.js route handlers forward
requests to Django at `NEXT_PUBLIC_API_URL` (locally `http://127.0.0.1:8000`).
The proxy reads the access token from an httpOnly cookie and allows only specific
headers. Client-supplied roles and authorization headers do not grant access.

## Service modules

Use the typed services under `frontend/src/service/api/v2/`:

| Module | Responsibility |
| --- | --- |
| `auth.ts` | Login, identity, logout and rubric CRUD |
| `classes.ts` / `tasks.ts` | Classes and assignments |
| `rubrics.ts` | Advanced rubric actions |
| `client.ts` | Shared API client |
| `types.ts` | Request and response contracts |

The active rubric list also uses `frontend/src/service/api/rubric.ts`; keep this
adapter alongside the v2 services. The unused legacy auth service was removed.

```typescript
import { authService } from '@/service/api/v2/auth';

const user = await authService.getUserInfo();
```

## Authentication

| Next.js route | Responsibility |
| --- | --- |
| `POST /api/v2/auth/login/` (also `login-with-jwt/`) | Authenticate and set token cookies |
| `GET /api/v2/auth/getUserInfo/` | Check the browser session |
| `GET/PATCH /api/v2/auth/me/` | Read or update account details |
| `POST /api/v2/auth/refresh/` | Refresh token cookies |
| `POST /api/v2/auth/logout/` | Revoke the session and clear cookies |

Keep `credentials: 'include'` and the proxy's origin/CSRF checks. Tokens remain
in httpOnly cookies; the client stores user metadata separately. Dashboard role
selection calls Django through `server-dashboard-auth.ts`, so revoked sessions
and current account status are checked before redirecting.

## Errors

Services reject failed requests. Components display the relevant error or retry
state. Keep permission failures visible and never replace them with fabricated
successful responses.
