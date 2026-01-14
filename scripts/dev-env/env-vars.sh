#!/usr/bin/env bash
# Environment variables for development

# Python environment variables
export PYTHONPATH="$PWD:$PYTHONPATH"
export DJANGO_SETTINGS_MODULE="essay_coach.settings"
export DJANGO_SECRET_KEY="dev-secret-key-change-in-production"
# Use postgres superuser for development simplicity
export PGPORT=${PGPORT:-5432}
export DATABASE_URL="postgresql://postgres:postgres@localhost:${PGPORT}/essaycoach"

# Load .env file if it exists (for DIFY_API_KEY and other secrets)
if [ -f "$PWD/.env" ]; then
  set -a
  source "$PWD/.env"
  set +a
fi