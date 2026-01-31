# Project Configuration Guide

This document describes the environment variable configuration structure and management for the EssayCoach project.

## Project Structure

```
EssayCoach/
├── pyproject.toml              # Root Python project configuration
├── Makefile                    # Unified command interface
├── backend/                    # Django backend application
│   ├── essay_coach/            # Django settings and main package
│   ├── core/                   # Core functionality
│   ├── ai_feedback/            # AI feedback generation
│   ├── auth/                   # Authentication
│   └── manage.py               # Django management script
└── frontend/                   # Next.js frontend application
```

## Environment Variable Structure

### Root Directory `.env`

Stores general configurations such as database connections and CORS settings. This file should be committed to version control but should not contain sensitive keys.

```bash
# Database (Docker Compose)
POSTGRES_DB=essaycoach
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5100,http://127.0.0.1:5100
```

### `backend/.env`

Stores backend-specific configurations, including Django settings and Dify API integration. This file should not be committed to version control.

```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Dify AI Integration
DIFY_API_KEY=your-dify-api-key
DIFY_BASE_URL=https://api.dify.ai/v1
```

### `frontend/.env.local`

Stores frontend-specific configurations. This file should not be committed to version control.

```bash
# API URL pointing to backend
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Python Dependency Management

### Root `pyproject.toml`

All Python dependencies are managed in the root `pyproject.toml` file:

```toml
[project]
name = "essaycoach"
dependencies = [
    "django>=4.2,<5.0",
    "djangorestframework>=3.14,<4.0",
    # ... more dependencies
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4,<8.0",
    "pyright>=1.1.0,<2.0",
    # ... more dev dependencies
]
```

### Installation

```bash
# Install all dependencies (Python + Node.js)
make install

# Or manually:
uv venv --no-project && uv pip install -e .
cd frontend && pnpm install
```

### Running Python Commands

All Python commands use `uv run` from the project root:

```bash
# Run Django management commands
cd backend && uv run python manage.py migrate

# Run tests
cd backend && uv run pytest

# Run linters
cd backend && uv run ruff check .
```

## Configuration Priority

1. `.env.local` (local overrides, highest priority)
2. `.env` (general configuration)
3. `.env.example` (default values and templates)

## Configuration File Responsibilities

| File | Responsibility | Committed | Notes |
|------|----------------|-----------|-------|
| `pyproject.toml` | Python dependencies | Yes | Root project configuration |
| `.env` | General configuration | Yes | Does not contain keys |
| `.env.local` | Local overrides | No | Contains sensitive information |
| `.env.example` | Configuration template | Yes | Provides default values |
| `backend/.env` | Backend configuration | No | Django-specific settings |
| `frontend/.env.local` | Frontend configuration | No | Next.js-specific settings |

## Development Environment Configuration

See the [Environment Setup Guide](environment-setup.md) for complete development environment configuration.

## Related Files

- [`.env.example`](../../.env.example) - Configuration template
- [Environment Setup Guide](environment-setup.md)
- [Development Environment Architecture](../architecture/development-environment.md)
- [Makefile](../../Makefile) - Command interface
