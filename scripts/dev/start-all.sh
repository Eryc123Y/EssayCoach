#!/usr/bin/env bash
set -euo pipefail

# Start All Services
# This script starts PostgreSQL, backend, and frontend services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "Starting PostgreSQL..."
"$SCRIPT_DIR/../db/postgres-manager.sh" start

echo ""
echo "Starting backend and frontend..."

# Start backend in background
"$SCRIPT_DIR/start-backend.sh" &
BACKEND_PID=$!

# Start frontend in background
"$SCRIPT_DIR/start-frontend.sh" &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "EssayCoach Dev Server"
echo "========================================"
echo "Frontend: http://127.0.0.1:5100"
echo "Backend:  http://127.0.0.1:8000"
echo "API Docs: http://127.0.0.1:8000/api/docs/"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
