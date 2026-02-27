# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **IMPORTANT**: This file is the single source of truth for project status. Update it after every significant code change to reflect the current state and next priorities.
>
- **Last Updated**: 2026-02-28 (Backend Python type-system refactor completed)
- **Incremental Update**: 2026-02-28 (Backend Python type-system refactor completed, PRD 11-14 modules bootstrapped)
- **Incremental Update**: 2026-02-27 (Dashboard Overview route fix + Task/Class backend hardening + Rubrics SSR URL fix + health-check workflow + real Chrome DevTools validation + typed-architecture roadmap)

---

## Commands

### Development Server
- **Full Dev Stack**: `make dev` (starts DB, Backend on port 8000, Frontend on port 5100)
- **Backend Only**: `make dev-backend`
- **Frontend Only**: `make dev-frontend`
- **Database (Docker)**: `make db` (starts Postgres), `make db-stop`
- **Seed Database**: `make seed-db` (creates test accounts)

### Dev Health & Self-Healing (Added 2026-02-27)
- **Health Check + Auto Recover**: `make health` (checks backend/frontend, restarts unhealthy service)
- **Health Check Only**: `make health-check` (checks only, no restart)
- **Script Direct**: `./scripts/dev/health-check.sh`, `./scripts/dev/health-check.sh --check-only`

### Dependency Management
- **Install All**: `make install` (uses `uv` for Python, `pnpm` for Node)
- **Backend Migrations**: `make migrate`

### Testing
- **All Tests**: `make test` (runs both api_v1 and api_v2 tests)
- **Backend Tests (API v2 only)**: `cd backend && uv run pytest api_v2/ -v`
- **Frontend Tests**: `cd frontend && pnpm test`
- **Targeted Frontend Tests**: `cd frontend && pnpm exec vitest run src/features/<path>/<file>.test.ts`
  > **Note**: `pnpm test -- <path>` may still run broad suites; `pnpm exec vitest run <file>` is more precise for single-file runs.

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
- **Dashboard Overview Route Hardening (PRD-04 follow-up)** ✅ Complete 2026-02-27
  - Added missing route page: `frontend/src/app/dashboard/overview/page.tsx`
  - Fixed layout composition to render overview page correctly: `frontend/src/app/dashboard/overview/layout.tsx`
  - Updated page container to support extension styles: `frontend/src/components/layout/page-container.tsx` (`className` support)
  - Updated breadcrumbs route mapping for current dashboard routes: `frontend/src/hooks/use-breadcrumbs.tsx`
  - Validation: overview frontend test passing (`38/38`)
- **Task/Class Backend Hardening (PRD-09/10 follow-up)** ✅ Complete 2026-02-27
  - Fixed query parsing for list filters/pagination (`Query(...)`) in `backend/api_v2/core/views.py`
  - Added `IsAdminOrLecturer` permission enforcement for task/class create endpoints
  - Added defensive 400 handling for missing related entities instead of server errors
  - `TaskIn.task_instructions` default set to empty string in `backend/api_v2/core/schemas.py`
  - `Class` join code normalization/auto-generation added in `backend/core/models.py`
  - Validation: backend suites passing (`test_task_class_crud.py` + `test_task_class_actions.py`)
- **Rubrics SSR Fetch Fix** ✅ Complete 2026-02-27
  - Server component now uses backend absolute URL + cookie token flow (fixes relative URL/Invalid URL issues in SSR)
  - File: `frontend/src/app/dashboard/rubrics/page.tsx`
- **Auth Proxy/Service Consolidation (v2)** ✅ Complete 2026-02-27
  - Added/updated auth proxy endpoints under `frontend/src/app/api/v2/auth/`
  - Updated API service/store integration: `frontend/src/service/api/v2/auth.ts`, `frontend/src/stores/authStore.ts`
  - Added test coverage updates: `frontend/src/stores/__tests__/authStore.test.ts`
- **Profile & Settings Sync (Phase 2)** ✅ Complete 2026-02-27
  - Settings: Role-based sidebar rendering (Organization/API keys hidden for non-admins)
  - Settings: Forms integrated with backend hooks (toast notifications added)
  - Profile: Role-based tabs (Achievements hidden for non-students)
  - Tests: 3 new feature-specific tests added and passing
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
- **Dashboard UI Compliance (Phase 3)** ✅ Complete 2026-02-25
  - Updated role dashboard components to align with current UI/test expectations
  - Dashboard component + hook tests passing: 201/201
  - Frontend build passes (`pnpm build`)
  - Type cleanup complete: removed duplicate dashboard interfaces in `frontend/src/service/api/v2/types.ts`
