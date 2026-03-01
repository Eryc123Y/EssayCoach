# Dashboard Backend API Implementation

**Date**: 2026-02-25
**Author**: python-pro (Backend Support)
**Related PRD**: PRD-04 Dashboard Overview
**Status**: Phase 1 Complete - Backend API

---

## Overview

This document covers the implementation of the Dashboard Backend API for the EssayCoach platform, introducing a service-layer architecture for role-based dashboard data aggregation.

## Implementation Summary

### Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `backend/core/services.py` | Created | Dashboard service layer with business logic |
| `backend/api_v2/core/schemas.py` | Modified | Added V3 dashboard response schemas |
| `backend/api_v2/core/views.py` | Modified | Added V3 dashboard endpoints |
| `backend/api_v2/core/tests/test_dashboard.py` | Modified | Added V3 endpoint tests |

### New Endpoints

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/v2/core/dashboard/v3/` | GET | All | Role-aware dashboard data (service layer) |
| `/api/v2/core/dashboard/grading-queue/` | GET | Lecturer | Essays pending review |
| `/api/v2/core/dashboard/class/{id}/metrics/` | GET | Lecturer/Admin | Class performance metrics |
| `/api/v2/core/dashboard/activity-feed/` | GET | All | Recent activity timeline |

### Schema Architecture

```
DashboardStatsOut          # Base statistics (common)
    |
    +-- LecturerDashboardOutV3
    |   +-- grading_queue: list[PendingEssayOut]
    |   +-- class_overview: list[ClassMetricsOut]
    |   +-- recent_activity: list[ActivityItemOut]
    |
    +-- StudentDashboardOutV3
    |   +-- my_essays: list[EssaySubmissionOut]
    |   +-- progress_trend: list[ScoreTrendOut]
    |   +-- recent_activity: list[ActivityItemOut]
    |
    +-- AdminDashboardOutV3
        +-- system_health: dict
        +-- user_metrics: dict
        +-- recent_activity: list[ActivityItemOut]
```

## Service Layer Pattern

### DashboardService Class

The `DashboardService` class in `backend/core/services.py` encapsulates all dashboard-related business logic:

```python
class DashboardService:
    @classmethod
    def get_lecturer_dashboard(cls, user: User) -> LecturerDashboardOutV3
    @classmethod
    def get_student_dashboard(cls, user: User) -> StudentDashboardOutV3
    @classmethod
    def get_admin_dashboard(cls, user: User) -> AdminDashboardOutV3

    @staticmethod
    def get_grading_queue(user: User, limit: int = 10) -> list[PendingEssayOut]
    @staticmethod
    def get_class_metrics_for_classes(class_ids: list[int]) -> list[ClassMetricsOut]
    @staticmethod
    def get_activity_feed_for_lecturer(user: User, limit: int = 10) -> list[ActivityItemOut]
    @staticmethod
    def get_activity_feed_for_student(user: User, limit: int = 10) -> list[ActivityItemOut]
    @staticmethod
    def get_student_essays(user: User, limit: int = 10) -> list[EssaySubmissionOut]
    @staticmethod
    def get_score_trend(user: User, limit: int = 8) -> list[ScoreTrendOut]
```

### Benefits of Service Layer

1. **Separation of Concerns**: Business logic separated from HTTP handling
2. **Testability**: Services can be tested independently
3. **Reusability**: Same service methods used by multiple endpoints
4. **Maintainability**: Clear single responsibility for each method

## Query Optimization

### select_related / prefetch_related

All service methods use Django's query optimization to avoid N+1 problems:

```python
# Example from get_activity_feed_for_lecturer
submissions = Submission.objects.filter(
    task_id_task__unit_id_unit__in=Class.objects.filter(
        class_id__in=taught_class_ids
    ).values_list("unit_id_unit_id", flat=True)
).select_related("user_id_user").order_by("-submission_time")[:limit]
```

### Key Optimizations

| Query | Optimization |
|-------|--------------|
| Submission user data | `select_related("user_id_user")` |
| Task and unit info | `select_related("task_id_task", "task_id_task__unit_id_unit")` |
| Feedback items | `prefetch_related("feedback__feedback_item")` |
| Class enrollments | `annotate(student_count=Count("enrollment", distinct=True))` |

## Permission Model

### Role-Based Access Control

| Endpoint | Student | Lecturer | Admin |
|----------|---------|----------|-------|
| `/dashboard/v3/` | Own data | Own classes | All data |
| `/grading-queue/` | 403 | Own classes | All |
| `/class/{id}/metrics/` | 403 | Own classes | All |
| `/activity-feed/` | Own activity | Class activity | All activity |

### Implementation

```python
# Permission check in class metrics endpoint
if user.user_role not in ["lecturer", "admin"]:
    raise HttpError(403, "Only lecturers and admins can view class metrics")
