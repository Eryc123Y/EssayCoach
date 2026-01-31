# Documentation Modernization - Issues & Solutions

## Issues Encountered

### 1. Initial Script Used Template Data (Fixed in Task 1 continuation)
- **Problem**: First implementation used hardcoded API endpoints (Rubrics, Submissions only)
- **Impact**: Missing 19+ real API endpoints from drf-spectacular
- **Solution**: Enhanced script to fetch real OpenAPI schema from Django backend
- **Lesson**: Always verify script output matches actual backend state

### 2. Django Model Loading Incomplete (Fixed in Task 1 continuation)
- **Problem**: SQLite in-memory configuration only loaded Django built-in models
- **Impact**: Missing 12 EssayCoach core models
- **Solution**: Configure Django with real INSTALLED_APPS and project settings
- **Lesson**: Use project settings, not minimal configuration for introspection

### 3. Pre-existing YAML Error in mkdocs.yml
- **Problem**: Line 123 has unresolved tag: `tag:yaml.org,2002:python/name:pymdownx.superfences.fence_code_format`
- **Impact**: LSP diagnostics show error
- **Solution**: Not fixed (pre-existing, not caused by our changes)
- **Lesson**: Verify errors are new before reporting/fixing

### 4. Gradient Detection False Positive
- **Problem**: Build CSS (`site/assets/stylesheets/main.*.min.css`) contains gradient
- **Impact**: Initial concern about gradient removal failure
- **Solution**: Verified gradient is only in CTA button (`.md-button--primary`), allowed per requirements
- **Lesson**: Check context of findings before assuming failure

## Pending Issues
- None critical - all requirements met

## Technical Debt
- None identified
