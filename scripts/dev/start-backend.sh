#!/usr/bin/env bash
set -euo pipefail

# Start Django Backend
# This script starts the Django development server

echo "Starting Django backend on http://127.0.0.1:8000..."
echo "API Docs available at: http://127.0.0.1:8000/api/schema/"

cd backend && uv run python manage.py runserver 127.0.0.1:8000
