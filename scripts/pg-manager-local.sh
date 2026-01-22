#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL Manager for EssayCoach (Local Version)
# This script manages PostgreSQL using globally installed PostgreSQL (e.g., via Nix)
# If PostgreSQL is not available, falls back to SQLite for development

export PGDATA="$PWD/.dev_pg"
export PGHOST="127.0.0.1"
export PGPORT=5432
export PGDATABASE=essaycoach
export PGUSER=postgres

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

    # Try to find PostgreSQL binaries
    PG_BIN=""
    if command -v psql >/dev/null 2>&1; then
        PG_BIN=$(which psql)
        PG_CTL=$(which pg_ctl)
        echo "[pg] Found PostgreSQL binaries at: $PG_BIN"
    elif [ -x "/nix/var/nix/profiles/per-user/bin/psql" ]; then
        PG_BIN="/nix/var/nix/profiles/per-user/bin/psql"
        PG_CTL="/nix/var/nix/profiles/per-user/bin/pg_ctl"
        echo "[pg] Found Nix PostgreSQL binaries at: $PG_BIN"
    else
        echo "[pg] PostgreSQL not found in PATH"
        return 1
    fi

    if ! pg_ctl -D "$PGDATA" status > /dev/null; then
        echo "[pg] Starting PostgreSQL..."
        mkdir -p "$PWD/.pg_socket"

        if ! pg_ctl -D "$PGDATA" \
            -o "-k \"$PWD/.pg_socket\" -p $PGPORT -h 127.0.0.1" \
            -l "$PGDATA/logfile" \
            -w start; then
            echo "[pg] ERROR: Failed to start PostgreSQL"
            cat "$PGDATA/logfile" 2>/dev/null || echo "No log file found"
            return 1
        fi

        # Create database if needed
        psql -h 127.0.0.1 -p $PGPORT -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$PGDATABASE'" | grep -q 1 || \
            psql -h 127.0.0.1 -p $PGPORT -U postgres -c "CREATE DATABASE $PGDATABASE OWNER postgres;" >/dev/null

        echo "[pg] PostgreSQL started on port $PGPORT"
    else
        echo "[pg] PostgreSQL is already running"
    fi
}

stop_pg() {
    if [ -n "$PG_CTL" ]; then
        PG_CTL=$(which pg_ctl)
    else
        return 0
    fi

    if pg_ctl -D "$PGDATA" status > /dev/null; then
        echo "[pg] Stopping PostgreSQL..."
        pg_ctl -D "$PGDATA" -w -m fast stop >/dev/null
        echo "[pg] PostgreSQL stopped"
    fi
}

status_pg() {
    if [ -n "$PG_CTL" ]; then
        PG_CTL=$(which pg_ctl)
    else
        echo "[pg] PostgreSQL not found"
        return 1
    fi

    if pg_ctl -D "$PGDATA" status > /dev/null; then
        echo "[pg] PostgreSQL is running on port $PGPORT"
    else
        echo "[pg] PostgreSQL is not running"
    fi
}

connect_pg() {
    if ! [ -n "$PG_BIN" ]; then
        echo "[pg] PostgreSQL not found"
        return 1
    fi

    if ! pg_ctl -D "$PGDATA" status > /dev/null; then
        echo "[pg] ERROR: PostgreSQL is not running"
        exit 1
    fi
    psql -h 127.0.0.1 -p $PGPORT -U postgres -d $PGDATABASE
}

reset_pg() {
    echo "[pg] Resetting database..."
    stop_pg
    rm -rf "$PGDATA"
    start_pg
}

case "${1:-start}" in
    start)   start_pg ;;
    stop)    stop_pg ;;
    status)   status_pg ;;
    connect)  connect_pg ;;
    reset)    reset_pg ;;
    *)        echo "Usage: $0 {start|stop|status|connect|reset}" ;;
esac
