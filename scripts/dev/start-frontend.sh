#!/usr/bin/env bash
set -euo pipefail

# Start Next.js Frontend
# This script starts the Next.js development server

echo "Starting Next.js frontend on port 5100..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."
exec make dev-frontend
