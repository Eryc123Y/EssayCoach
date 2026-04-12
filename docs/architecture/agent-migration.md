# AI agent migration: Dify → LangChain / LangGraph

This document describes the planned migration of EssayCoach’s essay analysis and revision chat from **Dify** to a **LangGraph**-centric stack (with LangChain agents where appropriate). It is the working design reference for implementation; update it as decisions land.

---

## 1. Purpose and scope

### Goals

- Replace external **Dify** workflow calls with an in-repo **LangGraph** (and optional `create_agent`) implementation.
- Keep **HTTP routes and consumer contracts** stable where practical so the **Next.js** app does not require a large rewrite.
- Support future **multi-tier agents** (institution, class, student) by defining **memory namespaces** and **policy evolution** without locking in a third-party memory OS in v1.

### In scope

- `POST /api/v2/ai-feedback/agent/workflows/run/` — essay analysis “workflow run”.
- `GET /api/v2/ai-feedback/agent/workflows/run/{id}/status/` — status / structured result.
- `POST /api/v2/ai-feedback/chat/` — revision / tutor chat (streaming optional in later phases).
- Configuration, observability, and test strategy for the new stack.

### Out of scope (initial document version)

- Full implementation of **institution-wide trend agents** or **class copilots** (only forward-compatible notes).
- Adoption of **MemOS** or other managed memory SaaS (Postgres + LangGraph `PostgresStore` is the default per product direction).

### Related code (anchors)


| Area                       | Location                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Ninja routes & Dify wiring | `backend/api_v2/ai_feedback/views.py`                                                                                                 |
| Request/response schemas   | `backend/api_v2/ai_feedback/schemas.py`                                                                                               |
| Provider client today      | `backend/ai_feedback/dify_client.py`                                                                                                  |
| Frontend v2 AI calls       | `frontend/src/service/api/v2/ai-feedback.ts`, `frontend/src/service/agent/agent-service.ts`                                           |
| Types                      | `frontend/src/service/api/v2/types.ts` (`WorkflowRunRequest`, `WorkflowRunResponse`, `EssayAnalysisOutput`, `WorkflowStatusResponse`) |


---

## 2. Current state

- **Backend** exposes v2 AI feedback under `/api/v2/ai-feedback/…` with **JWT** (`JWTAuth`).
- **Analyze** path uses `**DifyClient.analyze_essay`** and maps results into `**WorkflowRunOut**` and `**WorkflowStatusOut**`.
- **Chat** is still thin / mock-oriented in parts of the frontend; migration should treat chat as a **second** graph or agent with shared context (essay, rubric, prior feedback).
- **Frontend** proxies to Django via `**/api/v2/...`** (Next route handler); callers must keep using **cookie + CSRF** patterns.

---

## 3. Target architecture

### Orchestration

- **LangGraph** `StateGraph` for **explicit** steps: e.g. load context → rubric-aware analysis → structured scoring → synthesis → optional critique loop.
- `**create_agent`** where **tool use + middleware** are enough (e.g. simpler chat), still compiled on LangGraph per LangChain OSS patterns.

### Two surfaces


| Surface           | Pattern                                | Notes                                                                                                |
| ----------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Essay analyze** | Blocking or polled completion          | Prefer returning `**WorkflowRunOut`**; heavy work may return “running” then `**WorkflowStatusOut**`. |
| **Revision chat** | Multi-turn; streaming in a later phase | Same auth; consider **SSE** vs full message per turn for v1.                                         |


### Provider boundary

- Introduce an **implementation** behind today’s orchestration (replace `**DifyClient`** usage in views) so **URLs and schemas** stay stable.
- Long term, **OpenAPI** descriptions on Ninja should say “LangGraph” instead of “Dify” where accurate.

---

## 4. API and contract strategy

### 4.1 Endpoints to preserve

- `**POST .../agent/workflows/run/`** — body `**WorkflowRunIn**` (`essay_question`, `essay_content`, optional `language`, `response_mode`, `user_id`, `rubric_id`).
- `**GET .../agent/workflows/run/{workflow_run_id}/status/**` — response `**WorkflowStatusOut**`.
- `**POST .../chat/**` — `**ChatMessageIn` → `ChatMessageOut**` (evolve carefully if streaming).

### 4.2 What is `WorkflowRunOut`?

`**WorkflowRunOut**` is the **immediate response envelope** for a **single workflow run** (one essay analysis invocation). It is **not** the full rubric breakdown by itself; the graded content lives under `**data.outputs`** when complete.

Backend shape (summary):


| Field                 | Meaning                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `**workflow_run_id**` | Stable id for this run (logging, polling).                                                                 |
| `**task_id**`         | Provider/async task id; useful for status checks.                                                          |
| `**data**`            | `**WorkflowDataOut**`: `id`, `**status**`, `**outputs**` (dict when done), `error`, timings, token fields. |
| `**inputs**`          | Echo of inputs (question, essay text, language; rubric usage indicator in schema).                         |
| `**response_mode**`   | `blocking` vs `streaming` echo.                                                                            |


The **typed essay result** the UI relies on is `**EssayAnalysisOut`**: `overall_score`, `total_possible`, `percentage_score`, `feedback_items[]`, `overall_feedback`, `strengths`, `suggestions`, `analysis_metadata`, optional `rubric_name` / `rubric_id`.

