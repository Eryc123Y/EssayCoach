# Scripts Usage Guide

This directory contains scripts for managing EssayCoach development environment.

## Supported local setup

Install dependencies before invoking the local commands:

```bash
cd backend && uv sync
cd ../frontend && pnpm install
cd ..
make local-setup
make dev-local
```

`make local-setup` calls `scripts/dev/local-stack.py setup`. It creates `.env` when absent, starts a persistent project-owned PostgreSQL instance at `127.0.0.1:55432`, saves its data in `.dev_pg`, and runs migrations. It does **not** seed data. Run `make local-demo` only when explicit demonstration accounts are wanted. Use `make local-db-stop` to stop this database without deleting its data.

The setup writes `frontend/.env.local` so `JWT_SECRET` matches `DJANGO_SECRET_KEY`; both must stay private. The AI worker finds `codex` from `PATH` automatically. Set `CODEX_BIN` only when the executable is elsewhere.

## Directory structure

```
scripts/
├── dev/
│   ├── local-stack.py        # Project-owned PostgreSQL setup and lifecycle
│   ├── start-all.sh          # Start all services
│   ├── start-backend.sh      # Start backend only
│   ├── start-frontend.sh     # Start frontend only
│   └── health-check.sh       # Check and auto-recover backend/frontend
└── README.md                 # This file
```

## Compatibility scripts

The older Docker-oriented scripts remain for compatibility. They are separate from the `.dev_pg` local setup:

```bash
# Start database
./scripts/db/postgres-manager.sh start

# Stop database
./scripts/db/postgres-manager.sh stop

# Check status
./scripts/db/postgres-manager.sh status

# Access shell
./scripts/db/postgres-manager.sh shell

# Reset database (removes all data)
./scripts/db/postgres-manager.sh reset

# View logs
./scripts/db/postgres-manager.sh logs
```

## Development Services (`scripts/dev/`)

```bash
# Start all services (database, backend, frontend)
./scripts/dev/start-all.sh

# Start backend only
./scripts/dev/start-backend.sh

# Start frontend only
./scripts/dev/start-frontend.sh

# Check service health and auto-recover if needed
./scripts/dev/health-check.sh

# Check only (no restart)
./scripts/dev/health-check.sh --check-only
```

## Makefile commands

The Makefile provides convenient shortcuts for common commands:

```bash
make local-setup     # Configure .env, start project-owned PostgreSQL, run migrations
make local-demo      # Same setup, then create explicit demonstration data
make local-db        # Start the existing project-owned PostgreSQL instance
make local-db-stop   # Stop it while preserving .dev_pg

make dev-backend     # Start backend only
make dev-frontend    # Start frontend only
make dev             # Start all services (database + backend + frontend)
make health          # Check and auto-recover backend/frontend
make health-check    # Check only (no restart)

make install         # Install dependencies
make test            # Run tests
make lint            # Run linters
```

## Environment Variables

See [docs/development/configuration.md](../docs/development/configuration.md) for environment variable configuration.
