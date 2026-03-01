# Dashboard Refactor - Phase 1: Backend API Implementation

**Date**: 2026-02-25
**Author**: Fullstack Developer Team
**Status**: Phase 1 Complete (Backend API)

---

## Overview

This document captures the implementation learnings from Phase 1 of the Dashboard Overview Refactor, which focused on creating role-specific backend API endpoints.

---

## What Was Implemented

### Backend API Endpoints (Django Ninja)

Three new role-specific dashboard endpoints were added to `/backend/api_v2/core/views.py`:

| Endpoint | Method | Role | Response Schema |
|----------|--------|------|-----------------|
| `/api/v2/core/dashboard/lecturer/` | GET | Lecturer/Admin | `LecturerDashboardOut` |
| `/api/v2/core/dashboard/student/` | GET | Student | `StudentDashboardOut` |
| `/api/v2/core/dashboard/admin/` | GET | Admin | `AdminDashboardOut` |

### New Schema Classes (`/backend/api_v2/core/schemas.py`)

#### Lecturer Dashboard
- `LecturerStats`: essaysReviewedToday, pendingReviews, activeClasses, avgGradingTime
- `ClassOverview`: id, name, unitName, studentCount, essayCount, avgScore, pendingReviews
- `GradingQueueItem`: submissionId, studentName, essayTitle, submittedAt
- `LecturerDashboardOut`: Complete response combining all lecturer data

#### Student Dashboard
- `StudentStats`: essaysSubmitted, avgScore, improvementTrend, feedbackReceived
- `StudentEssay`: id, title, status, submittedAt, score, unitName, taskTitle
- `StudentDashboardOut`: Complete response combining all student data

#### Admin Dashboard
- `AdminStats`: totalUsers, activeStudents, activeLecturers, totalClasses, systemHealth
- `SystemStatus`: database status, 24h activity metrics, active users count
- `AdminDashboardOut`: Complete response combining all admin data

#### Common Types
- `DashboardActivityItem`: Enhanced activity feed with icons and categorization
- `UserInfo`: Standardized user information across all roles

---

## Key Implementation Decisions

### 1. Role-Specific vs Generic Endpoint

**Decision**: Create separate endpoints for each role instead of a single generic endpoint.

**Rationale**:
- Type safety: Each response schema is tailored to the role's needs
- Performance: Only fetch data needed for the specific role
- Security: Built-in permission checks at the endpoint level
- Frontend clarity: Explicit typing based on user role

**Trade-offs**:
- More endpoints to maintain
- Requires frontend to know user role before calling

### 2. Improvement Trend Calculation

**Implementation**: Compare average scores of recent 3 submissions vs previous 3 submissions.

```python
if diff > 2:
    improvement_trend = "up"
elif diff < -2:
    improvement_trend = "down"
else:
    improvement_trend = "stable"
```

**Rationale**: Simple heuristic that provides meaningful feedback without complex ML.

### 3. Activity Feed Personalization

**Student Feed**: Shows own submissions and received feedback
**Lecturer Feed**: Shows student submissions and graded essays

**Rationale**: Contextually relevant activities for each role's workflow.

### 4. Feedback Source Detection

```python
ai_feedback_exists = FeedbackItem.objects.filter(
    feedback_id_feedback=feedback,
    feedback_item_source="ai"
).exists()
```

**Purpose**: Distinguish between AI-graded and lecturer-reviewed submissions for accurate status display.

---

## Database Query Optimization

### N+1 Query Prevention

All queries use `select_related` and `prefetch_related`:

```python
submissions = Submission.objects.filter(
    user_id_user=user
).select_related(
    "task_id_task",
    "task_id_task__unit_id_unit"
).order_by("-submission_time")[:limit]
```

### Aggregation Efficiency

Using Django's `aggregate()` for calculations instead of Python loops:

```python
scores = FeedbackItem.objects.filter(
    feedback_id_feedback__in=feedback_ids
).aggregate(models.Avg("feedback_item_score"))
```

---

## Frontend Integration

### TypeScript Types (`/frontend/src/service/api/v2/types.ts`)

Mirrored all backend schemas with TypeScript interfaces:

