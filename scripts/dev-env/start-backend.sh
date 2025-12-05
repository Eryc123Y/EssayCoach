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
POSTGRES_SUPERUSER="postgres"
POSTGRES_SUPERPASS="postgres"
# Use postgres as the app DB user for simplicity
APP_DB_USER="postgres"
APP_DB_PASS="postgres"
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"
export POSTGRES_USER="${APP_DB_USER}"
export POSTGRES_PASSWORD="${APP_DB_PASS}"

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
    if ! pg_ctl -D "$PGDATA" -o "-k \"$PWD/../.pg_socket\" -p $PGPORT" -l "$PGDATA/logfile" -w start; then
        echo "[dev-pg] ERROR: Failed to start PostgreSQL"
        cat "$PGDATA/logfile" 2>/dev/null || echo "No log file found"
        return 1
    fi
    
    echo "[dev-pg] PostgreSQL started successfully"
}

# Function to ensure proper database setup and ownership
ensure_database_setup() {
    echo "[dev-pg] Ensuring database setup..."
    
    # Create database if it doesn't exist (postgres user already exists as superuser)
    psql -U "$POSTGRES_SUPERUSER" -p "$PGPORT" -h "$PGHOST" -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1 || \
        psql -U "$POSTGRES_SUPERUSER" -p "$PGPORT" -h "$PGHOST" -c "CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_SUPERUSER;" >/dev/null

    echo "[dev-pg] Database setup complete"
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

# Always ensure proper database setup regardless of whether we started PG or not
ensure_database_setup

# Wait for PostgreSQL to be ready
echo "[dev-pg] Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if psql -U "$POSTGRES_SUPERUSER" -p "$PGPORT" -h "$PGHOST" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
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
    
    # Create migrations for any model changes
    echo "Creating new migrations if needed..."
    python manage.py makemigrations --noinput
    
    # Run database migrations
    echo "Running Django migrations..."
    python manage.py migrate --noinput
    
    # Seed database if empty
    echo "Seeding database if empty..."
    python manage.py seed_db

    # create a superuser if it doesn't exist
    echo "Ensuring default admin superuser exists..."
    python - <<'PY'
import os
from django.db import connection
from django.contrib.auth.hashers import make_password

# Target credentials
email_candidates = ['admin', 'admin@example.com']
password = 'admin'
hashed = make_password(password)

with connection.cursor() as cur:
    # Try to update existing admin-like user by email
    updated = False
    for email in email_candidates:
        cur.execute(
            'UPDATE "user"\n'
            'SET user_credential = %s, user_role = %s, user_status = %s,\n'
            '    is_superuser = TRUE, is_staff = TRUE, is_active = TRUE\n'
            'WHERE user_email = %s\n'
            'RETURNING user_id',
            [hashed, 'admin', 'active', email]
        )
        if cur.rowcount:
            updated = True
            break

    if not updated:
        # Insert a new admin user with the requested username/email 'admin'
        # Use default if next_id is None (fresh DB)
        cur.execute('SELECT COALESCE(MAX(user_id)+1, 1) FROM "user"')
        row = cur.fetchone()
        next_id = row[0] if row else 1
        
        cur.execute(
            'INSERT INTO "user" (user_id, user_fname, user_lname, user_email, user_role, user_status, user_credential, is_superuser, is_staff, is_active, date_joined)\n'
            'VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, TRUE, TRUE, NOW())',
            [next_id, 'Admin', 'User', 'admin', 'admin', 'active', hashed]
        )

print('Admin user ensured (email: "admin" or "admin@example.com")')
PY

    # Start the development server
    echo "Starting Django development server..."
    python manage.py runserver
else
    echo "ERROR: Django not found in Python environment"
    exit 1
fi
