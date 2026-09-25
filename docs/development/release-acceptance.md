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

## Boundaries of this local candidate

The requested one-institution, private local journeys are implemented. The following work is still required before a broader institutional pilot or a third interface language:

1. Finish cataloging the remaining dynamic and legacy interface strings. A third language still requires a new catalog and extending the current two-language preference contract; user-authored essays and rubrics remain independent of the interface language.
2. Run a full keyboard and screen-reader audit, a cross-browser pass, and measured responsive/performance checks. Current browser acceptance used the local in-app browser only; the six API performance tests do not establish browser speed.
3. Evaluate source-verification coverage with a representative bilingual claim set. Unsupported checks remain unresolved; the observed English and Chinese cases do not establish general fact-check accuracy.
