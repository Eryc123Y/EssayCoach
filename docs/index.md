# EssayCoach Developer Documentation

Welcome to the technical documentation for EssayCoach, an AI-powered essay coaching platform built with a Next.js frontend and Django backend.

## Architecture overview

EssayCoach is designed as a modern web application with the following architecture:

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS with shadcn/ui components
- **Backend**: Django 4.x + **API v2 (Django Ninja)** with PostgreSQL (DRF retained for JWT/simplejwt only)
- **Development Environment**: uv and Docker Compose for fast, consistent setups
- **Deployment**: Docker containers with CI/CD pipelines

## Quick start for developers

### Environment setup

Install dependencies and start services:

```bash
make install
make dev
```

This sets up:

- PostgreSQL 17 database in Docker
- Django development environment with **uv**
- Frontend development tools (Node.js, pnpm, Next.js)
- All documentation tools (MkDocs, material theme)

### Start documentation server

```bash
make docs
```
(or `uv run mkdocs serve`)

Visit <http://127.0.0.1:8001> to view the documentation locally (`make docs` serves MkDocs on port 8001; Django dev uses port 8000).

## Documentation structure

This documentation is organized for developers and contributors:

- **Project Status**: [Frontend Status](frontend/current-status.md) | [Backend Status](backend/current-status.md) (Actual implementation state)
- **Architecture & Design**: System design decisions and technical specifications
- **Database Schema**: Complete database design with relationships and constraints
- **Backend Deep Dive**: Django models, serializers, views, and async processing
- **Frontend Architecture**: Next.js component structure and state management
- **Performance Optimization**: [Frontend Performance Guide](frontend/performance-optimization.md) - Vercel React best practices applied
- **Agentic workflow**: [Agentic design](agentic-workflow/agentic-design.md) and [AI agent migration (LangGraph)](architecture/agent-migration.md)
- **Project status / roadmap**: see repo root `CLAUDE.md` (not all planning docs are published here)
- **Development Guide**: Setup instructions and contribution guidelines

## Development workflow

1. Make changes to the documentation in the `docs/` directory
2. Test locally with `mkdocs serve`
3. Submit PR to main branch
4. Documentation automatically deploys to GitHub Pages on merge

## Technical stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js + React + TypeScript | Server-rendered React UI |
| Backend | Django + Django Ninja (`api_v2`) | JSON API + OpenAPI |
| Database | PostgreSQL 17 | Primary data store |
| Dev Environment | uv + Docker Compose | Reproducible builds |
| Documentation | MkDocs Material | Technical documentation |
| Testing | Pytest + Vitest | Comprehensive test suite |

## AI feedback (API v2)

- **Run workflow**: `POST /api/v2/ai-feedback/agent/workflows/run/` — body includes `essay_question`, `essay_content`, optional `language`, `response_mode`, `user_id`, `rubric_id` (see `backend/api_v2/ai_feedback/schemas.py`).
- **Status**: `GET /api/v2/ai-feedback/agent/workflows/run/{workflow_run_id}/status/` — progress and `EssayAnalysisOut` when complete.
- **Chat**: `POST /api/v2/ai-feedback/chat/` — revision assistant (implementation evolving).
- **Provider**: Dify backs these routes today; target stack is **LangGraph** — see [AI agent migration](architecture/agent-migration.md). OpenAPI: `docs/api-reference/openapi-schema.json` and the Swagger page in the nav.

## Useful links

- [GitHub Repository](https://github.com/Eryc123Y/EssayCoach)
- [System Architecture](architecture/system-architecture.md)
- [Database Design](database/schema-overview.md)
- [Database Configuration](database/configuration.md)
- [Agentic design](agentic-workflow/agentic-design.md)
- [AI agent migration (LangGraph)](architecture/agent-migration.md)
