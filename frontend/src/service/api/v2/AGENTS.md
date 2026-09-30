# API_V2 SERVICE KNOWLEDGE BASE

## OVERVIEW
`frontend/src/service/api/v2/` is the active typed service layer for frontend ↔ backend v2 communication.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Shared HTTP client | `client.ts` | typed `api.get/post/...` with CSRF/timeout |
| Generic request wrapper | `../../request.ts` | lower-level fetch helper used by multiple services |
| Contract registry | `types.ts` | large shared TS contract hub |
| Auth/settings/rubrics CRUD | `auth.ts` | multiple services live here |
| Task services | `tasks.ts` | CRUD + advanced actions |
| Class services | `classes.ts` | CRUD + batch/invite flows |
| Dashboard services | `dashboard.ts` | role dashboard fetches |
| Rubric advanced actions | `rubrics.ts` | duplicate action service |

## CONVENTIONS
- Keep request/response shapes aligned with backend API v2 schemas.
- Use `credentials: 'include'` and CSRF-aware clients for state-changing calls.
- Normalize backend payload differences at the service boundary, not in UI components.
- Prefer adding new domain services here instead of feature-local fetch wrappers.

## SHARP EDGES
- Dual service layers exist: legacy `src/service/api/` and active `src/service/api/v2/`.
- Rubric logic is intentionally split: CRUD in `auth.ts`, advanced rubric actions in `rubrics.ts`.
- `useRubrics` still depends on legacy rubric service code; do not “clean up” that split casually.

## ANTI-PATTERNS
- Do not duplicate API contract types inside features.
- Do not bypass this layer with raw `fetch` from components unless the route file already establishes a strong server-only pattern.
- Do not break parity between backend schema changes and `types.ts` updates.

## NOTES
- `types.ts` is a hotspot and mirrors multiple backend domains in one file.
- `client.ts` and `request.ts` are the fastest places to check when auth, cookies, or error-shaping look wrong.
