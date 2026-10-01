# Private local release acceptance — 2026-10-01

This record maps the owner-approved private local product to the 14 authoritative PRDs and seven release gates in `docs/architecture/product-completion-plan.md`. Scope remains one institution, invitations rather than open registration, English and Simplified Chinese, Codex ChatGPT subscription sign-in with Luna, and lecturer review followed by explicit course-lead publication. A lecturer may perform both actions with separate audit records. It does not represent a public deployment or institutional pilot.

## Requirement matrix

| PRD | Implemented behavior | Current evidence |
| --- | --- | --- |
| 01 Landing | Institution name/logo/primary color, bilingual explanation and authenticated entry | Shared branding integration tests cover successful save and failed-save preservation. A real settings save propagated the institution name to the landing page, sign-in page and refreshed dashboard; a simulated failed save preserved the saved brand. Test branding was restored. Public pricing, sales and legal-site journeys are outside this private build. |
| 02 Sign in | Role routing, password display, remembered or session-only cookies, shared failed-login lock, password reset and session revocation | Cookie response tests ensure login/refresh JSON contains no credentials. Five failures lock the account for 15 minutes with 429; expiry/success/concurrent attempts are tested. Real three-role login, browser refresh, keyboard password controls and invalid links were observed. |
| 03 Sign up | Single-use staff/student invitation activation; no client-selected role or open registration | Production browser E2E invited and activated a lecturer and student in a disposable database, then completed their teaching/assessment journey. Invitation permission, expiry and replay tests pass. |
| 04 Dashboard | Role-specific persisted statistics, activity, notifications and links | Admin/lecturer/student desktop and 390px routes were inspected. WebKit's unstable first-render date was repaired with a deterministic server-render regression; eight final admin desktop/mobile WebKit routes passed without overflow or script errors. |
| 05 Practice | Autosaved drafts, immutable revisions, selected rubric, feedback, annotation notes, source evidence, chat, comparison, exemplar and PDF print | Concurrent real English/Chinese runs persisted feedback, three rubric criteria, two annotations, matching NASA/UN quotes and retrieval times; follow-up chat succeeded in both languages. Both real practice reports exported to three A4 pages each, with complete essay/source/chat text and closed rubric exemplars; all six pages were visually inspected. Other-student access was denied. All retrieved saved drafts remain selectable, including drafts older than the first five; a regression opens the sixth draft and its matching feedback. |
| 06 Rubrics | Manual/private/public authoring, validated weights/ranges, versioned snapshots/copies, educator exemplars and PDF import | Manual/private permission and validation tests pass; rubric forms/details were inspected in both languages. A generated synthetic PDF imported through the real Luna API as three weighted criteria. This is a specific successful import, not evidence for every PDF. |
| 07 Settings | Profile, verified email, password, sessions, preferences, notifications and organization branding | API and UI tests cover saved preferences, session revocation and branding updates. Settings forms and dialog focus were inspected; the browser branding save, refresh and failed-save preservation journey passed. API-key management and self-registration controls are excluded by the owner's decisions. |
| 08 Profile | Role-scoped portfolio/history/achievements/privacy; lecturer classes | Backend ownership tests pass. Student/lecturer/admin profiles were inspected at desktop and mobile widths. |
| 09 Assignments | Publish/copy, immutable rubric/submission, optional revision, personal extensions, export/review queue and audited release | Real English/Chinese formal jobs succeeded. Student result access stayed hidden before release; early publication was rejected. Lecturer review and course-lead release produced `ai_proposal_recorded`, `lecturer_reviewed`, `lead_confirmed`, `published` in order. Browser E2E observed a hidden then published result. |
| 10 Classes | Course-scoped create/edit/copy/archive, roster, invitation, join code, progress and leave request | Role/course membership tests pass. Production browser E2E created a class/assignment and invited an enrolled student; class forms/dialogs and scoped pages were inspected. |
| 11 Community | Released-essay sharing, visibility, feedback, likes, bookmarks, reports and moderation with original-comment context | API tests cover ownership and targeted comment removal. The browser shared a released synthetic essay, reported one of two comments, showed its original content to the moderator and removed only that comment while retaining the other feedback and shared essay. |
| 12 Analytics | Role/date scopes, trends/distribution, sorting and CSV; successful login events | Only successful login/activation events count; failed/refresh calls do not. Scope/date/count tests pass; admin and teacher analytics pages were inspected. CSV is the supported spreadsheet-readable export. |
| 13 Users | Search/filter/sort/page, invite, status/reset actions, confirmed single/bulk deletion and per-account results | Permission and UI tests pass; own/other admin deletion is blocked and linked teaching records return 409. WebKit deleted an activated, suspended synthetic empty account. A mixed bulk action deleted the other empty account, retained the enrolled account and displayed its concrete 409 reason. Revoked credentials are cleaned up; login/admin audit history survives deletion. The protected-account reason is localized in English/Chinese. |
| 14 Help | Role onboarding/articles/FAQ/search, category navigation, usefulness voting, optional support email and persisted tickets | FAQ/contact/role tests pass. Article/dialog states were inspected. The browser created a student ticket, replied and resolved it as admin, reloaded the owner-visible reply, excluded it from another student’s list and denied that student’s edit with 403. Help attachments are not an explicit MVP requirement. |

