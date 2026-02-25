# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **IMPORTANT**: This file is the single source of truth for project status. Update it after every significant code change to reflect the current state and next priorities.
>
> **Last Updated**: 2026-02-25 (Dashboard Phase 2 Complete + Security Review + Sidebar Fix)

---

## Commands

### Development Server
- **Full Dev Stack**: `make dev` (starts DB, Backend on port 8000, Frontend on port 5100)
- **Backend Only**: `make dev-backend`
- **Frontend Only**: `make dev-frontend`
- **Database (Docker)**: `make db` (starts Postgres), `make db-stop`
- **Seed Database**: `make seed-db` (creates test accounts)

### Dependency Management
- **Install All**: `make install` (uses `uv` for Python, `pnpm` for Node)
- **Backend Migrations**: `make migrate`

### Testing
- **All Tests**: `make test` (runs both api_v1 and api_v2 tests)
- **Backend Tests (API v2 only)**: `cd backend && uv run pytest api_v2/ -v`
- **Frontend Tests**: `cd frontend && pnpm test`
- **Single Backend Test**: `cd backend && uv run pytest api_v2/tests/test_specific.py::TestClass::test_method -v`

> **Note**: `make test` includes legacy api_v1 tests. For api_v2-only testing, use the command above. Tests require `.env` at project root and have a 60s timeout per test.

### Linting & Formatting
- **Check All**: `make lint`
- **Auto-fix All**: `make lint-fix`
- **Format Code**: `make format`
- **Python Type Check**: `make typecheck` (runs mypy)

### Documentation
- **Build Docs**: `make docs-build` (generates OpenAPI schema and MkDocs)
- **Serve Docs**: `make docs`

### Docker & Database Utilities
- **Docker Up**: `make docker-up` (start all Docker Compose services)
- **Docker Down**: `make docker-down` (stop all Docker Compose services)
- **Docker Logs**: `make docker-logs` (stream all logs), `make docker-logs-pg` (PostgreSQL only)
- **Database Shell**: `make db-shell` (psql into PostgreSQL)
- **Database Reset**: `make db-reset` (wipe and recreate PostgreSQL container)
- **Django Shell**: `make shell` (open Django Python shell)
- **Create Superuser**: `make createsuperuser`

---

## Code Architecture

### High-Level Structure
EssayCoach is a dual-monorepo application with a separated frontend and backend:
- **`backend/`**: Django 4.x application using Python 3.12+.
- **`frontend/`**: Next.js 15 App Router application using React 19, TypeScript, and Tailwind CSS v4.
- **`docs/prd/`**: Contains the Product Requirement Documents and the `pencil-shadcn.pen` UI design file.

### Backend Architecture
**All new development must target API v2 (Django Ninja).**
- **`core/models.py`**: Central location for all database models (User, Class, MarkingRubric, Task, Submission).
- **`api_v2/`**: The modern Django Ninja API layer.
  - `api_v2/api.py`: Main router configuration.
  - `api_v2/auth/`: JWT/Token authentication logic.
  - `api_v2/core/`: CRUD operations for core models.
  - `api_v2/ai_feedback/`: Orchestrates AI analysis using Dify.
- **`api_v1/`**: Legacy DRF code - deleted 2026-02-24.

### Frontend Architecture
- **Framework**: Next.js App Router (`src/app/`).
- **UI Components**: shadcn/ui (`src/components/ui/`) styled with Tailwind CSS v4.
- **State Management**: Zustand (preferred) + legacy React Context.
- **Styling Paradigm**: "Academic Precision" (clean typography, subtle depth, minimal gradients for primary CTAs).

### Design-to-Code Workflow
The `docs/prd/` directory contains an explicit contract for code generation:
- `pencil-shadcn.pen`: The master UI design file (Codegen Ready: GO_CONDITIONAL).
- `codegen-readiness.desktop.md`: Readiness report with gate matrix (Layout/Contract/State/Token/Component/Placeholder).
- `D2C_IMPLEMENTATION_CONTRACT_STANDARD.md`: The canonical 10-field template every feature must implement before coding begins.
- Always consult the PRDs to understand the UI/UX states and data shape before implementing a component.
- **All 14 PRD modules verified** (2026-02-25): Dashboard/Essay/Tasks/Classes/Rubrics ready for implementation.