**Status polling** uses `**WorkflowStatusOut`**, where `**outputs**` is `**EssayAnalysisOut | null**` — stricter than `**WorkflowDataOut.outputs: dict | null**` on the run response. Migration should **align** these (e.g. validate `outputs` as `**EssayAnalysisOut`** on completion for both paths) to avoid client ambiguity.

### 4.3 Contract principles

1. **Minimize frontend churn**: keep `**EssayAnalysisOut` / `EssayAnalysisOutput`** field names and meanings.
2. **Async-friendly**: allow `**WorkflowRunOut`** with `**data.status**` = running and `**outputs**` = null; clients continue to poll **status** until terminal state.
3. **Versioning**: breaking changes require `**/api/v3/...`** or an explicit version field — default plan is **no break** for v2 consumers.
4. **Chat separately**: analyze vs chat can ship in **two phases** with independent flags.

### 4.4 Frontend type alignment

`WorkflowRunResponse` in `types.ts` is intentionally loose in places (`Record<string, unknown>`). After backend normalization, **tighten TS types** to match `**WorkflowRunOut`** and nested `**EssayAnalysisOut**` to prevent drift.

---

## 5. Memory and context

### Layers


| Layer                  | Mechanism                                                                                                          | Use                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **Working / thread**   | LangGraph **checkpointer** + `thread_id`                                                                           | Current run and multi-turn chat.                                                  |
| **Long-term / scoped** | `**PostgresStore`** (or Django tables + optional pgvector) with **namespaces** (`tenant`, `class`, `task`, `user`) | Lecturer corrections, policy snippets, retrieval for marking consistency.         |
| **Source of truth**    | **Django models**                                                                                                  | Submissions, rubrics, grades, audit logs — never replace with vector-only stores. |


### “Self-evolving” behavior

- Lecturer **feedback on agent behavior** should be stored as **versioned events** (relational), then **surfaced** to the graph via retrieval or **procedural / prompt** updates (LangMem-style patterns), not silent weight changes.
- **MemOS / external memory** remains **optional** and out of MVP unless a spike shows a clear gap.

---

## 6. Security and tenancy

- **JWT** and existing **RBAC** unchanged; agent code must not bypass `**JWTAuth`** on v2 routers.
- **Multi-tenant isolation**: memory namespaces and retrieval filters must include **org/class** boundaries as the product model requires.
- **PII**: essay text and embeddings — document retention and whether embeddings are allowed per deployment.

---

## 7. Observability and quality

- **Tracing**: LangSmith (or equivalent) for graph steps and failures.
- **Evals**: golden essays / schema checks on `**EssayAnalysisOut`**; optional LLM-as-judge with human spot checks for rubric adherence.

---

## 8. Implementation phases (suggested)


| Phase                      | Deliverable                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| **0 — Spike**              | One LangGraph for analyze; same `**WorkflowRunOut`** / `**EssayAnalysisOut**`; feature flag.         |
| **1 — Production analyze** | Replace Dify for blocking path; status endpoint wired; env cleanup (`DIFY_*` deprecation plan).      |
| **2 — Chat**               | Real chat graph/agent; optional streaming; frontend replaces mock/`dify.ts` naming where applicable. |
| **3 — Memory harness**     | Lecturer correction events → stored policy / retrieval; class-scoped behavior.                       |


---

## 9. Open decisions

- Model provider(s) and fallbacks.
- **Streaming** transport for chat (SSE vs WebSocket) vs v1 full-message responses.
- Whether `**WorkflowDataOut.outputs`** is formally typed as `**EssayAnalysisOut**` in OpenAPI for the run response.
- Background worker vs synchronous request for long graphs.

---

## 10. References

- Project status and commands: root `AGENTS.md`
- Ninja schemas: `backend/api_v2/ai_feedback/schemas.py`
- Target multi-agent diagrams and CRAG narrative: `docs/agentic-workflow/agentic-design.md`
- LangChain long-term memory (stores, namespaces): [LangChain docs — Long-term memory](https://docs.langchain.com/oss/python/langchain/long-term-memory)

---

## Appendix A — Illustrative target stack (non-binding)

Concrete libraries change with spikes; this table is a **planning anchor** only.


| Layer           | Target                                               | Notes                                             |
| --------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Orchestration   | LangGraph                                            | Cyclical flows (e.g. CRAG) and parallel branches. |
| Agent API       | LangChain (`create_agent`, tools, structured output) | Where a full graph is unnecessary.                |
| Validation      | Pydantic / Ninja                                     | Align with `EssayAnalysisOut` and graph state.    |
| Vector / search | TBD (e.g. pgvector, managed search)                  | Fact-check / retrieval; not locked in MVP.        |


---

## Appendix B — LangGraph state sketch (reference)

Illustrative `TypedDict` shapes for parallel scatter–gather + fact subgraph (from earlier design notes; refine during implementation):

```python
# Main graph state (conceptual)
class OverallState(TypedDict):
    essay_content: str
    essay_question: str
    fact_check_report: dict
    language_analysis: str
    logic_analysis: str
    rubric_criteria: dict
    final_evaluation: str

# Fact-checker subgraph (conceptual)
class FactState(TypedDict):
    claims: list[str]
    verification_results: list[dict]
    documents: list[str]
    web_search_needed: bool
```

---

*Last updated: 2026-04-12 — draft for implementation planning.*