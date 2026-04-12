# Frontend code tour (temporary guide)

> **Purpose:** A reading order for returning to the EssayCoach frontend after time away.  
> **Scope:** Next.js 15 App Router, feature slices, v2 API services, and how they map to Django API v2.  
> **Note:** This file is meant as a **personal tour document**—delete or move it when you no longer need it.

---

## 1. How to use this document

1. Read sections **2 → 3** once (mental model).
2. Follow **4** in order; open each path in the editor and skim imports + one representative component.
3. When something “calls the API,” jump to **5** and the matching **backend** row in **6**.
4. Section **7** is where **LangChain / LangGraph** work will plug in later (today the stack still goes through Dify in several places).

---

## 2. Stack (what you are looking at)


| Layer                  | Location                                                                    | Role                                                                      |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Routes & layouts       | `frontend/src/app/`                                                         | URLs, server components, dashboard shell                                  |
| Route-handler proxy    | `frontend/src/app/api/v2/[...path]/route.ts`                                | Browser → Next → Django `/api/v2/...` with cookie-derived `Authorization` |
| Feature UI + hooks     | `frontend/src/features/`                                                    | Domain-specific components, hooks, tests                                  |
| Typed HTTP + contracts | `frontend/src/service/api/v2/`                                              | Prefer this for new API work                                              |
| Legacy / split callers | `frontend/src/service/api/` (e.g. `dify.ts`), `frontend/src/service/agent/` | Older or workflow-specific paths—know before refactoring                  |
| Shared UI              | `frontend/src/components/ui/`                                               | shadcn-style primitives                                                   |
| Auth utilities         | `frontend/src/lib/auth.ts`                                                  | JWT verification (server), CSRF helpers                                   |
| Backend URL (server)   | `frontend/src/lib/server-api.ts`                                            | Resolves API base for proxy / SSR                                         |


---

## 3. Request path (browser → Django)

```
Browser (same origin, e.g. 127.0.0.1:5100)
  → fetch('/api/v2/...')  with credentials: 'include'
  → Next route handler: src/app/api/v2/[...path]/route.ts
       - Forwards allowlisted headers + cookies
       - Sets Authorization: Bearer <access_token> from httpOnly cookie
  → Django: /api/v2/...  (Ninja routers under backend/api_v2/)
```

**Implication:** Feature code should normally **not** embed the raw Django host; it hits **same-origin** `/api/v2/...` and the proxy attaches the token.

---

## 4. Guided reading order (frontend)

### Step A — Root shell and marketing entry


| Order | Path                          | What to notice                |
| ----- | ----------------------------- | ----------------------------- |
| A1    | `frontend/src/app/layout.tsx` | Root layout, fonts, providers |
| A2    | `frontend/src/app/page.tsx`   | Landing page                  |


### Step B — Authentication UX


| Order | Path                                                    | What to notice                                                                |
| ----- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| B1    | `frontend/src/app/auth/sign-in/[[...sign-in]]/page.tsx` | Sign-in surface                                                               |
| B2    | `frontend/src/app/auth/sign-up/[[...sign-up]]/page.tsx` | Sign-up surface                                                               |
| B3    | `frontend/src/lib/auth.ts`                              | **Server** JWT verify with `jose`; CSRF cookie read patterns                  |
| B4    | `frontend/src/app/api/v2/auth/` (if present)            | Server-only auth handoff / cookie setting—compare with any legacy `api/auth/` |


**Backend:** `backend/api_v2/auth/` — login, refresh, register, sessions.

### Step C — Dashboard routing (important gotcha: parallel routes)


| Order | Path                                              | What to notice                                                                           |
| ----- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| C1    | `frontend/src/app/dashboard/layout.tsx`           | Sidebar / chrome                                                                         |
| C2    | `frontend/src/app/dashboard/page.tsx`             | **Server** JWT check → redirect to role-specific area                                    |
| C3    | `frontend/src/app/dashboard/[role]/page.tsx`      | Student / lecturer / admin entry                                                         |
| C4    | `frontend/src/app/dashboard/overview/page.tsx`    | Overview shell                                                                           |
| C5    | `frontend/src/app/dashboard/overview/@*/page.tsx` | **Parallel routes**—each `@slot` is a fragment; the parent layout must include all slots |


