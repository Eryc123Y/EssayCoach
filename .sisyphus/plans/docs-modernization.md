# Documentation Site Modernization & Django API Integration

## TL;DR

> **Quick Summary**: Modernize MkDocs documentation site with auto-generated Django API and model documentation, removing "AI taste" gradients and implementing Emerald + Teal minimalist design.
>
> **Deliverables**:
> - Custom Python script to generate API docs from OpenAPI schema
> - Auto-generated model documentation from Django admin configuration
> - Updated MkDocs configuration with new "API Reference" section
> - Modernized CSS with Emerald + Teal color palette (no gradients)
> - Updated Makefile to run doc generation during builds
>
> **Estimated Effort**: Medium
> **Parallel Execution**: NO - Sequential tasks
> **Critical Path**: Doc generation script → MkDocs integration → CSS modernization → Build automation

---

## Context

### Original Request
User wants to optimize the documentation site to make it more modern, with:
1. Automatic Django API documentation generation during `make docs` build
2. Integration of API docs into static documentation site
3. Automatic update of Django admin panel data models in documentation during build
4. More modern appearance (avoid generic "AI taste" - AI味道太重)

### Interview Summary

**Key Discussions**:
- **Framework Choice**: Stay with MkDocs (not migrate to Docusaurus)
  - Rationale: Preserve existing setup, simpler integration path
  - Approach: Custom Python script or drf-to-mkdoc to generate markdown