---

## Current Project Status

### Version: v2.0.0 (v2-only migration target)

#### ✅ Completed Features
- Core AI essay analysis functionality
- Dashboard overview (student/lecturer role-aware)
- Rubric management (CRUD + PDF import via AI)
- Essay Practice submission flow
- API v2 core endpoints for existing features
- RBAC permission checks on Users CRUD endpoints ✅ Added 2026-02-24
- Cookie security hardening (httpOnly, sameSite, secure flags) ✅ Added 2026-02-24
- Navigation links to 404 pages removed ✅ Fixed 2026-02-24
- **JWT Refresh Token mechanism** ✅ Implemented 2026-02-24
- **Dashboard API endpoint** ✅ Implemented 2026-02-25 (`/api/v2/core/dashboard/`)
- **Comprehensive test coverage** ✅ Added 2026-02-25
  - Backend: 50+ dashboard API tests (pytest)
  - Frontend: Dashboard page + component tests (vitest)
  - Integration tests for full workflows
  - Backend: `/api/v2/auth/refresh/` with token rotation and blacklist
  - Frontend: `useAuthRefresh` hook with auto-refresh 5min before expiry
  - Security: httpOnly cookies, single-flight pattern, retry with backoff
  - Tests: 52 tests passing (33 authStore + 19 useAuthRefresh)
- **Dashboard Backend API (Phase 1)** ✅ Implemented 2026-02-25
  - Endpoints: `/api/v2/core/dashboard/lecturer/`, `/api/v2/core/dashboard/student/`, `/api/v2/core/dashboard/admin/`
  - Schemas: Role-specific response schemas (LecturerDashboardOut, StudentDashboardOut, AdminDashboardOut)
  - Frontend: API client (`dashboardService`), TypeScript types, useDashboard hook
  - Documentation: `docs/learnings/dashboard-refactor-phase1-backend.md`
- **Dashboard Performance Optimization** ✅ Complete 2026-02-25
  - Database indexes added: 11 new indexes on Submission, Feedback, Enrollment, FeedbackItem, Class tables
  - Artificial delays removed from all dashboard slot pages (+3s TTI improvement)
  - Documentation: `docs/learnings/dashboard-performance-optimization.md`
- **Dashboard Frontend (Phase 2)** ✅ Complete 2026-02-25
  - Role-based routing: `/dashboard/student`, `/dashboard/lecturer`, `/dashboard/admin`
  - Components: 5 implemented (`DashboardHeader`, `ActivityFeed`, `LecturerDashboard`, `StudentDashboard`, `AdminDashboard`)
  - Location: `frontend/src/features/dashboard/`, `frontend/src/app/dashboard/[role]/page.tsx`
  - Documentation: `docs/learnings/dashboard-frontend-implementation.md`
  - UI Designer Review: ✅ Complete (70% compliance score)
  - Testing: ✅ Complete (201 tests created)
  - Code Review: ✅ Complete (28 findings, 3 High priority security)
- **Sidebar Fix** ✅ Complete 2026-02-25
  - Added skeleton loading state during auth initialization
  - Added placeholder UI when no classes available
  - Fixed icon mismatches (`IconBook`, `IconChevronsDown`)
  - Documentation: `docs/learnings/sidebar-fix-implementation.md`
- **Test Account Quick-Fill** ✅ Complete 2026-02-25
  - Added Student/Lecturer/Admin quick-fill buttons on login page
  - Documentation: `docs/learnings/test-account-quick-fill.md`

#### 🚧 In Progress / Needs Attention
- API v1 → v2 migration (cleanup pending)
- RevisionChat Backend Integration (~8h)

#### 🔍 PRD vs Implementation Gap Analysis

