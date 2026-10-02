# EssayCoach Backend

## Development Setup

### Prerequisites
- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- PostgreSQL 16+ for the local database

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

3. **Database setup** (from project root):
   ```bash
   make local-setup
   ```
   This creates or reuses the project-owned PostgreSQL data at `.dev_pg`, listens on `127.0.0.1:55432`, and applies migrations. It does not seed accounts or sample data. Run `make local-demo` only when demonstration data is explicitly required.

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

### Local database

The supported local route is the project-owned PostgreSQL instance. `make local-setup` creates it once; `make local-db` starts it later, and `make local-db-stop` stops it while preserving `.dev_pg`. Docker targets remain available for compatibility, but do not share this local configuration.

The setup writes a repository-root `.env` and frontend `.env.local`. `JWT_SECRET` must equal `DJANGO_SECRET_KEY`, because the frontend proxy verifies Django tokens. Do not set either secret to a public value.

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