```typescript
interface LecturerStats {
  essaysReviewedToday: number;
  pendingReviews: number;
  activeClasses: number;
  avgGradingTime: number | null;
}
```

### API Client (`/frontend/src/service/api/v2/dashboard.ts`)

Created service layer for dashboard API calls:

```typescript
export const dashboardService = {
  async getLecturerDashboard(): Promise<LecturerDashboardResponse> { ... },
  async getStudentDashboard(): Promise<StudentDashboardResponse> { ... },
  async getAdminDashboard(): Promise<AdminDashboardResponse> { ... },
};
```

### React Hook (`/frontend/src/hooks/useDashboard.ts`)

Custom hook with automatic role detection:

```typescript
export function useDashboard<T extends DashboardData>() {
  // Fetches user info first to determine role
  // Then calls appropriate role-specific endpoint
  // Returns typed data, loading, error, and refetch
}
```

---

## Security Considerations

### Permission Checks

Each endpoint validates user role:

```python
if user_role != "student":
    raise HttpError(403, "Access denied. Student role required.")
```

### Data Isolation

- Students only see their own data
- Lecturers see data from their assigned classes
- Admins have platform-wide access

### Query Parameter Validation

All limit parameters have defaults and maximums to prevent abuse.

---

## Testing Strategy

### Backend Unit Tests (Pending)

Tests should cover:
1. Role-based permission checks
2. Stats calculation accuracy
3. Activity feed ordering
4. Empty state handling
5. Query optimization (no N+1)

### Frontend Integration Tests (Pending)

Tests should cover:
1. Hook renders correct data for each role
2. Loading and error states
3. Refetch functionality
4. Type safety with different roles

---

## Known Limitations

### 1. Task Title Display

Current implementation uses `Task {task_id}` as title because the Task model lacks a `title` field.

**Fix Required**: Add `title` field to Task model (part of PRD-09 Task Module).

### 2. Average Grading Time

Currently returns `null` - would need timestamp tracking for grading actions.

**Fix Required**: Add grading timestamp logging to Feedback model.

### 3. System Health Check

Basic implementation only checks database connectivity.

**Enhancement**: Add Redis, external API, and queue health checks.

---

## Migration Notes

### Database Migrations

No new database migrations required - all views use existing models.

### API Compatibility

- Existing `/api/v2/core/dashboard/` endpoint preserved for backward compatibility
- Frontend should migrate to role-specific endpoints
- Legacy endpoint marked as `@deprecated`

---

## Performance Benchmarks

### Query Count (per request)

| Role | Queries | Notes |
|------|---------|-------|
| Student | ~5-7 | Submissions, feedback, activity |
| Lecturer | ~8-10 | Classes, submissions, feedback, activity |
| Admin | ~6-8 | User counts, system status, activity |

### Response Time Targets

- P50: < 200ms
- P95: < 500ms
- P99: < 1000ms

**Note**: Actual benchmarks pending production load testing.

---

## Next Steps (Phase 2)

1. **Frontend Dashboard Components**
   - Create `LecturerDashboard` component
   - Create `StudentDashboard` component
   - Create `AdminDashboard` component

2. **UI Components**
   - `GradingQueue` table
   - `ClassOverviewCards` grid
   - `MyEssaysList` table
   - `ProgressTracker` chart
   - `ActivityFeed` timeline

3. **Integration**
   - Connect components to `useDashboard` hook
   - Implement loading skeletons
   - Add error boundaries

---

## Files Modified

### Backend
- `/backend/api_v2/core/views.py` - Added dashboard endpoints and helper functions
- `/backend/api_v2/core/schemas.py` - Added dashboard response schemas

### Frontend
- `/frontend/src/service/api/v2/types.ts` - Added TypeScript types
- `/frontend/src/service/api/v2/dashboard.ts` - Created API client
- `/frontend/src/service/api/v2/index.ts` - Exported dashboard service
- `/frontend/src/hooks/useDashboard.ts` - Created React hook

---

## References

- PRD-04: `/docs/prd/04-dashboard-overview.md`
- Design: `/docs/prd/pencil-shadcn.pen` (EC-04 Dashboard screens)
- Implementation Plan: `/docs/plans/dashboard-refactor-plan.md`