| PRD Module | Status | Gap Summary | Priority |
|------------|--------|-------------|----------|
| 01 Landing Page | ✅ Implemented | - | - |
| 02 Sign In | ✅ Implemented | - | - |
| 03 Sign Up | ✅ Implemented | - | - |
| 04 Dashboard Overview | ⚠️ Phase 2 Complete | Frontend components implemented. UI review (70%), Code review (28 findings), 201 tests. Fix phase pending. | 🟡 P0 |
| 05 Essay Practice | ⚠️ Partial | Missing: RevisionChat backend (Deferred), PDF export, skill radar chart | 🟠 P1 |
| 06 Rubrics | ⚠️ Partial | Missing: Visibility (public/private), student view, duplicate | 🟡 P2 |
| 07 Settings | ✅ Implemented | - | - |
| 08 Profile | ✅ Implemented | - | - |
| 09 Assignments (Tasks) | ⚠️ Partial (33%) | Model: missing title, description, instructions, class_id, status (8/12 fields). Endpoints: missing publish/unpublish/submissions. | 🟠 P1 |
| 10 Classes | ⚠️ Partial (25%) | Model: missing name, description, code (join_code), term, status (9/12 fields). Endpoints: missing join/leave/students. | 🟠 P1 |
| 11 Social Learning Hub | ❌ Not Started | Planned for post-MVP | 🟢 P3 |
| 12 Analytics | ❌ Not Started | Planned for post-MVP | 🟢 P3 |
| 13 Users | ❌ Not Started | Admin user management | 🟢 P3 |
| 14 Help | ❌ Not Started | Basic help docs needed | 🟢 P3 |

#### Test Accounts
- **Admin**: admin@example.com / admin123
- **Lecturer**: lecturer@example.com / lecturer123
- **Student**: student@example.com / student123

---

## Active Development Priorities

### PRD Readiness Assessment (2026-02-25 Verified)

| Tier | Modules | Status | Implementation Readiness |
|------|---------|--------|-------------------------|
| **S 级 (95%+)** | Sign In, Sign Up, Settings, Profile | ✅ Implemented | Production ready |
| **A 级 (85-95%)** | Dashboard, Essay Practice, Tasks, Classes, Rubrics | ⚠️ Partial | **Ready for refactor** - PRD complete + UI design complete |
| **B 级 (70-85%)** | Landing Page, Social Learning Hub, Analytics, Users, Help | ❌ Not Started | Post-MVP - larger backend scope |

**Key Insight:** Dashboard (PRD-04) is the core entry point - refactor first to unlock Task/Classes dependencies.

### 🔴 P0 - Critical (Immediate)

1. **Dashboard Overview Refactor** (~16h) ✅ **PHASE 2 COMPLETE**
   - Separate dashboards for Student/Lecturer/Admin roles ✅ Implemented
   - Lecturer: Grading queue, class overview cards, activity feed ✅ Done
   - Student: My essays list, progress tracking, activity feed ✅ Done
   - Admin: Platform stats, system health, user metrics ✅ Done
   - Location: `frontend/src/features/dashboard/`, `frontend/src/app/dashboard/[role]/page.tsx`
   - Status: **Phase 2 Frontend Complete** ✅ (2026-02-25)
   - **Phase 3**: UI compliance fixes (typography, action buttons, filters) - ~3h
   - **Phase 4**: Security remediation (JWT verification, CSRF) - ~2h
   - **Why P0**: Core user entry point, affects all user experience

2. **Dashboard Security Remediation** (~2h) 🔒 **NEW**
   - Fix JWT parsing with signature verification (`page.tsx:8-23`)
   - Add CSRF token handling in API client
   - Fix direct cookie access vulnerability
   - Add focus indicators for keyboard navigation
   - See: `docs/learnings/dashboard-frontend-phase2-code-review.md`

