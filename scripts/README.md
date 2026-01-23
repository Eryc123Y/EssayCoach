# Scripts Usage Guide

This directory contains scripts for managing EssayCoach development environment.

## Directory Structure

```
scripts/
├── db/
│   └── postgres-manager.sh   # PostgreSQL management (Docker Compose)
├── dev/
│   ├── start-all.sh          # Start all services
│   ├── start-backend.sh      # Start backend only
│   └── start-frontend.sh     # Start frontend only
└── README.md                 # This file
```

## Database Management (`scripts/db/`)

Use the PostgreSQL manager to control the database:

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
```

## Alternative: Use Makefile

The Makefile provides convenient shortcuts for common commands:

```bash
make db              # Start database
make db-stop         # Stop database
make db-status       # Check database status
make db-shell        # Access database shell
make db-reset        # Reset database

make dev-backend     # Start backend only
make dev-frontend    # Start frontend only
make dev             # Start all services (database + backend + frontend)

make install         # Install dependencies
make test            # Run tests
make lint            # Run linters
```

## Environment Variables

See [docs/development/configuration.md](../docs/development/configuration.md) for environment variable configuration.