- **Design Direction**: Remove "AI taste" (AI味道太重)
  - User identified: Too many gradients (purple-blue #667eea to #764ba2)
  - Solution: Use solid colors or subtle tints (<5%)
  - New palette: Emerald (#10b981) + Teal (#14b8a6)

- **Documentation Depth**: Full model specification
  - Include: Fields, types, descriptions, relationships, constraints, indexes
  - Include: Django admin configuration

- **Integration Strategy**:
  - API docs: Create new top-level section "API Reference" in mkdocs.yml
  - Model docs: Replace existing `docs/backend/django-models.md`
  - Generated files: Build-only (not committed to git, cleaner repo)

**Research Findings**:
- **drf-spectacular** (v0.27.x) already installed and configured in backend
- OpenAPI schema endpoint: http://127.0.0.1:8000/api/schema/
- Django apps: core (12 models), auth, ai_feedback, analytics
- 19+ API endpoints across `/api/v1/`, `/api/v1/auth/`, `/api/v1/ai-feedback/`
- Current MkDocs Material theme with heavy gradient usage in extra.css

### Metis Review

**Identified Gaps** (addressed in this plan):
- **Color Palette Clarification**: Specified Emerald + Teal (resolved via user question)
- **Generated Doc Handling**: Build-only mode (no git commits - resolved via user question)
- **Aesthetic Direction**: Minimalist design (resolved via user question)
- **Guardrails Added**: Explicit scope boundaries to prevent scope creep

**Guardrails Applied**:
- NO migration to Docusaurus (must stay with MkDocs)
- NO new content creation beyond auto-generated docs
- NO interactive API testing UI (Swagger UI, Postman features)
- NO authentication-protected documentation sections
- NO gradient backgrounds (except optional CTA buttons)
- NO blue (#2563eb) or cyan (#0ea5e9) primary colors

---

## Work Objectives

### Core Objective
Modernize MkDocs documentation site with automated Django API and model documentation generation, implementing minimalist Emerald + Teal design to replace "AI taste" gradients.

### Concrete Deliverables
- Python doc generation script (`scripts/generate-docs.py`)
- Auto-generated API documentation markdown files (`docs/api-reference/`)
- Auto-generated model documentation (`docs/backend/django-models.md`)
- Updated MkDocs configuration (`mkdocs.yml`)
- Modernized CSS (`docs/stylesheets/extra.css`)
- Updated Makefile with doc generation pre-hook

### Definition of Done
- [x] `make docs` generates all API and model documentation automatically
- [x] Generated API docs include endpoints, schemas, authentication, examples
- [x] Generated model docs include fields, relationships, constraints, admin config
- [x] MkDocs site builds successfully with no gradient backgrounds
- [x] New Emerald + Teal color palette applied consistently
- [x] Build fails if doc generation errors occur

### Must Have
- Custom Python script for doc generation (idempotent, handles errors)
- API docs as new MkDocs nav section "API Reference"
- Full model specs replacing existing django-models.md
- CSS gradient removal (solid colors/subtle tints)
- Emerald (#10b981) primary + Teal (#14b8a6) accent colors
- Makefile integration (doc generation before mkdocs serve)

### Must NOT Have (Guardrails)
- NO migration to Docusaurus or other frameworks
- NO gradient backgrounds on banners/headers
- NO blue (#2563eb) or cyan (#0ea5e9) as primary colors
- NO heavy glassmorphism or backdrop-blur effects
- NO rainbow color belts or pulsing animated elements
- NO modification of Django models or API code
- NO interactive API testing UI (just static markdown docs)
- NO generated markdown files committed to git (build-only mode)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (MkDocs with Material theme)
- **User wants tests**: NO (Manual verification during development)
- **Framework**: Manual QA procedures

### Manual QA Procedures

**For Python Doc Generation Script**:
- [x] Verify script runs standalone: `python scripts/generate-docs.py`
- [x] Verify idempotence: Run script twice, outputs are identical
- [x] Verify error handling: Stop Django server during generation, show clear errors
- [x] Verify OpenAPI extraction: Fetch schema from http://127.0.0.1:8000/api/schema/
- [x] Verify model introspection: Extract Django models from core app

**For MkDocs Integration**:
- [x] Verify mkdocs serve works: `make docs`
- [x] Verify "API Reference" section appears in navigation
- [x] Verify API docs render correctly: Check markdown syntax and tables
- [x] Verify model docs render: Check field tables and relationship links
- [x] Verify existing nav structure unchanged: All original sections present

**For CSS Modernization**:
- [x] Verify gradient removal: No `linear-gradient` in banners/sections
- [x] Verify new colors: Emerald/Teal present (use browser dev tools)
- [x] Verify dark mode contrast: Check text readability on slate backgrounds
- [x] Verify responsive design: Test on mobile (375px width)
- [x] Verify no heavy effects: No backdrop-blur-xl or excessive shadows

**For Build Automation**:
- [x] Verify Makefile integration: `make docs` runs doc generation first
- [x] Verify build failure handling: Stop mkdocs build if doc generation fails
- [x] Verify rebuild consistency: Running twice produces identical output

**Evidence Required**:
- [x] Screenshots of before/after design changes
- [x] Terminal output from doc generation script (run once)
- [x] MkDocs build successful message
- [x] API docs screenshot (showing new Emerald + Teal theme)

---

## Execution Strategy

### Sequential Execution Flow

Tasks are inherently sequential due to dependencies:

```
Phase 1: Doc Generation Script Development
├── Task 1: Create Python doc generation skeleton
└── Task 2: Implement OpenAPI schema extraction

Phase 2: Model Documentation Generation
├── Task 3: Implement Django model introspection
└── Task 4: Generate model markdown files

Phase 3: MkDocs Integration
├── Task 5: Update mkdocs.yml navigation
└── Task 6: Test API docs rendering

Phase 4: CSS Modernization
├── Task 7: Remove gradient backgrounds
├── Task 8: Apply Emerald + Teal palette
└── Task 9: Validate dark mode contrast

Phase 5: Build Automation
├── Task 10: Update Makefile
└── Task 11: Full integration test

Critical Path: All tasks sequential (no parallelization possible)
Estimated Total Time: 10-12 hours
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|-------|-------------|--------|----------------------|
| 1 | None | 2 | None |
| 2 | 1 | 3 | None |
| 3 | 2 | 4 | None |
| 4 | 3 | 5 | None |
| 5 | 4 | 6 | None |
| 6 | 5 | 7 | None |
| 7 | None | 8 | None |
| 8 | 7 | 9 | None |
| 9 | 8 | 10 | None |
| 10 | 9 | 11 | None |
| 11 | 10 | None | None (final integration test) |

### Agent Dispatch Summary

| Phase | Tasks | Recommended Agents |
|--------|--------|-------------------|
| 1 | 1, 2 | delegate_task(category="writing", load_skills=["git-master"]) |
| 2 | 3, 4 | delegate_task(category="writing", load_skills=["git-master"]) |
| 3 | 5, 6 | delegate_task(category="unspecified-low", load_skills=["git-master"]) |
| 4 | 7, 8, 9 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"]) |
| 5 | 10, 11 | delegate_task(category="unspecified-low", load_skills=["git-master"]) |

---

## TODOs

> Implementation = ONE Task. Every task MUST have: Recommended Agent Profile + Parallelization info.

- [x] 1. Create doc generation script skeleton

  **What to do**:
  - Create `scripts/generate-docs.py` with argparse CLI interface
  - Add logging setup for verbose/dry-run modes
  - Define output directory structure (`docs/api-reference/`, `docs/backend/`)
  - Add error handling for Django connection failures
  - Add idempotency check (timestamp comparison for dirty detection)

  **Must NOT do**:
  - Modify any Django model or API code
  - Create interactive UI or testing interfaces
  - Commit generated files to git (build-only mode)

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: Python script creation with standard library usage, simple file I/O
  - **Skills**: [`git-master`]
    - `git-master`: For referencing existing Makefile patterns and project structure
  - **Skills Evaluated but Omitted**:
    - No specialized skills needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `Makefile:144-147` - docs command implementation (`./.venv/bin/mkdocs serve`)
  - `scripts/` directory structure (if exists) - Follow existing script patterns

  **API/Type References** (contracts to implement against):
  - http://127.0.0.1:8000/api/schema/ - OpenAPI schema endpoint to fetch
  - Python argparse docs: https://docs.python.org/3/library/argparse.html
  - Python requests library: https://requests.readthedocs.io/ - For fetching OpenAPI schema

  **Documentation References** (specs and requirements):
  - MkDocs documentation: https://www.mkdocs.org/ - Markdown format requirements
  - OpenAPI 3.0 specification: https://swagger.io/specification/ - Schema structure

  **External References** (libraries and frameworks):
  - drf-spectacular docs: https://drf-spectacular.readthedocs.io/ - Understanding OpenAPI schema from Django

  **WHY Each Reference Matters** (explain the relevance):
  - `Makefile`: Shows how to integrate doc generation into existing build command
  - `http://127.0.0.1:8000/api/schema/`: Source of truth for API documentation
  - `Python argparse`: Best practice for CLI scripts with subcommands
  - `MkDocs documentation`: Ensures generated markdown is compatible with build system
  - `OpenAPI 3.0 spec`: Schema structure we're parsing and converting to markdown
  - `drf-spectacular docs`: Understanding Django-specific OpenAPI extensions

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For Script Development*:
  - [x] Verify script exists: `ls -la scripts/generate-docs.py`
  - [x] Verify script is executable: `python scripts/generate-docs.py --help`
  - [x] Verify CLI interface: `python scripts/generate-docs.py --help` shows usage
  - [x] Verify logging works: `python scripts/generate-docs.py --verbose` shows log output

  **Evidence Required**:
  - [x] Script help output captured (copy-paste terminal output)
  - [x] Script file exists confirmation

  **Commit**: NO

- [x] 2. Implement OpenAPI schema extraction

  **What to do**:
  - Fetch OpenAPI schema from Django backend (http://127.0.0.1:8000/api/schema/)
  - Parse JSON/YAML schema format (drf-spectacular can return either)
  - Extract endpoints grouped by tag (Authentication, Users, Courses, Rubrics, Tasks, Submissions, Feedback)
  - For each endpoint, extract: HTTP method, path, summary, description, request schema, response schema, authentication requirements, error codes
  - Convert to MkDocs-compatible markdown format
  - Generate table of contents for each endpoint group

  **Must NOT do**:
  - Create interactive Swagger UI or testing interface
  - Modify Django backend schema or endpoints
  - Add non-standard OpenAPI extensions

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `writing`
    - Reason: Complex string manipulation and data transformation from OpenAPI spec
  - **Skills**: [`git-master`]
    - `git-master`: For referencing existing API docs patterns in codebase

  - **Skills Evaluated but Omitted**:
    - No specialized data processing skills needed (standard Python JSON/YAML parsing)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `backend/essay_coach/settings.py:111-158` - SPECTACULAR_SETTINGS configuration
  - `backend/essay_coach/urls.py` - API schema endpoint route
  - `docs/API_ENDPOINTS.md` - Existing API documentation format (follow structure)
  - `mkdocs.yml:64-96` - Navigation structure pattern (nav section format)

  **API/Type References** (contracts to implement against):
  - OpenAPI 3.0 Schema structure: paths, components, tags, securitySchemes
  - MkDocs markdown syntax: Tables, code blocks, headings, admonitions

  **Documentation References** (specs and requirements):
  - `docs/API_ENDPOINTS.md` - Reference for existing API documentation style
  - drf-spectacular schema format: https://drf-spectacular.readthedocs.io/en/latest/settings.html

  **External References** (libraries and frameworks):
  - OpenAPI specification: https://swagger.io/specification/
  - Python json library: https://docs.python.org/3/library/json.html

  **WHY Each Reference Matters** (explain the relevance):
  - `settings.py`: Shows drf-spectacular configuration that defines schema structure
  - `urls.py`: Confirms API schema endpoint location
  - `API_ENDPOINTS.md`: Ensures generated docs match existing documentation style
  - `mkdocs.yml`: Shows how to add new nav sections without breaking existing structure

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For Schema Extraction*:
  - [x] Verify schema fetch: `curl -s http://127.0.0.1:8000/api/schema/ | jq .info.title`
  - [x] Verify endpoint count: `curl -s http://127.0.0.1:8000/api/schema/ | jq '.paths | keys | length'` matches expected (19+)
  - [x] Verify JSON/YAML format: Check schema file is valid JSON/YAML
  - [x] Verify tag groups: Schema has tags: Authentication, Users, Courses, etc.

  **Evidence Required**:
  - [x] Schema endpoint curl output captured
  - [x] Generated markdown files sample (show first few lines)
  - [x] Endpoint count verification output

  **Commit**: NO

- [x] 3. Implement Django model introspection

  **What to do**:
  - Use Django apps registry to discover all models: `from django.apps import apps`
  - Iterate through installed apps (core, auth, ai_feedback, analytics)
  - Extract model metadata: Model class name, docstring, field names, types, help_text
  - Extract field constraints: max_length, null, blank, choices, unique, default
  - Extract relationships: ForeignKey, ManyToMany, OneToOne, related_name
  - Extract admin configuration: list_display, list_filter, search_fields, readonly_fields, inline admin classes
  - Generate markdown tables for each model (field name, type, description, constraints)

  **Must NOT do**:
  - Modify Django models or add new fields
  - Create database migrations
  - Change admin configurations

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: Django model introspection using standard Django APIs (apps.get_models, Model._meta)
  - **Skills**: [`git-master`]
    - `git-master`: For referencing existing Django app structure and admin.py files

  - **Skills Evaluated but Omitted**:
    - No specialized Django skills needed (standard library usage)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `backend/core/models.py` - All 12 Django models (User, Unit, Class, etc.)
  - `backend/core/admin.py:12-177` - Admin configuration for all models
  - `backend/essay_coach/settings.py:24-38` - INSTALLED_APPS configuration
  - `docs/backend/django-models.md` - Existing model documentation format (to replace)

  **API/Type References** (contracts to implement against):
  - Django Model._meta API: https://docs.djangoproject.com/en/stable/ref/models/meta/
  - Django apps.get_models(): https://docs.djangoproject.com/en/stable/ref/applications/

  **Documentation References** (specs and requirements):
  - Django model fields documentation: https://docs.djangoproject.com/en/stable/ref/models/fields/

  **External References** (libraries and frameworks):
  - None (standard Django library usage only)

  **WHY Each Reference Matters** (explain the relevance):
  - `core/models.py`: Source of truth for all Django models to document
  - `core/admin.py`: Shows admin configuration patterns to extract
  - `settings.py`: Shows which apps are installed and should be documented
  - `django-models.md`: Ensures new model docs match existing documentation style

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For Model Introspection*:
  - [x] Verify model count: Script discovers 12 core models
  - [x] Verify field extraction: Each model shows correct field types and constraints
  - [x] Verify admin extraction: Admin config (list_display, filters) included
  - [x] Verify output format: Markdown tables match existing style

  **Evidence Required**:
  - [x] Generated model docs sample (show first model's field table)
  - [x] Model count verification output
  - [x] Field extraction confirmation

  **Commit**: NO

- [x] 4. Generate model markdown files

  **What to do**:
  - For each discovered model, generate markdown file: `docs/backend/models/{model_name}.md`
  - Replace existing `docs/backend/django-models.md` with consolidated model index
  - Create table of contents linking to individual model files
  - Format: Model docstring → heading, fields → markdown table, relationships → text list, admin config → code block
  - Handle models with 20+ fields: Truncate display, keep full in dedicated file

  **Must NOT do**:
  - Create new Django models or modify existing ones
  - Generate HTML or interactive docs (markdown only)
  - Add model-specific guides beyond field documentation

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `writing`
    - Reason: Markdown generation with table formatting and internal linking
  - **Skills**: [`git-master`]
    - `git-master`: For referencing existing documentation markdown patterns

  - **Skills Evaluated but Omitted**:
    - No specialized documentation skills needed (standard markdown formatting)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 5
  - **Blocked By**: Task 3

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `docs/backend/django-models.md` - Existing model documentation structure
  - `docs/architecture/database-design.md` - Database documentation patterns
  - `mkdocs.yml:64-96` - Nav section format for adding Backend section

  **API/Type References** (contracts to implement against):
  - MkDocs table syntax: https://www.mkdocs.org/user-guide/writing-your-docs/#data-tables

  **Documentation References** (specs and requirements):
  - None (markdown formatting)

  **External References** (libraries and frameworks):
  - None (standard markdown formatting)

  **WHY Each Reference Matters** (explain the relevance):
  - `django-models.md`: Shows expected output format for model documentation
  - `database-design.md`: Reference for database terminology consistency
  - `mkdocs.yml`: Shows nav section structure to follow

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For Markdown Generation*:
  - [x] Verify index file created: `ls docs/backend/django-models.md`
  - [x] Verify model files created: `ls docs/backend/models/` shows 12+ files
  - [x] Verify markdown syntax: `mkdocs build --clean` succeeds
  - [x] Verify internal links: Click links navigate correctly between model docs
  - [x] Verify table rendering: Tables display correctly in rendered HTML

  **Evidence Required**:
  - [x] Generated files listing
  - [x] MkDocs build successful message
  - [x] Screenshot of rendered model docs (showing tables and links)

  **Commit**: NO

- [x] 5. Update mkdocs.yml navigation

  **What to do**:
  - Add "API Reference" section to `nav` in mkdocs.yml
  - Add subsections: "REST API" (endpoints) and "Database Models" (models)
  - Link to generated API docs: `api-reference/` directory
  - Link to model docs: `backend/django-models.md`
  - Maintain existing nav structure (all other sections unchanged)
  - Place new section after "Backend Deep Dive" section

  **Must NOT do**:
  - Remove or rename existing nav sections
  - Change order of unrelated sections
  - Break existing sidebar hierarchy

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: YAML configuration file update, following existing patterns
  - **Skills**: [`git-master`]
    - `git-master`: For understanding existing MkDocs configuration structure

  - **Skills Evaluated but Omitted**:
    - No specialized MkDocs skills needed (YAML syntax is straightforward)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 6
  - **Blocked By**: Task 4

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `mkdocs.yml:64-108` - Current nav structure (Architecture & Design, Backend Deep Dive, etc.)
  - `mkdocs.yml:12` - Site name and repo URL configuration

  **API/Type References** (contracts to implement against):
  - MkDocs nav configuration: https://www.mkdocs.org/user-guide/configuration/#navigation

  **Documentation References** (specs and requirements):
  - MkDocs documentation: https://www.mkdocs.org/

  **External References** (libraries and frameworks):
  - None (YAML configuration)

  **WHY Each Reference Matters** (explain the relevance):
  - `mkdocs.yml`: Shows current nav structure to understand insertion point
  - Line 64: Shows where Backend Deep Dive section is placed
  - MkDocs docs: Ensures YAML syntax and nav structure follow best practices

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For MkDocs Configuration*:
  - [x] Verify YAML syntax: `mkdocs build --clean` succeeds
  - [x] Verify new section appears: "API Reference" shows in nav
  - [x] Verify links work: Click API Reference nav items go to correct pages
  - [x] Verify existing nav unchanged: All original sections present and ordered correctly

  **Evidence Required**:
  - [x] mkdocs.yml diff showing new section
  - [x] Screenshot of updated navigation (showing API Reference section)
  - [x] MkDocs build successful message

  **Commit**: NO

- [x] 6. Test API docs rendering

  **What to do**:
  - Run `make docs` to start MkDocs dev server
  - Navigate to API Reference section
  - Verify REST API markdown renders correctly (tables, code blocks, badges)
  - Verify all endpoint links are clickable
  - Check mobile responsiveness (375px width)
  - Verify search indexes generated pages
  - Test dark mode toggle (API docs should respect theme)

  **Must NOT do**:
  - Modify generated markdown files (verify only)
  - Add new interactive features beyond static markdown
  - Change API endpoint functionality

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: Manual verification of static site rendering and navigation
  - **Skills**: [`git-master`]
    - `git-master`: For referencing existing MkDocs build patterns

  - **Skills Evaluated but Omitted**:
    - No browser automation skills needed (manual testing)

  - **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 7
  - **Blocked By**: Task 5

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `mkdocs.yml:144-151` - Markdown extensions configuration (pymdownx.superfences, tables)
  - `docs/stylesheets/extra.css` - Existing CSS for code blocks and tables
  - `docs/javascripts/extra.js` - Search and navigation enhancements

  **API/Type References** (contracts to implement against):
  - MkDocs Material theme docs: https://squidfunk.github.io/mkdocs-material/

  **Documentation References** (specs and requirements):
  - None (verification testing)

  **External References** (libraries and frameworks):
  - None (static site testing)

  **WHY Each Reference Matters** (explain the relevance):
  - `mkdocs.yml`: Shows markdown extensions enabled (tables, code blocks, admonitions)
  - `extra.css`: Shows existing CSS patterns for tables and code blocks
  - `extra.js`: Shows search and navigation features to test
  - Material theme docs: Ensures generated markdown works with Material theme

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For Rendering Testing*:
  - [x] Verify API docs accessible: Navigate to `http://localhost:8000/api-reference/`
  - [x] Verify tables render correctly: Field tables show headers, borders, stripes
  - [x] Verify code blocks render correctly: Syntax highlighting applied to JSON examples
  - [x] Verify badges render correctly: Auth, deprecated, etc. tags display
  - [x] Verify mobile layout: Tables scroll horizontally, no overflow
  - [x] Verify dark mode: Code blocks and tables readable on slate background
  - [x] Verify search: "POST /api/v1/auth/login/" appears in search results

  **Evidence Required**:
  - [x] Screenshot of API docs page (showing Emerald + Teal colors)
  - [x] Screenshot of code block (showing syntax highlighting)
  - [x] Screenshot of mobile view (showing responsive table)
  - [x] Search result screenshot (showing API docs indexed)

  **Commit**: NO

- [x] 7. Remove gradient backgrounds from CSS

  **What to do**:
  - Remove `--background-gradient` CSS variable and all gradient background usages
  - Remove gradient from: `.md-header`, `.md-footer`, `.md-content`, `.md-typeset h1::after`
  - Replace gradient backgrounds with solid colors: `bg-slate-50 dark:bg-slate-900/50`
  - Keep gradient ONLY for primary CTA buttons (if any exist)
  - Remove backdrop-filter: blur() from header and content
  - Simplify box-shadows: Use `shadow-sm` instead of `shadow-xl`, `hover-shadow`

  **Must NOT do**:
  - Add new CSS frameworks (Tailwind, Bootstrap, etc.)
  - Change Material theme structure (colors, layout, navigation)
  - Add new animations or motion effects

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `visual-engineering`
    - Reason: CSS modernization with color palette changes and design cleanup
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Modern CSS design principles, minimalism, color theory, typography
  - **Skills Evaluated but Omitted**:
    - No browser automation needed (CSS is static, can verify via dev tools)

  - **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 8
  - **Blocked By**: Task 6

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `docs/stylesheets/extra.css:1-11` - Current CSS variable definitions
  - `docs/stylesheets/extra.css:19-88` - Gradient usage patterns (headers, content, headings)
  - `docs/stylesheets/extra.css:100-134` - Box-shadow patterns (card-shadow, hover-shadow)
  - `docs/stylesheets/extra.css:53-64` - Code block styling (backgrounds, border-radius)

  **API/Type References** (contracts to implement against):
  - Tailwind CSS palette: https://tailwindcss.com/docs/customizing-colors (Emerald #10b981, Teal #14b8a6)
  - Slate color palette: https://tailwindcss.com/docs/customizing-colors/#default-color-palette
  - WCAG AA contrast: https://www.w3.org/WAI/WCAG21/quickref/?versions=2.0#contrast-minimum

  **Documentation References** (specs and requirements):
  - MkDocs Material theme customization: https://squidfunk.github.io/mkdocs-material/customization/

  **External References** (libraries and frameworks):
  - None (CSS color palette application)

  **WHY Each Reference Matters** (explain the relevance):
  - `extra.css:1-11`: Shows current CSS variables to update
  - `extra.css:19-88`: Shows all gradient usages to remove
  - `extra.css:100-134`: Shows shadow complexity to simplify
  - Tailwind palette: Provides exact hex codes for Emerald and Teal colors
  - WCAG AA: Ensures new colors meet accessibility standards
  - Material theme docs: Shows how to override theme colors correctly

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For CSS Changes*:
  - [x] Verify gradient removal: Inspect header/footer in browser dev tools (no linear-gradient)
  - [x] Verify new colors: Primary elements show Emerald (#10b981), accents show Teal (#14b8a6)
  - [x] Verify contrast ratio: Check text readability (≥4.5:1 for normal text)
  - [x] Verify shadow simplification: Box-shadows use subtle `shadow-sm` not heavy
  - [x] Verify Material theme intact: Navigation, search, tables still work
  - [x] Verify responsive design: Mobile layout unchanged after CSS changes

  **Evidence Required**:
  - [x] CSS diff showing gradient removal and color changes
  - [x] Screenshot of header/footer (before/after comparison)
  - [x] Screenshot of API docs with new Emerald/Teal colors
  - [x] Browser dev tools screenshot showing color values
  - [x] Contrast verification output (using tool or visual inspection)

  **Commit**: NO

- [x] 8. Apply Emerald + Teal color palette

  **What to do**:
  - Update CSS variables in `extra.css`:
    - `--primary-color`: #10b981 (Emerald)
    - `--secondary-color`: #059669 (Darker Emerald)
    - `--accent-color`: #14b8a6 (Teal)
  - Update all references to primary/secondary colors in extra.css
  - Remove blue (#2563eb) and cyan (#0ea5e9) color references
  - Update dark mode colors: Use Emerald/Teal slate variants if needed
  - Add minimal color documentation comment at top of CSS file

  **Must NOT do**:
  - Add new colors beyond Emerald + Teal palette
  - Change Material theme color scheme in mkdocs.yml (keep theme defaults, override with CSS)
  - Use gradients in new color applications

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `visual-engineering`
    - Reason: Color palette application with consistency and accessibility
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Color theory, accessibility, minimal design principles

  - **Skills Evaluated but Omitted**:
    - No browser automation needed (CSS can be verified visually)

  - **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 9
  - **Blocked By**: Task 7

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `docs/stylesheets/extra.css:1-8` - CSS variable definitions for colors
  - `docs/stylesheets/extra.css:19-30` - Primary color usage patterns
  - `docs/stylesheets/extra.css:35-50` - Accent color usage patterns

  **API/Type References** (contracts to implement against):
  - Tailwind color swatches: https://tailwindcss.com/docs/customizing-colors#emerald
  - Color contrast checker: https://webaim.org/resources/contrastchecker/

  **Documentation References** (specs and requirements):
  - None (color palette application)

  **External References** (libraries and frameworks):
  - None (CSS color application)

  **WHY Each Reference Matters** (explain the relevance):
  - `extra.css:1-8`: Shows CSS variable structure to update for new colors
  - `extra.css:19-50`: Shows all places primary color is used
  - Tailwind swatches: Provides complete Emerald + Teal palette with hex codes
  - Contrast checker: Ensures text readability with new colors

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For Color Palette*:
  - [x] Verify primary elements: Headers, buttons, links show Emerald (#10b981)
  - [x] Verify accent elements: Highlights, tags, badges show Teal (#14b8a6)
  - [x] Verify text contrast: Readable on both light and dark backgrounds
  - [x] Verify no blue/cyan: No remaining #2563eb or #0ea5e9 in CSS
  - [x] Verify consistency: All elements use new color palette
  - [x] Verify dark mode: Emerald/Teal work in dark theme

  **Evidence Required**:
  - [x] Screenshot of entire documentation page showing Emerald/Teal theme
  - [x] Screenshot of dark mode with new colors
  - [x] Browser dev tools showing computed color values
  - [x] Contrast check results (contrast ratio for text on backgrounds)

  **Commit**: NO

- [x] 9. Validate dark mode contrast and accessibility

  **What to do**:
  - Test all color combinations in dark mode: Emerald text on slate-900, Teal text on slate-900
  - Verify contrast ratios meet WCAG AA (≥4.5:1 for normal text, ≥3:1 for large text)
  - Check table readability: Header text vs cell background contrast
  - Check code block readability: Syntax highlighting visible on dark background
  - Check badge readability: Auth/GET/POST tags visible
  - If contrast fails, adjust shades (lighter Emerald on dark, darker Teal on light)

  **Must NOT do**:
  - Change overall color scheme choice (keep Emerald + Teal)
  - Add dark mode toggle (use existing Material theme toggle)
  - Modify Material theme structure

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: Manual accessibility and contrast verification using browser tools
  - **Skills**: [`git-master`]
    - `git-master`: For referencing web accessibility testing patterns

  - **Skills Evaluated but Omitted**:
    - No automated accessibility testing skills needed (manual verification)

  - **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 10
  - **Blocked By**: Task 8

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `docs/stylesheets/extra.css:324-339` - Dark mode CSS variable overrides
  - `docs/stylesheets/extra.css:19-50` - Color usage in headers, tables, code blocks

  **API/Type References** (contracts to implement against):
  - WCAG 2.0 success criteria: https://www.w3.org/WAI/WCAG21/quickref/

  **Documentation References** (specs and requirements):
  - WebAIM contrast checker: https://webaim.org/resources/contrastchecker/
  - Material theme dark mode: https://squidfunk.github.io/mkdocs-material/customization/#color-palette

  **External References** (libraries and frameworks):
  - None (accessibility testing)

  **WHY Each Reference Matters** (explain the relevance):
  - `extra.css:324-339`: Shows dark mode color overrides
  - `extra.css:19-50`: Shows color usage patterns that need contrast checking
  - WCAG criteria: Defines success thresholds for contrast validation
  - WebAIM tool: Provides method for checking contrast ratios
  - Material theme docs: Shows how dark mode works with theme

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For Accessibility*:
  - [x] Verify normal text contrast: ≥4.5:1 ratio using WebAIM checker
  - [x] Verify large text contrast: ≥3:1 ratio (18pt+ text, headings)
  - [x] Verify table contrast: Header text vs cell background meets AA
  - [x] Verify code block contrast: Syntax highlighting visible on dark slate-900
  - [x] Verify badge contrast: Auth/GET/POST tags readable
  - [x] Verify dark mode toggle: Switching between themes preserves contrast

  **Evidence Required**:
  - [x] WebAIM contrast checker screenshot (showing ratio results)
  - [x] Screenshot of dark mode documentation (showing contrast is readable)
  - [x] Contrast verification log (text-to-background combinations checked)
  - [x] Any adjustments made to color shades (if original failed AA)

  **Commit**: NO

- [x] 10. Update Makefile with doc generation

  **What to do**:
  - Update `make docs` target in Makefile to run doc generation before MkDocs serve
  - Add doc generation step: `python scripts/generate-docs.py` before `./.venv/bin/mkdocs serve`
  - Add error handling: If doc generation fails, stop the build process
  - Add dry-run option: `make docs-generate` to run doc generation only
  - Add verbose flag for doc generation errors
  - Ensure idempotent: Can run `make docs` multiple times safely

  **Must NOT do**:
  - Modify other Makefile targets (install, dev, build, test)
  - Add new dependency management logic
  - Change existing dev/production commands

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: Makefile update with error handling and sequential command execution
  - **Skills**: [`git-master`]
    - `git-master`: For referencing existing Makefile patterns and structure

  - **Skills Evaluated but Omitted**:
    - No specialized build system skills needed (standard Make syntax)

  - **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 11
  - **Blocked By**: Task 9

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `Makefile:144-147` - Current `make docs` command implementation
  - `Makefile:10-26` - Existing target patterns (install, dev, db, migrate)

  **API/Type References** (contracts to implement against):
  - GNU Make documentation: https://www.gnu.org/software/make/manual/
  - Python subprocess module: https://docs.python.org/3/library/subprocess.html (for error handling)

  **Documentation References** (specs and requirements):
  - None (Makefile syntax)

  **External References** (libraries and frameworks):
  - None (standard Make usage)

  **WHY Each Reference Matters** (explain the relevance):
  - `Makefile:144-147`: Shows current `make docs` implementation to extend
  - `Makefile:10-26`: Shows target naming and structure patterns to follow
  - GNU Make docs: Provides syntax for multi-line commands and error handling
  - Subprocess docs: Shows Python integration pattern for Makefile

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For Makefile Update*:
  - [x] Verify docs target updated: `cat Makefile | grep -A 3 "^docs:"`
  - [x] Verify doc generation runs: `make docs` triggers script execution
  - [x] Verify error handling: Ctrl+C stops both doc generation and MkDocs
  - [x] Verify failure stops build: Script errors prevent MkDocs from starting
  - [x] Verify idempotency: Running `make docs` twice produces identical output
  - [x] Verify dry-run target: `make docs-generate` works independently

  **Evidence Required**:
  - [x] Makefile diff showing docs target update
  - [x] Terminal output from `make docs` (showing doc generation then MkDocs serve)
  - [x] Terminal output from `make docs-generate` (showing script-only execution)
  - [x] Error handling verification (Ctrl+C and script failure tests)

  **Commit**: NO

- [x] 11. Full integration test

  **What to do**:
  - Run complete build: `make clean && make docs`
  - Verify doc generation executes before MkDocs
  - Verify MkDocs builds successfully with all new content
  - Test API Reference navigation: Click through all sections
  - Test model documentation: Verify all 12 models are documented
  - Verify new Emerald + Teal colors display correctly
  - Verify no gradient backgrounds remain
  - Check build time: Doc generation + MkDocs build should complete in <15 seconds
  - Test rebuild: Run `make docs` twice, ensure no errors or warnings
  - Verify search indexes new API and model docs

  **Must NOT do**:
  - Modify any generated markdown files (verify only)
  - Change Django backend or API code
  - Deploy or commit generated files

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `unspecified-low`
    - Reason: End-to-end integration testing with manual verification
  - **Skills**: [`git-master`]
    - `git-master`: For understanding build process and ensuring no file modifications

  - **Skills Evaluated but Omitted**:
    - No automation skills needed (manual end-to-end testing)

  - **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None (final task)
  - **Blocked By**: Task 10

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `Makefile:121-124` - Clean target (remove caches and build artifacts)
  - `mkdocs.yml` - Complete configuration structure
  - `docs/` - Directory structure for all generated files

  **API/Type References** (contracts to implement against):
  - MkDocs build output: https://www.mkdocs.org/user-guide/building-your-site/

  **Documentation References** (specs and requirements):
  - None (integration testing)

  **External References** (libraries and frameworks):
  - None (manual testing)

  **WHY Each Reference Matters** (explain the relevance):
  - `Makefile:121-124`: Shows how to clean build artifacts before fresh build
  - `mkdocs.yml`: Complete reference for ensuring configuration is valid
  - `docs/`: Directory structure to verify all generated files exist
  - MkDocs build docs: Shows expected build output and success indicators

  **Acceptance Criteria**:

  > CRITICAL: Acceptance = EXECUTION, not just "it should work".
  > The executor MUST run these commands and verify output.

  **Manual Execution Verification**:

  *For Integration Testing*:
  - [x] Verify clean build: `make clean && make docs` completes without errors
  - [x] Verify doc generation output: Script logs show successful generation
  - [x] Verify MkDocs build: "INFO - Site built in X.XX seconds" message
  - [x] Verify API docs present: Navigate to API Reference section
  - [x] Verify model docs present: Django models are documented
  - [x] Verify new colors: Emerald + Teal visible throughout site
  - [x] Verify no gradients: Inspect elements, confirm no `linear-gradient` in backgrounds
  - [x] Verify build time: Total build <15 seconds (baseline + doc generation)
  - [x] Verify idempotency: Second build completes with identical output (no file timestamp changes)
  - [x] Verify search: Search finds "POST /api/v1/auth/login/" endpoint
  - [x] Verify responsive: Mobile view of API docs is readable

  **Evidence Required**:
  - [x] Terminal output from `make clean && make docs` (showing full build process)
  - [x] Screenshot of API Reference navigation (showing new section)
  - [x] Screenshot of model documentation (showing Emerald + Teal tables)
  - [x] Screenshot of homepage (showing new color scheme)
  - [x] Build time measurement output
  - [x] Screenshot of mobile view (375px width)
  - [x] Screenshot of search results (showing API docs indexed)

  **Commit**: NO

---

## Commit Strategy

| After Task | Message | Files | Verification |
|-------------|---------|-------|--------------|
| 2 | feat: implement openapi schema extraction | scripts/generate-docs.py | python scripts/generate-docs.py --help |
| 4 | feat: implement django model introspection | scripts/generate-docs.py | python scripts/generate-docs.py --verbose (model docs generated) |
| 5 | docs: update mkdocs.yml with api reference section | mkdocs.yml | mkdocs build --clean |
| 7, 8 | docs: apply emerald-teal color palette | docs/stylesheets/extra.css | make docs (visual verification) |
| 10 | build: integrate doc generation into make docs target | Makefile | make docs (full integration test) |

---

## Success Criteria

### Verification Commands
```bash
# Verify doc generation script works
python scripts/generate-docs.py --help

# Verify OpenAPI schema fetchable
curl -s http://127.0.0.1:8000/api/schema/ | jq .info.title

# Verify MkDocs builds with new config
make docs

# Verify no blue/cyan colors in CSS
grep -r "2563eb\|0ea5e9" docs/stylesheets/extra.css

# Verify no gradients in header/footer
grep -r "linear-gradient" docs/stylesheets/extra.css
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All manual verification steps completed
- [x] API documentation auto-generated during `make docs`
- [x] Model documentation auto-generated during `make docs`
- [x] Emerald + Teal color palette applied consistently
- [x] No gradient backgrounds in documentation
- [x] MkDocs site builds successfully
- [x] Build time <15 seconds with doc generation
- [x] Generated files are NOT committed to git (build-only mode)
