# EssayCoach

EssayCoach is a private, bilingual writing platform for one institution. Staff invite students into courses. Students can practice writing with AI feedback and source checks; formal essay grades require lecturer review and course lead publication.

**Development status (2026-10-01):** development and local acceptance are complete for the owner-approved, one-institution English/Chinese scope. Real routes cover invitation activation, classes, assignments, practice feedback, source evidence, teacher review and course-lead publication, analytics, community moderation, administration, help and runtime diagnostics. The reviewed [interactive prototype](docs/architecture/interactive-prototype.md) guides the interface. See the [current acceptance record](docs/development/release-acceptance-2026-10-01.md) for the requirement matrix, observed workflows and AI/accessibility limitations.

## Current architecture

- Next.js 15, React 19, TypeScript, and Tailwind CSS 4 for the web interface.
- Django 4.2 with Ninja API v2 and PostgreSQL (verified on 16 and 17) for application data and permissions.
- A PostgreSQL backed worker for formal scoring, practice feedback, and follow-up chat.
- The local Python Codex SDK with a signed-in ChatGPT account and configurable `gpt-6-luna` model. The current private setup does not require an OpenAI API key. Practice source checks use live web discovery plus independent server retrieval. The old Dify API routes return HTTP 410.

Read the [architecture decisions](docs/architecture/product-architecture.md) for data boundaries, provider choice, and known limitations.

## Local start

Prerequisites: Python 3.12+, `uv`, Node.js 22+, `pnpm`, PostgreSQL 16 or newer, and a signed-in Codex CLI/Desktop app for AI jobs.

1. Install dependencies: run `cd backend && uv sync`, then `cd ../frontend && pnpm install`.
2. From the repository root, run `make local-setup`. It creates a private `.env` (if needed), generates `DJANGO_SECRET_KEY`, creates the frontend's `.env.local` with the same `JWT_SECRET`, starts the project-owned PostgreSQL instance, and applies migrations.
3. Run `make createsuperuser` to create the first administrator, then `make dev-local`. The API listens on `http://127.0.0.1:8000`, the web app on `http://127.0.0.1:5100`, and the AI worker starts alongside them.

`make local-setup` keeps PostgreSQL data in the ignored `.dev_pg` directory and listens on `127.0.0.1:55432`. It does not create accounts or sample data. Use `make local-demo` only when you explicitly need disposable demonstration accounts. `make local-db-stop` stops this project-owned database without deleting its data.

The [local setup guide](docs/development/private-local-setup.md) has the worker, authentication, diagnostics, and test commands.

## Validation

```bash
cd backend && uv run pytest api_v2 ai_feedback core -m 'not performance'
cd frontend && pnpm test
cd frontend && pnpm exec tsc --noEmit
cd frontend && pnpm build
```

Stop `pnpm dev` before `pnpm build`, because they share `.next`. A passing suite verifies the implemented paths; the [acceptance record](docs/development/release-acceptance-2026-10-01.md) records verified behavior and the limits of this local release.