**Backend:** `GET /api/v2/core/dashboard/` — `frontend/src/service/api/v2/dashboard.ts` + types in `types.ts`.

### Step D — Feature slices (read in any order by interest)


| Feature                                            | Primary folder                          | Typical entry                                                                           |
| -------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| Dashboard widgets / data                           | `frontend/src/features/dashboard/`      | `hooks/useDashboardData.ts`                                                             |
| Overview-only UI                                   | `frontend/src/features/overview/`       | Used by overview parallel routes                                                        |
| Essay submit + analysis page glue                  | `frontend/src/features/essay-analysis/` | `components/essay-submission-form.tsx`, `components/revision-chat.tsx`                  |
| Essay feedback (charts, PDF, radar, shared viewer) | `frontend/src/features/essay-feedback/` | `components/FeedbackViewer.tsx`, `hooks/useDifyWorkflow.ts`                             |
| Rubrics                                            | `frontend/src/features/rubrics/`        | `hooks/useRubrics.ts` (**still tied to legacy rubric service path**—see service layer)  |
| Tasks                                              | `frontend/src/features/tasks/`          | Forms, dialogs; **git:** root `.gitignore` has `tasks/`—new files may need `git add -f` |
| Classes                                            | `frontend/src/features/classes/`        | List/detail/dialogs                                                                     |
| Settings                                           | `frontend/src/features/settings/`       | Zustand store lives here (exception to “hooks only” default)                            |
| Profile                                            | `frontend/src/features/profile/`        | Tabs + hooks                                                                            |


**App routes that mount essay flow:**


| Route file                                           | Role                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `frontend/src/app/dashboard/essay/page.tsx`          | Essay submission entry                                                              |
| `frontend/src/app/dashboard/essay-analysis/page.tsx` | Post-submit analysis UI (imports both `essay-analysis` and `essay-feedback` pieces) |


### Step E — Service layer (contracts + HTTP)


| Order | Path                                                                               | What to notice                                                                                       |
| ----- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| E1    | `frontend/src/service/api/v2/client.ts`                                            | Typed methods, CSRF, timeouts, `credentials: 'include'`                                              |
| E2    | `frontend/src/service/request.ts`                                                  | Lower-level fetch helper                                                                             |
| E3    | `frontend/src/service/api/v2/types.ts`                                             | Large shared DTO hub—mirror of backend schemas                                                       |
| E4    | `frontend/src/service/api/v2/auth.ts`                                              | Auth + rubric CRUD and related calls (multiple concerns in one module by history)                    |
| E5    | `frontend/src/service/api/v2/tasks.ts`, `classes.ts`, `dashboard.ts`, `rubrics.ts` | Domain splits; **rubrics:** CRUD vs advanced actions intentionally split (`rubrics.ts` vs `auth.ts`) |
| E6    | `frontend/src/service/api/v2/ai-feedback.ts`                                       | Workflow run / status—aligns with v2 AI routes                                                       |
| E7    | `frontend/src/service/agent/agent-service.ts`                                      | Another path to `/api/v2/ai-feedback/...`—used by hooks such as `useDifyWorkflow`                    |
| E8    | `frontend/src/service/api/dify.ts`                                                 | **Legacy naming**—still hits `/api/v2/ai-feedback/chat/` from `essay-analysis` revision chat         |


### Step F — Tests (how the repo expects you to work)


| Path                                    | Note                                          |
| --------------------------------------- | --------------------------------------------- |
| `frontend/src/test/setup.ts`            | Global Vitest mocks (`next/navigation`, etc.) |
| `frontend/src/features/**/*.test.ts(x)` | Co-located tests—good examples beside hooks   |


Run a single file:  
`cd frontend && pnpm exec vitest run src/features/<path>/<file>.test.ts`

