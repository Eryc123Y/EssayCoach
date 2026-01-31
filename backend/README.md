# EssayCoach Backend

## Development Setup

### Prerequisites
- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- Docker and Docker Compose (for PostgreSQL)

### Install uv
```bash
pip install uv
```

### Quick Start

1. **Setup Environment**:
   Ensure you have `uv` installed. The recommended way to set up the project is:
   ```bash
   cd backend
   uv sync  # Installs all dependencies and creates .venv
   ```

2. **Environment Variables**:
   The backend uses `python-dotenv` and expects a `.env` file in the **root** of the repository.
   Django will automatically load variables from `../.env` when running `manage.py`.

3. **Database Setup** (from project root):
   ```bash
   make db        # Start PostgreSQL
   make migrate   # Run migrations
   make seed-db   # Seed data
   ```

4. **Start development server**:
   ```bash
   uv run python manage.py runserver
   ```

### Dependency Management with `uv`

This project uses `uv` for lightning-fast dependency management.

- **Install new package**: `uv add <package>`
- **Install dev dependency**: `uv add --dev <package>`
- **Remove package**: `uv remove <package>`
- **Run command in venv**: `uv run <command>` (e.g., `uv run pytest`)
- **Sync dependencies**: `uv sync` (Ensures `.venv` matches `pyproject.toml`)

### Package Discovery Configuration

The project uses a flat layout where core applications (`core`, `ai_feedback`, `analytics`) and the settings module (`essay_coach`) are in the root of the `backend/` directory.

To handle this with modern Python packaging, `pyproject.toml` includes explicit package discovery:

```toml
[tool.setuptools]
packages = ["core", "essay_coach", "ai_feedback", "analytics"]
```

This ensures that `uv pip install -e .` (or `uv sync`) correctly links all local modules.

### Useful Commands

```bash
# Run Django management commands
uv run python manage.py <command>

# Run tests
uv run pytest

# Type checking
uv run pyright .

# Code formatting
uv run black .

# Linting
uv run ruff check .
uv run ruff check --fix .
```

### Database

PostgreSQL is managed via Docker Compose using project Makefile:

```bash
# From project root
make db          # Start PostgreSQL
make db-stop     # Stop PostgreSQL
make db-status   # Check status
make db-shell    # Connect to database
make db-reset    # Reset database
```

### Development Workflow

```bash
# 1. Make changes
# 2. Run tests
uv run pytest

# 3. Format code
uv run black .

# 4. Check types
uv run pyright .

# 5. Lint
uv run ruff check .
```
