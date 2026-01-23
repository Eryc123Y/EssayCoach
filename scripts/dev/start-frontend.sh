#!/usr/bin/env bash
set -euo pipefail

# Start Next.js Frontend
# This script starts the Next.js development server

echo "Starting Next.js frontend on port 5100..."

cd frontend && pnpm dev
