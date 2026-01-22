# Development Environment

## Overview

EssayCoach uses a modern development stack designed for speed, reproducibility, and ease of use. The environment is built around **uv** for Python, **pnpm** for Node.js, and **Docker Compose** for infrastructure services.

## Core Tools

### uv (Python)
We use [uv](https://github.com/astral-sh/uv) for lightning-fast Python dependency management and virtual environments. It replaces traditional tools like pip, poetry, and virtualenv.

- **Speed**: Installs dependencies in milliseconds.
- **Reproducibility**: Uses `uv.lock` to ensure identical environments across all machines.
- **Simplicity**: Single tool for package management, Python version management, and tool execution.

### pnpm (Node.js)
The frontend uses [pnpm](https://pnpm.io/) for efficient Node.js package management. It uses a content-addressable storage system to save disk space and speed up installations.

### Docker Compose (Services)
External services like **PostgreSQL 17** are managed via Docker Compose. This ensures that every developer runs the same database version and configuration without manual local setup.

## Makefile Interface

The project uses a `Makefile` as the primary interface for developer tasks. This abstracts away complex commands and provides a consistent experience.

| Command | Action |
|---------|--------|
| `make install` | Install all dependencies (Python & Node) |
| `make db` | Start PostgreSQL in Docker |
| `make migrate` | Run database migrations |
| `make seed-db` | Load initial development data |
| `make dev` | Start both backend and frontend servers |
| `make test` | Run the full test suite |

## Database Architecture

### PostgreSQL 17
- **Host**: `127.0.0.1`
- **Port**: `5432`
- **User/Password**: `postgres`/`postgres`
- **Persistence**: Managed via Docker volumes. Use `make db-reset` to clear all data.

### Deletion Strategy: CASCADE
To ensure maintenance safety and prevent orphaned data, core models use **CASCADE** deletion. Deleting a parent entity automatically cleans up child records (e.g., Rubric -> Task -> Submission -> Feedback).

## Network Configuration

Always use explicit IPv4 addresses (`127.0.0.1`) instead of `localhost` in development to avoid IPv6 resolution issues common in modern Node.js versions.

- **Frontend**: http://127.0.0.1:5100
- **Backend API**: http://127.0.0.1:8000
- **Admin Dashboard**: http://127.0.0.1:8000/admin/
