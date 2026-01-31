# Draft: MkDocs Interactive Documentation Enhancement

## User Request Summary

**Goal**: Embed interactive documentation directly into MkDocs for EssayCoach documentation site.

**Requirements**:
1. **drf-spectacular output** - Full Swagger UI / ReDoc (interactive, not just static markdown)
2. **Django admin model docs** - Full model documentation with constraints, not just fields
3. **Real-time ERD diagram** - Generated from Django models on each build

**Context**:
- Current setup: MkDocs + Material theme
- Auto-generated API markdown from drf-spectacular OpenAPI schema
- Auto-generated model markdown from Django introspection
- Emerald + Teal color palette, no gradients
- Existing gaps: Static markdown, missing model constraints, no ERD

## Research Results: Codebase Exploration ✅

### 1. MkDocs Configuration
**Current Setup**:
- **Theme**: Material theme with dual palette (Slate dark + default light)
- **Primary Color**: Blue, Accent: Cyan
- **Plugins**: search, mermaid2 (v10.6.1), git-revision-date-localized, minify
- **Build Commands**:
  ```makefile
  docs-generate:
      python scripts/generate-docs.py

  docs:
      python scripts/generate-docs.py && ./.venv/bin/mkdocs serve
  ```

### 2. Django Models Structure
**Active Models** (backend/core/models.py):
- User, Unit, Class, Enrollment, TeachingAssn
- Task, Submission, MarkingRubric, RubricItem, RubricLevelDesc
- Feedback, FeedbackItem

**Relationships**: Complex educational data model with foreign keys and check constraints
- 7 CheckConstraints defined
- 3 UniqueConstraints defined
- All models use managed = True

### 3. API Documentation Approach
**drf-spectacular Status**: INSTALLED ✅
- **Location**: backend/pyproject.toml line 12
- **Configuration**: backend/essay_coach/settings.py with SPECTACULAR_SETTINGS
- **Schema Endpoints**:
  - JSON Schema: http://127.0.0.1:8000/api/schema/
  - Swagger UI: http://127.0.0.1:8000/api/docs/
  - ReDoc: http://127.0.0.1:8000/api/redoc/

**Documentation Generator** (scripts/generate-docs.py):
- Introspects Django models via Django ORM
- Fetches OpenAPI schema from running backend
- Generates markdown documentation
- Uses cache for idempotency check
- Supports dry-run and verbose modes

### 4. Current Documentation Output
**Generated Files**:
1. `docs/backend/models/models.md` - Field-level documentation table
2. `docs/api-reference/endpoints.md` - API endpoint documentation
3. `docs/backend/django-models.md` - Hand-written model architecture
4. `docs/database/schema-overview.md` - Database design overview
5. `docs/database/erd-diagram.md` - ERD diagram reference (SVG)

**Current Limitations**:
- API docs are STATIC markdown (not interactive)
- Model docs missing Django built-in models and constraints
- No real-time ERD generation during build

## Research Complete ✅

### Background Agents Status
1. **Explore Agent** (bg_67d1065e): ✅ COMPLETED
2. **Librarian Agent** (bg_7562c563): ✅ COMPLETED

## Research Findings Summary

### 1. Swagger UI / ReDoc Integration

#### **Recommended Tool: mkdocs-swagger-ui-tag** ⭐ PRIMARY RECOMMENDATION
- **GitHub**: blueswen/mkdocs-swagger-ui-tag (107 stars)
- **Latest Release**: v0.7.2 (Aug 2025) - Actively maintained
- **Key Features**:
  - ✅ Full Material theme integration with dark mode sync
  - ✅ Self-contained (no external CDN dependencies)
  - ✅ Supports multiple Swagger UIs on same page
  - ✅ Full Swagger UI configuration support
  - ✅ OAuth2 support
  - ✅ Multiple OpenAPI specs with selector

**Configuration Example**:
```yaml
plugins:
  - swagger-ui-tag:
      background: White
      docExpansion: none
      filter: ""
      syntaxHighlightTheme: monokai
      tryItOutEnabled: ['get', 'post']
      dark_scheme_name: slate
```

**Markdown Usage**:
```markdown
<swagger-ui src="openapi.yaml"/>
```

#### **Alternative: mkdocs-render-swagger-plugin**
- 78 stars, outdated (May 2024)
- Basic features, no dark mode support
- Uses external CDN
- ❌ NOT RECOMMENDED

### 2. Django Model Documentation

