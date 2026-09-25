# EssayCoach local private setup

This is the development setup for one institution on a single machine. The [completion plan](../architecture/product-completion-plan.md) and [acceptance record](release-acceptance.md) track release checks. The reviewed `/prototype` remains a design reference while the authenticated routes are verified.

## Prerequisites

- Python 3.12 or newer, `uv`, Node.js 22 or newer, and `pnpm`.
- PostgreSQL 17 reachable on a local port. Docker Compose or a locally installed PostgreSQL instance both work.
- The Codex desktop/CLI signed in with a ChatGPT subscription. The worker uses this sign-in and requires **no OpenAI API key**. `CODEX_BIN` may point to a compatible Codex executable when `codex` is not on `PATH`; the current desktop app on macOS provides `/Applications/ChatGPT.app/Contents/Resources/codex`.

## Configure and start

1. Copy `.env.example` to the repository-root `.env`. Replace `DJANGO_SECRET_KEY` with a fresh value, for example from `openssl rand -hex 32`. Keep `.env` private. Set `POSTGRES_*` to your local database; a Homebrew PostgreSQL install usually uses your macOS account as `POSTGRES_USER` and an empty `POSTGRES_PASSWORD`. The Docker Compose defaults in the example use the `postgres` role. Use `http://localhost:5100` consistently in the browser and `ESSAYCOACH_APP_URL` so email links share the same cookie host.
2. Install dependencies: `cd backend && uv sync`; then `cd ../frontend && pnpm install`.
3. Start PostgreSQL. For Docker use `make db`. For a local installation, start PostgreSQL with your package manager and create the configured database if it does not exist.
4. Run `make migrate`, then `make createsuperuser` to create the first administrator. This administrator can invite lecturers; assigned teaching staff can invite students. Do not use the old `seed-db` command for a private institution, because it creates public test accounts.
5. Start the application with `make dev-local` for an already running local database. This launches Django on `127.0.0.1:8000`, Next.js on `127.0.0.1:5100`, and the AI worker. With Docker, start the database using `make db` first, then use `make dev-local`.

The worker reads durable `AIJob`, `PracticeRun`, and `PracticeChatTurn` rows. A formal submission creates an `ai_pending` assessment and a pending job. On success, Luna writes an AI proposal for teaching staff. A lecturer must review the proposal, then that course's lead explicitly publishes the final score. Both actions are audited, even when the same teacher performs both actions. A student sees no formal grade until publication.

The authenticated `/dashboard/essay-analysis` route now saves student-owned practice drafts, snapshots each analyzed revision, and polls a durable practice run. Students can import UTF-8 text/Markdown, selectable-text PDF, and DOCX documents up to 10 MB, and ask follow-up questions tied to a saved report. Practice feedback, chat, and fact-check evidence appear only on the student's own account. Source discovery uses the signed-in Codex runtime with live web search; the backend independently fetches each candidate page and requires a matching quote before a claim can be marked supported or contradicted. A failed retrieval or ambiguous result remains unresolved. The source URL and excerpt are saved with the run. Practice scores never become formal grades.

For a one-job diagnostic, run `cd backend && uv run python manage.py run_ai_worker --once`. Staff can inspect a job via `GET /api/v2/ai-feedback/jobs/{job_id}/` and retry a failed job through the corresponding `/retry/` endpoint. A provider or validation failure remains visible in the job record; it never publishes a grade.

PDF rubric import also uses the local Codex subscription session and Luna. The parser accepts selectable-text PDFs up to 10 MB and 20 pages. It validates the returned dimensions and score bands before saving. No SiliconFlow API key is required for the product import route.

Teaching staff can also build a rubric manually with criteria, weights totaling 100%, contiguous score levels, and optional high-scoring exemplar text. Students can create private study rubrics and use them in practice; they cannot publish them to the institution. The library offers a revised copy workflow, so changes to a rubric never alter an assignment's saved rubric snapshot. Exemplars are visible in the scoring guide and the corresponding practice-report criterion.

Notification and verification emails are written to `backend/outbox/` by default. To deliver mail outside the machine, set `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend` and configure the `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, and `EMAIL_USE_TLS` variables. A verified email change sends a one-hour link to the new address; it invalidates existing sessions when confirmed.

Local traces are written as JSON Lines under `backend/logs/`; admin users can inspect health, worker heartbeat, failed AI jobs, and recent traces at `/dashboard/observability`. Logs and spans contain IDs and status metadata, not essay text or credentials.

## Current limits

- Practice feedback, source verification, follow-up chat, and document import work locally. Source coverage is limited; a claim without a retrieved matching quote is explicitly unresolved. The legacy Dify analysis/chat/status endpoints return HTTP 410; use the `/api/v2/practice/` routes.
- English and Simplified Chinese cover the authenticated journeys. Most static active-page copy is in `frontend/src/locales/` under stable message IDs; dynamic strings and some older components still keep inline pairs. A third interface language needs its own catalog and a preference-contract extension. Stored essays and rubrics remain independent of interface language.
- The worker has a 180-second model-turn limit and a 15-minute database lease. A crashed worker's stale lease can be reclaimed on restart. Jobs failed after three attempts require operator investigation.
- Local tests use PostgreSQL. Run `cd backend && uv run pytest api_v2 ai_feedback core -m 'not performance'`, `cd frontend && pnpm test`, and `cd frontend && pnpm exec tsc --noEmit`. Run `pnpm build` after stopping the frontend dev server; both processes share `.next`.