- **Sidebar Fix** ✅ Complete 2026-02-25
  - Added skeleton loading state during auth initialization
  - Added placeholder UI when no classes available
  - Fixed icon mismatches (`IconBook`, `IconChevronsDown`)
  - Documentation: `docs/learnings/sidebar-fix-implementation.md`
- **Test Account Quick-Fill** ✅ Complete 2026-02-25
  - Added Student/Lecturer/Admin quick-fill buttons on login page
  - Documentation: `docs/learnings/test-account-quick-fill.md`
- **Code Hygiene (Phase 1)** ✅ Complete 2026-02-25
  - Deleted 5 orphaned v1 auth route files
  - Fixed hardcoded API URLs to use `NEXT_PUBLIC_API_URL` env var
- **Task + Class Model Extension (Phase 2)** ✅ Complete 2026-02-25
  - Task model: +6 fields (title, description, instructions, class_id, status, allow_late)
  - Class model: +7 fields (name, description, join_code, term, year, status, archived_at)
  - Migrations created and applied
  - API endpoints: publish/unpublish/submissions, join/students/archive
  - Tests: 21 pytest tests passing
- **Tasks + Classes Module (PRD-09/10)** ✅ Complete 2026-02-26
  - Backend: Full CRUD + action endpoints (publish/unpublish/submissions/join/leave/archive)
  - Frontend: Full routes, components, navigation integration
  - Testing: 15 service tests + 16 backend CRUD tests passing
- **Profile Backend API (PRD-08)** ✅ Complete 2026-02-26
  - Models: Badge, UserBadge created with migrations
  - Endpoints: `/api/v2/core/users/{user_id}/stats/`, `/badges/`, `/progress/`
  - Testing: 18 pytest tests passing
  - Location: `backend/api_v2/core/views.py`, `backend/core/models.py`
- **Settings Backend API (PRD-07)** ✅ Complete 2026-02-26
  - Models: User.preferences (JSONField) added to store user settings
  - Endpoints implemented:
    - `PUT /api/v2/auth/password-change/` - Change password with current password verification ✅ Already existed
    - `POST /api/v2/auth/settings/avatar/` - Upload avatar (PNG/JPG, max 5MB) ✅ New
    - `GET /api/v2/auth/settings/preferences/` - Get user preferences ✅ New
    - `PUT /api/v2/auth/settings/preferences/` - Update user preferences (partial update) ✅ New
    - `GET /api/v2/auth/settings/sessions/` - List active sessions ✅ New
    - `DELETE /api/v2/auth/settings/sessions/{session_id}/` - Revoke session ✅ New
    - `GET /api/v2/auth/settings/login-history/` - Get login history ✅ New
  - Schemas: UserPreferencesIn, UserPreferencesOut, SessionOut, LoginHistoryOut, AvatarUploadOut
  - Testing: 19 pytest tests passing (password change, preferences, avatar, sessions, login history)
  - Frontend: types.ts + settingsService API client + 8 vitest tests
  - Location: `backend/api_v2/auth/views.py`, `backend/api_v2/auth/schemas.py`, `backend/core/models.py`
  - Migration: `core/0008_badge_user_preferences_userbadge_and_more.py` (includes User.preferences field)
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
- RevisionChat Backend Integration (~8h) - **Deferred to LangGraph migration**
- API v1 → v2 migration (cleanup pending)
- RevisionChat Backend Integration (~8h)

#### 🔍 PRD vs Implementation Gap Analysis

