.PHONY: install dev dev-backend dev-frontend health health-check test test-performance lint clean db docs docs-generate docs-erd

BACKEND_PYTHON := backend/.venv/bin/python
MKDOCS_CMD := uv run --with mkdocs==1.6.1 --with mkdocs-material==9.5.50 --with mkdocs-mermaid2-plugin==1.2.1 --with mkdocs-minify-plugin==0.8.0 mkdocs

# Install all dependencies
install:
	@echo "Installing Python dependencies (in backend .venv)..."
	@cd backend && uv venv .venv && uv pip install -e .
	@echo "Installing Node dependencies..."
	@cd frontend && pnpm install

# Start all services (backend, frontend, and db)
dev: db
	@echo ""
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║                   🚀 EssayCoach Dev Server                     ║"
	@echo "╠════════════════════════════════════════════════════════════════╣"
	@echo "║  🌐 Frontend:    http://127.0.0.1:5100                        ║"
	@echo "║  🔧 Backend:     http://127.0.0.1:8000                        ║"
	@echo "║  📚 API Docs:    http://127.0.0.1:8000/api/docs/              ║"
	@echo "║  📚 API v2 Docs: http://127.0.0.1:8000/api/v2/docs/           ║"
	@echo "╠════════════════════════════════════════════════════════════════╣"
	@echo "║  👤 Test Accounts:                                              ║"
	@echo "║     admin@example.com    / admin123    (admin)                 ║"
	@echo "║     lecturer@example.com / lecturer123 (lecturer)              ║"
	@echo "║     student@example.com / student123  (student)               ║"
	@echo "╠════════════════════════════════════════════════════════════════╣"
	@echo "║  💡 Tip: Press Ctrl+C to stop all services                    ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@make -j2 dev-backend dev-frontend

# Start backend only
dev-backend:
	@echo "Starting Django backend on http://127.0.0.1:8000..."
	@echo "📚 API v1 Docs: http://127.0.0.1:8000/api/docs/"
	@echo "📚 API v2 Docs: http://127.0.0.1:8000/api/v2/docs/"
	@cd backend && .venv/bin/python manage.py runserver 127.0.0.1:8000

# Start frontend only
dev-frontend:
	@echo "Starting Next.js frontend on port 5100..."
	@cd frontend && pnpm dev

# Check and self-heal local dev services
health:
	@./scripts/dev/health-check.sh

health-check:
	@./scripts/dev/health-check.sh --check-only

# Database management (Docker Compose)
db:
	@echo "Starting PostgreSQL (Docker Compose)..."
	@docker compose up -d postgres

db-stop:
	@echo "Stopping PostgreSQL..."
	@docker compose stop postgres

db-status:
	@docker compose ps postgres

db-shell:
	@docker compose exec postgres psql -U postgres -d essaycoach

db-reset:
	@docker compose down -v && docker compose up -d postgres

# Django management
migrate:
	@echo "Running Django migrations..."
	@cd backend && .venv/bin/python manage.py migrate

createsuperuser:
	@echo "Creating Django superuser..."
	@cd backend && .venv/bin/python manage.py createsuperuser

shell:
	@echo "Opening Django shell..."
	@cd backend && .venv/bin/python manage.py shell

seed-db:
	@echo "Seeding database with initial data..."
	@cd backend && .venv/bin/python manage.py seed_db
	@echo ""
	@echo "✅ Database seeded successfully!"
	@echo "👤 Test Accounts:"
	@echo "   admin@example.com    / admin123    (admin)"
	@echo "   lecturer@example.com / lecturer123 (lecturer)"
	@echo "   student@example.com  / student123  (student)"

# Testing
test:
	@echo "Running API v2 tests (excluding performance)..."
	@cd backend && .venv/bin/pytest -m "not performance" -v --timeout=120
	@echo ""
	@echo "Running Node tests..."
	@cd frontend && pnpm test

test-performance:
	@echo "Running API v2 performance tests..."
	@cd backend && .venv/bin/pytest -m performance -v --timeout=120

# Code quality
lint:
	@echo "Running Python linter..."
	@cd backend && .venv/bin/ruff check .
	@echo ""
	@echo "Running Node linter..."
	@cd frontend && pnpm lint

lint-fix:
	@echo "Auto-fixing Python lint issues..."
	@cd backend && .venv/bin/ruff check --fix .
	@echo ""
	@echo "Auto-fixing Node lint issues..."
	@cd frontend && pnpm lint:fix

format:
	@echo "Formatting Python code..."
	@cd backend && .venv/bin/black .
	@echo ""
	@echo "Formatting Node code..."
	@cd frontend && pnpm format

typecheck:
	@echo "Running Python type checking..."
	@cd backend && .venv/bin/pyright

# Build
build:
	@echo "Building production bundle..."
	@cd frontend && pnpm build

# Cleanup
clean:
	@echo "Cleaning up Python cache..."
	@rm -rf backend/.venv backend/__pycache__ backend/.pytest_cache backend/.ruff_cache backend/.mypy_cache
	@echo "Cleaning up Node cache..."
	@cd frontend && rm -rf node_modules .next

# Docker management (for PostgreSQL)
docker-up:
	@echo "Starting Docker Compose services..."
	@docker compose up -d

docker-down:
	@echo "Stopping Docker Compose services..."
	@docker compose down

docker-logs:
	@echo "Showing Docker Compose logs..."
	@docker compose logs -f

docker-logs-pg:
	@echo "Showing PostgreSQL logs..."
	@docker compose logs -f postgres

# Documentation
docs-generate: docs-api
	@echo "Generating documentation..."
	@$(BACKEND_PYTHON) scripts/generate-docs.py

docs-api:
	@echo "Generating OpenAPI schema JSON..."
	@cd backend && .venv/bin/python manage.py shell -c "import json; from pathlib import Path; from api_v2.api import api_v2; output = Path('../docs/api-reference/openapi-schema.json'); output.parent.mkdir(parents=True, exist_ok=True); output.write_text(json.dumps(api_v2.get_openapi_schema(), indent=2, ensure_ascii=False), encoding='utf-8')"
	@echo "OpenAPI schema generated at docs/api-reference/openapi-schema.json"

docs-erd:
	@echo "Generating ERD diagram..."
	@$(BACKEND_PYTHON) scripts/generate-docs.py --erd-only

docs-build: docs-api
	@echo "Building documentation..."
	@$(BACKEND_PYTHON) scripts/generate-docs.py
	@$(MKDOCS_CMD) build
	@echo ""
	@echo "✅ Documentation built successfully!"
	@echo "📚 Output: site/"

docs: docs-api
	@echo "Starting documentation server on http://127.0.0.1:8001..."
	@$(BACKEND_PYTHON) scripts/generate-docs.py
	@$(MKDOCS_CMD) serve --dev-addr=127.0.0.1:8001
