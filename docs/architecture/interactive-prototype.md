# EssayCoach interactive prototype — phase 1

Status: retired. Phase 1 was implemented and browser-reviewed on 2026-09-25; the `/prototype` route was removed on 2026-10-02 once the real pages were accepted. This page is kept as the design record.

## Goal and boundary

Deliver a local, bilingual, clickable product prototype at `/prototype` that covers every numbered PRD, role-specific navigation, and the main end-to-end journeys. It is a design and interaction artifact. Mock actions must be visibly labelled as prototype behavior; no page may imply that a formal grade, invitation email, AI analysis, or support ticket was actually sent.

Existing authenticated routes and the API proxy remain available for the later feature integration phase. Product rules agreed for the future implementation take precedence over stale PRD text: one institution, lecturer-invited students, Chinese and English in v1, AI proposes formal scores, a lecturer reviews and edits them, and a course lead confirms before publication.

## Visual system

| Token | Value | Job |
| --- | --- | --- |
| Ink | `#19243B` | Main text and navigation |
| Cobalt | `#365CE6` | Primary actions and active state |
| Mist | `#F5F7FB` | Cool workspace background |
| Paper | `#FFFFFF` | Essay and focused work surfaces |
| Jade | `#21846F` | Completed and verified states |
| Ochre | `#A66A2C` | Awaiting review and caution |

Use the repository's Instrument Sans for headings and Inter for controls and body. Essay text uses a comfortable reading face with generous line height. The memorable element is the writing workspace: an essay page with a visible margin for feedback. Other screens use restrained dividers, well-spaced tables, and a compact navigation rail instead of repeated identical cards.

The original PRDs' blue/Inter dashboard proposal is a functional reference, while this visual system is the agreed modern refresh. No decorative gradient or animation is needed to explain workflow state.

### Layout sketch

```text
Desktop:  [240px navigation] [page title + actions]
                             [primary work area] [context rail when useful]

Writing:  [prompt / essay editor                    ] [rubric + session goal]
Feedback: [annotated essay                         ] [score + evidence + coach]
Review:   [student essay and source evidence        ] [editable AI draft]

Mobile:   [compact header + role/language controls]
          [one focused column]
          [bottom navigation / page menu]
```

Review against the brief: the essay margin is specific to writing and gives the UI an academic identity. The cool palette and high-density editorial layouts avoid a generic warm paper or same-sized SaaS card treatment. Only actions and review states receive strong color.

### Landing-page refinement

The homepage leads with a short writing promise and a legible annotated draft. The same paper becomes a single-column reading surface on narrow screens, with its margin comment placed immediately below the highlighted passage. This keeps the product's distinctive element visible within the first mobile viewport and removes unreadably small margin text. The lower section gives three course-specific benefits equal-width editorial columns; it no longer compresses them beside a large heading. The generic eyebrow, faux editor menu, rotation, and heavy shadow were removed. Two main actions stay together; the school contact link has its own labelled line, avoiding an accidental orphan at intermediate widths. The palette and type roles above remain the reference for the other screens.

## Coverage and required interactions

| PRD | Prototype screen | Reviewable interaction |
| --- | --- | --- |
| 01 Landing | Public introduction | Sign in, institution enquiry |
| 02 Sign in | Demo sign in | Select one of four roles, enter workspace, preview password recovery |
| 03 Sign up | Invitation activation | Accept a lecturer invitation; no open registration |
| 04 Dashboard | Student, lecturer, course-lead, admin overview | Follow a relevant next action |
| 05 Essay practice | Editor, AI feedback report | Choose goal/rubric, write, simulate feedback, revise, chat |
| 06 Rubrics | Library, editor/preview | Filter, create, set visibility, inspect criteria |
| 07 Settings | Preferences | Switch language and notifications |
| 08 Profile | Profile and progress | Switch tabs, edit bio, change privacy setting |
| 09 Assignments | Student list and lecturer task editor | Open task, draft/publish mock task, start essay |
| 10 Classes | Class list and detail | Create/open class, inspect tabs, invite student mock action |
| 11 Social learning | Class feed | Share, filter, like, bookmark, comment, report |
| 12 Analytics | Role-specific overview | Change time range and export mock CSV |
| 13 Users | Admin directory | Search/filter, inspect status, and invite lecturer/course lead mock action |
| 14 Help | Help centre | Search, open FAQ, submit mock support request |
| Cross-module | Lecturer and course-lead review | Lecturer edits AI score/feedback and submits review; course lead confirms and publishes mock grade |

