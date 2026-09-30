# APP ROUTER KNOWLEDGE BASE

## OVERVIEW
`frontend/src/app/` is the Next.js App Router surface: pages, layouts, auth entry points, dashboard routing, and server-side API handlers live here.

## STRUCTURE
```text
src/app/
├── api/                  # route handlers and backend proxy boundary
├── auth/                 # sign-in / sign-up entry pages
├── dashboard/            # layouts, redirects, overview, role routes
├── layout.tsx            # root shell
├── page.tsx              # landing page
└── global-error.tsx      # app-level error UI
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Backend proxy boundary | `api/v2/[...path]/route.ts` | safe header/cookie allowlist |
| Login / token cookies | `api/v2/auth/*/route.ts` | server-only auth handoff |
| Dashboard shell | `dashboard/layout.tsx` | sidebar/header + scroll behavior |
| Role redirect | `dashboard/page.tsx` | server-side JWT validation then redirect |
| Role-specific dashboards | `dashboard/[role]/page.tsx` | student/lecturer/admin split |
| Overview parallel routes | `dashboard/overview/@*/` | all slots matter together |

## CONVENTIONS
- Treat route handlers here as security boundaries; auth comes from cookies, not client-supplied headers.
- Dashboard redirects validate JWTs server-side with `validateAndDecodeToken` before choosing a role route.
- The overview dashboard uses parallel routes (`@bar_stats`, `@pie_stats`, `@sales`, `@submissions`, etc.); keep slot compatibility intact.
- `api/v2/*` is the active route-handler surface. Legacy `api/auth/*` files still exist, so verify you are editing the active path.

## ANTI-PATTERNS
- Do not replace the `/api/v2/[...path]` proxy with Next rewrites.
- Do not forward arbitrary inbound `Authorization` headers; the proxy derives auth from cookies.
- Do not drop or rename overview parallel-route folders casually; layout coupling is real.
- Do not trust README references to `/api/v1` or old auth flow details without checking current code.

## NOTES
- `dashboard/page.tsx` intentionally redirects unauthenticated users to `/dashboard/overview` for client-side recovery behavior.
- The app tree still contains both active v2 handlers and older compatibility handlers; prefer the v2 tree for new work.
