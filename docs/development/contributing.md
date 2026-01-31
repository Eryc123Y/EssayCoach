# Contributing to EssayCoach

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 22+
- Docker and Docker Compose
- **uv** (for Python management)

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/EssayCoach.git`
3. Setup environment: `make install`
4. Start services: `make dev`

## Development Workflow

### Branch Naming
- `feature/add-user-profiles`
- `fix/login-validation-error`
- `docs/update-api-spec`
- `refactor/essay-store`

### Commit Messages
```
type(scope): description

feat(auth): add JWT token refresh
fix(frontend): resolve essay loading bug
docs(api): update endpoint documentation
```

### Pull Request Process
1. Create feature branch from `main`
2. Make changes with tests
3. Run test suite: `make test`
4. Update documentation if needed
5. Submit PR with template

## Code Standards

### Python (Backend)
- Follow PEP 8
- Use type hints (required for new code)
- Write docstrings
- Run `pyright` for type checking
- Run `ruff` for linting

### TypeScript (Frontend)
- Use strict mode
- Prefer functional components and React hooks
- Follow Next.js and React style guides
- Run `eslint` and `prettier`

### Testing Requirements
- Backend: 80% code coverage
- Frontend: Unit tests for components
- E2E: Critical user flows

## Documentation

### Code Documentation
- Add JSDoc for TypeScript functions
- Include docstrings for Python methods
- Update API documentation for new endpoints

### User Documentation
- Update README for new features
- Add migration guides for breaking changes
- Include examples in documentation

## Issue Reporting

### Bug Reports
```markdown
**Describe the bug**
Clear description of the issue

**Steps to reproduce**
1. Step 1
2. Step 2
3. Step 3

**Expected behavior**
What should happen

**Environment**
- OS: [e.g. macOS 14]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.2.0]
```

## Development Notes

### Branch Workflow & Review Process

#### Documentation Branch Workflow
1. **All documentation changes** must first be merged to the `docs` branch
2. **Documentation includes**:
   - API documentation updates
   - Architecture diagram changes
   - README updates
   - Any `.md` file modifications
3. **After docs branch review**, changes are then merged from `docs` to `main`

#### Code Review Process
1. **Pull Request Requirements**:
   - Must include at least 1 approving review from code owner
   - All CI checks must pass (tests, linting, type checking)
   - Documentation must be updated for any API changes
   - Breaking changes require migration guide

2. **Review Checklist** for reviewers:
   - [ ] Code follows project style guidelines
   - [ ] Tests are included and passing
   - [ ] Documentation is updated
   - [ ] No security vulnerabilities introduced
   - [ ] Performance considerations addressed
   - [ ] Accessibility standards met (frontend changes)

3. **Review Timeline**:
   - **Initial review**: Within 24 hours on weekdays
   - **Follow-up reviews**: Within 12 hours after updates
   - **Complex changes**: May require 2+ reviewers

#### Branch Protection Rules
- **main branch**: Requires 2 approving reviews + all CI checks
- **docs branch**: Requires 1 approving review + documentation checks
- **feature branches**: Must be up-to-date with target branch before merge

#### Merge Strategy
- **Squash and merge** for feature branches (clean history)
- **Merge commit** for docs → main merges (preserve history)
- **Rebase** only for personal feature branches (never on shared branches)

#### Release Process
1. Create release branch from `main`
2. Update version numbers and changelog
3. Test in staging environment
4. Create PR from release branch to `main`
5. After approval, merge and tag release
6. Deploy to production

[This section will be expanded with actual contribution guidelines]