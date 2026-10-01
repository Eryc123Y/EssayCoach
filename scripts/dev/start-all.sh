#!/usr/bin/env bash
set -euo pipefail

# Start the frontend, API and AI worker from the repository command entry point.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"

case "${1:-}" in
  --local)
    make local-db
    exec make dev-local
    ;;
  "") exec make dev ;;
  *) echo "Usage: $0 [--local]" >&2; exit 2 ;;
esac