```

## Testing Strategy

### Test Coverage

The test file `backend/api_v2/core/tests/test_dashboard.py` includes:

- **Authentication Tests**: Verify endpoints require valid JWT
- **Student Dashboard Tests**: Empty states, submissions, enrollments
- **Lecturer Dashboard Tests**: Teaching assignments, grading queue
- **Admin Dashboard Tests**: System-wide stats, all classes
- **RBAC Tests**: Permission verification
- **V3 Endpoint Tests**: Service layer integration

### Running Tests

```bash
# Run all dashboard tests
cd backend && uv run pytest api_v2/core/tests/test_dashboard.py -v

# Run specific test
cd backend && uv run pytest api_v2/core/tests/test_dashboard.py::test_dashboard_v3_student_endpoint -v
```

## Key Learnings

### 1. Service Layer Architecture

The service layer pattern provides clear separation between:
- **Views**: HTTP request/response handling
- **Services**: Business logic and data aggregation
- **Models**: Data persistence

This makes the codebase more maintainable and testable.

### 2. Django Query Optimization

Key lessons for avoiding N+1 queries:
- Use `select_related` for foreign key relationships (JOIN)
- Use `prefetch_related` for many-to-many relationships (separate query)
- Use `annotate` for aggregations on related objects
- Profile queries with Django Debug Toolbar

### 3. Role-Based Response Schemas

Using Pydantic v2 schemas with Django Ninja allows:
- Type-safe response validation
- Clear API documentation
- Union types for role-specific responses

```python
@router.get("/dashboard/v3/", response=LecturerDashboardOutV3 | StudentDashboardOutV3 | AdminDashboardOutV3)
def get_dashboard_v3(request):
    ...
```

### 4. Empty State Handling

All service methods return empty lists (not None) for users with no data:
- Students with no submissions: `my_essays = []`
- Lecturers with no classes: `class_overview = []`
- This simplifies frontend handling (no null checks needed)

## Challenges and Solutions

### Challenge 1: Complex Query Joins

**Problem**: Getting class metrics required joining Class → Unit → Task → Submission → Feedback → FeedbackItem

**Solution**: Broke down into smaller queries with explicit joins using `select_related` and `annotate`

### Challenge 2: Role-Specific Statistics

**Problem**: Different roles need different stat calculations

**Solution**: Separate stat calculation methods per role:
- `get_lecturer_stats()`
- `get_student_stats()`
- Admin uses platform-wide aggregates

### Challenge 3: Activity Feed Personalization

**Problem**: Activity feed needs to show different events based on role

**Solution**: Separate feed methods:
- `get_activity_feed_for_student()`: Own submissions and feedback
- `get_activity_feed_for_lecturer()`: Student submissions in their classes
- `get_activity_feed_for_admin()`: Platform-wide submissions

## Next Steps (Phase 2-4)

### Phase 2: Frontend Structure
- Create `frontend/src/features/dashboard/` directory
- Implement role-based dashboard router
- Build shared components (DashboardHeader, ActivityFeed)

### Phase 3: Lecturer Dashboard
- GradingQueue component
- ClassOverviewCards component
- Summary stats display

### Phase 4: Student Dashboard
- MyEssaysList component
- ProgressTracker (chart)
- FeedbackReceived component

## References

- PRD-04: `docs/prd/04-dashboard-overview.md`
- UI Design: `docs/prd/pencil-shadcn.pen`
- Backend Plan: `docs/plans/dashboard-refactor-plan.md`
- API Schemas: `backend/api_v2/core/schemas.py`
- Service Layer: `backend/core/services.py`
- Tests: `backend/api_v2/core/tests/test_dashboard.py`