2. **RevisionChat Backend Integration** - ⚠️ **Deferred** (~8h)
   - Backend: Chat endpoint at `/api/v2/ai-feedback/chat/` ✅ Already exists
   - Frontend: Connect to real API (currently using mock data at `revision-chat.tsx:18-25`)
   - Status: **Deferred - Will migrate to LangGraph/LangChain agent**
   - Decision: Current Dify implementation is temporary. Will implement properly after LangGraph migration.
   - For now: Keep mock data, focus on higher priority features (Dashboard refactor, Task/Classes modules)

3. **API v1 → v2 Cleanup** (~8h)
   - Delete `backend/api_v1/` directory ✅ Deleted 2026-02-24
   - Delete `frontend/src/app/api/v1/` ✅ Deleted 2026-02-24
   - Remove DRF dependencies from `backend/pyproject.toml`
   - Status: In progress

### 🟠 P1 - High Priority (This Week)

1. **Task Model Extension** (~3h + migration)
   - Add fields: title, description, instructions, class_id, status, allow_late_submission
   - Location: `backend/core/models.py::Task`
   - Status: Not started
   - **Dependency**: Requires Dashboard refactor (class selection UI)

2. **Task API Endpoints** (~4h)
   - Add: POST /tasks/{id}/publish/, POST /tasks/{id}/unpublish/
   - Add: GET /tasks/{id}/submissions/
   - Location: `backend/api_v2/core/views.py`
   - Status: Not started

3. **Class Model Extension** (~3h + migration)
   - Add fields: name, description, code (join_code), term, year, status
   - Location: `backend/core/models.py::Class`
   - Status: Not started
   - **Dependency**: Requires Dashboard refactor (class overview UI)

4. **Class API Endpoints** (~4h)
   - Add: POST /classes/join/ (join code)
   - Add: GET/POST/DELETE /classes/{id}/students/
   - Add: POST /classes/{id}/archive/
   - Location: `backend/api_v2/core/views.py`
   - Status: Not started

5. **PDF Export Feature** (~4h)
   - Install `@react-pdf/renderer`
   - Create FeedbackPDF component
   - Hook up Export button in essay-analysis page
   - Status: Not started

### 🟡 P2 - Medium Priority (This Month)

1. **Rubric Visibility Enhancement** (~6h)
   - Add `visibility` field to `MarkingRubric` model
   - Public/private toggle UI
   - Student view for public rubrics

2. **Dashboard Enhancement** (~8h)
   - Grading queue for lecturers
   - Activity feed
   - Class overview cards

3. **Authentication Security Hardening** (~9h)
   - Remove client-side token reading
   - Request interceptor standardization
   - Middleware route protection

4. **Save to Portfolio** (~2h)
   - Backend endpoint: `POST /api/v2/core/submissions/{id}/save/`

5. **Apply Fix Feature** (~4h)
   - Display modification suggestions for user decision

### 🟢 P3 - Low Priority (Post-MVP)

- Social Learning Hub (PRD-11) - peer essay sharing
- Analytics Dashboard (PRD-12) - student progress tracking
- Multi-AI provider support (LangChain)
- Internationalization (Chinese)
- Redis caching
- OAuth integration (Google/GitHub)

---

## Refactoring Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Secure authentication + core missing features + Dashboard refactor

| Task | Files to Modify | Priority |
|------|-----------------|----------|
| JWT Refresh Token | `api_v2/auth/views.py`, `api_v2/auth/schemas.py`, `useAuthRefresh.ts` | ✅ Done |
| **Dashboard Overview Refactor** | `frontend/src/app/dashboard/`, `frontend/src/features/dashboard/` | **P0** |
| RevisionChat API | `api_v2/ai_feedback/views.py`, `revision-chat.tsx` | Deferred |
| Task Model Extension | `core/models.py::Task` (+8 fields) | P1 |
| Class Model Extension | `core/models.py::Class` (+9 fields) | P1 |
| Task Publish/Unpublish API | `api_v2/core/views.py` | P1 |
| Class Join Code API | `api_v2/core/views.py` | P1 |

### Phase 2: Feature Completion (Week 3-4)
**Goal**: Complete PRD-defined features

