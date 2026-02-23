# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **IMPORTANT**: This file is the single source of truth for project status. Update it after every significant code change to reflect the current state and next priorities.
>
> **Last Updated**: 2026-02-24 (Security audit + Codex verification)

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
- **`api_v1/`**: Legacy DRF code - pending deletion.

### Frontend Architecture
- **Framework**: Next.js App Router (`src/app/`).
- **UI Components**: shadcn/ui (`src/components/ui/`) styled with Tailwind CSS v4.
- **State Management**: Zustand (preferred) + legacy React Context.
- **Styling Paradigm**: "Academic Precision" (clean typography, subtle depth, minimal gradients for primary CTAs).

### Design-to-Code Workflow
The `docs/prd/` directory contains an explicit contract for code generation:
- `pencil-shadcn.pen`: The master UI design file (Codegen Ready: GO_CONDITIONAL).
- `D2C_IMPLEMENTATION_CONTRACT_STANDARD.md`: The canonical 10-field template every feature must implement before coding begins.
- Always consult the PRDs to understand the UI/UX states and data shape before implementing a component.

---

## Current Project Status

### Version: v2.0.0 (v2-only migration target)

#### ✅ Completed Features
- Core AI essay analysis functionality
- Basic authentication system (token-based, no refresh)
- Dashboard overview (student/lecturer role-aware)
- Rubric management (CRUD + PDF import via AI)
- Essay Practice submission flow
- API v2 core endpoints for existing features

#### 🚧 In Progress / Needs Attention
- API v1 → v2 migration (cleanup pending)
- JWT Refresh Token mechanism (not implemented)
- RevisionChat (frontend uses mock data)

#### 🔍 PRD vs Implementation Gap Analysis

| PRD Module | Status | Gap Summary |
|------------|--------|-------------|
| 01 Landing Page | ✅ Implemented | - |
| 02 Sign In | ✅ Implemented | - |
| 03 Sign Up | ✅ Implemented | - |
| 04 Dashboard Overview | ⚠️ Partial | Missing: Grading queue, activity feed, class overview cards |
| 05 Essay Practice | ⚠️ Partial | Missing: RevisionChat backend, PDF export, skill radar chart |
| 06 Rubrics | ⚠️ Partial | Missing: Visibility (public/private), student view, duplicate |
| 07 Settings | ✅ Implemented | - |
| 08 Profile | ✅ Implemented | - |
| 09 Assignments (Tasks) | ❌ Not Started | **Needs full implementation** |
| 10 Classes | ❌ Not Started | **Needs full implementation** |
| 11 Social Learning Hub | ❌ Not Started | Planned for post-MVP |
| 12 Analytics | ❌ Not Started | Planned for post-MVP |
| 13 Users | ❌ Not Started | Admin user management |
| 14 Help | ❌ Not Started | Basic help docs needed |

#### Test Accounts
- **Admin**: admin@example.com / admin123
- **Lecturer**: lecturer@example.com / lecturer123
- **Student**: student@example.com / student123

---

## Active Development Priorities

### 🔴 P0 - Critical (Immediate)

1. **JWT Token Refresh Mechanism** (~14h)
   - Backend: Refresh token endpoint with rotation (`/api/v2/auth/refresh/`)
   - Frontend: Auto-refresh hook + Zustand state migration
   - Status: Not started

2. **RevisionChat Backend Integration** (~8h)
   - Backend: Chat endpoint at `/api/v2/ai-feedback/chat/`
   - Frontend: Connect to real API (currently using mock data at `revision-chat.tsx:18-25`)
   - Status: Not started

3. **RBAC Permission Checks** (~4h) 🔴 NEW (Verified 2026-02-24)
   - Add admin/lecturer role checks to Users CRUD endpoints
   - Location: `backend/api_v2/core/views.py:87-143`
   - Risk: Any authenticated user can modify/delete any user
   - Status: Verified - needs implementation

4. **Cookie Security Hardening** (~1h) 🔴 NEW (Verified 2026-02-24)
   - Fix httpOnly/secure flags in login route
   - Location: `frontend/src/app/api/auth/login/route.ts:67-100`
   - Risk: User role cookie can be tampered for privilege escalation
   - Status: Verified - needs implementation

5. **API v1 → v2 Cleanup** (~8h)
   - Delete `backend/api_v1/` directory ✅ Deleted 2026-02-24
   - Delete `frontend/src/app/api/v1/` ✅ Deleted 2026-02-24
   - Remove DRF dependencies from `backend/pyproject.toml`
   - Status: In progress

### 🟠 P1 - High Priority (This Week)

4. **Tasks Module (PRD-09)** (~16h)
   - Backend: Task model, endpoints (`/api/v2/core/tasks/`)
   - Frontend: Task list, task editor, submission view
   - Status: Not started

5. **Classes Module (PRD-10)** (~14h)
   - Backend: Class model, enrollment, join code
   - Frontend: Class cards, detail view, student roster
   - Status: Not started

