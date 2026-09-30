# Local release acceptance record

This record describes the one-institution, private local product on 2026-09-25. The 14 original PRDs were written for a broader public service. The owner's later decisions control this build: invitation-only accounts, English and Chinese, Codex subscription login with Luna, teacher review followed by course-lead publication, and no public deployment. The same lecturer may perform both assessment actions; they create separate audit events.

## Implemented journeys

| PRD | Current local journey | Evidence or boundary |
| --- | --- | --- |
| 01 Landing | Product introduction and authenticated entry | Public sales contact, legal pages, social proof, and pricing are outside the private local scope. |
| 02 Sign in | JWT sign in, password reset, session revocation, role routing | Browser sign in observed for admin, lecturer, and student; permission tests cover unauthorized access. |
| 03 Sign up | Single-use staff and student invitation activation | Open registration and client role selection were removed by product decision. |
| 04 Dashboard | Role-specific persisted statistics, activity, notifications, links | Admin and student mobile dashboards observed; lecturer dashboard observed earlier in this build. |
| 05 Practice | Draft autosave, file import, Luna feedback, source checks, annotation detail, chat, PDF print, revision comparison, exemplar disclosure | Real English report and follow-up reply observed. Source coverage remains limited. |
| 06 Rubrics | Transactional manual authoring, student-private and staff-public rubrics, versioned copy, Codex PDF import | Browser created a private student rubric and found it in practice selection. A real PDF import produced three dimensions with validated weights. |
| 07 Settings | Profile, verified email change, password, sessions, language/theme, notifications, organization settings | Self-registration toggle and API-key management were removed by product decision. |
| 08 Profile | Portfolio, history, achievements, privacy settings | Backed by role-scoped records. |
| 09 Assignments | Publish, duplicate, deadlines/extensions, immutable submissions and one optional revision, export, review queue | Student status and deadline warning; teacher counts and ZIP export. |
| 10 Classes | Create/edit/duplicate/archive, roster, join code, progress, leave request, scoped administration | Student leave requires a staff decision rather than immediate removal. |
| 11 Community | Released-essay sharing, visibility, feedback, likes, bookmarks, reports, moderation, notifications, pagination | Scroll loading and a manual fallback are present. |
| 12 Analytics | Student, class, institution scopes; date filters, trends, distribution, CSV, sort controls | Formal scores only contribute after publication. |
| 13 Users | Admin directory, invite, search/filter/sort, pagination, account actions, audit trail | Hard deletion of accounts with course records is blocked to preserve submissions. |
| 14 Help | Role-based articles, FAQ, search, support tickets, article usefulness vote | Help vote saved in browser acceptance. |

## Verification on this machine

- PostgreSQL 17: an empty `essaycoach_fresh_rubric_20260925` database migrated from zero through `core.0033`; `manage.py check` found no issues. That temporary verification database was dropped afterward.
- Full backend regression: 362 passed, 6 performance tests deselected, 8 warnings from older tests using naive datetimes. `make test` now includes all backend test directories. A new permission test prevents a student's private practice rubric from being attached to a formal assignment.
- Full frontend regression: 598 passed. TypeScript, Ruff, Django checks, migration checks, and `git diff --check` passed. ESLint completed with 116 warnings, mostly in legacy components and tests. The final production Next.js build passed after the locale-catalog migration; the optional Sentry import still emits a webpack critical-dependency warning even while Sentry is disabled by default.
- All 6 tests marked `performance` passed on the local PostgreSQL instance. They are targeted API checks, not a browser performance benchmark.
- Browser checks used real local accounts and persisted data. At 390px, admin and student dashboards, admin directory, teacher assignment detail, student assignment cards, submission states, and the practice report were observed. Teacher assignment download/review selection and the help vote were also observed. A pending formal result exposed no grade to the student; a published result showed the teacher's final score and comment.
- English and Chinese UI switching was observed, including persistence after a reload in the practice studio. User-authored essay and rubric text stayed in its original language.
- The student rubric form and detail were observed at 390px in Chinese. The manual endpoint rejects bad total weights and score gaps atomically, and nested private rubric endpoints reject other students. A practice report test opens an educator-authored exemplar directly from its rubric criterion.
- A live Chinese practice run with the student's private rubric completed under Luna, showed its high-scoring exemplar, and saved one independently fetched NASA quote supporting the eight-minute sunlight claim. This is a single successful source case, not representative coverage.
- The rubric editor's name, visibility, criterion, range, and action controls exposed labels in the in-app browser accessibility tree. Keyboard Tab moved from the name field to visibility as expected. Repeated score-level deletion controls now identify their score range and criterion. This is a focused smoke check, not a full accessibility audit.
- Shared English/Chinese catalogs now contain 809 matching message IDs. All static two-argument copy calls in active pages, including landing and community, were moved to IDs; an AST check found no remaining static pairs and no missing catalog references. Nineteen dynamic copy calls still use a two-argument fallback. The browser showed the rubric library and landing page correctly in both languages, confirmed the community search input's accessible name, and showed one correctly localized confirmation when the account language changed.

