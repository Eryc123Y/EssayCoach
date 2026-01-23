.PHONY: install dev dev-backend dev-frontend test lint clean db

# Install all dependencies
install:
	@echo "Installing Python dependencies (in root .venv)..."
	@uv venv .venv && uv pip install -e backend/
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
	@echo "╠════════════════════════════════════════════════════════════════╣"
	@echo "║  👤 Admin Login: admin@example.com / admin                    ║"
	@echo "║  👨‍🎓 Test Users:  student1@example.com / student1               ║"
	@echo "║                 student2@example.com / student2               ║"
	@echo "║                 student3@example.com / student3               ║"
	@echo "╠════════════════════════════════════════════════════════════════╣"
	@echo "║  💡 Tip: Press Ctrl+C to stop all services                    ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@make -j2 dev-backend dev-frontend

# Start backend only
dev-backend:
	@echo "Starting Django backend on http://127.0.0.1:8000..."
	@echo "📚 API Docs available at: http://127.0.0.1:8000/api/schema/"
	@./.venv/bin/python backend/manage.py runserver 127.0.0.1:8000

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
	@./.venv/bin/python backend/manage.py migrate

createsuperuser:
	@echo "Creating Django superuser..."
	@./.venv/bin/python backend/manage.py createsuperuser

shell:
	@echo "Opening Django shell..."
	@./.venv/bin/python backend/manage.py shell

seed-db:
	@echo "Seeding database with initial data..."
	@./.venv/bin/python backend/manage.py seed_db
	@echo ""
	@echo "✅ Database seeded successfully!"
	@echo "👤 Admin login: admin@example.com / admin"
	@echo "👨‍🎓 Student logins: student1@example.com / student1, student2@example.com / student2, student3@example.com / student3"

# Testing
test:
	@echo "Running Python tests..."
	@./.venv/bin/pytest backend/
	@echo ""
	@echo "Running Node tests..."
	@cd frontend && pnpm test

# Code quality
lint:
	@echo "Running Python linter..."
	@./.venv/bin/ruff check backend/
	@echo ""
	@echo "Running Node linter..."
	@cd frontend && pnpm lint

lint-fix:
	@echo "Auto-fixing Python lint issues..."
	@./.venv/bin/ruff check --fix backend/
	@echo ""
	@echo "Auto-fixing Node lint issues..."
	@cd frontend && pnpm lint:fix

format:
	@echo "Formatting Python code..."
	@./.venv/bin/black backend/
	@echo ""
	@echo "Formatting Node code..."
	@cd frontend && pnpm format

typecheck:
	@echo "Running Python type checking..."
	@./.venv/bin/mypy backend/

# Build
build:
	@echo "Building production bundle..."
	@cd frontend && pnpm build

# Cleanup
clean:
	@echo "Cleaning up Python cache..."
	@rm -rf .venv __pycache__ .pytest_cache .ruff_cache .mypy_cache
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
docs:
	@echo "Starting documentation server..."
	./.venv/bin/mkdocs serve
