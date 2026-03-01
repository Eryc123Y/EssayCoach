# EssayCoach Developer Documentation

Welcome to the technical documentation for EssayCoach, an AI-powered essay coaching platform built with a Next.js frontend and Django backend.

## 🏗️ Architecture Overview

EssayCoach is designed as a modern web application with the following architecture:

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS with shadcn/ui components
- **Backend**: Django API v2 (Django Ninja) with PostgreSQL database
- **Development Environment**: uv and Docker Compose for fast, consistent setups
- **Deployment**: Docker containers with CI/CD pipelines

## 🚀 Quick Start for Developers

### Environment Setup

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

### Start Documentation Server

```bash
make docs
```
(or `uv run mkdocs serve`)

Visit <http://127.0.0.1:8000> to view the documentation locally.

## 📁 Documentation Structure

This documentation is organized for developers and contributors:

- **Project Status**: [Frontend Status](frontend/current-status.md) | [Backend Status](backend/current-status.md) (Actual implementation state)
- **Architecture & Design**: System design decisions and technical specifications
- **Database Schema**: Complete database design with relationships and constraints
- **Backend Deep Dive**: Django models, serializers, views, and async processing
- **Frontend Architecture**: Next.js component structure and state management
- **Performance Optimization**: [Frontend Performance Guide](frontend/performance-optimization.md) - Vercel React best practices applied
- **Agentic Workflow**: Plans for agentic design, orchestration, and technique stacks
- **Project Planning**: Roadmaps, architecture tasks, and development plans
- **Development Guide**: Setup instructions and contribution guidelines

## 🔄 Development Workflow

1. Make changes to documentation in the `docs/` directory
2. Test locally with `mkdocs serve`
3. Submit PR to main branch
4. Documentation automatically deploys to GitHub Pages on merge

## 📊 Technical Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js + React + TypeScript | Server-rendered React UI |
| Backend | Django REST Framework | RESTful API server |
| Database | PostgreSQL 17 | Primary data store |
| Dev Environment | uv + Docker Compose | Reproducible builds |
| Documentation | MkDocs Material | Technical documentation |
| Testing | Pytest + Vitest | Comprehensive test suite |

## 🧠 Dify Agent Workflow APIs

- **Run workflow**: `POST /api/v2/ai-feedback/agent/workflows/run/` accepts `essay_question`, `essay_content`, optional `language`, `response_mode`, and `user_id`. The server uploads `rubric.pdf` once and attaches it as the `essay_rubric` file input required by the DSL.
- **Check status**: `GET /api/v2/ai-feedback/agent/workflows/run/{workflow_run_id}/status/` returns current `status`, `outputs`, and token usage for workflow polling.
- **Note**: Only send `inputs`, `response_mode`, and `user_id` when starting a workflow.
- These endpoints mirror the Essay Agent DSL described in `docs/agentic-workflow/*.md` and are documented via drf-spectacular so frontend developers see the exact request schema.

## 🔗 Useful Links

- [GitHub Repository](https://github.com/your-org/EssayCoach)
- [System Architecture](architecture/system-architecture.md)
- [Database Design](database/schema-overview.md)
- [Database Configuration](database/configuration.md)
- [Agentic Workflow](agentic-workflow/agentic-design.md)
- [Project Plan](plans/dashboard-refactor-plan.md)
- [Latest Sync Plan](plans/2026-02-27-profile-settings-sync-plan.md)
