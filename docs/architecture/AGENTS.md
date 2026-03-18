# ARCHITECTURE DOCS KNOWLEDGE BASE

## OVERVIEW
`docs/architecture/` is the high-level system-reference shelf: auth, system layout, database, API, and dev-environment docs live here.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Auth flow background | `authentication.md` | useful, but parts lag current v2 proxy/JWT reality |
| System model | `system-architecture.md` | broad mental model, not exact implementation |
| Dev environment | `development-environment.md` | setup/reference context |
| Data model overview | `database-design.md` | conceptual DB notes |
| API architecture | `api-specification.md` | reference only; verify real routes in code |

## CONVENTIONS
- Use these docs for mental models and terminology, not as stronger truth than current code.
- When architecture docs and code disagree, prefer `CLAUDE.md`, root `AGENTS.md`, and the live implementation.
- Keep updates focused on durable architecture concepts; feature-specific change logs belong in `docs/learnings/`.

## ANTI-PATTERNS
- Do not assume `/api/v1` references are still authoritative.
- Do not trust DRF-, Celery-, or Redis-heavy descriptions without checking whether the current repo actually uses them.
- Do not document current behavior here if it is really task-specific implementation history.

## NOTES
- `authentication.md` and `system-architecture.md` are the most likely to contain stale implementation details.
- This directory is best for orientation, not precise coding instructions.
