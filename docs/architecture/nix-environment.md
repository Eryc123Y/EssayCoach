# Nix Development Environment

## 🚀 Nix Flakes Overview

EssayCoach uses Nix flakes to provide a reproducible, declarative development environment that ensures consistent builds across different machines and operating systems.

## 📦 Flake Structure

### flake.nix Components
```nix
{
  description = "EssayCoach - AI-powered essay coaching platform";
  
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Development tools
            python311
            python311Packages.pip
            nodejs_20
            pnpm
            postgresql_14
            
            # Documentation
            mkdocs
            python311Packages.mkdocs-material
            
            # Utilities
            git
            curl
            jq
          ];
          
          shellHook = ''
            # Automatic database setup
            source scripts/dev-env/setup-db.sh
            
            # Environment variables
            export DATABASE_URL="postgresql://essaycoach:password@localhost:5432/essaycoach_dev"
            export REDIS_URL="redis://localhost:6379"
            export DJANGO_SETTINGS_MODULE="essay_coach.settings.development"
            
            echo "🚀 EssayCoach development environment ready!"
            echo "   • Database: postgresql://localhost:5432/essaycoach_dev"
            echo "   • Backend:  http://localhost:8000"
            echo "   • Frontend: http://localhost:5173"
            echo "   • Docs:     http://localhost:8001"
          '';
        };
      }
    );
}
```

## 🛠️ Getting Started

### Prerequisites
- Install Nix with flakes support:
```bash
# Install Nix
sh <(curl -L https://nixos.org/nix/install) --daemon

# Enable flakes
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

### Enter Development Environment
```bash
# Clone repository
git clone https://github.com/your-org/EssayCoach.git
cd EssayCoach

# Enter development shell
nix develop

# Or use direnv for automatic activation
echo "use flake" > .envrc
direnv allow
```

## 🗄️ Database Setup

### Automatic Database Creation
The Nix environment includes automatic PostgreSQL setup:

```bash
# Start PostgreSQL service
nix develop --command postgres-start

# Create database and user
nix develop --command db-setup

# Run migrations
nix develop --command migrate

# Load sample data
nix develop --command load-sample-data
```

### Database Configuration
```bash
# Environment variables set automatically
DATABASE_URL=postgresql://essaycoach:password@localhost:5432/essaycoach_dev
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=essaycoach_dev
POSTGRES_USER=essaycoach
POSTGRES_PASSWORD=password
```

## 🧪 Development Commands

### Backend Development
```bash
# Start Django development server
python backend/manage.py runserver

# Run Django shell
python backend/manage.py shell

# Create migrations
python backend/manage.py makemigrations

# Run tests
python backend/manage.py test

# Run specific app tests
python backend/manage.py test ai_feedback
```

### Frontend Development
```bash
# Start Next.js development server
cd frontend && pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type checking
pnpm type-check
```

### Documentation
```bash
# Start documentation server
mkdocs serve --dev-addr=0.0.0.0:8001

# Build documentation
mkdocs build

# Deploy to GitHub Pages
mkdocs gh-deploy
```

## 🐳 Docker Integration

### Development with Docker
```bash
# Build development containers
nix develop --command docker-dev-up

# View logs
nix develop --command docker-logs

# Stop containers
nix develop --command docker-dev-down
```

### Production Build
```bash
# Build production images
nix build .#dockerImage

# Load into Docker
docker load < result
```

## 🔧 Custom Development Tools

### Helper Scripts
Located in `scripts/dev-env/`:

#### setup-db.sh
```bash
#!/bin/bash
# PostgreSQL setup script
set -e

echo "Setting up PostgreSQL database..."

# Start PostgreSQL if not running
if ! pg_isready -q; then
    pg_ctl -D $PGDATA start
fi

# Create user and database
psql -c "CREATE USER essaycoach WITH PASSWORD 'password';"
psql -c "CREATE DATABASE essaycoach_dev OWNER essaycoach;"
psql -c "GRANT ALL PRIVILEGES ON DATABASE essaycoach_dev TO essaycoach;"

echo "Database setup complete!"
```

#### reset-db.sh
```bash
#!/bin/bash
# Reset database to clean state
set -e

echo "Resetting database..."

# Drop and recreate database
psql -c "DROP DATABASE IF EXISTS essaycoach_dev;"
psql -c "CREATE DATABASE essaycoach_dev OWNER essaycoach;"

# Run migrations
python backend/manage.py migrate

# Load sample data
python backend/manage.py loaddata sample_data.json

echo "Database reset complete!"
```

## 🧪 Testing Environment

### Isolated Test Environment
```bash
# Run tests in clean environment
nix develop --command test-all

# Backend tests only
nix develop --command test-backend

# Frontend tests only
nix develop --command test-frontend

# Coverage reports
nix develop --command coverage-report
```

### Test Database
```bash
# Create test database
nix develop --command test-db-setup

# Run tests with coverage
python backend/manage.py test --with-coverage --cover-package=ai_feedback,essay_submission
```

## 📊 Performance Monitoring

### Development Metrics
```bash
# Database query analysis
nix develop --command db-analyze

# Django performance profiling
python backend/manage.py shell -c "
from django.db import connection
from essay.models import Essay
print(len(connection.queries))
"

# Frontend bundle analysis
pnpm build --analyze
```

## 🚨 Troubleshooting

### Common Issues

#### Nix Store Corruption
```bash
# Fix corrupted store
nix-store --verify --repair

# Garbage collect
nix-collect-garbage -d
```

#### PostgreSQL Connection Issues
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Restart PostgreSQL
pg_ctl -D $PGDATA restart
```

#### Python Package Issues
```bash
# Reinstall Python packages
pip install -r requirements.txt --force-reinstall

# Clear pip cache
pip cache purge
```

### Environment Variables
```bash
# View all set variables
env | grep -E "(DATABASE|DJANGO|REDIS)"

# Override settings
export DJANGO_SETTINGS_MODULE=essay_coach.settings.production
export DATABASE_URL=postgresql://prod:pass@localhost:5432/essaycoach_prod
```

## 🔄 Continuous Integration

### GitHub Actions Integration
```yaml
# .github/workflows/test.yml
name: Test with Nix
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: DeterminateSystems/nix-installer-action@main
      - run: nix develop --command test-all
```

### Local CI Simulation
```bash
# Run full CI pipeline locally
nix develop --command ci-local

# Check formatting
nix develop --command lint-all

# Security scanning
nix develop --command security-scan
```

## 📚 Additional Resources

### Nix Documentation
- [Nix Flakes Manual](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake.html)
- [Django with Nix](https://nixos.org/manual/nixpkgs/stable/#python)
- [Node.js with Nix](https://nixos.org/manual/nixpkgs/stable/#node.js)

### Useful Commands
```bash
# Update dependencies
nix flake update

# Check flake health
nix flake check

# Show available packages
nix flake show

# Build specific package
nix build .#backend
```