Implementation entry points are the matching `frontend/src/features/` modules and `backend/api_v2/` routers, with shared domain behavior under `backend/core/`. The focused tests live beside their modules; the full suites include them rather than adding partial counts twice.

## Release gates

| Gate | Observed evidence | Status |
| --- | --- | --- |
| Start from local setup | `make local-setup` configured private environment files and native localhost PostgreSQL. A separate empty cluster migrated through `core.0035`, seeded on request, tolerated repeated setup, retained identical record counts after stop/start, and subsequently upgraded through `core.0036`. The main database retained identical counts and formal-job state across a real stop/start. Existing data-directory port mismatches are rejected before database access. | Passed; dependencies were already installed on this machine, so this is a fresh configuration/database check rather than a new operating-system installation. |
| Invitation and membership | Disposable production-browser workflow: admin → lecturer invitation/activation → class/task → student invitation/activation/submission. Permission tests deny unrelated users/classes. | Passed. |
| Course, rubric, writing | Persisted class/task/rubric/submission journey plus real bilingual practice and generated-PDF rubric import. | Passed for the listed paths. |
| AI persistence and failure | Validated real results and independently retrieved quotes; visible real timeout; authorized retry; crash recovery after the original lease expired. | Passed for the observed runs. |
| Human formal release | Distinct teacher review and lead publication; four audit events; student grade hidden before release and visible afterward. | Passed in live API and deterministic-provider browser workflow. |
| Remaining role journeys | Dashboards/profile/settings/analytics render real scoped data. Branding save/failure/restoration, single/mixed deletion, targeted moderation and owner-only help reply journeys passed in browsers. | Passed for the listed paths. |
| Bilingual responsive integration | Full automated suites; final production build; desktop/mobile role routes; Firefox/WebKit authentication; repaired WebKit admin routes; axe page/dialog scans and keyboard controls; complete bilingual PDF export. | Passed for the listed automated and inspected scope. |

## Automated verification

- Backend: **491 passed**, 6 performance tests deselected, 8 legacy naive-datetime warnings. All **6 performance tests** separately pass.
- Frontend: **48 test files / 577 tests passed**. These counts include the SDK, auth, date, token-fragment and print regressions where applicable; partial runs are not added to the total.
- Local setup: **10 focused tests passed**.
- Ruff, Pyright, TypeScript, Django checks and migration checks pass. ESLint has **0 errors / 104 existing warnings**.
- The final production Next.js build passes, including token-fragment, print-event, auth-response, older-draft access and Chinese protected-account repairs. The final production-browser formal workflow also passes (one test, 7.4 seconds including setup).
- Documentation build passes; API schema and model diagram are generated from current source. No remote GitHub CI run or deployment is claimed.

## Real provider evidence

