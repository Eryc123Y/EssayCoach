# Runbook

This runbook is generated from the current source of truth:

- `frontend/package.json` (`scripts` section)
- `.env.example`

## Deployment Flow

### 1) Pre-deploy checks

- Ensure required env vars from `.env.example` are set.
- Validate key endpoints/config values:
  - `NEXT_PUBLIC_API_URL`
  - `DIFY_BASE_URL`
  - PostgreSQL connection variables

### 2) Build and start

Run from `frontend/`:

1. `pnpm install`
2. `pnpm build`
3. `pnpm start`

Expected result: app serves production build successfully.

## Monitoring and Alerts

No dedicated monitoring scripts are defined in `frontend/package.json`.

Use baseline operational checks:

- Process health: ensure `pnpm start` process is running.
- Log monitoring: watch runtime logs for build/start/runtime errors.
- Endpoint check: confirm app responds and frontend can reach `NEXT_PUBLIC_API_URL`.

Alert conditions to watch manually:

- Build failures (`pnpm build` non-zero exit)
- Startup failures (`pnpm start` non-zero exit)
- Repeated runtime errors in logs

## Common Issues and Fixes

### Build fails

- Run:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
- Fix lint/test failures first, then retry build.

### Frontend cannot reach backend

- Verify `.env`/deployment env has correct `NEXT_PUBLIC_API_URL`.
- Verify backend host/port and CORS vars from `.env.example`:
  - `CORS_ALLOWED_ORIGINS`
  - `ALLOWED_HOSTS`

### Database connectivity issues (backend side)

- Check these values:
  - `POSTGRES_HOST`
  - `POSTGRES_PORT`
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`

## Rollback Flow

Rollback is done by redeploying the previous known-good revision using the same steps:

1. Switch to previous stable commit/release.
2. Rebuild and restart:
   - `pnpm install`
   - `pnpm build`
   - `pnpm start`
3. Verify service health and API connectivity.

## Outdated Docs Review (> 90 days)

Manual review scan result (current workspace):

- No markdown files in `docs/` are older than 90 days.
