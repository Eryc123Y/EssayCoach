#!/usr/bin/env bash
set -Eeuo pipefail

# Resolve repo root
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
ROOT_DIR="$(cd -- "${SCRIPT_DIR}/../.." &>/dev/null && pwd)"
cd "${ROOT_DIR}"

SOCKET="${ROOT_DIR}/.overmind.sock"
SESSION="essaycoach"

echo "Tmux/Overmind preflight..."

# If a socket exists, attempt a graceful shutdown first
if [ -S "${SOCKET}" ]; then
  echo "Found existing socket at ${SOCKET}. Attempting graceful shutdown..."
  OVERMIND_SOCKET="${SOCKET}" overmind quit >/dev/null 2>&1 || true
  OVERMIND_SOCKET="${SOCKET}" overmind kill >/dev/null 2>&1 || true
fi

# If tmux is available, ensure the session isn't lingering
if command -v tmux >/dev/null 2>&1; then
  if tmux has-session -t "${SESSION}" 2>/dev/null; then
    echo "Killing lingering tmux session '${SESSION}'..."
    tmux kill-session -t "${SESSION}" || true
  fi
fi

# Remove stale socket if still present
if [ -S "${SOCKET}" ]; then
  echo "Removing stale socket ${SOCKET}..."
  rm -f -- "${SOCKET}" || true
fi

echo "Starting Overmind..."
OVERMIND_SOCKET="${SOCKET}" overmind start