## Re-verification in a second environment, 2026-09-30

Run on a Linux container (PostgreSQL 16 where the setup guide asks for 17, Python 3.12, Node 22, headless Chromium). There is no Codex sign-in there, so **no real AI call was made**. These checks cover code paths, the database, and the browser, not live model behavior.

- The 2026-09-25 results reproduced at commit `3946a4d`: backend 362 passed, frontend 598 passed, Ruff and TypeScript clean. Pyright reported 16 errors that this record did not mention. I could not make any of them fail at runtime (non-finite rubric weights are rejected with 422 before the flagged line, and a blank upload name returns 400), so each is a type-narrowing fix with unchanged behavior, and all are resolved.
- Final state: backend 410 passed plus the 6 performance tests, frontend 608 passed, Ruff, Pyright, and TypeScript clean, and the production build passes. ESLint reports 0 errors and 113 warnings.
- `make seed-db` crashed on the first row because it used field names that no longer exist, and its partial writes made a retry skip seeding. It now builds a demo course with a rubric and a published assignment, and a test requests that assignment's rubric as a student and a lecturer. A browser check after the first repair found the seeded assignment page returning 500 because the seed stored the rubric snapshot in the wrong shape; the snapshot shape now lives in `core.assessment.task_rubric_snapshot`, shared with the publish path.
- `make install` skipped the dev dependency group, so a fresh `make test` or `make lint` found no pytest or Ruff. It now runs `uv sync`.
- Automated accessibility: axe-core (WCAG 2.0/2.1 A and AA) over the signed-in pages of all three roles, in English and Chinese, at 1280px and 390px. The first run found 184 violation records under four rules: breadcrumb list structure on 18 pages, unlabeled filter selects, low contrast on practice text and task status badges, and scrolling lists without keyboard access. After the fixes the same run, repeated after each later change, reports none. `scripts/a11y` holds the script.
- Interface text: the catalogs now hold 1022 matching IDs. `localized()` accepts variables for `{name}` placeholders, and 18 dynamic calls plus 289 inline `zh ? '中文' : 'English'` sites in the class, assignment, layout, dashboard, and help screens were moved into them. A check confirmed that every replaced pair equals its catalog entry. Page text for both roles in both languages was identical before and after on the same data.
- Queue and provider tests without Codex: a live lease blocks a second worker, an expired lease is reclaimed, three lost attempts fail the job visibly, a superseded attempt's result is discarded, four concurrent workers claim one job once, and the Codex adapters reject a non-ChatGPT login, an incomplete turn, and malformed output. Removing the stale-result guard, the attempt cap, the lease check, or the row lock each fails a test.
- `manage.py eval_source_checks` and 32 labelled English and Chinese claim cases exist. The scoring and runner are tested, but the evaluation itself has not been run. See [Source-check evaluation](source-check-evaluation.md).

## Boundaries of this local candidate

The requested one-institution, private local journeys are implemented. The following work is still required before a broader institutional pilot or a third interface language:

1. About a dozen copy sites with interpolated values still choose text inline (mainly the assignment and class dialogs and the practice studio), and a few help-center strings come from data. A third language still requires a new catalog and extending the current two-language preference contract; user-authored essays and rubrics remain independent of the interface language.
2. The automated accessibility scan covers the listed pages in their seeded state. A keyboard and screen-reader pass, dialogs and form-error states, other browsers (only Chromium and the in-app browser have been used), and measured responsive and performance checks are still open.
3. Run `eval_source_checks` with a signed-in Codex runtime and record the report. A set of 32 single-claim essays can catch a regression; it does not establish general fact-check accuracy.
4. Observe the real Codex runtime over long runs, cancellation, a worker process crash, and concurrent users. The queue semantics are tested with fake providers only.
5. Legacy Dify, LangGraph, and mock-data modules have no caller but are still in the tree (the old essay-analysis and profile components, `dify_client`, `langgraph_client`, and their dependencies). Removal needs an explicit decision.
