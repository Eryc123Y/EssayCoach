#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL Manager for EssayCoach
# This script manages PostgreSQL via Docker Compose

export PGDATA="$PWD/.dev_pg"
export PGHOST="127.0.0.1"  # Explicit IPv4
export PGPORT=5432
export PGDATABASE=essaycoach
export PGUSER=postgres

show_help() {
    cat << EOF
PostgreSQL Manager for EssayCoach

Usage: $0 <command>

Commands:
    start     Start PostgreSQL container
    stop      Stop PostgreSQL container
    status    Show PostgreSQL status
    shell     Connect to PostgreSQL shell
    reset     Reset database (removes all data)
    logs      Show PostgreSQL logs

Examples:
    $0 start      # Start PostgreSQL
    $0 status     # Check status
    $0 shell      # Connect to psql shell
    $0 reset      # Reset database
EOF
}

start_pg() {
    echo "[pg] Checking for existing processes on port $PGPORT..."
    if lsof -ti:$PGPORT >/dev/null 2>&1; then
        echo "[pg] Found process(es) on port $PGPORT. Killing them..."
        lsof -ti:$PGPORT | xargs kill -9 2>/dev/null || true
        sleep 2
    fi

    if [ ! -d "$PGDATA" ]; then
        echo "[pg] Initializing PostgreSQL data directory..."
        mkdir -p "$PGDATA"
    fi

    if ! docker compose -f docker-compose.yml ps postgres 2>/dev/null | grep -q "Up"; then
        echo "[pg] Starting PostgreSQL..."
        if ! docker compose -f docker-compose.yml up -d postgres; then
            echo "[pg] ERROR: Failed to start PostgreSQL"
            docker compose -f docker-compose.yml logs postgres
            return 1
        fi

        # Wait for PostgreSQL to be ready
        echo "[pg] Waiting for PostgreSQL to be ready..."
        max_attempts=30
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
                echo "[pg] PostgreSQL is ready"
                break
            fi
            echo "[pg] Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
            sleep 2
            attempt=$((attempt + 1))
        done

        if [ $attempt -gt $max_attempts ]; then
            echo "[pg] ERROR: PostgreSQL did not become ready"
            return 1
        fi

        echo "[pg] PostgreSQL started on port $PGPORT"
    else
        echo "[pg] PostgreSQL is already running"
    fi
}

stop_pg() {
    if docker compose -f docker-compose.yml ps postgres 2>/dev/null | grep -q "Up"; then
        echo "[pg] Stopping PostgreSQL..."
        docker compose -f docker-compose.yml down
        echo "[pg] PostgreSQL stopped"
    else
        echo "[pg] PostgreSQL is not running"
    fi
}

status_pg() {
    if docker compose -f docker-compose.yml ps postgres 2>/dev/null | grep -q "Up"; then
        echo "[pg] PostgreSQL is running on port $PGPORT"
        docker compose -f docker-compose.yml ps postgres
    else
        echo "[pg] PostgreSQL is not running"
    fi
}

connect_pg() {
    if ! docker compose -f docker-compose.yml ps postgres 2>/dev/null | grep -q "Up"; then
        echo "[pg] ERROR: PostgreSQL is not running"
        exit 1
    fi
    docker compose exec -T postgres psql -U postgres -d $PGDATABASE
}

reset_pg() {
    echo "[pg] Resetting database..."
    stop_pg
    echo "[pg] Removing data volume..."
    docker compose -f docker-compose.yml down -v
    start_pg
}

logs_pg() {
    docker compose -f docker-compose.yml logs -f postgres
}

case "${1:-start}" in
    start)   start_pg ;;
    stop)    stop_pg ;;
    status)  status_pg ;;
    shell)   connect_pg ;;
    reset)   reset_pg ;;
    logs)    logs_pg ;;
    help|--help|-h) show_help ;;
    *)       echo "Unknown command: $1" && show_help && exit 1 ;;
esac