#### **Recommended Tool: django-erd** ⭐ PRIMARY RECOMMENDATION
- **Type**: CLI command + ERD/Data Dictionary generator
- **Key Features**:
  - ✅ ERD Generation: Mermaid.js, PlantUML, dbdiagram.io formats
  - ✅ Data Dictionary: Comprehensive field documentation with constraints
  - ✅ Constraint information included
  - ✅ Relationship mapping
  - ✅ Help text extraction
  - ✅ Markdown output ready for MkDocs

**Installation & Usage**:
```bash
pip install django-erd
python manage.py generate_erd -d mermaid -o docs/erd.mermaid
python manage.py generate_data_dictionary -o docs/data_dictionary.md
```

**Data Dictionary Output Example**:
```markdown
# Data Dictionary

## User Model

| pk | field_name | data_type | related_model | description | nullable | unique | max_length |
|----|------------|-----------|---------------|-------------|----------|------------|
| ✓ | id | integer | | Primary key | | ✓ | |
|   | username | varchar | | User's login name | | ✓ | 150 |
|   | email | email | | User's email address | ✓ | | 254 |
```

#### **Alternative: django-extensions graph_models**
- Traditional Django management command
- Only DOT output (requires Graphviz)
- No markdown documentation output
- ❌ NOT RECOMMENDED for this use case

### 3. ERD Generation

#### **Recommended Approach: django-erd with Mermaid format** ⭐ PRIMARY RECOMMENDATION
- **Why Mermaid?**: Native to MkDocs Material theme via mermaid2 plugin (already configured!)
- **No additional dependencies**: Already supported by existing mkdocs.yml
- **Build time**: 5-15 seconds
- **Automation**: Can be integrated into `make docs` workflow

**Output Formats Available**:
1. **Mermaid.js** (Recommended) - Native to Material theme
2. **PlantUML** - Requires kroki plugin
3. **dbdiagram.io** - Requires kroki plugin

**Command**:
```bash
python manage.py generate_erd -d mermaid -o docs/database/erd.mermaid
```

**Integration with MkDocs** (Already configured in mkdocs.yml):
```yaml
markdown_extensions:
  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_code_format
```

### 4. Integration Considerations

#### **Build Time Impact**
| Tool | Estimated Build Time | Optimization |
|-------|-------------------|--------------|
| django-erd | 5-15 seconds | Cache generated files |
| mkdocs-swagger-ui-tag | 2-5 seconds | Pre-generate schemas |
| drf-spectacular | 10-30 seconds | CI/CD generation |

**Total Additional Build Time**: ~17-50 seconds

#### **Dependency Management**
```txt
# docs/requirements.txt
mkdocs-swagger-ui-tag>=0.7.0
django-erd>=1.0.0
beautifulsoup4>=4.11.0  # Required by django-erd
```

#### **Potential Conflicts & Solutions**
1. **Plugin Load Order**: Ensure `swagger-ui-tag` loads after search plugin
2. **CDN Dependencies**: `mkdocs-swagger-ui-tag` is self-contained ✓
3. **Python Version Compatibility**: All tools support Python 3.8+ ✓

### 5. Recommended Implementation Strategy

**Best Approach Based on Research**:
1. Use `mkdocs-swagger-ui-tag` for interactive API docs
2. Use `django-erd` for ERD and model documentation
3. Use Mermaid format for ERD (native to Material theme)
4. Automate generation in `make docs` workflow

## Key Questions to Resolve

### Clarification Needed Before Plan Generation

#### 1. API Documentation View Preference
**Question**: Do you want to provide BOTH Swagger UI AND ReDoc, or just one?

**Options**:
- **Option A: Both Swagger UI and ReDoc** (Recommended)
  - Pros: User choice between two views
  - Cons: Larger build time, more complexity
  - Implementation: Use tabbed interface in MkDocs
- **Option B: Swagger UI Only**
  - Pros: Simpler, faster build, most developers prefer it
  - Cons: ReDoc users lose their preferred view
- **Option C: ReDoc Only**
  - Pros: Clean modern UI
  - Cons: Less common, Swagger UI is more familiar

**My Recommendation**: **Option A (Both)** with tabbed interface. Leverages drf-spectacular's strengths and gives users choice.

#### 2. Model Documentation Detail Level
**Question**: How much detail do you want for model documentation?

**Options**:
- **Option A: Django Admin Style** (Comprehensive)
  - Includes: All field types, constraints, relationships, validators, help text
  - Format: Data dictionary + ERD
  - Pros: Complete reference for developers
  - Cons: More verbose, longer generation time
