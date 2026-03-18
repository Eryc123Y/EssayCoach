# API_V2 KNOWLEDGE BASE

## OVERVIEW
`backend/api_v2/` is the modular Django Ninja API layer. It is the active application surface for new backend work.

## STRUCTURE
```text
api_v2/
├── auth/         # login, JWT refresh, settings, sessions
├── core/         # classes, tasks, rubrics, submissions, dashboard, users
├── ai_feedback/  # essay analysis + chat endpoints
├── advanced/     # batch/advanced operations
├── social/       # PRD-11 stubs
├── analytics/    # PRD-12 stubs
├── users_admin/  # PRD-13 stubs
├── help/         # PRD-14 stubs
├── types/        # StrEnum + typed IDs single source of truth
├── utils/        # JWT auth + RBAC helpers
└── tests/        # top-level integration/RBAC/type/perf tests
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Router assembly | `api.py` | mounts all subrouters |
| Core CRUD routers | `core/routers/*.py` | main implemented entity endpoints |
| Auth/session/settings | `auth/views.py` | auth + settings share one file |
| Shared schemas | `core/schemas.py`, `schemas/base.py` | large schema hubs |
| RBAC helpers | `utils/permissions.py` | role/owner checks |
| JWT lifecycle | `utils/jwt_auth.py` | issue/refresh/blacklist |
| Domain enums | `types/enums.py` | all constrained string primitives |

## CONVENTIONS
- Router pattern: `router = Router(tags=[...], auth=JWTAuth())` unless a different auth boundary is intentional.
- Schema naming: `*In`, `*Out`, `*FilterParams`, response wrappers in base schemas.
- Use `response=Schema` on Ninja decorators; do not rely on strict ORM return annotations.
- Reuse `StrEnum` and typed IDs instead of inline string literals.
- RBAC belongs in router logic via `has_role(...)` / permission helpers, not in ad hoc scattered checks.

## TESTS
- Top-level tests: `api_v2/tests/` for integration, auth contract, RBAC, type kernel, performance.
- Module tests also exist under `auth/tests/` and `core/tests/`.
- JWT test pattern: issue token, attach `Bearer` header, hit router endpoint.

## ANTI-PATTERNS
- Do not add new endpoints outside v2.
- Do not invent new role/status/visibility strings without extending `types/enums.py`.
- Do not skip RBAC on write paths; this repo already hardened sensitive mutations.
- Do not assume stub modules (`social`, `analytics`, `users_admin`, `help`) have real behavior yet.

## NOTES
- `core/` is the densest implemented module; `rubrics.py` and `core/schemas.py` are major hotspots.
- `auth/views.py` mixes auth and settings/session concerns; read before adding parallel patterns.