| PRD Module | Status | Gap Summary | Priority |
|------------|--------|-------------|----------|
| 01 Landing Page | ✅ Implemented | - | - |
| 02 Sign In | ✅ Implemented | - | - |
| 03 Sign Up | ✅ Implemented | - | - |
| 04 Dashboard Overview | ✅ Complete | Phase 3 complete: dashboard components + `useDashboardData` hook tests passing (201 tests total), frontend build passing. | - |
| 05 Essay Practice | ✅ Complete | Skill radar chart implemented (68 tests). Missing: PDF export (~4h), RevisionChat backend (Deferred) | - |
| 06 Rubrics | ⚠️ Partial | Missing: Visibility field (public/private, ~3h), student view (~3h) | 🟡 P2 |
| 07 Settings | ✅ Implemented | Phase 2 Functional sync complete (role-based rendering, form hooks integrated, 3 tests passing) | - |
| 08 Profile | ✅ Implemented | Phase 2 Functional sync complete (role-based tabs, Student/Lecturer/Admin specific views, 1 test passing) | - |
| 09 Assignments (Tasks) | ✅ Complete | Backend: Full CRUD + action endpoints. Frontend: Full components, routes, navigation. Tests: 17 passing. | - |
| 10 Classes | ✅ Complete | Backend: Full CRUD + action endpoints. Frontend: Full components, routes, navigation. Tests: 14 passing. | - |
| 11 Social Learning Hub | 🚧 Contract Bootstrapped | Backend typing/schemas defined. Core business logic pending. | 🟢 P3 |
| 12 Analytics | 🚧 Contract Bootstrapped | Backend typing/schemas defined. Core business logic pending. | 🟢 P3 |
| 13 Users (Admin) | 🚧 Contract Bootstrapped | Backend typing/schemas defined. Core business logic pending. | 🟢 P3 |
| 14 Help Center | 🚧 Contract Bootstrapped | Backend typing/schemas defined. Core business logic pending. | 🟢 P3 |