| Task | Files to Modify | Priority |
|------|-----------------|----------|
| PDF Export | `FeedbackPDF.tsx`, `useExportPDF.ts` | P1 |
| Rubric Visibility | `core/models.py::MarkingRubric`, rubric forms | P2 |
| Task Module (PRD-09) | `core/models.py::Task`, `api_v2/core/views.py`, Task components | P1 |
| Class Module (PRD-10) | `core/models.py::Class`, `api_v2/core/views.py`, Class components | P1 |
| Auth Hardening | `request.ts`, `middleware.ts` | ✅ Done (httpOnly cookies, single-flight) |

### Phase 3: Polish & Scale (Month 2+)
**Goal**: Production readiness + advanced features

- Docker containerization
- Nginx reverse proxy
- Social Learning Hub (PRD-11)
- Analytics Dashboard (PRD-12)
- Multi-AI support (LangGraph migration)

---

## Data Model Reference

### Core Models (`backend/core/models.py`)

```python
User              # student/lecturer/admin roles
Class             # ⚠️ Needs implementation for PRD-10
Enrollment        # ⚠️ Needs implementation for PRD-10
MarkingRubric     # ✅ Exists, ⚠️ needs visibility field
RubricItem        # ✅ Exists
RubricLevelDesc   # ✅ Exists
Task              # ⚠️ Exists, needs PRD-09 alignment
Submission        # ✅ Exists
Feedback          # ✅ Exists
FeedbackItem      # ✅ Exists
```

### Missing Models

```python
# For PRD-11 Social Learning Hub
SharedEssay       # Shared submissions
Like              # Peer likes
Bookmark          # Saved essays
Report            # Content reports

# For PRD-12 Analytics
SkillMastery      # Student skill tracking
ProgressSnapshot  # Historical progress
```

---

## API Endpoint Reference

### Implemented (API v2)

| Endpoint | Status | Description |
|----------|--------|-------------|
| `POST /api/v2/auth/login/` | ✅ | User login |
| `POST /api/v2/auth/logout/` | ✅ | User logout |
| `POST /api/v2/auth/register/` | ✅ | User registration |
| `POST /api/v2/auth/refresh/` | ✅ | JWT token refresh with rotation |
| `GET /api/v2/core/dashboard/` | ✅ | Role-aware dashboard data |
| `GET /api/v2/core/users/me/` | ✅ | Get current user |
| `GET /api/v2/core/users/me/classes/` | ✅ | Get user's classes |
| `GET /api/v2/core/rubrics/` | ✅ | List rubrics |
| `POST /api/v2/core/rubrics/` | ✅ | Create rubric |
| `POST /api/v2/core/rubrics/import_from_pdf_with_ai/` | ✅ | AI rubric import |
| `GET /api/v2/core/submissions/` | ✅ | List submissions |
| `POST /api/v2/ai-feedback/analyze/` | ✅ | AI essay analysis |
| `POST /api/v2/ai-feedback/chat/` | ✅ | AI chat (mock) |

### Missing Endpoints

| Endpoint | PRD | Priority |
|----------|-----|----------|
| `POST /api/v2/ai-feedback/chat/` | 05 | P0 |
| `GET/POST /api/v2/core/tasks/` | 09 | P1 |
| `GET/POST /api/v2/core/classes/` | 10 | P1 |
| `POST /api/v2/core/submissions/{id}/share/` | 11 | P3 |
| `GET /api/v2/core/feed/` | 11 | P3 |

---

## Maintenance Guidelines

### After Every Code Change

1. **Update this file** if you:
   - Complete a task listed in Active Development Priorities
   - Add or modify a significant feature
   - Change the architecture or API structure
   - Add new dependencies or remove existing ones

2. **Keep the status current**:
   - Move completed P0/P1 items to "Completed Features"
   - Add new discovered issues to appropriate priority
   - Update version number when milestones are reached
   - Update the PRD vs Implementation table

