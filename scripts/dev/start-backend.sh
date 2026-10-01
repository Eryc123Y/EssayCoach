#!/usr/bin/env bash
set -euo pipefail

# Start Django Backend
# This script starts the Django development server

echo "Starting Django backend on http://127.0.0.1:8000..."
echo "API Docs available at: http://127.0.0.1:8000/api/schema/"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."
exec make dev-backend
