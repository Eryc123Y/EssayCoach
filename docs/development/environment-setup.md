# Environment Setup

## 🚀 Quick Development Setup

This guide will get you up and running with the EssayCoach development environment using **uv**, **pnpm**, and **Docker Compose**.

## 📦 Prerequisites

### Required Tools
- **Python 3.12+**
- **Node.js 22+**
- **[uv](https://github.com/astral-sh/uv)** (Modern Python package manager)
- **pnpm** (Fast, disk space efficient package manager for Node)
- **Docker and Docker Compose** (For PostgreSQL 17)
- **Make** (To use the project's automation interface)

### System Requirements
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 5GB free space for entire environment
- **OS**: Linux, macOS, or Windows with WSL2

## 🛠️ Installation Guide

### Step 1: Install `uv`
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Step 2: Clone Repository
```bash
git clone https://github.com/Eryc123Y/EssayCoach.git
cd EssayCoach
```

### Step 3: One-Step Installation
```bash
# This installs all Python and Node dependencies
make install
```

## 🗄️ Database Setup

### PostgreSQL Setup (Docker Compose)
```bash
# Start PostgreSQL 17
make db

# Run Django migrations to create schema
make migrate

# Seed the database with initial data (admin, test users, rubrics)
make seed-db
```

## 🔧 Development Workflow

### Launch Services
```bash
# Start both backend (8000) and frontend (5100)
make dev
```

### Backend Development
```bash
# Start Django backend only
make dev-backend

# Django shell for debugging
make shell

# Run migrations
make migrate

# Create new migrations
cd backend && uv run python manage.py makemigrations
```

### Frontend Development
```bash
# Start frontend development server only
make dev-frontend

# Build for production
make build

# Run frontend tests
cd frontend && pnpm test
```

### Documentation Development
```bash
# Start documentation server
uv run mkdocs serve --dev-addr=127.0.0.1:8001
```

## 🔍 Environment Variables

### 1. Root `.env` (Backend Secrets)
Create this file in the repository root (copy from `.env.example`).

```bash
# AI Feedback (Dify)
DIFY_API_KEY=your-dify-api-key
DIFY_BASE_URL=https://api.dify.ai/v1

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
...
```

### 2. Frontend `.env.local`
Create this file in the `frontend/` directory.

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## 🧪 Testing Commands

### Full Test Suite
```bash
# Run both backend and frontend tests
make test
```

### Backend Testing
```bash
# Run pytest
cd backend && uv run pytest
```

### Frontend Testing
```bash
# Run Vitest
cd frontend && pnpm test
```

### Type Checking (mypy)
```bash
# Run mypy on all backend code
make typecheck
```

## 📊 Monitoring and Debugging

### Django Admin
Access at: http://127.0.0.1:8000/admin/

### Database Access
```bash
# Connect to PostgreSQL shell
make db-shell
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000

# Kill process if needed
kill -9 <PID>
```

### Database Connection Issues
1. Ensure Docker is running.
2. Check PostgreSQL container status: `make db-status`.
3. View logs: `make docker-logs-pg`.

### IPv6/IPv4 Resolution
If you get connection errors on `localhost`, use `127.0.0.1` instead. Modern Node.js versions may default to IPv6.

## 📝 Contributing Guidelines

### Development Branches
- `main`: Production-ready code
- `feature/*`: Feature development
- `fix/*`: Bug fixes

### Code Standards
- **Python**: Follow PEP 8, use `ruff` for linting, `black` for formatting, and `mypy` for types.
- **TypeScript**: Use strict mode, follow project patterns in existing components.

## 🌐 Useful URLs
- **Frontend**: http://127.0.0.1:5100
- **Backend API**: http://127.0.0.1:8000
- **Admin Dashboard**: http://127.0.0.1:8000/admin/
- **API Documentation**: http://127.0.0.1:8000/api/docs/
