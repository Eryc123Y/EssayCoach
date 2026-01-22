.PHONY: install dev dev-backend dev-frontend test lint clean db

# Install all dependencies
install:
	@echo "Installing dependencies..."
	@cd backend && uv venv --no-project && uv pip install -e .
	@cd frontend && pnpm install

# Start all services (backend, frontend, and db)
dev: db
	@echo "Starting all development services..."
	@make -j2 dev-backend dev-frontend

# Start backend only
dev-backend:
	@echo "Starting Django backend on port 8000..."
	@cd backend && uv run python manage.py runserver 127.0.0.1:8000

# Start frontend only
dev-frontend:
	@echo "Starting Next.js frontend on port 5100..."
	@cd frontend && pnpm dev

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
	@cd backend && uv run python manage.py migrate

createsuperuser:
	@echo "Creating Django superuser..."
	@cd backend && uv run python manage.py createsuperuser

shell:
	@echo "Opening Django shell..."
	@cd backend && uv run python manage.py shell

seed-db:
	@echo "Seeding database with initial data..."
	@cd backend && uv run python manage.py seed_db

# Testing
test:
	@echo "Running all tests..."
	@cd backend && uv run pytest
	@cd frontend && pnpm test

# Code quality
lint:
	@echo "Running linters..."
	@cd backend && uv run ruff check .
	@cd frontend && pnpm lint

lint-fix:
	@echo "Auto-fixing lint issues..."
	@cd backend && uv run ruff check --fix .
	@cd frontend && pnpm lint:fix

format:
	@echo "Formatting code..."
	@cd backend && uv run black .
	@cd frontend && pnpm format

typecheck:
	@echo "Running type checking..."
	@cd backend && uv run mypy .

# Build
build:
	@echo "Building production bundle..."
	@cd frontend && pnpm build

# Cleanup
clean:
	@echo "Cleaning up..."
	@cd backend && rm -rf .venv __pycache__ .pytest_cache .ruff_cache .mypy_cache
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
