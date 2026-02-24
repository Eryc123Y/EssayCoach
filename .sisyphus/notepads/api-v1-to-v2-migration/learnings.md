- 2026-02-13: In `backend/api_v2/`, all `from api_v1.core.models import ...` imports were migrated to `from core.models import ...`.
- 2026-02-13: All `from api_v1.ai_feedback...` imports in `api_v2` were migrated to `from ai_feedback...`.
- 2026-02-13: `backend/core/__init__.py` must not import models at module import time; replacing exports with `default_app_config = "core.apps.CoreConfig"` avoids `AppRegistryNotReady` during app bootstrap.

## Migration Verification (2026-02-13)

### Test Results
- All 44 tests passing after core app migration fix
- Categories passed: Integration (6), Ninja API (16), Performance (7), Schema (15)
- Django check: PASS (no issues)

### Key Finding: Core App Missing Migrations
**Problem**: Tests failed with `ProgrammingError: relation "auth_group" does not exist`  
**Root Cause**: Core app had no migrations, Django treated it as unmigrated, deferred SQL referenced non-existent auth tables  
**Solution**: `uv run python manage.py makemigrations core` creates proper migration with correct dependency ordering

**Lesson**: Every Django app must have migrations, even simple ones. Unmigrated apps can cause issues with test database setup due to deferred SQL execution order.

### Migration Dependencies Applied Successfully
- Django core: auth, contenttypes, sessions, admin, authtoken
- Custom: core.0001_initial (User, Class, Feedback, MarkingRubric, Unit, Task, Submission, Enrollment with constraints)
