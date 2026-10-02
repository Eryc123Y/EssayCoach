# EssayCoach completion plan

- Status: local candidate implemented, 2026-09-25; pilot-quality limits remain in the acceptance record
- Goal: convert all 14 PRDs and the reviewed bilingual prototype into a usable, private local product
- Architecture baseline: [product-architecture.md](product-architecture.md)
- Current product checks: [2026-10-01 acceptance record](../development/release-acceptance-2026-10-01.md); the checkpoints below retain the implementation history.

The stages below are ordered by dependency, not by page number. A stage is complete only when the named behavior uses persisted data, server-side permissions, Chinese and English copy, relevant automated checks, and a browser journey. Fixture-only prototype interactions do not count as product completion.

| Stage | Deliverable | Exit gate |
| --- | --- | --- |
| 0. Architecture and runtime | Data/permission contracts, migration plan, Codex SDK and source-retrieval spikes, local worker/telemetry decision | Bilingual structured output, source fetch, failure/status/concurrency checks or a documented blocked capability |
| 1. Identity and teaching scope | Admin bootstrap, staff/student invitation activation, course lead assignment, class membership, user status | No open registration or client-selected role; unauthorized and cross-class paths denied |
| 2. Course setup | Courses, classes, roster, assignments, rubric authoring/versioning | Staff can create and publish an assignment; enrolled student sees the correct immutable rubric |
| 3. Writing and practice | Draft autosave, formal submission, practice feedback, revision chat, source evidence | Student can resume a draft and receive persisted, sourced feedback without creating a formal grade |
| 4. Assessment | AI proposal, lecturer edit/review, lead confirmation/publication, audit trail | Student cannot fetch pre-publication grades; a lead publishes an explainable final result |
| 5. Remaining PRDs | Dashboards, profile/settings, social moderation, analytics/CSV, admin directory, help | Each of PRDs 01–14 has a real role-appropriate journey; stubs are gone |
| 6. Product integration | Apply the prototype design to authenticated pages, shared locale catalogs, typed API contracts | Four role journeys work at desktop/mobile widths in both languages |
| 7. Local release | Observability view, health/retry tools, migrations/seed, setup documentation, regression suite | Fresh local setup passes automated checks and browser acceptance with no Dify runtime dependency |

Work proceeds in vertical slices through these stages. The release gates below are checked against the running product, not just code presence.

Stage 0 evidence so far (2026-09-25): local ChatGPT login, Python SDK with Luna, JSON-schema output, usage metadata, English/Chinese concurrent calls, an exception for an invalid model, and independent HTTP retrieval of a returned source URL. Remaining gates include a persisted run and status path, timeout/cancellation behavior, trace correlation, and trustworthy search-event/source capture. These checks must be repeated through the application boundary before Stage 0 is closed.

Implementation checkpoint (2026-09-25): invitation-only activation and course-scope checks are in place; formal submissions create immutable essay records, a rubric snapshot when valid, and a durable AI job. The local worker uses Codex subscription login with Luna and persists an AI proposal, usage, failure status, and retry metadata. English and Chinese jobs succeeded in an isolated local database; a mocked timeout verified interruption. Teacher review, course-lead confirmation/publication, weighted final score, and audit records are implemented in the API. The same person can perform the review and lead action with two separate audit events.

The practice vertical slice now saves drafts, immutable revisions, provider runs, retries, source evidence, and follow-up chat turns. The student can import UTF-8 text, Markdown, selectable-text PDF, or DOCX files. It uses live Codex web search for source discovery and independent server retrieval before source-supported/contradicted verdicts. The authenticated writing studio and report are connected to real API data; an English student browser journey completed from login through a persisted report and a follow-up answer. Source coverage is still narrow, and Chinese factual verification can return unresolved. Legacy Dify API routes return 410 and no active route calls Dify.

Latest checkpoint (2026-09-25): role-scoped analytics/CSV, social sharing and moderation, profile portfolio, settings with revocable JWT sessions and verified email changes, local email/in-app notifications, help tickets, admin directory, invitation flows, and a local observability page are implemented. The root landing page and shared locale preference are live. PDF rubric import now uses the ChatGPT-signed-in Codex Luna adapter; `test_rubric.pdf` was parsed and saved through the real API as three dimensions, 33 levels, and weights 50/30/20. Manual rubric authoring, student-private study rubrics, educator exemplars, and a bilingual scoring-guide view are connected. Formal submissions support an optional single immutable revision, personal deadline extensions, teacher export/review queue, and separate review/publication records. A fresh PostgreSQL database migrated through `core.0033`; full 362-backend/598-frontend regression and a production build passed. Browser acceptance observed admin, lecturer, and student paths at mobile width, including a hidden pre-publication grade, a visible published grade, and a private student rubric in practice selection. A live Chinese practice run retrieved a matching NASA quote. The exact evidence and remaining pilot-quality limits are tracked in the release acceptance record.

## Release acceptance

1. A new local checkout can start the frontend, API, PostgreSQL, worker, and trace viewer from documented commands, with no public deployment or provider API key.
2. An admin can invite staff; authorized staff can invite students; an invited student can activate an account and access only enrolled classes.
3. A lecturer can configure a class, assignment, and rubric, and a student can practice, revise, and submit an essay.
4. AI feedback has a persisted run ID, validated result, and reviewable source evidence or an explicit unresolved status. A failed run is retryable and never appears as a score.
5. A lecturer can revise the AI proposal, a course lead can confirm and publish it, and a student sees the formal result only then. Every edit and release is auditable.
6. Social, analytics, settings, profile, users, dashboard, and help flows operate on real records under role-aware permissions.
7. English and Simplified Chinese interfaces, responsive layouts, keyboard access, loading/empty/error states, and core end-to-end tests pass.

## Risk and estimation

The main schedule risks are the unproven long-running Codex SDK use case, source-verification quality, legacy auth/role migration, and replacing prototype fixtures across 14 PRDs. A calendar estimate should be recalculated after Stage 0 and Stage 1 expose real migration/test costs. Do not count the current prototype or an SDK one-call smoke test as evidence that these stages have shipped.
