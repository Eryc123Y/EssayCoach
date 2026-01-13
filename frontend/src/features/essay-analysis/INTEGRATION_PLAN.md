# Technical Specification: Dify AI Workflow Integration

## 1. Architecture Overview

The integration follows a **Backend-as-a-Proxy** pattern. The frontend interacts with dedicated endpoints in the Django `ai_feedback` app, which handles orchestration with the Dify API.

### Current State vs. Goal

- **Current**: Frontend uses `AnalysisProgress` with a 5-second simulation timer and `FeedbackDashboard` with `MOCK_SCORES`.
- **Goal**: Frontend triggers real Dify workflows via backend, polls for status, and displays live AI feedback.

### Interaction Flow

1. **Submission**: `EssaySubmissionForm` -> `useEssayAnalysisStore.runAnalysis()` -> `POST /api/v1/ai-feedback/agent/workflows/run/`.
2. **Polling**: `AnalysisProgress` observes `status === 'polling'` -> `useEssayAnalysisStore.pollStatus()` -> `GET /api/v1/ai-feedback/agent/workflows/run/{id}/status/`.
3. **Completion**: Store updates with `outputs` -> `FeedbackDashboard` renders real data.

---

## 2. Data Models & API Contracts

### Request: `POST /api/v1/ai-feedback/agent/workflows/run/`

```typescript
interface WorkflowRunRequest {
  essay_question: string;
  essay_content: string;
  language: string; // Default: 'English'
  response_mode: 'blocking'; // Currently used mode
  user_id?: string;
}
```

### Response (Initial):

```json
{
  "workflow_run_id": "string",
  "task_id": "string",
  "status": "running"
}
```

### Status Response: `GET /api/v1/ai-feedback/agent/workflows/run/{id}/status/`

```typescript
interface WorkflowStatusResponse {
  id: string;
  status: 'running' | 'succeeded' | 'failed';
  outputs?: {
    text: string; // JSON string containing structured feedback
  };
  error?: string;
}
```

---

## 3. Component Hierarchy & Responsibilities

### `EssayAnalysisView` (Feature Container)

- Manages the switch between `SubmissionForm`, `AnalysisProgress`, and `FeedbackDashboard`.

### `EssaySubmissionForm`

- Validates input using Zod.
- Dispatches `runAnalysis` action.

### `AnalysisProgress`

- **Replaced**: Simulation logic removed.
- **New**: Observes store `status`. Shows "Running" while polling, "Success" when `outputs` are available.

### `FeedbackDashboard`

- Receives `outputs` from the store.
- Parses the `text` field (JSON) into scores and comments.

---

## 4. State Management (Zustand)

### Store: `useEssayAnalysisStore`

- `status`: `'idle' | 'submitting' | 'polling' | 'success' | 'error'`
- `workflowRunId`: `string | null`
- `feedback`: `FeedbackData | null`
- `error`: `string | null`

**Actions:**

- `runAnalysis(input)`: Hits the run endpoint, sets `workflowRunId`, switches status to `polling`.
- `startPolling()`: Sets up a `setInterval` or recursive `setTimeout` to hit the status endpoint until `succeeded` or `failed`.
- `setFeedback(data)`: Finalizes the process.

---

## 5. Implementation Plan

### Phase 1: API Layer (Frontend)

1. Create `frontend/src/service/api/ai-feedback.ts`.
2. Register the two backend endpoints using the existing `request` utility.

### Phase 2: Store Logic

1. Implement `useEssayAnalysisStore` in `frontend/src/features/essay-analysis/utils/store.ts`.
2. Add polling logic with a backoff or fixed interval (e.g., 2 seconds).

### Phase 3: Component Connection

1. Update `EssaySubmissionForm` to call the store.
2. Update `AnalysisProgress` to remove the mock timer and link to store status.
3. Update `FeedbackDashboard` to map real JSON output to UI cards.

### Phase 4: Error Handling

1. Handle Dify timeouts (backend proxy usually handles but frontend should show state).
2. Handle malformed JSON in `outputs.text`.

---

## 6. Edge Cases & Constraints

- **Max Length**: Essays are capped at 20,000 characters by the backend serializer.
- **Persistence**: Backend currently does not save results to PostgreSQL. A follow-up task should implement a "Save Feedback" action that hits the `core` app endpoints.
- **Static Rubric**: The system currently uses `rubric.pdf` at the root. Future versions should allow dynamic rubric selection.
