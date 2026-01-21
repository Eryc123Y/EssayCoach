#!/usr/bin/env bash
set -Eeuo pipefail

cd frontend

# Ensure pnpm exists and show versions for clarity
if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm is not installed or not on PATH" >&2
  exit 1
fi

echo "Using Node: $(node -v), pnpm: $(pnpm -v)"

# New frontend template uses Vite config for port/envs and .env.* files.
# Avoid reinstalling on every run; install only if node_modules is missing.
need_install=0
if [ ! -d node_modules ]; then
  need_install=1
else
  # Check for core Next.js dependency
  if [ ! -d node_modules/next ]; then
    need_install=1
  fi
fi

if [ "$need_install" -eq 1 ]; then
  echo "Installing frontend dependencies..."
  pnpm install
else
  echo "Dependencies look OK; skipping install. Run 'pnpm i' if needed."
fi

echo "Starting Next.js development server..."
# package.json -> scripts.dev: "next dev"
PORT=5100 pnpm run dev
