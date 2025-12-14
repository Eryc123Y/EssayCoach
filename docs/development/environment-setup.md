# Environment Setup

## 🚀 Quick Development Setup

This guide will get you up and running with the EssayCoach development environment in minutes using our Nix-based setup.

## 📦 Prerequisites

### Required Tools
- **Nix Package Manager** with flakes support
- **Git** for version control
- **Docker** (optional, for containerized development)

### System Requirements
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 5GB free space for entire environment
- **OS**: Linux, macOS, or Windows with WSL2

## 🛠️ Installation Guide

### Step 1: Install Nix
```bash
# Install Nix with flakes support
sh <(curl -L https://nixos.org/nix/install) --daemon

# Enable flakes feature
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

### Step 2: Clone Repository
```bash
git clone https://github.com/eric-gt/EssayCoach.git
cd EssayCoach
```

### Step 3: Enter Development Environment
```bash
# Option 1: Manual activation
nix develop

# Option 2: Automatic activation with direnv
echo "use flake" > .envrc
direnv allow
```

## 🗄️ Database Setup

### PostgreSQL Setup (Automatic)
```bash
# Start development services
nix develop --command dev-up

# This will:
# 1. Start PostgreSQL service with postgres superuser
# 2. Create database 'essaycoach' owned by postgres superuser
# 3. Run Django migrations to create schema
# 4. Seed the database with initial data
```

### Manual Database Setup
```bash
# Start PostgreSQL
nix develop --command postgres-start

# Create database
nix develop --command db-setup

# Run migrations
python backend/manage.py migrate

# Load sample data (using the new seed command)
python backend/manage.py seed_db
```

## 🔧 Development Workflow

### Backend Development
```bash
# Start Django development server
python backend/manage.py runserver 0.0.0.0:8000

# Django shell for debugging
python backend/manage.py shell_plus

# Run tests
python backend/manage.py test

# Create migrations
python backend/manage.py makemigrations
```

### Frontend Development
```bash
# Start frontend development server
cd frontend && pnpm dev

# Build for production
pnpm build

# Run frontend tests
pnpm test
```

### Documentation Development
```bash
# Start documentation server
mkdocs serve --dev-addr=0.0.0.0:8001

# Build documentation
mkdocs build
```

## 🐳 Docker Development (Alternative)

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔍 Environment Variables

### Development Defaults
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/essaycoach
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=essaycoach
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis (for caching and async tasks)
REDIS_URL=redis://localhost:6379

# Django
DJANGO_SETTINGS_MODULE=essay_coach.settings.development
DJANGO_SECRET_KEY=dev-secret-key-change-in-production
DEBUG=True

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚀 Quick Start Commands

### One-Command Setup
```bash
# Complete development environment setup
nix develop --command dev-setup

# This runs:
# - Database setup
# - Migration application
# - Sample data loading (seed_db)
# - Development server startup
```

### Service Management
```bash
# Start all development services
nix develop --command dev-start

# Stop all services
nix develop --command dev-stop

# Restart services
nix develop --command dev-restart

# Reset everything
nix develop --command dev-reset
```

## 🧪 Testing Commands

### Backend Testing
```bash
# Run all tests
python backend/manage.py test

# Run specific app tests
python backend/manage.py test auth

# Run with coverage
python backend/manage.py test --with-coverage

# Run specific test file
python backend/manage.py test auth.tests.UserLoginTests
```

### Frontend Testing
```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

### Type Checking (mypy)

The project uses mypy for static type checking of Python code. Type checking is automatically run in CI/CD, but you can also run it locally.

#### Quick Commands
```bash
# Run mypy on all backend code (recommended)
mypy-check

# Run with pretty colored output
mypy-pretty

# Check specific file
mypy-file auth/views.py

# Show statistics
mypy-stats
```

#### Manual Usage
```bash
# Basic check
cd backend && mypy .

# With detailed error information
cd backend && mypy . --show-error-codes --show-column-numbers

# Check specific app
cd backend && mypy auth/

# Generate HTML report
cd backend && mypy . --html-report mypy-report
```

#### Configuration
- Configuration file: `backend/mypy.ini`
- Python version: 3.12
- Strictness: Moderate (allows untyped functions but checks them)
- Excludes: migrations, `__pycache__`, and third-party packages

#### Common Issues
- **Module not found errors**: Ensure you're running from the `backend` directory
- **Django model errors**: Some Django model field type annotations are optional in moderate mode
- **Third-party imports**: Missing type stubs are ignored by default

#### CI/CD Integration
mypy runs automatically on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

The CI check will fail if type errors are found, preventing merge until fixed.

## 📊 Monitoring and Debugging

### Django Debug Toolbar
Access at: http://localhost:8000/__debug__/

### Database Query Analysis
```bash
# Enable query logging
export DJANGO_LOG_LEVEL=DEBUG

# Analyze slow queries
python backend/manage.py dbshell
-- Run EXPLAIN ANALYZE on slow queries
```

### Frontend DevTools
- React DevTools browser extension
- Next.js Fast Refresh
- Source maps enabled in development

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000

# Kill process if needed
kill -9 PID
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Restart PostgreSQL
nix develop --command postgres-restart
```

#### Nix Environment Issues
```bash
# Update flake lockfile
nix flake update

# Clean build cache
nix develop --command clean-all

# Reset to clean state
nix develop --command reset-env
```

### Getting Help
- Check logs in `logs/` directory
- Use Django admin: http://localhost:8000/admin/
- Join development Discord channel
- Review GitHub issues and discussions

## 📝 Contributing Guidelines

### Development Branches
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `hotfix/*`: Critical fixes

### Pull Request Process
1. Create feature branch from `develop`
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation
5. Submit PR to `develop` branch

### Code Standards
- Follow PEP 8 for Python code
- Use Black for code formatting
- Use type hints for Python code (checked with mypy)
- Use TypeScript for frontend code
- Write comprehensive tests
- Document all public APIs

#### Type Checking Requirements
- All new Python code should include type hints
- Run `mypy-check` before committing
- Fix type errors before submitting PRs
- CI/CD will enforce type checking on all PRs

## 🔄 CI/CD Pipeline

### Local CI Testing
```bash
# Run pre-commit hooks
pre-commit run --all-files

# Run full CI pipeline locally
nix develop --command ci-local

# Run security scanning
nix develop --command security-scan
```

### GitHub Actions
- Automated testing on PR
- Code quality checks
- Documentation deployment
- Docker image building

## 🌐 Useful URLs

### Development Endpoints
- **Backend API**: http://localhost:8000
- **Frontend App**: http://localhost:5173
- **Documentation**: http://localhost:8001
- **Django Admin**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/api/docs/

### Tools and Services
- **pgAdmin**: http://localhost:8080 (if enabled)
- **Redis Commander**: http://localhost:8081 (if enabled)