## Acceptance

- Every numbered screen is reachable from a link and has a direct browser URL. English and Chinese cover the interface, actions, statuses, and prepared guidance. A sample English essay remains in English when the interface is switched to Chinese because it represents student-authored course content.
- Student, lecturer, course lead, and admin switchers demonstrate the relevant navigation and permissions. The invite and grade-release flows match the agreed B2B rules.
- Key actions change visible local state and have a clear next step. Empty, pending, success, and validation states appear where the journey needs them.
- Desktop and narrow/mobile views remain usable; keyboard focus is visible and reduced-motion settings are respected.
- `pnpm build` passes, and representative student, lecturer, and admin journeys are inspected in a browser.
- A handoff note identifies which interactions still use mock data and the corresponding real modules to connect next.

## Implementation sequence

1. Establish the isolated prototype route, role/language navigation, visual tokens, and shared components.
2. Build all PRD screens and the cross-module review screen using coherent mock records.
3. Wire the key journeys and local validation/state changes.
4. Inspect desktop and mobile renders, fix usability issues, run the frontend build, and record the handoff.

## Review and handoff

This section records how the prototype was reviewed; the `/prototype` route no longer exists (removed 2026-10-02), so these steps cannot be repeated on the current code. Reviewers opened `/prototype` from `pnpm dev`. The route used hash links such as `#practice`, `#review`, and `#users`, so a reviewer could return directly to any numbered screen. The header role selector switched among student, lecturer, course lead, and admin; the language selector switched the interface between English and Chinese. Role and language were saved locally. Other sample records and form results reset on a full reload.

The UI was reviewed at desktop and 390 px mobile widths. The student draft → practice feedback → revision path, lecturer review → course-lead approval → grade publication gate, invited student activation, and admin staff invitation were exercised in the browser. Rubric creation, class creation and student invitation, community sharing and reactions, help request, institution enquiry, profile/preferences, and role-specific analytics were also checked. The frontend production build and targeted prototype lint pass. Existing warnings elsewhere in the repository remain outside this phase.

All shown records are fixtures. Practice feedback, fact-check evidence, the coaching chat, AI draft score, review/published status, assignment and rubric creation, class and staff invitations, social posts, analytics, account activation, password recovery, and support or enquiry requests are local preview states. The CSV export downloads sample data. No AI request, live search, email, account mutation, or formal grade publication occurs from this route. The visible preview banner and action messages keep this boundary explicit.

### Next implementation connections

1. **Identity and class membership:** connect the invitation and role flows to `backend/api_v2/auth`, `backend/api_v2/core/routers/users.py`, `classes.py`, and the existing frontend auth and classes features. Enforce student invitation and course-lead permissions on the server.
2. **Teaching setup:** connect classes, assignments, and rubrics to `backend/api_v2/core/routers/classes.py`, `tasks.py`, and `rubrics.py`, then replace component-local arrays with typed API data. Version rubrics used for each submission.
3. **Writing and AI feedback:** connect draft/submission records to `submissions.py` and practice feedback to `backend/api_v2/ai_feedback`. Keep the provider boundary in `agent-migration.md`, add actual fact-check sources and trace identifiers, and distinguish practice feedback from formal scores in stored data.
4. **Formal assessment:** persist AI proposals, lecturer edits, course-lead approvals, and publication as distinct states with an audit trail. Only a course lead may publish; students see the formal result only after publication.
5. **Community and reporting:** connect social moderation, analytics, help requests, and admin user status to the existing `backend/api_v2/social`, `analytics`, `help`, and `users_admin` modules. Apply role-scoped queries and CSV exports.
6. **Localization and observability:** move the prototype's paired inline strings into translation catalogs before real feature integration, so more languages can be added. Carry request, workflow, provider, and review identifiers across the API and AI path as described in `agent-migration.md`.

The prototype is an isolated reference route. Product implementation should reuse its interaction rules and design tokens while replacing fixture state module by module; the existing authenticated routes and API proxy still need their own integration and verification.