3. **Maintain consistency**:
   - Keep the Commands section synchronized with Makefile
   - Update the Test Accounts section if credentials change
   - Keep PRD status aligned with actual implementation

### Updating Process

When updating CLAUDE.md:
1. Read the current file first
2. Make targeted edits (don't rewrite everything)
3. Use clear, concise language
4. Include file paths for reference
5. Update the "Last Updated" timestamp at the top

---

## Key Development Context

- **Roles**: The system supports three primary user roles: `student`, `lecturer` (formerly teacher), and `admin`.
- **API Versioning**: Do not modify `api_v1`. Target `api_v2` exclusively.

---

## Environment Setup

### Required Environment Variables

**Backend** (`.env` at project root - NOT in backend/):
- `SECRET_KEY` or `DJANGO_SECRET_KEY`: Django secret key
- `DEBUG`: Set to `True` for development
- `DIFY_API_KEY`: API key for Dify AI service
- `JWT_SECRET`: Secret for JWT token signing
- `POSTGRES_DB`: Database name (default: essaycoach)
- `POSTGRES_USER`: DB username (default: postgres)
- `POSTGRES_PASSWORD`: DB password (default: postgres)
- `POSTGRES_HOST`: DB host (default: 127.0.0.1)
- `POSTGRES_PORT`: DB port (default: 5432)

**Frontend** (`.env.local` in frontend directory):
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://127.0.0.1:8000)
- `NEXT_PUBLIC_API_VERSION`: API version (default: v2)
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN (optional)
- `NEXT_PUBLIC_SENTRY_ORG`: Sentry organization (optional)
- `NEXT_PUBLIC_SENTRY_PROJECT`: Sentry project (optional)

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/manage.py` | Django management entry point |
| `backend/core/models.py` | Single source of truth for database schema |
| `backend/api_v2/api.py` | API v2 router configuration |
| `backend/essay_coach/settings.py` | Django settings (DB, CORS, Ninja config) |
| `backend/essay_coach/middleware.py` | Custom middleware (auth, logging) |
| `frontend/src/app/layout.tsx` | Root layout with providers |
| `frontend/src/lib/request.ts` | API request utilities |
| `Makefile` | Centralized development commands |

---

## Gotchas

- **Virtual Environment**: Backend uses `uv` for dependency management. Virtual environment is at `backend/.venv`, not root `.venv`
- **.env Location**: Backend loads `.env` from project ROOT (via `manage.py`), not from `backend/` directory
- **API v1 Status**: Deleted 2026-02-24. All NEW development targets API v2.
- **Dependency Groups**: Backend uses uv's new `dependency-groups` format (PEP 735), not `[optional-dependencies]`
- **Test Accounts**: Created by `make seed-db` command, not by migrations
- **Port Conflicts**: Backend runs on port 8000, frontend on 5100 - ensure these are available
- **Docker Required**: PostgreSQL runs in Docker - run `make db` before starting backend
- **Parallel Routes**: Dashboard uses Next.js parallel routes (`@bar_stats`, `@pie_stats`, etc.) - all must be included in layout
- **Role Routing**: Dashboard role routing decodes JWT from httpOnly cookie server-side (`/app/dashboard/page.tsx`)

---

## Agent Team Workflow (2026-02-25)

**Dashboard Phase 2 Implementation Pattern:**

```
Orchestrator (multi-agent-coordinator)
├── Fullstack Developer → Implement components
├── UI Designer → Design compliance review (pencil-shadcn.pen)
├── Code Reviewer → Security + quality audit
└── Test Automator → Write tests (vitest + react-testing-library)
```

**Learnings:**
1. **Parallel routes require all slots** - Missing `@sales` slot caused build failure
2. **Icon imports** - Use `@tabler/icons-react` directly, not wrapper components
3. **Design compliance** - Check typography scale (design: 32px/600, not Tailwind defaults)
4. **Security first** - JWT parsing needs signature verification, CSRF tokens required
5. **Test early** - 201 tests created, caught rendering issues early

**Documentation locations:**
- Implementation: `docs/learnings/dashboard-frontend-implementation.md`
- UI Review: `docs/learnings/dashboard-ui-design-review.md`
- Code Review: `docs/learnings/dashboard-frontend-phase2-code-review.md`
- Testing: `docs/learnings/dashboard-testing-implementation.md`

---

## 🔍 Security Findings (2026-02-25 Code Review)

**Dashboard Phase 2 Code Review - 28 findings total**

| Severity | Count | Issues |
|----------|-------|--------|
| 🔴 High | 5 | JWT parsing without signature verification, CSRF handling missing, direct cookie access, missing focus indicators, button links without aria-labels |
| 🟠 Medium | 8 | TypeScript strictness, re-render optimization, color contrast |
| 🟢 Low | 15 | Minor accessibility, code style |

**Immediate Actions Required:**
1. Add JWT signature verification in `/app/dashboard/page.tsx`
2. Implement CSRF token handling in API client
3. Fix direct cookie access to use secure HTTP-only pattern
4. Add keyboard focus indicators
5. Add unique aria-labels to icon buttons

**Full report**: `docs/learnings/dashboard-frontend-phase2-code-review.md`

---

## 🚨 Security Warnings (Archive)

**Resolved Issues:**

| Issue | Status | Date Fixed |
|-------|--------|------------|
| JWT Refresh Token Mechanism | ✅ Implemented | 2026-02-24 |
| RBAC Missing on Users CRUD | ✅ Fixed | 2026-02-24 |
| Cookie httpOnly=false | ✅ Fixed | 2026-02-24 |
| Navigation links to 404 pages | ✅ Fixed | 2026-02-24 |

---

## Technical Debt (Verified 2026-02-24)

| Debt | Impact | Fix Effort | Status |
|------|--------|------------|--------|
| Task model missing 8 fields (title, description, instructions, class_id, status, etc.) | Blocks PRD-09 | ~6h + migration | Pending |
| Class model missing 9 fields (name, description, code/join_code, term, status, etc.) | Blocks PRD-10 | ~6h + migration | Pending |
| DRF dependencies残留 (djangorestframework in pyproject.toml + settings.py) | Technical debt | ~1h | Pending |
| Missing publish/unpublish task endpoints | Blocks task workflow | ~2h | Pending |
| Missing join code feature (student self-enrollment) | Blocks class enrollment | ~3h | Pending |
| Missing class students CRUD endpoints | Incomplete class management | ~3h | Pending |
| Missing task submissions endpoint | Incomplete task management | ~2h | Pending |
| v2 API Proxy hardcoded (127.0.0.1:8000) | Production config issue | ~1h | Pending |

### Documentation Consistency Issues (Verified 2026-02-24)

| Issue | Description |
|-------|-------------|
| Single source of truth | CLAUDE.md is now updated with accurate status after security audit |
| Frontend routes | Navigation links to 404 pages removed 2026-02-24 |

### Code Hygiene Issues (Verified 2026-02-24)

| Issue | Location | Status |
|-------|----------|--------|
| v2 proxy hardcoded URL | `frontend/src/app/api/v2/[...path]/route.ts:3` | Pending |
| DRF dependencies残留 | `backend/pyproject.toml`, `backend/essay_coach/settings.py` | Pending |

- **`docs/prd/`**: Product Requirement Documents (14 modules) - **Source of truth for features**

### Development Priorities Strategy
- **RevisionChat Deferred**: Dify implementation is temporary; will migrate to LangGraph/LangChain agent. Continue using mock data.
- **Refactor > New Features**: Prioritize refactoring existing features to match PRD/UI design before implementing new functionality.
- **Dashboard First**: Dashboard Overview Refactor unlocks Task and Classes module development (dependency chain).
- **`docs/architecture/`**: System architecture docs
- **`pencil-shadcn.pen`**: UI design file (Codegen Ready: GO_CONDITIONAL)
- **`D2C_IMPLEMENTATION_CONTRACT_STANDARD.md`**: Design-to-code contract template