The ignored local record is `backend/source-eval-results/2026-10-01-live-workflows/acceptance.json`. Only fixed synthetic English/Chinese essays and a generated synthetic rubric were used in this acceptance run.

- Two concurrent formal jobs and two concurrent practice jobs succeeded under real `gpt-6-luna`; two saved follow-up chat turns and a synthetic PDF import also succeeded.
- A real worker was killed during scoring. Its original 15-minute lease expired naturally; a new worker completed attempt 2 and saved exactly one AI proposal.
- A deliberately short real provider timeout persisted `timeout` and exited in 1.26 seconds after the SDK upgrade. An authorized teacher retried the failed job through the API; a student retry returned 403. The retried job completed on attempt 2 with exactly one saved proposal. An earlier SDK cancellation hang was reproduced and repaired; a subprocess regression exercises actual SDK subscription cleanup.
- Admin observability confirmed the signed-in runtime and retrieved a selected job's persisted generation span after worker replacement; students received 403. Traces redact free text and retain complete JSONL tails within 128KiB per process/job file.
- The 32-case source run recorded **29 correct outcomes, one unresolved resolvable claim and two spurious extractions, zero wrong verified verdicts and zero provider errors**. Verified coverage was 23/24 and verified precision 23/23. Original labels were retained. See [Source-check evaluation](source-check-evaluation.md) for the wide intervals, ambiguous opinion labels and exact limitations.

These are specific observed cases. They establish the product paths and visible failure behavior; they do not guarantee AI accuracy across all essays, continuous service availability, arbitrary job durations or arbitrary concurrency.

## Browser and local evidence

Browser acceptance used the seeded private accounts and clearly named synthetic records. Test data remains in the ignored local database; no user essays were sent to the provider for these checks.

- Production Chromium workflow: admin invitation → lecturer activation → class/assignment creation → student activation/submission → deterministic test worker → teacher review and course-lead publication. The test provider is guarded by the disposable `essaycoach_e2e` database and is unavailable through a product API. English and Chinese 390px released-result views passed.
- Firefox 155 and WebKit 26.6: 12 public authentication pages at 1440×900 and 390×844; Firefox additionally inspected 18 authenticated student/admin pages. The repaired WebKit admin dashboard/users/analytics/observability routes passed all eight desktop/mobile visits. These are the specified browsers/pages, not every browser version or device.
- Axe WCAG 2/2.1 A/AA rules: 102 lecturer/admin/public visits and an independent final 46 student/public visits produced zero rule violations, scan errors or unintended redirects. Twenty-four custom form/dialog states produced zero rule violations; focus stayed inside dialogs and Escape returned focus to the trigger. Two additional native confirmations were inspected and dismissed. Automated scans and keyboard inspection are not a human screen-reader assessment or a WCAG certification.
- Eleven representative navigation-to-loaded-interface observations were 589–632ms, including a 500ms network-idle wait. The admin dashboard's original timing probe used an incorrect heading; its corrected single-route probe passed at 627ms. These one-machine observations are not a load test or general performance guarantee.
- Both real practice PDFs contain three pages, all six visually inspected. Text extraction checked essay endings, source quotes, saved chat and collapsed exemplars. Original exemplar disclosure states are restored after printing. Twelve final browser checks additionally verified malformed password/email fragments, Chinese resolved-ticket/profile/community controls, protected-account denial and desktop/mobile practice overflow.

Ignored local browser records live under `/private/tmp/essaycoach-admin-delete-final/`, `/private/tmp/essaycoach-support-social-final/`, `/private/tmp/essaycoach-webkit-admin-final/`, `/private/tmp/essaycoach-a11y-run/`, `/private/tmp/essaycoach-brand-e2e/` and `/private/tmp/essaycoach-pdf-2026-10-01/` and `/private/tmp/essaycoach-final-ui/`. These paths document this machine's evidence and are not portable release assets.

## Completion boundary

Development and local acceptance are complete for the approved private English/Chinese product scope. Real provider runs, local browser workflows, data persistence and automated suites support that conclusion. Public deployment, a real institutional pilot, general AI accuracy and human screen-reader validation are separate outcomes and are not claimed here.
