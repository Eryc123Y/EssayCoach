# AI agent migration: Dify → LangChain / LangGraph

This document describes the planned migration of EssayCoach’s essay analysis and revision chat from **Dify** to a **LangGraph**-centric stack. It is the working design reference for implementation; update it as decisions land. Sections marked as targets are not claims about the current code.

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

- Keep the essay workflow in Python **LangGraph** and call a provider-neutral model adapter from bounded graph nodes. The initial adapter uses the **Python Codex SDK**, a local ChatGPT sign-in, and a configurable Luna model; later adapters can use an API or another provider without changing graph steps or the public essay result contract.
- Keep the existing `EssayAgentInterface` as the application-facing workflow boundary. Add a narrower model-execution boundary inside the graph so `provider_name` identifies the execution provider rather than confusing it with the LangGraph orchestrator.
- The Codex SDK is the initial **local/private runtime choice**, subject to an end-to-end spike for structured output, source capture, cancellation, timeouts, and concurrent runs. Do not infer that the current API-key-based `LangGraphEssayAgent` already uses it.
- Replace `DifyClient` usage in views progressively while keeping **URLs and schemas** stable.
- Store the AI result as a draft. Django/Postgres owns the lecturer's review and edits, the course lead's confirmation, and publication; a model run cannot publish a formal grade.
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

Observability is part of the first working AI module, including the Codex SDK spike, rather than a later dashboard task. Keep instrumentation provider-neutral and usable in the local/private deployment. OpenTelemetry spans and structured JSON logs are the default direction; a local OTLP collector/trace viewer and metrics endpoint can be added when the worker is wired. LangSmith remains an optional exporter, not a dependency for local use.

### Run and trace contract

- Generate one application `run_id` per essay-analysis request. Carry it through the Ninja request, background job, LangGraph nodes, provider call, fact-check searches, persisted AI draft, and error response. Record `trace_id` alongside it when tracing is enabled. Keep Codex thread/turn IDs as provider metadata so a run can be diagnosed without exposing them in the product API.
- Persist a run record with submission/rubric references and rubric version, provider/model and prompt/schema versions, locale, status, start/end timestamps, node-level attempts, error category, and available token/usage fields. A process restart must not erase the status endpoint’s result. Mark unavailable provider usage as unknown rather than zero.
- Span the main stages separately: context/rubric loading, writing analysis, claim extraction, source retrieval, claim verification, rubric scoring, schema/score validation, and draft persistence. Record duration and outcome for each. Capture query/source IDs and URLs for fact checking, plus whether each claim was supported, contradicted, or unresolved. Source evidence belongs in the run record so reviewers can open it; do not rely on a trace alone as evidence.
- Log structured identifiers, durations, statuses, retry counts, and typed failure reasons. Do not put raw essay text, full prompts, credentials, or model responses into general logs or trace attributes. Store reviewable feedback and evidence in access-controlled application records.
- Record a separate append-only audit event for each teacher edit, approval, and publication, linked to the AI draft/run. Preserve the original AI proposal, editor identity, timestamp, and changed fields so the final grade can be explained.

### Operational signals and quality checks

- Track run success/failure/cancellation, per-stage latency, queue age, retries, schema-validation failures, missing citations, fact-check coverage, and provider usage/rate-limit failures. Compare AI draft scores with approved scores by rubric criterion and language to find systematic disagreement; use aggregate views for dashboards.
- Maintain a small bilingual set of rubric/essay fixtures for schema, scoring-arithmetic, citation, and teacher-review checks. Before switching a provider or model, replay these fixtures and review score/feedback differences. Optional model-as-judge output is supplementary to teacher spot checks.
- The Codex spike passes only when one bilingual sample can be traced end to end, yields a validated `EssayAnalysisOut`, preserves source references for verified claims, and surfaces a simulated provider failure with a useful run status. A failed spike leaves the provider boundary intact while the execution adapter is reconsidered.

---

## 8. Implementation phases (suggested)


| Phase                      | Deliverable                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| **0 — Spike**              | One LangGraph analysis flow with the Codex SDK adapter, Luna, structured output, source capture, and correlated trace/run record; same `WorkflowRunOut` / `EssayAnalysisOut` contract. |
| **1 — Production analyze** | Replace Dify for analysis; durable status endpoint, stage telemetry, teacher-review draft boundary, and `DIFY_*` retirement. |
| **2 — Chat**               | Real chat graph/agent; optional streaming; frontend replaces mock/`dify.ts` naming where applicable. |
| **3 — Memory harness**     | Lecturer correction events → stored policy / retrieval; class-scoped behavior.                       |


---

## 9. Open decisions

- Which execution adapter to use if the Codex SDK spike cannot meet structured-output, source-capture, or concurrency needs. Luna is the initial model, with provider/model selection configurable per task.
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

*Last updated: 2026-09-25 — runtime and observability decisions recorded; implementation pending.*
