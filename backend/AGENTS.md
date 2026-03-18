# BACKEND KNOWLEDGE BASE

## OVERVIEW
`backend/` contains the Django project, core ORM layer, API v2 modules, and AI integration code.

## STRUCTURE
```text
backend/
├── core/         # models + shared business services
├── api_v2/       # Django Ninja API v2
├── ai_feedback/  # provider-facing AI integration layer
├── essay_coach/  # settings, urls, ASGI/WSGI
└── manage.py     # Django entry point
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Settings / URLs | `essay_coach/` | project config root |
| Models / services | `core/AGENTS.md` | centralized ORM + service guidance |
| v2 endpoints | `api_v2/AGENTS.md` | router/schema/RBAC guidance |
| AI provider logic | `ai_feedback/AGENTS.md` | Dify now, agent migration next |
| Seed data | `core/management/commands/seed_db.py` | test accounts |

## LOCAL CONVENTIONS
- Run backend commands from `backend/` with `uv run ...` or `.venv/bin/...`.
- Backend env comes from repo-root `.env`, not `backend/.env`.
- Prefer documenting API behavior through Ninja response schemas rather than strict ORM return hints.
- `core/models.py` is intentionally centralized; do not assume one-model-per-file.
- `core/services.py` is the shared business-logic layer; route handlers should stay thin when possible.

## ANTI-PATTERNS
- Do not add new API v1 code.
- Do not duplicate enum literals across models/schemas when `api_v2/types/enums.py` already owns them.
- Do not start backend work without PostgreSQL running (`make db`).

## COMMANDS
```bash
cd backend && uv run python manage.py runserver 127.0.0.1:8000
cd backend && uv run pytest api_v2/ -v
cd backend && uv run pyright .
cd backend && uv run ruff check .
```

## NOTES
- Backend CI also runs migrations before tests; broken migrations are repo-blocking.
- Read `backend/api_v2/AGENTS.md` before touching endpoint modules.
- Read `backend/core/AGENTS.md` before changing shared models or service logic.
