#!/usr/bin/env bash
set -euo pipefail

# EssayCoach development health check and self-healing script.
#
# Default behavior:
# - Check backend and frontend availability
# - If unhealthy, restart the affected service
# - For frontend, clear ".next" cache before restart to recover from stale build artifacts
#
# Usage:
#   ./scripts/dev/health-check.sh
#   ./scripts/dev/health-check.sh --check-only

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

BACKEND_HOST="127.0.0.1"
BACKEND_PORT="8000"
FRONTEND_HOST="127.0.0.1"
FRONTEND_PORT="5100"

BACKEND_HEALTH_URL="http://${BACKEND_HOST}:${BACKEND_PORT}/api/v2/docs/"
FRONTEND_HEALTH_URL="http://${FRONTEND_HOST}:${FRONTEND_PORT}/auth/sign-in/"

BACKEND_LOG="${ROOT_DIR}/backend/logs/dev-backend.log"
FRONTEND_LOG="/tmp/essaycoach-frontend.log"
FRONTEND_HEALTH_TMP="/tmp/essaycoach-frontend-health.html"

CHECK_ONLY=false

usage() {
  cat <<'EOF'
Usage: ./scripts/dev/health-check.sh [--check-only] [--help]

Options:
  --check-only   Only report health status, do not restart services.
  --help         Show this help message.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --check-only)
      CHECK_ONLY=true
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      usage
      exit 2
      ;;
  esac
done

info() {
  echo "[INFO] $*"
}

warn() {
  echo "[WARN] $*" >&2
}

error() {
  echo "[ERROR] $*" >&2
}

listening_pids() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
}

wait_until_healthy() {
  local service="$1"
  local max_attempts="${2:-30}"
  local delay_secs="${3:-1}"
  local attempt=1

  while (( attempt <= max_attempts )); do
    if [[ "$service" == "backend" ]]; then
      if check_backend >/dev/null 2>&1; then
        return 0
      fi
    else
      if check_frontend >/dev/null 2>&1; then
        return 0
      fi
    fi

    sleep "$delay_secs"
    ((attempt++))
  done

  return 1
}

check_backend() {
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "${BACKEND_HEALTH_URL}" || true)"
  [[ "$code" == "200" ]]
}

check_frontend() {
  local code
  code="$(curl -sS -L -o "${FRONTEND_HEALTH_TMP}" -w "%{http_code}" --max-time 15 "${FRONTEND_HEALTH_URL}" || true)"
  if [[ "$code" != "200" ]]; then
    return 1
  fi

  # Detect common Next.js runtime failure signatures.
  if grep -Eqi 'Runtime Error|ENOENT:|Cannot find module' "${FRONTEND_HEALTH_TMP}"; then
    return 1
  fi

  # Basic content sanity check.
  grep -q "Sign In" "${FRONTEND_HEALTH_TMP}"
}

start_backend() {
  mkdir -p "${ROOT_DIR}/backend/logs"

  if [[ -x "${ROOT_DIR}/backend/.venv/bin/python" ]]; then
    info "Starting backend via backend/.venv/bin/python ..."
    (
      cd "${ROOT_DIR}/backend"
      nohup .venv/bin/python manage.py runserver "${BACKEND_HOST}:${BACKEND_PORT}" >"${BACKEND_LOG}" 2>&1 < /dev/null &
      echo $!
    )
  else
    info "Starting backend via uv run python ..."
    (
      cd "${ROOT_DIR}/backend"
      nohup uv run python manage.py runserver "${BACKEND_HOST}:${BACKEND_PORT}" >"${BACKEND_LOG}" 2>&1 < /dev/null &
      echo $!
    )
  fi
}

start_frontend() {
  info "Starting frontend via pnpm dev ..."
  (
    cd "${ROOT_DIR}/frontend"
    nohup pnpm dev >"${FRONTEND_LOG}" 2>&1 < /dev/null &
    echo $!
  )
}

restart_backend() {
  local pids
  pids="$(listening_pids "${BACKEND_PORT}")"
  if [[ -n "$pids" ]]; then
    info "Stopping backend listener(s) on :${BACKEND_PORT}: ${pids}"
    kill ${pids} || true
    sleep 1
  fi

  local pid
  pid="$(start_backend)"
  info "Backend start requested (PID: ${pid})"

  if wait_until_healthy backend 40 1; then
    info "Backend is healthy at ${BACKEND_HEALTH_URL}"
  else
    error "Backend failed to become healthy. Check log: ${BACKEND_LOG}"
    return 1
  fi
}

restart_frontend() {
  local pids
  pids="$(listening_pids "${FRONTEND_PORT}")"
  if [[ -n "$pids" ]]; then
    info "Stopping frontend listener(s) on :${FRONTEND_PORT}: ${pids}"
    kill ${pids} || true
    sleep 1
  fi

  if [[ -d "${ROOT_DIR}/frontend/.next" ]]; then
    info "Clearing frontend .next cache ..."
    find "${ROOT_DIR}/frontend/.next" -mindepth 1 -delete || true
  fi

  local pid
  pid="$(start_frontend)"
  info "Frontend start requested (PID: ${pid})"

  if wait_until_healthy frontend 60 1; then
    info "Frontend is healthy at ${FRONTEND_HEALTH_URL}"
  else
    error "Frontend failed to become healthy. Check log: ${FRONTEND_LOG}"
    return 1
  fi
}

main() {
  local ok=true

  info "Checking backend (${BACKEND_HEALTH_URL}) ..."
  if check_backend; then
    info "Backend health: OK"
  else
    warn "Backend health: FAIL"
    if $CHECK_ONLY; then
      ok=false
    else
      restart_backend || ok=false
    fi
  fi

  info "Checking frontend (${FRONTEND_HEALTH_URL}) ..."
  if check_frontend; then
    info "Frontend health: OK"
  else
    warn "Frontend health: FAIL"
    if $CHECK_ONLY; then
      ok=false
    else
      restart_frontend || ok=false
    fi
  fi

  if $ok; then
    info "All checks passed."
    return 0
  fi

  error "Health check failed."
  return 1
}

main "$@"
