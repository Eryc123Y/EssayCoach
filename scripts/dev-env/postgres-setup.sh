#!/usr/bin/env bash
# PostgreSQL development environment setup

# ---------- Local PostgreSQL Dev Cluster ----------
# This block ensures a self-contained PostgreSQL instance is available
# whenever you run `nix develop`. It stores data in .dev_pg/
# (git-ignored) and is only accessible on localhost on port 5432.
# Any existing process on port 5432 will be killed before starting.
#
# On shell exit, the database is stopped, and the data directory is
# removed to ensure a clean start for the next session.

export PGDATA="$PWD/.dev_pg"
# IMPORTANT: Use explicit IPv4 address to avoid IPv6/IPv4 resolution issues
# with Node.js v24+ and Python's psycopg2 on macOS
export PGHOST="127.0.0.1"

start_local_pg() {
  # Force PostgreSQL to run on port 5432 only
  export PGPORT=5432
  
  # Kill any existing process on port 5432
  echo "[dev-pg] Checking for existing processes on port 5432..."
  if lsof -ti:5432 >/dev/null 2>&1; then
    echo "[dev-pg] Found process(es) on port 5432. Killing them..."
    lsof -ti:5432 | xargs kill -9 2>/dev/null || true
    sleep 2
  fi
  
  # Clean up any stray postmaster*.pid files that might cause startup issues
  # These can be left behind from previous crashes
  rm -f "$PGDATA/postmaster"*.pid 2>/dev/null || true
  
  # Init DB if it doesn't exist or is corrupted/incomplete
  # PG_VERSION is the canonical marker of a valid PostgreSQL data directory
  if [ ! -d "$PGDATA" ] || [ ! -f "$PGDATA/PG_VERSION" ]; then
    if [ -d "$PGDATA" ]; then
      echo "[dev-pg] Data directory exists but is invalid/corrupted. Cleaning up..."
      rm -rf "$PGDATA"
    fi
    echo "Initializing PostgreSQL data directory..."
    initdb -D "$PGDATA" --auth=trust --no-locale --encoding=UTF8 -U postgres >/dev/null
  fi

  # Ensure socket directory exists
  mkdir -p "$PWD/.pg_socket"
  
  # Start if not already running
  if ! pg_ctl -D "$PGDATA" status > /dev/null; then
    echo "[dev-pg] Starting PostgreSQL on port 5432..."
    
    if ! pg_ctl -D "$PGDATA" -o "-k \"$PWD/.pg_socket\" -p $PGPORT -h 127.0.0.1" -l "$PGDATA/logfile" -w start; then
      echo "[dev-pg] ERROR: Failed to start PostgreSQL. Check logs at '$PGDATA/logfile'."
      return 1
    fi

    echo "[dev-pg] PostgreSQL started on port $PGPORT."

    # Ensure default role & database exist (using postgres superuser)
    psql -U postgres -p "$PGPORT" -h "$PGHOST" -tc "SELECT 1 FROM pg_database WHERE datname = 'essaycoach'" | grep -q 1 || \
      psql -U postgres -p "$PGPORT" -h "$PGHOST" -c "CREATE DATABASE essaycoach OWNER postgres;" >/dev/null

    echo "[dev-pg] Database 'essaycoach' with postgres superuser is ready."

    # Migrations-only strategy:
    # Do NOT attempt SQL cold-start (`docker/db/init/*.sql`). Schema/data should be created
    # via Django migrations + `python manage.py seed_db`.
  else
    # If already running, retrieve port from the pid file
    export PGPORT=$(head -n 4 "$PGDATA/postmaster.pid" | tail -n 1)
    echo "[dev-pg] PostgreSQL is already running on port $PGPORT."
  fi
}

# Stop the server on exit, but preserve data directory for persistence.
cleanup_on_exit() {
    echo -e "\n[dev-pg] Exiting shell. Stopping PostgreSQL..."
    # Stop the server managed by our PGDATA directory.
    if pg_ctl -D "$PGDATA" status > /dev/null; then
        pg_ctl -D "$PGDATA" -w -m fast stop >/dev/null
    fi
    # NOTE: Data directory preserved at $PGDATA for next session
    # To reset DB manually: rm -rf .dev_pg
    echo "[dev-pg] PostgreSQL stopped. Data preserved in $PGDATA"
}

start_local_pg

# The 'trap' command ensures cleanup_on_exit is called when the shell exits.
trap cleanup_on_exit EXIT