---

## 5. “Where does this screen get data?”


| User-facing area                    | Frontend hook / service                                   | Backend (Django Ninja)                                                                        |
| ----------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Sign in / up                        | Auth flows in app + `service/api/v2/auth.ts`              | `backend/api_v2/auth/views.py`                                                                |
| Role dashboard                      | `useDashboardData` → `dashboard.ts`                       | `backend/api_v2/core/` (dashboard router)                                                     |
| Rubrics list / CRUD                 | `useRubrics` + `auth.ts` (rubric service)                 | `backend/api_v2/core/routers/rubrics.py`                                                      |
| Rubric duplicate / advanced         | `rubrics.ts`                                              | Advanced paths on core routers (see `routers/rubrics.py`)                                     |
| Tasks / classes                     | `tasks.ts`, `classes.ts`                                  | `backend/api_v2/core/routers/tasks.py`, `classes.py`                                          |
| Essay workflow UI                   | `useDifyWorkflow` → `agent-service.ts` / `ai-feedback.ts` | `backend/api_v2/ai_feedback/views.py`                                                         |
| Revision chat (essay analysis page) | `fetchChatMessage` in `service/api/dify.ts`               | Same `ai_feedback` router—chat endpoint (currently mock-oriented on backend per product docs) |


---

## 6. AI path today (frontend ↔ backend) — migration anchor

**Backend entry:** `backend/api_v2/ai_feedback/views.py`  
Uses `ai_feedback.dify_client.DifyClient` and provider-agnostic-ish interfaces under `backend/ai_feedback/`.

**Frontend entry points to read before designing LangChain:**

1. `frontend/src/service/api/v2/ai-feedback.ts` — workflow run + status.
2. `frontend/src/service/agent/agent-service.ts` — `analyzeEssay` / polling patterns.
3. `frontend/src/features/essay-feedback/hooks/useDifyWorkflow.ts` — how the UI drives analysis.
4. `frontend/src/features/essay-analysis/components/revision-chat.tsx` — chat UX + `dify.ts` transport.
5. `frontend/src/features/essay-feedback/hooks/useRevisionChat.ts` — mock-first hook in the feedback feature (two parallel chat stories—be aware).

**Design goal (from product direction):** Keep **response shapes** compatible with existing TS types / viewer components where possible; swap **implementation** behind `api_v2/ai_feedback` (and optionally rename frontend files away from `Dify`* as the provider changes).

---

## 7. Working together on LangChain / LangGraph (next steps)

When you are ready to start implementation (not only reading), a practical sequence is:

1. **Lock the contract:** Open `backend/api_v2/ai_feedback/schemas.py` and the matching sections of `frontend/src/service/api/v2/types.ts` for workflow in/out. Decide what stays byte-for-byte stable for the UI.
2. **Introduce a provider boundary on the backend:** e.g. `EssayAgentInterface` implementation that calls LangChain instead of Dify, still returning `WorkflowRunOut`-compatible payloads.
3. **Streaming (optional phase 2):** If you want SSE, add a parallel route or extend the proxy with streaming support—today the proxy uses `fetch` + `blob()` (non-streaming).
4. **Frontend cleanup:** Rename `useDifyWorkflow` / `dify.ts` once behavior moves; avoid duplicate clients (`agent-service` vs `ai-feedback.ts`) if you can consolidate safely.

---

## 8. Quick reference paths

```
frontend/src/app/                 # routes, layouts, api/v2 proxy
frontend/src/features/          # domain features + tests
frontend/src/service/api/v2/    # typed v2 API layer
frontend/src/lib/               # auth, server-api, utils
frontend/src/components/ui/     # shadcn primitives
backend/api_v2/                 # all v2 HTTP routers
backend/api_v2/ai_feedback/     # AI HTTP surface + schemas
backend/ai_feedback/            # provider integration (Dify today)
```

Happy reading. When you want to start the LangChain design in earnest, say whether you prefer **blocking JSON** first (minimal UI change) or **streaming chat** first (more moving parts).