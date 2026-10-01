# Private local setup

Use this route for a single-institution development instance on one machine.

## Start the application

Install the backend environment first, then frontend dependencies:

```bash
cd backend && uv sync
cd ../frontend && pnpm install
cd ..
make local-setup
make createsuperuser
make dev-local
```

`make local-setup` creates `.env` from `.env.example` only when `.env` is absent. It creates a private `DJANGO_SECRET_KEY` when the placeholder is present, writes `frontend/.env.local`, starts PostgreSQL, and applies migrations. The frontend `JWT_SECRET` is written from the same value as `DJANGO_SECRET_KEY`; keep both secret values private.

The local PostgreSQL instance listens on `127.0.0.1:55432` and stores data in the ignored `.dev_pg` directory. It uses the current macOS account with an empty password when creating a new `.env`. Existing `.env` values are preserved, so review them before switching database settings.

`make local-setup` does not create test users or sample records. Run `make local-demo` only when explicit demonstration data is needed. To stop the project-owned database while preserving its data, run `make local-db-stop`; use `make local-db` to start it again.

`make dev-local` starts Django at `http://127.0.0.1:8000`, Next.js at `http://127.0.0.1:5100`, and the AI worker. Use the same host form consistently for browser access and `ESSAYCOACH_APP_URL` so cookie and email-link behavior match.

## AI worker and email

The worker discovers a signed-in `codex` executable on `PATH`. Set `CODEX_BIN` only when it is installed elsewhere. It uses the local Codex session and does not require an OpenAI API key for this setup.

Email is saved under `backend/outbox/` by default. Set SMTP variables to deliver outside the machine. `SUPPORT_EMAIL` is optional: when configured, the help endpoint returns it as the contact address; when empty, no email contact is shown.

## Checks

```bash
cd backend
uv run pytest api_v2 ai_feedback core -m 'not performance'
uv run ruff check .
uv run pyright .
uv run python manage.py check
uv run python manage.py makemigrations --check --dry-run
```

For the frontend, run `pnpm test` and `pnpm exec tsc --noEmit` from `frontend/`. Stop `pnpm dev` before `pnpm build`, because both use `.next`.
