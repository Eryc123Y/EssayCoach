# Documentation Generation Script - Learnings

## Implementation Summary

Created `scripts/generate-docs.py` - an automated documentation generator for EssayCoach.

### Features Implemented

1. **argparse CLI Interface**
   - `--help` flag for usage information
   - `--verbose` / `-v` for debug logging
   - `--dry-run` / `-n` for preview mode

2. **Logging Configuration**
   - Default INFO level
   - DEBUG level when verbose flag is set
   - Timestamped log messages

3. **Output Directory Structure**
   - `docs/api-reference/` - API endpoint documentation
   - `docs/backend/models/` - Django model documentation

4. **Error Handling**
   - Django connection test before generation
   - Graceful error messages for connection failures
   - AttributeError handling for different field types

5. **Idempotency Check**
   - Timestamp-based comparison with source files
   - Cache file: `.doc_generator_cache.json`
   - Skips regeneration if files are current

### Key Design Decisions

1. **Django Introspection**
   - Uses in-memory SQLite for Django setup
   - Avoids requiring actual database connection
   - Safely tests Django environment before generation

2. **Field Type Handling**
   - Uses `getattr()` with defaults for optional attributes
   - Skips fields without `name` attribute (reverse relations)
   - Gracefully handles ManyToOneRel objects

3. **Cache Strategy**
   - JSON-based cache for portability
   - Records timestamp and source for each generated file
   - Skipped in dry-run mode

### Usage Examples

```bash
# Generate all documentation
python scripts/generate-docs.py

# Preview without creating files
python scripts/generate-docs.py --dry-run

# Verbose output with debug logs
python scripts/generate-docs.py --verbose

# Combined flags
python scripts/generate-docs.py --verbose --dry-run
```

### Generated Output

- `docs/api-reference/endpoints.md` - API reference with authentication and endpoint tables
- `docs/backend/models/models.md` - Model documentation with field details
- `.doc_generator_cache.json` - Idempotency cache

### Dependencies

Uses only Python standard library:
- `argparse` - CLI interface
- `logging` - Logging configuration
- `json` - Cache storage
- `pathlib` - Path handling
- `urllib` - HTTP operations (for Django connection test)
- `django` - Model introspection

### Error Handling Improvements

Fixed initial issue with `ManyToOneRel` objects not having `blank` attribute:
- Added `hasattr()` checks for field attributes
- Used `getattr(field, 'attr', 'N/A')` pattern for optional attributes
- Prevents AttributeError during field iteration

### Future Enhancements

Potential improvements noted:
- Add support for serializer documentation
- Include viewset documentation
- Add custom field type descriptions
- Support for multiple output formats (JSON, YAML)

---

## Enhancement: Real Backend Integration (2026-01-28)

Updated `scripts/generate-docs.py` to extract from the real Django backend instead of template data.

### Changes Made

1. **OpenAPI Schema Fetching**
   - Added `_generate_api_documentation()` to fetch from `http://127.0.0.1:8000/api/schema/`
   - Uses urllib to make HTTP request with proper headers
   - Falls back to template documentation when backend is unavailable
   - Parses OpenAPI JSON schema and groups endpoints by tag

2. **Real Django Model Loading**
   - Updated `_setup_django()` to use real backend apps:
     - `core` (EssayCoach models)
     - `auth` (authentication models)
     - `analytics` (analytics models)
     - `ai_feedback` (AI feedback models)
   - Added backend path to Python sys.path for proper imports
   - Now discovers 16 models total (12 EssayCoach + 4 Django built-ins)

3. **Updated Idempotency Sources**
   - Changed source files from `backend/api/models.py` to `backend/core/views.py`
   - Reflects actual API view changes

### Real Models Discovered

EssayCoach core models (12):
1. Class
2. Enrollment
3. Feedback
4. FeedbackItem
5. MarkingRubric
6. RubricItem
7. RubricLevelDesc
8. Submission
9. Task
10. TeachingAssn
11. Unit
12. User

Django built-in models (4):
- ContentType
- Permission
- Group
- User

### API Documentation Features

When backend is running:
- Fetches OpenAPI schema from drf-spectacular endpoint
- Groups endpoints by tag (Authentication, Users, Units, Classes, Tasks, Rubrics, Submissions, Feedback, Analytics)
- Displays endpoints sorted by path and method
- Shows summary from OpenAPI operation description

When backend is unavailable:
- Falls back to template documentation with basic endpoints
- Logs warning about connection failure
- Continues without error

### Verification Results

```bash
$ python scripts/generate-docs.py --verbose
DEBUG: Successfully connected to Django. Found 16 models.
INFO: Model documentation is current: docs/backend/models/models.md
DEBUG: Fetching OpenAPI schema from http://127.0.0.1:8000/api/schema/
WARNING: Could not fetch OpenAPI schema from backend: Connection refused
INFO: Using template API documentation
INFO: Documentation generation completed.
```