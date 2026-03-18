# CORE KNOWLEDGE BASE

## OVERVIEW
`backend/core/` is the centralized ORM and shared business-logic layer. Models stay consolidated here, and dashboard/task/class/rubric behaviors fan out from this directory.

## STRUCTURE
```text
core/
├── models.py                    # central ORM model file
├── services.py                  # shared aggregation/business logic
├── rubric_manager.py            # rubric helper logic
├── management/commands/seed_db.py # local test-account bootstrap
└── migrations/                  # schema history
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| User/class/task/rubric schema | `models.py` | most domain entities live in one file |
| Dashboard aggregation | `services.py` | `DashboardService` is the hotspot |
| Seed accounts / starter data | `management/commands/seed_db.py` | admin/lecturer/student bootstrap |
| Rubric helper behavior | `rubric_manager.py` | narrower helper module |
| Behavioral verification | `../api_v2/core/tests/` | API-facing tests validate many core rules |

## CONVENTIONS
- Keep model-level constraints and indexes in `Meta`; this repo encodes a lot of integrity rules there.
- `Class.save()` normalizes/generates join codes; preserve that behavior when touching class creation paths.
- Shared aggregation belongs in `services.py`, not in routers.
- Database naming is legacy/explicit (`user_id_user`, `class_id_class`, etc.); match existing field names instead of “cleaning” them ad hoc.

## ANTI-PATTERNS
- Do not split `models.py` into many files unless the repo commits to a broader migration.
- Do not bypass model constraints with loose write-path assumptions in API code.
- Do not duplicate constrained role/status/visibility strings when `api_v2/types/enums.py` already owns them.
- Do not edit old migrations to change current behavior.

## NOTES
- `services.py` is large because dashboard and cross-entity logic are centralized there.
- `seed_db.py` is the fastest way to confirm expected test users and starter unit/class data.
