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
export PGHOST="localhost"

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
  
  # Init DB if it doesn't exist
  if [ ! -d "$PGDATA" ]; then
    echo "Initializing PostgreSQL data directory..."
    initdb -D "$PGDATA" --auth=trust --no-locale --encoding=UTF8 -U postgres >/dev/null
  fi

  # Ensure socket directory exists
  mkdir -p "$PWD/.pg_socket"
  
  # Start if not already running
  if ! pg_ctl -D "$PGDATA" status > /dev/null; then
    echo "[dev-pg] Starting PostgreSQL on port 5432..."
    
    if ! pg_ctl -D "$PGDATA" -o "-k $PWD/.pg_socket -p $PGPORT" -l "$PGDATA/logfile" -w start; then
      echo "[dev-pg] ERROR: Failed to start PostgreSQL. Check logs at '$PGDATA/logfile'."
      return 1
    fi

    echo "[dev-pg] PostgreSQL started on port $PGPORT."

    # Ensure default role & database exist (using postgres superuser)
    psql -U postgres -p "$PGPORT" -h "$PGHOST" -tc "SELECT 1 FROM pg_database WHERE datname = 'essaycoach'" | grep -q 1 || \
      psql -U postgres -p "$PGPORT" -h "$PGHOST" -c "CREATE DATABASE essaycoach OWNER postgres;" >/dev/null

    echo "[dev-pg] Database 'essaycoach' with postgres superuser is ready."
    
    # Load schema if database is empty (no tables exist)
    if ! psql -U postgres -p "$PGPORT" -h "$PGHOST" -d essaycoach -tc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1;" 2>/dev/null | grep -q 1; then
      echo "[dev-pg] Loading database schema..."
      if psql -U postgres -p "$PGPORT" -h "$PGHOST" -d essaycoach -f docker/db/init/00_init.sql >/dev/null 2>&1; then
        echo "[dev-pg] Schema loaded successfully."
      else
        echo "[dev-pg] ERROR: Failed to load schema. Check docker/db/init/00_init.sql"
      fi
    else
      echo "[dev-pg] Database already contains tables. Skipping schema load."
    fi

    echo "[dev-pg] Loading mock data..."
    if psql -U postgres -p "$PGPORT" -h "$PGHOST" -d essaycoach -f docker/db/init/01_add_data.sql >/dev/null 2>&1; then
      echo "[dev-pg] Mock data loaded successfully."
    else
      echo "[dev-pg] ERROR: Failed to load mock data. Check docker/db/init/01_add_data.sql"
    fi
  else
    # If already running, retrieve port from the pid file
    export PGPORT=$(head -n 4 "$PGDATA/postmaster.pid" | tail -n 1)
    echo "[dev-pg] PostgreSQL is already running on port $PGPORT."
  fi
}

# Stop the server and remove the data directory on exit.
cleanup_on_exit() {
    echo -e "\n[dev-pg] Exiting shell. Cleaning up PostgreSQL..."
    # Stop the server managed by our PGDATA directory.
    if pg_ctl -D "$PGDATA" status > /dev/null; then
        pg_ctl -D "$PGDATA" -w -m fast stop >/dev/null
    fi
    rm -rf "$PGDATA"
    echo "[dev-pg] Cleanup complete."
}

start_local_pg

# The 'trap' command ensures cleanup_on_exit is called when the shell exits.
trap cleanup_on_exit EXIT