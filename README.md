# EssayCoach

EssayCoach is being built as a private, bilingual writing platform for one institution. Staff invite students into courses. Students can practice writing with AI feedback and source checks; formal essay grades require lecturer review and course lead publication.

**Development status (2026-09-25):** the one-institution private local candidate implements the requested role journeys. The reviewed [interactive prototype](docs/architecture/interactive-prototype.md) guides the interface. Real routes cover invitations, classes and assignments, practice feedback, teacher assessment and lead publication, analytics, community, administration, help, and observability. The [acceptance record](docs/development/release-acceptance.md) distinguishes verified behavior from the accessibility, source-quality, and third-language work needed for a broader pilot.

## Current architecture

- Next.js 15, React 19, TypeScript, and Tailwind CSS 4 for the web interface.
- Django 4.2 with Ninja API v2 and PostgreSQL 17 for application data and permissions.
- A PostgreSQL backed worker for formal scoring, practice feedback, and follow-up chat.
- The local Python Codex SDK with a signed-in ChatGPT account and configurable `gpt-6-luna` model. The current private setup does not require an OpenAI API key. Practice source checks use live web discovery plus independent server retrieval. The old Dify API routes return HTTP 410.

Read the [architecture decisions](docs/architecture/product-architecture.md) for data boundaries, provider choice, and known limitations.

## Local start

Prerequisites: Python 3.12+, `uv`, Node.js 22+, `pnpm`, PostgreSQL 17, and a signed-in Codex CLI/Desktop app for AI jobs.

1. Copy `.env.example` to `.env`. Set a stable, private `DJANGO_SECRET_KEY` and your local PostgreSQL connection values.
2. Install dependencies with `cd backend && uv sync`, then `cd ../frontend && pnpm install`.
3. Start PostgreSQL using `make db` for Docker Compose, or start your existing local instance.
4. Run `make migrate` and `make createsuperuser`. Invite staff and students through the application; `make seed-db` is only for disposable development fixtures.
5. Run `make dev-local` when PostgreSQL is already running, or `make dev` to start the Docker database too. This starts the API at `http://127.0.0.1:8000`, the web app at `http://127.0.0.1:5100`, and the AI worker.

The [local setup guide](docs/development/local-private-setup.md) has the worker, authentication, diagnostics, and test commands.

## Validation

```bash
cd backend && uv run pytest api_v2 ai_feedback core -m 'not performance'
cd frontend && pnpm test
cd frontend && pnpm exec tsc --noEmit
cd frontend && pnpm build
```

Stop `pnpm dev` before `pnpm build`, because they share `.next`. A passing suite verifies the implemented paths; the [acceptance record](docs/development/release-acceptance.md) separates verified behavior from outstanding PRD items.
