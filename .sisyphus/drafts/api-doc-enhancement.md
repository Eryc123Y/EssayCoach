# Draft: API Documentation Enhancement

## Requirements (confirmed)

### User's Core Problems
1. Swagger UI and ReDoc pages are empty (they try to fetch `/api/schema/` from running backend)
2. MkDocs is a static site generator - it cannot dynamically call backend APIs
3. API Reference (endpoints.md) lacks detailed descriptions

### User's Requirements
1. Fix Swagger UI and ReDoc to show actual API documentation
2. Add more detailed descriptions to API Reference

## Current State (Research Findings)

### Documentation System
- **Platform**: MkDocs with Material theme
- **Location**: Root directory `/Users/eric/Documents/GitHub/EssayCoach/mkdocs.yml`
- **Output**: Static site generated to `site/` directory

### Backend Configuration
- **Framework**: Django 4.x + DRF
- **Documentation**: drf-spectacular configured
- **Schema Endpoint**: `/api/schema/` (defined in `backend/essay_coach/urls.py`)
- **Authentication**: Bearer token, Session, Basic

### Existing Files
- `docs/api-reference/swagger-ui.md` - Uses CDN for Swagger UI, fetches from `/api/schema/`
- `docs/api-reference/redoc.md` - Uses CDN for ReDoc, fetches from `/api/schema/`
- `docs/api-reference/endpoints.md` - Template/fallback documentation
- `scripts/generate-docs.py` - Can generate docs and fetch OpenAPI schema

### Script Capabilities (`scripts/generate-docs.py`)
- Fetch OpenAPI schema from `http://127.0.0.1:8000/api/schema/`
- Parse OpenAPI 3.0 schema
- Generate endpoint documentation with authentication, request/response details
- Generate model documentation from Django introspection
- Generate ERD diagrams with Mermaid.js
- Falls back to template if backend is unavailable

## Proposed Solution (User's Analysis)

1. Start Django backend temporarily to fetch OpenAPI schema
2. Save schema to `docs/api-reference/openapi-schema.json`
3. Update Swagger UI to reference local JSON file
4. Update ReDoc to reference local JSON file
5. Enhance endpoints.md with detailed descriptions

## Open Questions (To be answered)

### Question 1: Schema Regeneration Strategy
Should the OpenAPI schema be regenerated on every docs build (requires backend running)?

**Options**:
- **Option A (Manual)**: Regenerate manually with `make docs-api` or similar command
  - Pros: Doesn't require backend during `mkdocs build`
  - Cons: Schema might become stale if API changes

- **Option B (Automatic)**: Regenerate on every docs build (pre-build hook)
  - Pros: Schema always up-to-date
  - Cons: Requires backend running during `mkdocs build`

### Question 2: Documentation Detail Level
What level of detail should be added to endpoints.md?

**Options**:
- **Option A (Enhanced Summary)**: Keep current structure but add:
  - Detailed descriptions for each endpoint
  - Request/response examples
  - Authentication requirements

- **Option B (Full Reference)**: Expand to include:
  - All fields with types and descriptions
  - Query parameters
  - Request body schemas
  - Response schemas
  - Error codes and examples
  - Code examples (curl, Python, JavaScript)

### Question 3: Code Examples
Should we include code examples? If yes, which languages?

**Options**:
- **curl**: HTTP requests from command line
- **Python**: Requests library examples
- **JavaScript**: Fetch API or Axios examples
- **All of the above**: Multi-language tabs

## Technical Decisions (To be made)

- Where to store static OpenAPI schema: `docs/api-reference/openapi-schema.json`?
- How to integrate schema generation into MkDocs build process?
- How to handle cases where backend is not running during doc build?
- What authentication token to use for example requests (or mock responses)?

## Scope Boundaries

### INCLUDE
- Fixing Swagger UI and ReDoc to work with static schema
- Generating static OpenAPI JSON schema
- Enhancing endpoints.md documentation
- Integrating schema generation into build process

### EXCLUDE
- Changing DRF Spectacular configuration (unless necessary)
- Modifying backend API endpoints
- Creating new MkDocs plugins
- Hosting dynamic documentation (keeping it static for GitHub Pages)

## Next Steps
1. Get answers to the three questions above
2. Create comprehensive work plan
3. Implement solution
