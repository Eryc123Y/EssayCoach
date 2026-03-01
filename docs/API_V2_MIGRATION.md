# API v2 Migration Status

## Current State

API migration is complete. The project uses API v2 as the only active API namespace.

- Active API prefix: `/api/v2/`
- Frontend proxy route: `frontend/src/app/api/v2/[...path]/route.ts`
- Legacy v1 endpoints are removed from active development flow.

## Environment Configuration

Use backend URL only:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

`NEXT_PUBLIC_API_VERSION` is no longer required.

## Validation Checklist

- [ ] `POST /api/v2/auth/login/` works
- [ ] `GET /api/v2/auth/me/` works with auth cookie/token
- [ ] `GET /api/v2/core/dashboard/` returns role-aware payload
- [ ] `GET /api/v2/core/rubrics/` works
- [ ] `POST /api/v2/ai-feedback/agent/workflows/run/` works

## Rollback Note

If production rollback is needed, use previous stable deployment artifact/commit.
Do not toggle API namespace by environment flag.
