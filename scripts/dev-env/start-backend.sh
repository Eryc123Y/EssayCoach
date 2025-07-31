#!/usr/bin/env bash
cd backend

# Use the current shell's environment directly
export PYTHONPATH="$PWD/..:$PYTHONPATH"
export DJANGO_SETTINGS_MODULE="essay_coach.settings"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/essaycoach"
export DJANGO_SECRET_KEY="dev-secret-key-change-in-production"

# PostgreSQL configuration
export PGDATA="$PWD/../.dev_pg"
export PGHOST="localhost"
export PGPORT=5432
export POSTGRES_DB="essaycoach"
export POSTGRES_USER="postgres"
export POSTGRES_PASSWORD="postgres"
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"

# Ensure socket directory exists
mkdir -p "$PWD/../.pg_socket"

echo "Starting Django development server..."
echo "Using Python: $(which python)"
echo "Django settings: $DJANGO_SETTINGS_MODULE"

# Function to check if PostgreSQL is running
check_postgres() {
    pg_ctl -D "$PGDATA" status >/dev/null 2>&1
}

# Function to start PostgreSQL
start_postgres() {
    echo "[dev-pg] Starting PostgreSQL..."
    
    # Initialize if not exists
    if [ ! -d "$PGDATA" ]; then
        echo "[dev-pg] Initializing PostgreSQL data directory..."
        initdb -D "$PGDATA" --auth=trust --no-locale --encoding=UTF8 -U postgres >/dev/null
    fi
    
    # Start PostgreSQL with custom socket directory
    if ! pg_ctl -D "$PGDATA" -o "-k $PWD/../.pg_socket -p $PGPORT" -l "$PGDATA/logfile" -w start; then
        echo "[dev-pg] ERROR: Failed to start PostgreSQL"
        cat "$PGDATA/logfile" 2>/dev/null || echo "No log file found"
        return 1
    fi
    
    echo "[dev-pg] PostgreSQL started successfully"
    
    # Create database if it doesn't exist (using postgres superuser)
    psql -U postgres -p "$PGPORT" -h "$PGHOST" -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1 || \
        psql -U postgres -p "$PGPORT" -h "$PGHOST" -c "CREATE DATABASE $POSTGRES_DB OWNER postgres;" >/dev/null
    
    echo "[dev-pg] Database '$POSTGRES_DB' with postgres superuser is ready"
    
    # Load schema if database is empty
    if ! psql -U "$POSTGRES_USER" -p "$PGPORT" -h "$PGHOST" -d "$POSTGRES_DB" -tc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1;" 2>/dev/null | grep -q 1; then
        echo "[dev-pg] Loading database schema..."
        if psql -U postgres -p "$PGPORT" -h "$PGHOST" -d "$POSTGRES_DB" -f "$PWD/../docker/db/init/00_init.sql" >/dev/null 2>&1; then
            echo "[dev-pg] Schema loaded successfully"
            if psql -U postgres -p "$PGPORT" -h "$PGHOST" -d "$POSTGRES_DB" -f "$PWD/../docker/db/init/01_add_data.sql" >/dev/null 2>&1; then
                echo "[dev-pg] Mock data loaded successfully"
            fi
        fi
    fi
}

# Check and start PostgreSQL if needed
if ! check_postgres; then
    echo "[dev-pg] PostgreSQL is not running, starting it..."
    if ! start_postgres; then
        echo "[dev-pg] ERROR: Failed to start PostgreSQL"
        exit 1
    fi
else
    echo "[dev-pg] PostgreSQL is already running"
fi

# Wait for PostgreSQL to be ready
echo "[dev-pg] Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if psql -U "$POSTGRES_USER" -p "$PGPORT" -h "$PGHOST" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "[dev-pg] PostgreSQL is ready"
        break
    fi
    echo "[dev-pg] Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
    sleep 1
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "[dev-pg] ERROR: PostgreSQL is not ready after $max_attempts attempts"
    exit 1
fi

# Test if Django is available in the current environment
if python -c "import django; print(f'Django {django.get_version()} found')" 2>/dev/null; then
    echo "Django is available, running migrations and starting server..."
    
    # Run database migrations
    echo "Running Django migrations..."
    python manage.py migrate --noinput
    
    # Start the development server
    echo "Starting Django development server..."
    python manage.py runserver
else
    echo "ERROR: Django not found in Python environment"
    echo "Python version: $(python --version)"
    echo "Python executable: $(which python)"
    echo "Trying to import Django..."
    python -c "import django" || echo "Import failed"
    exit 1
fi