| PRD Module | Status | Gap Summary | Priority |
|------------|--------|-------------|----------|
| 01 Landing Page | ✅ Implemented | - | - |
| 02 Sign In | ✅ Implemented | - | - |
| 03 Sign Up | ✅ Implemented | - | - |
| 04 Dashboard Overview | ✅ Complete | Phase 3 complete: dashboard components + `useDashboardData` hook tests passing (201 tests total), frontend build passing, and duplicated dashboard type declarations removed. | - |
| 05 Essay Practice | ✅ Complete | Skill radar chart implemented (68 tests). Missing: PDF export (~4h), RevisionChat backend (Deferred) | - |
| 06 Rubrics | ⚠️ Partial | Missing: Visibility (public/private), student view, duplicate | 🟡 P2 |
| 07 Settings | ✅ Implemented | Phase 2 Functional sync complete (role-based rendering, form hooks integrated, 3 tests passing) | - |
| 08 Profile | ✅ Implemented | Phase 2 Functional sync complete (role-based tabs, Student/Lecturer/Admin specific views, 1 test passing) | - |
| 09 Assignments (Tasks) | ✅ Complete | Backend: Model fields, schemas, CRUD + publish/unpublish/submissions endpoints complete with 10 tests. Frontend: Full components (list, card, form, submissions), routes (/dashboard/tasks/*), navigation, and 7 service tests. Build passes. | - |
| 10 Classes | ✅ Complete | Backend: Model fields, schemas, CRUD + join/leave/students/archive endpoints complete with 6 tests. Frontend: Full components (list, card, form, detail, roster, join dialog), routes (/dashboard/classes/*), navigation, and 8 service tests. Build passes. | - |
| 11 Social Learning Hub | 🚧 Contract Bootstrapped | Backend typing/schemas defined. Core business logic pending. | 🟢 P3 |
| 12 Analytics | 🚧 Contract Bootstrapped | Backend typing/schemas defined. Core business logic pending. | 🟢 P3 |
| 13 Users (Admin) | 🚧 Contract Bootstrapped | Backend typing/schemas defined. Core business logic pending. | 🟢 P3 |
| 14 Help Center | 🚧 Contract Bootstrapped | Backend typing/schemas defined. Core business logic pending. | 🟢 P3 |

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
  - **Phase 3**: UI compliance fixes (typography, action buttons, filters) - ✅ complete (components + hooks stabilized)
   - **Phase 4**: Security remediation (JWT verification, CSRF) - ~2h
   - **Why P0**: Core user entry point, affects all user experience

2. **Dashboard Security Remediation** (~2h) 🔒 **COMPLETE 2026-02-25**
   - ✅ Fix JWT parsing with signature verification (`page.tsx:8-23`)
   - ✅ Add CSRF token handling in API client
   - ✅ Fix direct cookie access vulnerability
   - Add focus indicators for keyboard navigation (A11Y, optional)
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
   - Remove DRF dependencies from `backend/pyproject.toml` ✅ Clarified 2026-02-25 - DRF is required by simplejwt, not removable
   - Status: ✅ Complete

### 🟠 P1 - High Priority (This Week)

1. **PDF Export Feature** (~4h) ✅ **COMPLETE 2026-02-26**
   - ✅ Install `@react-pdf/renderer` (already installed)
   - ✅ Create FeedbackPDF component: `frontend/src/features/essay-feedback/components/feedback-pdf.tsx`
   - ✅ Create export hook: `frontend/src/features/essay-feedback/hooks/useExportPDF.tsx`
   - ✅ Hook up Export button in essay-analysis page
   - ✅ Tests: 29 tests passing (16 component + 13 hook)
   - ✅ Documentation: `docs/learnings/pdf-export-implementation.md`
   - Status: ✅ Complete

2. **Skill Radar Chart** (~4h) ✅ **COMPLETE 2026-02-26**
   - ✅ Implement radar chart for Essay Practice feedback
   - ✅ Show mastery across writing dimensions (Grammar, Logic, Tone, Structure, Vocabulary)
   - ✅ Files: `frontend/src/features/essay-feedback/components/skill-radar-chart.tsx`, `useSkillRadar.ts`
   - ✅ Tests: 68 tests passing (33 component + 35 hook)
   - ✅ Documentation: `docs/learnings/skill-radar-chart-implementation.md`
   - Status: ✅ Complete

3. **Rubric Visibility Enhancement** (~6h)
   - Add `visibility` field to `MarkingRubric` model
   - Public/private toggle UI
   - Student view for public rubrics
   - Status: Not started

### 🟡 P2 - Medium Priority (This Month)

1. **Dashboard Enhancement** (~8h)
   - Grading queue for lecturers
   - Activity feed
   - Class overview cards
   - Status: Not started

2. **Save to Portfolio** (~2h)
   - Backend endpoint: `POST /api/v2/core/submissions/{id}/save/`
   - Status: Not started

3. **Apply Fix Feature** (~4h)
   - Display modification suggestions for user decision
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
| **Dashboard Overview Refactor** | `frontend/src/app/dashboard/`, `frontend/src/features/dashboard/` | **P0** ✅ Done |
| RevisionChat API | `api_v2/ai_feedback/views.py`, `revision-chat.tsx` | Deferred |
| Task Model Extension | `core/models.py::Task` (+8 fields) | ✅ Completed 2026-02-26 |
| Class Model Extension | `core/models.py::Class` (+7 fields) | ✅ Completed 2026-02-26 |
| Task Publish/Unpublish API | `api_v2/core/views.py` | ✅ Completed 2026-02-26 |
| Class Join Code API | `api_v2/core/views.py` | ✅ Completed 2026-02-26 |
|------|-----------------|----------|
| JWT Refresh Token | `api_v2/auth/views.py`, `api_v2/auth/schemas.py`, `useAuthRefresh.ts` | ✅ Done |
| **Dashboard Overview Refactor** | `frontend/src/app/dashboard/`, `frontend/src/features/dashboard/` | **P0** |
| RevisionChat API | `api_v2/ai_feedback/views.py`, `revision-chat.tsx` | Deferred |
| Task Model Extension | `core/models.py::Task` (+8 fields) | P1 |
| Class Model Extension | `core/models.py::Class` (+7 fields added; migration pending) | P1 |
| Task Publish/Unpublish API | `api_v2/core/views.py` | P1 |
| Class Join Code API | `api_v2/core/views.py` | P1 |

### Phase 2: Feature Completion (Week 3-4)
**Goal**: Complete PRD-defined features

| Task | Files to Modify | Priority |
|------|-----------------|----------|
| PDF Export | `frontend/src/features/essay-feedback/components/feedback-pdf.tsx`, `useExportPDF.tsx` | ✅ Complete |
| Rubric Visibility | `core/models.py::MarkingRubric`, rubric forms | P2 |
| Task Module (PRD-09) | `core/models.py::Task`, `api_v2/core/views.py`, Task components | ✅ Complete |
| Class Module (PRD-10) | `core/models.py::Class`, `api_v2/core/views.py`, Class components | ✅ Complete |
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
| `frontend/src/lib/auth.ts` | JWT validation utilities |
| `Makefile` | Centralized development commands |
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

- **Docker Required**: PostgreSQL runs in Docker - run `make db` before starting backend
- **Parallel Routes**: Dashboard uses Next.js parallel routes (`@bar_stats`, `@pie_stats`, etc.) - all must be included in layout
- **Role Routing**: Dashboard role routing decodes JWT from httpOnly cookie server-side (`/app/dashboard/page.tsx`)
- **Duplicate Interface Declarations**: TypeScript allows duplicate interface names (merging); LSP won't flag these. Use `grep` to find duplicates before declaring types clean.
- **Build Warnings**: `pnpm build` passes with pre-existing warnings (console statements, unused vars). These are non-blocking; focus on errors only.
- **DRF Dependency**: `djangorestframework` is required by `djangorestframework-simplejwt` for JWT token handling. Project does NOT use DRF's API framework (views, serializers, routers) — only uses simplejwt for token generation/blacklist/rotation. Do not remove unless migrating to pure `pyjwt`.
- **Authentication Pattern**: Hybrid approach - httpOnly cookies for tokens (secure), localStorage for user data (client access)
- **Login Flow**: After login, MUST store user data to localStorage OR auth context fails to initialize
- **Server vs Client Auth**: Server components (`/dashboard/page.tsx`) strictly validate JWT cookies; client components use localStorage (more forgiving)
- **Cookie Propagation**: Setting cookie in one request doesn't guarantee availability in next server component (race condition)
- **Edit Tool Risk**: Can create duplicate code blocks; use `write` instead of `edit` for large rewrites (>50% change)
- **Test Accounts**: Created by `make seed-db` (admin/lecturer/student@example.com). Login page has Student/Lecturer/Admin quick-fill buttons for fast testing
- **Parallel Routes**: Dashboard uses Next.js parallel routes (`@bar_stats`, `@pie_stats`, etc.) - all must be included in layout
- **Role Routing**: Dashboard role routing decodes JWT from httpOnly cookie server-side (`/app/dashboard/page.tsx`)
- **Duplicate Interface Declarations**: TypeScript allows duplicate interface names (merging); LSP won't flag these. Use `grep` to find duplicates before declaring types clean.
- **Build Warnings**: `pnpm build` passes with pre-existing warnings (console statements, unused vars). These are non-blocking; focus on errors only.
- **DRF Dependency**: `djangorestframework` is required by `djangorestframework-simplejwt` for JWT token handling. Project does NOT use DRF's API framework (views, serializers, routers) — only uses simplejwt for token generation/blacklist/rotation. Do not remove unless migrating to pure `pyjwt`.

---

## Security Patterns

### JWT Validation (Server Components)
- Use `jose` library: `jwtVerify(token, new TextEncoder().encode(JWT_SECRET))`
- Never use manual `atob(token.split('.')[1])` parsing - vulnerable to tampering
- Location: `frontend/src/lib/auth.ts`

### Hybrid Authentication Pattern
- **httpOnly cookies**: Store sensitive tokens (access_token, refresh_token)
- **localStorage**: Store non-sensitive user data (id, email, name, role)
- **Login**: Set both cookie + localStorage, then navigate
- **Logout**: Clear both cookie + localStorage
- **Why**: httpOnly cookies can't be read by JS, but client components need user data

### CSRF Protection (API Client)
- Use `jose` library: `jwtVerify(token, new TextEncoder().encode(JWT_SECRET))`
- Never use manual `atob(token.split('.')[1])` parsing - vulnerable to tampering
- Location: `frontend/src/lib/auth.ts`

### CSRF Protection (API Client)
- Read Django `csrftoken` cookie: `document.cookie.match(/csrftoken=([^;]+)/)`
- Add to headers: `headers['X-CSRFToken'] = csrfToken` for POST/PATCH/DELETE
- Include `credentials: 'include'` for cookie-based auth

### Edit vs Write Tool
- Large `edit` operations may append instead of replace, causing duplicate content
- Use `write` when completely rewriting files (>50% content change)
- Verify with `read` after edits if build shows duplicate identifier errors

---

## Frontend Test Patterns

### Hook Testing with Fake Timers
- **Scope fake timers** to specific `describe` blocks using `vi.useFakeTimers()` / `vi.useRealTimers()` in `beforeEach`/`afterEach`
- **Avoid global fake timers** — they interfere with async state updates in other tests
- **Behavior-based assertions** > exact call counts for retry/refresh logic (timing can vary)
- **Wrap async refreshes** in `act(async () => { await refresh() })` to suppress React warnings

### Component Test Patterns
- Mock shadcn/ui components with `data-testid` attributes for reliable queries
- Use `@testing-library/react` `screen.getByText()` over container queries
- Skeleton loading states should have `animate-pulse` class for test assertions



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

**Immediate Actions Required**:
1. ✅ Add JWT signature verification in `/app/dashboard/page.tsx` - **DONE 2026-02-25**
2. ✅ Implement CSRF token handling in API client - **DONE 2026-02-25**
3. ✅ Fix direct cookie access to use secure HTTP-only pattern - **DONE 2026-02-25**
4. Add keyboard focus indicators (A11Y - optional)
5. Add unique aria-labels to icon buttons (A11Y - optional)
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
| **Dashboard JWT Validation** | ✅ Fixed | 2026-02-25 |
| **Dashboard CSRF Protection** | ✅ Fixed | 2026-02-25 |
|-------|--------|------------|
| JWT Refresh Token Mechanism | ✅ Implemented | 2026-02-24 |
| RBAC Missing on Users CRUD | ✅ Fixed | 2026-02-24 |
| Cookie httpOnly=false | ✅ Fixed | 2026-02-24 |
| Navigation links to 404 pages | ✅ Fixed | 2026-02-24 |

---

## Latest Validation Snapshot (2026-02-27)

### Automated Validation
- Frontend targeted test: `cd frontend && pnpm test src/app/dashboard/overview/page.test.tsx` -> **PASS (38/38)**
- Backend task/class CRUD: `cd backend && uv run pytest api_v2/tests/test_task_class_crud.py -q` -> **PASS (16 passed)**
- Backend task/class actions: `cd backend && uv run pytest api_v2/tests/test_task_class_actions.py -q` -> **PASS (21 passed)**
- Health check command: `make health-check` -> **PASS (backend OK, frontend OK)**

### Real Browser Validation (Chrome DevTools)
- URL: `http://127.0.0.1:5100/auth/sign-in/`
- Login with seeded student account succeeded
- Verified redirect to `/dashboard/overview/`
- Verified navigation and rendering:
  - `View Rubrics` -> `/dashboard/rubrics/`
  - `Submit New Essay` -> `/dashboard/essay/`

### Website Unreachable Runbook (Local Dev)
- Common symptom: random `ENOENT` or missing `/_next/static/*` leading to blank page/500/404 loops
- Fast fix:
  1. `make health` (auto-check + restart unhealthy services)
  2. If frontend still unhealthy: `find frontend/.next -mindepth 1 -delete`
  3. Restart frontend: `make dev-frontend`
  4. Confirm: `make health-check`

---

## Technical Debt

| Debt | Impact | Fix Effort | Status |
|------|--------|------------|--------|
| Task model missing 8 fields (title, description, instructions, class_id, status, etc.) | Blocks PRD-09 | ~6h + migration | ✅ Completed 2026-02-26 |
| Class model missing 9 fields (name, description, code/join_code, term, status, etc.) | Blocks PRD-10 | ~6h + migration | ✅ Completed 2026-02-26 |
| DRF dependencies 残留 (djangorestframework in pyproject.toml + settings.py) | Technical debt | ~1h | ✅ Resolved 2026-02-25 - DRF is required by simplejwt for JWT handling, not removable |

### Documentation Consistency Issues

| Issue | Description |
|-------|-------------|
| Single source of truth | CLAUDE.md updated with accurate status after security audit |
| Frontend routes | Navigation links to 404 pages removed 2026-02-24 |

### Code Hygiene Issues

| Issue | Location | Status |
|-------|----------|--------|
| v2 proxy hardcoded URL | `frontend/src/app/api/v2/[...path]/route.ts:3` | Pending |

| Debt | Impact | Fix Effort | Status |
|------|--------|------------|--------|
| Task model missing 8 fields (title, description, instructions, class_id, status, etc.) | Blocks PRD-09 | ~6h + migration | Pending |
| Class model missing 9 fields (name, description, code/join_code, term, status, etc.) | Blocks PRD-10 | ~6h + migration | Pending |
| DRF dependencies 残留 (djangorestframework in pyproject.toml + settings.py) | Technical debt | ~1h | ✅ Resolved 2026-02-25 - DRF is required by simplejwt for JWT handling, not removable |

### Documentation Consistency Issues (Verified 2026-02-24)

| Issue | Description |
|-------|-------------|
| Single source of truth | CLAUDE.md is now updated with accurate status after security audit |
| Frontend routes | Navigation links to 404 pages removed 2026-02-24 |

### Code Hygiene Issues (Verified 2026-02-24)

| Issue | Location | Status |
|-------|----------|--------|
| v2 proxy hardcoded URL | `frontend/src/app/api/v2/[...path]/route.ts:3` | Pending |
| DRF dependencies 残留 | `backend/pyproject.toml`, `backend/essay_coach/settings.py` | ✅ Clarified 2026-02-25 - DRF is simplejwt dependency, not directly used |

- **`docs/prd/`**: Product Requirement Documents (14 modules) - **Source of truth for features**

### Development Priorities Strategy
- **RevisionChat Deferred**: Dify implementation is temporary; will migrate to LangGraph/LangChain agent. Continue using mock data.
- **Refactor > New Features**: Prioritize refactoring existing features to match PRD/UI design before implementing new functionality.
- **Dashboard First**: Dashboard Overview Refactor unlocks Task and Classes module development (dependency chain).
- **`docs/architecture/`**: System architecture docs
- **`pencil-shadcn.pen`**: UI design file (Codegen Ready: GO_CONDITIONAL)
- **`D2C_IMPLEMENTATION_CONTRACT_STANDARD.md`**: Design-to-code contract template

---

## Backend Python Type System Refactor Plan (2026-02-27)

This section defines the canonical plan for rebuilding backend typing quality and preparing API contracts for unimplemented PRDs (11/12/13/14).

### Why This Plan Exists

- API v2 has strong schema adoption, but contract consistency is uneven (some handlers return raw dicts while annotated as schemas).
- Domain constraints exist in Django models but are not fully represented in schema-layer types.
- Static checking is not strict enough for safe expansion into Social Hub / Analytics / Users(Admin) / Help Center.
- PRD requirements for planned modules include endpoint families that are currently not present in typed backend modules.

### Current Assessment (Type Safety Baseline)

| Dimension | Current State | Risk | Target |
|-----------|---------------|------|--------|
| API contract consistency | Partial (mixed schema + raw dict returns) | High | Contract-first on all public handlers |
| Domain constrained fields | Partial (`str` used where enum/literal should be used) | High | Enum/Literal single source |
| Shared type reuse | Partial (base schema exists but repeated patterns remain) | Medium | One canonical base + aliases |
| Static checker rigor | Basic mode with key checks relaxed | High | Incremental strict mode in CI |
| PRD-11~14 readiness | Low (no dedicated typed modules/contracts) | High | Typed contracts before business rollout |

### Source Evidence (Key Files)

- API router boundary: `backend/api_v2/api.py`
- Shared schema base: `backend/api_v2/schemas/base.py`
- Core contracts/views: `backend/api_v2/core/schemas.py`, `backend/api_v2/core/views.py`
- Auth contracts/views: `backend/api_v2/auth/schemas.py`, `backend/api_v2/auth/views.py`
- AI contracts/views: `backend/api_v2/ai_feedback/schemas.py`, `backend/api_v2/ai_feedback/views.py`
- AI domain schemas/interfaces: `backend/ai_feedback/schemas.py`, `backend/ai_feedback/interfaces.py`
- Stale service typing risk: `backend/core/services.py`
- Type-check config: `backend/pyrightconfig.json`, `backend/pyproject.toml`
- Planned PRDs: `docs/prd/11-social-learning-hub.md`, `docs/prd/12-analytics.md`, `docs/prd/13-users.md`, `docs/prd/14-help.md`

### Type-System North Star (Target Architecture)

1. **Type-First Development**
   - Define schema/DTO/protocol first, then implement handler/service.
   - No new endpoint without explicit request/response types.

2. **Single Source of Truth for Domain Primitives**
   - Consolidate role/status/source/visibility states into centralized enum/literal definitions.
   - Enforce consistent use in schemas, services, and validation.

3. **Layered Typing Model**
   - `Domain Types` (enums, IDs, value objects)
   - `API Contracts` (Ninja/Pydantic schemas)
   - `Service Protocols` (business contracts, structural typing)
   - `Persistence Adapters` (ORM mapping + conversion)

4. **Strict-by-Default Governance**
   - Gradually move pyright from `basic` to strict policy with module-based rollout.
   - CI must fail on contract drift and type regressions.

### Refactor & Initialization Roadmap

#### Phase 0 — Stabilization (Week 1) ✅ Complete
Goal: remove blocking type debt in existing modules.

- Fix all current pyright errors in:
  - `backend/api_v2/core/views.py`
  - `backend/api_v2/auth/views.py`
  - `backend/api_v2/utils/jwt_auth.py`
  - `backend/core/services.py`
- Remove stale schema references and undefined type names in `backend/core/services.py`.
- Ensure high-traffic routes declare `response=...` contracts (no implicit response shape).
- Replace mutable defaults in schemas (e.g. list/dict defaults) with `Field(default_factory=...)`.

Exit criteria:
- `pyright api_v2 ai_feedback core` returns 0 errors.
- No stale V3 type names remain in active services.

#### Phase 1 — Domain Typing Core (Week 2) ✅ Complete
Goal: establish reusable primitives for current and future PRDs.

- Create centralized type primitives (new module namespace):
  - `backend/api_v2/types/ids.py`
  - `backend/api_v2/types/enums.py`
  - `backend/api_v2/types/common.py`
- Introduce typed IDs (`NewType`) for core entities:
  - `UserId`, `ClassId`, `TaskId`, `SubmissionId`, `FeedbackId`, `RubricId`
- Migrate constrained fields to enum/literal-backed types:
  - `user_role`, `user_status`, `task_status`, `class_status`, `feedback_source`, `visibility`
- Remove duplicated pagination/response patterns and align with `backend/api_v2/schemas/base.py`.

Exit criteria:
- Constrained fields in schemas no longer use unconstrained free-form `str`.
- Shared base response/pagination types are reused across modules.

#### Phase 2 — Contract Unification (Week 3) ✅ Complete
Goal: eliminate schema drift in existing feature modules.

- Unify AI schema source-of-truth:
  - Reconcile `backend/api_v2/ai_feedback/schemas.py` and `backend/ai_feedback/schemas.py`.
  - Align `analysis_metadata`, `token_usage`, `tracing` field types.
- Normalize dashboard payload construction:
  - Return concrete schema objects instead of dicts for typed handlers.
- Standardize handler signatures and return annotations across `api_v2`.

Exit criteria:
- No semantic duplication for the same API payload across modules.
- Dashboard/auth/ai handlers are type-consistent end-to-end.

#### Phase 3 — PRD-09/10 Contract Completion (Week 4) ✅ Complete
Goal: complete typed contracts for remaining Tasks/Classes requirements.

- Add typed endpoint contracts and handlers for:
  - Task duplicate: `POST /api/v2/core/tasks/{task_id}/duplicate`
  - Task deadline extension: `POST /api/v2/core/tasks/{task_id}/extend`
  - Batch enroll: `POST /api/v2/admin/classes/batch-enroll/`
  - Invite lecturer: `POST /api/v2/admin/users/invite-lecturer/`
- Use explicit request/response schemas even when business implementation is staged.

Exit criteria:
- PRD-09/10 endpoint list has typed API contracts aligned with docs.

#### Phase 4 — PRD-11/12 Type-System Initialization (Weeks 5-6) ✅ Complete
Goal: bootstrap Social Hub + Analytics with contract-first modules.

- Create dedicated typed modules (no dumping into `core/views.py`):
  - `backend/api_v2/social/` (schemas, views, service_protocols)
  - `backend/api_v2/analytics/` (schemas, views, service_protocols)
- Define domain enums/literals before implementation:
  - Social: visibility, interaction type, moderation action, report status
  - Analytics: metric name, granularity, scope (student/class/institution)
- Add minimal stubs where needed (feature-flag or 501) but keep schema stable.

Exit criteria:
- PRD-11/12 have stable typed API surfaces and OpenAPI visibility.

#### Phase 5 — PRD-13/14 Type-System Initialization (Weeks 7-8) ✅ Complete
Goal: bootstrap Users(Admin) + Help Center with strict contracts.

- Add typed modules:
  - `backend/api_v2/users_admin/`
  - `backend/api_v2/help/`
- Define typed workflows:
  - Users: disable/enable/reset-password/activity-log action contracts
  - Help: article/category/search/feedback/ticket contracts
- Ensure all new action endpoints use explicit response envelopes and error types.

Exit criteria:
- PRD-13/14 planned endpoint families exist with typed contract baselines.

### CI & Governance Policy

- Stage 1 (immediate):
  - Keep pyright on required modules in CI (`api_v2`, `core`, `ai_feedback`).
  - Fail CI on any new type error.
- Stage 2 (after Phase 2):
  - Enable stricter pyright checks module-by-module.
  - Disallow untyped public handlers in `api_v2`.
- Stage 3 (after Phase 5):
  - Strict policy becomes default for backend feature modules.

### Definition of Done (Type-System Program)

- Pyright: zero errors on active backend modules.
- 100% public API routes have explicit typed request/response contracts.
- Constrained domain states are represented by centralized enum/literal types.
- AI/schema duplication removed; one source of truth per payload family.
- PRD-11/12/13/14 each has initialized typed API modules and contract baselines before full feature coding.

### Execution Notes

- Follow type-first workflow for all new backend work:
  1. Define contracts and primitives
  2. Define service protocol
  3. Implement adapters/handlers
  4. Run type-check + tests
- Do not introduce new feature endpoints that bypass schema contracts.