6. **PDF Export Feature** (~4h)
   - Install `@react-pdf/renderer`
   - Create FeedbackPDF component
   - Hook up Export button in essay-analysis page
   - Status: Not started

### 🟡 P2 - Medium Priority (This Month)

7. **Rubric Visibility Enhancement** (~6h)
   - Add `visibility` field to `MarkingRubric` model
   - Public/private toggle UI
   - Student view for public rubrics

8. **Dashboard Enhancement** (~8h)
   - Grading queue for lecturers
   - Activity feed
   - Class overview cards

9. **Authentication Security Hardening** (~9h)
   - Remove client-side token reading
   - Request interceptor standardization
   - Middleware route protection

10. **Save to Portfolio** (~2h)
    - Backend endpoint: `POST /api/v2/core/submissions/{id}/save/`

11. **Apply Fix Feature** (~4h)
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
**Goal**: Secure authentication + core missing features

| Task | Files to Modify | Priority |
|------|-----------------|----------|
| JWT Refresh Token | `api_v2/auth/views.py`, `api_v2/auth/schemas.py`, `useAuthRefresh.ts` | P0 |
| RevisionChat API | `api_v2/ai_feedback/views.py`, `revision-chat.tsx` | P0 |
| API v1 Cleanup | Delete `api_v1/`, update `pyproject.toml` | P0 |
| Tasks Module | New: `core/models.py::Task`, `api_v2/core/tasks.py` | P1 |
| Classes Module | New: `core/models.py::Class`, `api_v2/core/classes.py` | P1 |

### Phase 2: Feature Completion (Week 3-4)
**Goal**: Complete PRD-defined features

| Task | Files to Modify | Priority |
|------|-----------------|----------|
| PDF Export | `FeedbackPDF.tsx`, `useExportPDF.ts` | P1 |
| Rubric Visibility | `core/models.py::MarkingRubric`, rubric forms | P2 |
| Dashboard Enhancement | Dashboard components, new API endpoints | P2 |
| Auth Hardening | `request.ts`, `middleware.ts` | P2 |

### Phase 3: Polish & Scale (Month 2+)
**Goal**: Production readiness + advanced features

- Docker containerization
- Nginx reverse proxy
- Social Learning Hub
- Analytics Dashboard
- Multi-AI support

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
| `GET /api/v2/core/rubrics/` | ✅ | List rubrics |
| `POST /api/v2/core/rubrics/` | ✅ | Create rubric |
| `POST /api/v2/core/rubrics/import_from_pdf_with_ai/` | ✅ | AI rubric import |
| `GET /api/v2/core/submissions/` | ✅ | List submissions |
| `POST /api/v2/ai-feedback/analyze/` | ✅ | AI essay analysis |

### Missing Endpoints

| Endpoint | PRD | Priority |
|----------|-----|----------|
| `POST /api/v2/auth/refresh/` | Auth | P0 |
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

---

## 🚨 Security Warnings (Verified 2026-02-24)

**CRITICAL - Do not deploy to production without fixing**:

1. **RBAC Missing**: Users CRUD endpoints (`backend/api_v2/core/views.py:87-143`) have no role-based access control. Any authenticated user can modify/delete any user.
   - **Fix**: Add admin/lecturer role checks before write operations
   - **Priority**: P0

2. **Cookie Security**: Login route sets `httpOnly: false` on user info cookies (`frontend/src/app/api/auth/login/route.ts:67-100`). User role can be tampered for privilege escalation.
   - **Fix**: Set `httpOnly: true, secure: true, sameSite: 'strict'`
   - **Priority**: P0

3. **Navigation Links to 404 Pages**: Frontend nav exposes unimplemented modules (`/dashboard/assignments`, `/dashboard/library`, `/dashboard/analytics`, `/dashboard/users`).
   - **Fix**: Remove links or add 404 handling
   - **Priority**: P1

---

## Technical Debt (Verified 2026-02-24)

| Debt | Impact | Fix Effort |
|------|--------|------------|
| Task model missing 8 fields (title, description, instructions, status, etc.) | Blocks PRD-09 | ~6h + migration |
| Class model missing 9 fields (class_code, name, description, status, etc.) | Blocks PRD-10 | ~6h + migration |
| Users CRUD no RBAC | Security risk | ~4h |
| Cookie httpOnly=false | Security risk | ~1h |
| RevisionChat uses mock data | UX incomplete | ~8h |
| Navigation links to 404 pages | UX broken | ~2h |

- **`docs/prd/`**: Product Requirement Documents (14 modules) - **Source of truth for features**
- **`docs/architecture/`**: System architecture docs
- **`pencil-shadcn.pen`**: UI design file (Codegen Ready: GO_CONDITIONAL)
- **`D2C_IMPLEMENTATION_CONTRACT_STANDARD.md`**: Design-to-code contract template
