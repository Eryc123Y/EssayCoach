# FRONTEND KNOWLEDGE BASE

## OVERVIEW
`frontend/` is a Next.js 15 App Router app with shadcn/ui, Tailwind v4, Vitest, and a cookie-authenticated proxy layer to the Django backend.

## STRUCTURE
```text
frontend/
├── src/app/               # routes, layouts, API handlers
├── src/features/          # feature-slice modules
├── src/service/api/v2/    # typed API service layer
├── src/lib/               # auth/utilities/server helpers
├── src/components/ui/     # shared shadcn primitives
└── src/test/setup.ts      # Vitest global mocks
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Route/layout behavior | `src/app/AGENTS.md` | App Router + proxy/auth shell guidance |
| Feature work | `src/features/AGENTS.md` | main frontend implementation zone |
| API calls/contracts | `src/service/api/v2/AGENTS.md` | typed service layer |
| JWT + CSRF | `src/lib/auth.ts` | secure auth helpers |
| Backend proxy | `src/app/api/v2/[...path]/route.ts` | allowlist + cookie-derived auth |
| Global test mocks | `src/test/setup.ts` | mocks `next/navigation` |

## CONVENTIONS
- Package manager is `pnpm`; run frontend commands from `frontend/`.
- New work should prefer `/api/v2` services and contracts.
- Server-side auth verification uses `jose`; client-side user state uses localStorage/context.
- `credentials: 'include'` is mandatory for cookie-backed requests.
- The `/app/api/v2/[...path]/route.ts` proxy is a security boundary: auth comes from cookies, and forwarded headers/cookies are explicitly allowlisted.
- `127.0.0.1` is the dev default; avoid `localhost` surprises.

## ANTI-PATTERNS
- Never parse JWTs with `atob()`.
- Do not replace the route-handler proxy with rewrites.
- Do not merge rubric CRUD and advanced rubric action services blindly; there is an intentional split.
- Do not forget dashboard parallel-route compatibility when touching overview layouts.

## COMMANDS
```bash
cd frontend && pnpm dev
cd frontend && pnpm test
cd frontend && pnpm exec vitest run src/features/<path>/<file>.test.ts
cd frontend && pnpm lint
cd frontend && pnpm build
```

## NOTES
- Frontend build checks type errors; there is no separate dedicated frontend typecheck command here.
- `frontend/README.md` has stale v1-era details in places; prefer current code and root `AGENTS.md` for v2 patterns.
- `src/app/AGENTS.md` is the best entry point for dashboard routing, route handlers, and proxy-boundary behavior.