- **Option B: Lightweight Overview**
  - Includes: Field names, types, key constraints only
  - Format: Simple table
  - Pros: Faster generation, less verbose
  - Cons: Missing detailed constraint info

**My Recommendation**: **Option A (Comprehensive)**. You already have `scripts/generate-docs.py` generating field tables - django-erd would enhance this with constraints and relationships.

#### 3. ERD Detail Level
**Question**: How detailed should the ERD diagram be?

**Options**:
- **Option A: Full ERD with All Relationships** (Recommended)
  - Shows: All tables, all foreign keys, many-to-many relationships
  - Pros: Complete schema visualization
  - Cons: Can be large for complex schemas
- **Option B: Simplified ERD**
  - Shows: Core tables and main relationships only
  - Pros: Easier to read
  - Cons: Missing details

**My Recommendation**: **Option A (Full ERD)**. You already have 11 models - manageable for a single diagram.

#### 4. Build Workflow Automation
**Question**: Should the documentation generation be fully automated in `make docs`?

**Current Workflow**:
```makefile
docs-generate:
    python scripts/generate-docs.py

docs:
    python scripts/generate-docs.py && ./.venv/bin/mkdocs serve
```

**Options**:
- **Option A: Full Automation** (Recommended)
  - `make docs` generates: OpenAPI schema + ERD + model docs + MkDocs build
  - Pros: Single command, consistent documentation
  - Cons: Slightly longer build time
- **Option B: Separate Commands**
  - `make docs-generate` (schemas/ERD/docs)
  - `make docs-serve` (MkDocs only)
  - Pros: Faster iteration for MkDocs changes
  - Cons: Two-step workflow

**My Recommendation**: **Option A (Full Automation)**. Prevents stale documentation.

## Draft Status
- Created: 2026-01-28
- Status: Research complete, awaiting user decisions
- Next: User to clarify preferences, then proceed to plan generation

## User Decision Points

Please respond with your preferences for these 4 questions:

### Q1: API Documentation View Preference
**Options**:
- **A: Both Swagger UI & ReDoc** (Recommended) - Tabbed interface in MkDocs. User choice between views.
- **B: Swagger UI Only** - Simplest integration. Most developers prefer this view.
- **C: ReDoc Only** - Clean modern UI. Less common than Swagger UI.

**Your Choice**: [A / B / C]

### Q2: Model Documentation Detail Level
**Options**:
- **A: Comprehensive (Django Admin style)** (Recommended) - Full data dictionary with all field types, constraints, relationships, validators, help text. Enhanced from existing generate-docs.py using django-erd.
- **B: Lightweight Overview** - Simple field tables like current docs/backend/models/models.md. Faster generation.

**Your Choice**: [A / B]

### Q3: ERD Detail Level
**Options**:
- **A: Full ERD (all relationships)** (Recommended) - Shows all 11 tables, foreign keys, many-to-many relationships. Complete schema visualization.
- **B: Simplified ERD** - Core tables and main relationships only. Easier to read but missing details.

**Your Choice**: [A / B]

### Q4: Build Workflow Automation
**Options**:
- **A: Full Automation** (Recommended) - `make docs` runs: drf-spectacular schema + django-erd + model docs + MkDocs build. Single command, consistent documentation.
- **B: Separate Commands** - `make docs-generate` (schemas/ERD/docs) + `make docs-serve` (MkDocs only). Faster iteration for MkDocs changes.

**Your Choice**: [A / B]

---

## My Recommendations (Summary)

Based on research and your requirements, here's what I recommend:

1. **Q1: API Docs** → **A: Both Swagger UI & ReDoc**
   - Leverages drf-spectacular's strengths (already provides both at /api/docs/ and /api/redoc/)
   - Gives users choice of UI style
   - Tabbed interface keeps docs clean

2. **Q2: Model Docs** → **A: Comprehensive Django Admin style**
   - You already have `scripts/generate-docs.py` generating field tables
   - django-erd will enhance this with constraints, relationships, and full metadata
   - More valuable for developers understanding the schema

3. **Q3: ERD Detail** → **A: Full ERD with all relationships**
   - 11 models is manageable for a single diagram
   - Complete visualization prevents questions about schema
   - Can be simplified in future if too complex

4. **Q4: Automation** → **A: Full Automation in `make docs`**
   - Prevents stale documentation (everything generated fresh)
   - Single command is simpler for contributors
   - Build time impact is acceptable (~17-50 seconds additional)

**Please confirm or override these recommendations so I can proceed to work plan generation.**
