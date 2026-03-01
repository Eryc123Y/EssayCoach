.PHONY: install dev dev-backend dev-frontend health health-check test lint clean db docs docs-generate docs-erd

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
	@echo "Running API v2 tests..."
	@cd backend && .venv/bin/pytest api_v2/ -v --timeout=120
	@echo ""
	@echo "Running Node tests..."
	@cd frontend && pnpm test

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
docs-generate:
	@echo "Generating documentation..."
	@python scripts/generate-docs.py

docs-api:
	@echo "Generating OpenAPI schema JSON..."
	@.venv/bin/python backend/manage.py generate_openapi_schema --output docs/api-reference/openapi-schema.json
	@echo "OpenAPI schema generated at docs/api-reference/openapi-schema.json"

docs-erd:
	@echo "Generating ERD diagram..."
	@python scripts/generate-docs.py --erd-only

docs-build: docs-api
	@echo "Building documentation..."
	@python scripts/generate-docs.py
	@.venv/bin/mkdocs build
	@echo ""
	@echo "✅ Documentation built successfully!"
	@echo "📚 Output: site/"

docs: docs-api
	@echo "Starting documentation server..."
	@python scripts/generate-docs.py
	@.venv/bin/mkdocs serve
