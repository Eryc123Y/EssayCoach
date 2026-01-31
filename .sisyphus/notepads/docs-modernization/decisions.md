# Documentation Modernization - Architectural Decisions

## 1. Build-Only Mode for Generated Files

**Decision**: Generated markdown files are NOT committed to git

**Rationale**:
- Keeps repository clean (no generated content in version control)
- Reduces git noise from automatic updates
- Idempotent generation ensures consistency on every build
- Generated files can be regenerated from source at any time

**Trade-offs**:
- Loss: Cannot review generated docs in PRs
- Gain: Cleaner diffs, smaller repository, always fresh content

## 2. Idempotent Doc Generation

**Decision**: Script uses timestamp-based caching to skip regeneration if files are current

**Implementation**:
- `.doc_generator_cache.json` tracks last generation time
- Compares source file modification times (models.py, views.py, settings.py)
- Skips regeneration if output is newer than all sources

**Rationale**:
- Faster incremental builds
- Prevents unnecessary file writes
- Safe to run `make docs` multiple times

## 3. Graceful Fallback for API Documentation

**Decision**: When Django backend unavailable, use template API documentation

**Implementation**:
- Try to fetch from `http://127.0.0.1:8000/api/schema/` (10s timeout)
- On failure, log warning and use template with all expected endpoints
- Template covers: Authentication, Users, Courses, Tasks, Rubrics, Submissions, Feedback, AI Feedback

**Rationale**:
- Allows doc generation without running backend
- Template is still useful for development
- Clear log message indicates fallback mode

## 4. Single Color Palette Source

**Decision**: All colors defined as CSS variables in `extra.css`

**Implementation**:
```css
:root {
  --primary-color: #10b981;      /* Emerald 500 */
  --secondary-color: #059669;    /* Emerald 600 */
  --accent-color: #14b8a6;       /* Teal 500 */
}
```

**Rationale**:
- Single source of truth for colors
- Easy to adjust palette globally
- Consistent application across all elements
- Clear documentation at top of file

## 5. Minimal CSS Overrides

**Decision**: Only override Material theme where necessary, keep defaults otherwise

**Implementation**:
- Removed: Gradients, backdrop blur, heavy shadows
- Added: Color palette, solid backgrounds, subtle shadows
- Preserved: Navigation structure, search, code highlighting, responsive layout

**Rationale**:
- Reduces maintenance burden
- Benefits from Material theme updates
- Minimal changes = fewer regressions
