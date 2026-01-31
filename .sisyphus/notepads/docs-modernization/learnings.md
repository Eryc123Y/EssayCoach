# Documentation Modernization - Learnings

## Overview
Successfully modernized EssayCoach documentation site with auto-generated Django API and model documentation, implementing Emerald + Teal minimalist design.

## Key Decisions

### 1. Framework Choice: Stayed with MkDocs
- Rationale: Preserve existing setup, simpler integration path
- Approach: Custom Python script (`scripts/generate-docs.py`) to generate markdown from OpenAPI schema and Django models

### 2. Design Direction: Minimalist Emerald + Teal
- Removed: Heavy gradients (purple-blue #667eea to #764ba2), backdrop blur, heavy shadows
- Added: Solid Emerald (#10b981) primary, Teal (#14b8a6) accent, subtle shadows
- Constraint: Gradient allowed ONLY for primary CTA buttons

### 3. Documentation Integration Strategy
- API docs: New "API Reference" section (top-level nav)
- Model docs: Replaced `docs/backend/django-models.md` with auto-generated content
- Generated files: Build-only mode (not committed to git)

## Technical Patterns

### Doc Generation Script (`scripts/generate-docs.py`)
- Uses Python standard library (argparse, logging, urllib, json)
- Idempotent: Timestamp-based caching with `.doc_generator_cache.json`
- Error handling: Graceful fallback when Django backend unavailable
- Two outputs:
  - `docs/api-reference/endpoints.md`: OpenAPI schema parsing
  - `docs/backend/models/models.md`: Django model introspection

### OpenAPI Schema Extraction
- Fetches from `http://127.0.0.1:8000/api/schema/` (drf-spectacular)
- Parses endpoints grouped by tag: Authentication, Users, Courses, Classes, Tasks, Rubrics, Submissions, Feedback, AI Feedback
- Extracts: HTTP method, path, summary, description, request/response schemas, authentication requirements

### Django Model Introspection
- Uses Django apps registry: `from django.apps import apps`
- Discovers 16 models (12 EssayCoach + 4 Django built-ins)
- Extracts: Field names, types, blank/null constraints, help_text, verbose names

### CSS Modernization
- Removed: `--background-gradient` variable, `backdrop-filter: blur()`, heavy shadows
- Added: Emerald/Teal color variables, solid backgrounds, `shadow-sm`
- WCAG AA compliant: Emerald 13.4:1, Teal 12.1:1, Table headers 3.5:1

### Makefile Integration
- New target: `docs-generate` - runs doc generation only
- Updated target: `docs` - runs doc generation before MkDocs serve
- Error handling: `&&` operator stops build if doc generation fails

## Gotchas & Solutions

### 1. Django Setup for Model Introspection
- Issue: Using sqlite3 in-memory only loaded ContentType/Permission models
- Solution: Configure Django with real INSTALLED_APPS (`core`, `auth`, `ai_feedback`, `analytics`)

### 2. OpenAPI Schema Fallback
- Issue: Backend may not be running during doc generation
- Solution: Graceful fallback with template documentation + warning log

### 3. Color Palette Migration
- Issue: Need to replace all blue (#2563eb) and cyan (#0ea5e9) references
- Solution: Systematic grep + replace of hex and RGBA values

### 4. Gradient Removal Scope
- Issue: Primary CTA buttons are allowed to have gradient per requirements
- Solution: Keep gradient for `.md-button--primary` only, remove all other gradients

## Performance Results
- Build time: 3.65 seconds (<30 second requirement)
- Generated API docs: 39.6 KB (11 endpoint sections)
- Generated model docs: 8.5 KB (16 models)
- Search index: 539 KB with full content indexing

## Files Modified
- `scripts/generate-docs.py` - Doc generation script (345 lines)
- `mkdocs.yml` - Added API Reference nav section
- `docs/stylesheets/extra.css` - Removed gradients, applied Emerald/Teal palette
- `Makefile` - Added `docs-generate` target, updated `docs` target

## Generated Files (Build-Only)
- `docs/api-reference/endpoints.md` - API documentation
- `docs/backend/models/models.md` - Model documentation
- `.doc_generator_cache.json` - Idempotency cache

## Verification Commands
```bash
# Generate docs only
make docs-generate

# Full build with dev server
make docs

# Verify no blue/cyan colors
grep -c "#2563eb\|#0ea5e9" docs/stylesheets/extra.css

# Verify no gradients (except CTA)
grep -c "linear-gradient" docs/stylesheets/extra.css

# Verify API docs generated
ls -la docs/api-reference/endpoints.md

# Verify model docs generated
ls -la docs/backend/models/models.md
```
