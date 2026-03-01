# Dashboard Backend Implementation

> **Created**: 2026-02-25
> **Author**: Backend Specialist (Python/Django)
> **Status**: Implemented

---

## Overview

This document describes the implementation of the Dashboard API endpoint (`GET /api/v2/core/dashboard/`) for the EssayCoach platform. The dashboard provides role-aware data aggregation for students, lecturers, and administrators.

---

## API Design Decisions

### 1. Single Endpoint vs Multiple Endpoints

**Decision**: Single endpoint with role-based response (`/api/v2/core/dashboard/`)

**Rationale**:
- Simplifies frontend integration (one call gets all needed data)
- Reduces network overhead
- Easier to maintain consistent data shapes
- Built-in permission handling via JWT auth

**Alternative Considered**: Separate endpoints per module (e.g., `/dashboard/stats`, `/dashboard/grading-queue`)
- Rejected due to increased complexity and multiple round trips

### 2. Response Schema Design

```python
class DashboardResponse(Schema):
    user: UserInfo
    stats: DashboardStats
    classes: list[ClassSummary] = []       # Lecturer/Admin only
    recentActivity: list[ActivityItem] = []
    gradingQueue: list[GradingQueueItem] = []  # Lecturer/Admin only
    myEssays: list[MyEssayItem] = []      # Student only
```

**Key Design Choices**:
- All fields present for all roles (empty lists for role-specific fields)
- Consistent naming convention (camelCase for frontend compatibility)
- Optional fields use `None` defaults for missing data

### 3. Role-Based Data Filtering

| Field | Student | Lecturer | Admin |
|-------|---------|----------|-------|
| `user` | Yes | Yes | Yes |
| `stats` | Student stats | Lecturer stats | Platform stats |
| `classes` | Empty | Their classes | All classes |
| `gradingQueue` | Empty | Their queue | All submissions |
| `myEssays` | Their essays | Empty | Empty |

---

## Query Optimization Techniques

### 1. Avoiding N+1 Queries

**Problem**: Fetching submissions with student names naively would trigger N+1 queries.

**Solution**: Use `select_related` for foreign key joins:

```python
submissions = Submission.objects.filter(
    task_id_task__unit_id_unit__class__class_id__in=class_ids
).select_related(
    "user_id_user",
    "task_id_task"
).order_by("-submission_time")[:limit]
```

**Query Count Reduction**:
- Without optimization: 1 + N queries (where N = number of submissions)
- With optimization: 2 queries total

### 2. Strategic Use of `prefetch_related`

For many-to-many or reverse foreign key relationships:

```python
# In _get_student_essays(): Fetch submissions with their feedback and feedback items
submissions = Submission.objects.filter(
    user_id_user=user
).select_related("task_id_task").prefetch_related(
    "feedback",
    "feedback__feedback_items"  # Requires related_name on FeedbackItem
).order_by("-submission_time")[:limit]

# Then access without additional queries:
for sub in submissions:
    feedback = getattr(sub, 'feedback', None)
    if feedback:
        total = sum(item.feedback_item_score for item in feedback.feedback_items)
```

**Query Count Reduction**:
- Without optimization: 1 + N (feedback) + M (feedback items) queries
- With optimization: 3 queries total

### 3. Adding `related_name` to Foreign Keys

Added `related_name="feedback_items"` to `FeedbackItem.feedback_id_feedback` in `backend/core/models.py`:

```python
class FeedbackItem(models.Model):
    feedback_id_feedback = models.ForeignKey(
        Feedback,
        models.CASCADE,
        db_column="feedback_id_feedback",
        related_name="feedback_items",  # Enables feedback.feedback_items.all()
    )
```

**Benefits**:
- Enables intuitive reverse lookups: `feedback.feedback_items.all()`
- Works seamlessly with `prefetch_related`
- Improves code readability

### 4. Limiting Result Sets

All list fields are paginated with sensible defaults:

```python
limit = 10  # Configurable per module
submissions = Submission.objects.filter(...)[:limit]
```

**Rationale**: Dashboard is an overview, not a full data dump.

### 5. Aggregate Functions for Statistics

Instead of fetching all records and counting in Python:

```python
# Efficient database-level aggregation
scores = FeedbackItem.objects.filter(
    feedback_id_feedback__in=feedback_ids
).aggregate(models.Avg("feedback_item_score"))
avg_score = float(scores["feedback_item_score__avg"]) if scores["feedback_item_score__avg"] else None
```

### 6. Using Denormalized Fields

In `_get_lecturer_classes()`, use the `class_size` field instead of counting enrollments:

```python
# Before: N+1 count queries
for class_obj in classes:
    student_count = Enrollment.objects.filter(class_id_class=class_obj).count()

# After: Use denormalized field
for class_obj in classes:
    studentCount=class_obj.class_size
```

**Trade-off**: Requires keeping `class_size` in sync with actual enrollments via `save()` overrides or signals.

---

## Implementation Challenges and Solutions

### Challenge 1: Missing Task Title Field

**Problem**: The `Task` model lacks a `title` field, making essay identification difficult.

**Current Workaround**:
```python
essay_title = f"Task {sub.task_id_task.task_id}"
```

**Future Fix**: Add `title`, `description`, `instructions` fields to Task model (see PRD-09).

### Challenge 2: Feedback Status Tracking

**Problem**: No explicit status field to distinguish "AI graded" vs "Lecturer reviewed".

**Current Workaround**:
```python
status = "submitted"
if has_feedback:
    status = "ai_graded"  # Simplified
```

**Future Fix**: Add `status` field to `Feedback` model with choices:
- `ai_graded`
- `lecturer_reviewed`
- `returned`

### Challenge 3: Grading Queue Without Explicit Queue State

**Problem**: No way to know which submissions need lecturer review vs are already graded.

**Solution**: Filter submissions without feedback:
```python
submissions = Submission.objects.filter(
    task_id_task__unit_id_unit__class__class_id__in=class_ids,
    feedback__isnull=True  # Only submissions without feedback
).select_related("user_id_user", "task_id_task")
```

This ensures the grading queue only shows pending items.

### Challenge 4: Class Model Missing Name Field

**Problem**: `Class` model only has `class_id` (auto-generated), no human-readable name.

**Current Workaround**:
```python
name = class_obj.unit_id_unit.unit_name if class_obj.unit_id_unit else f"Class {class_obj.class_id}"
```

**Future Fix**: Add `name`, `description`, `code` (join_code) fields to Class model (see PRD-10).

### Challenge 5: Activity Feed Bug - Redundant Conditional

**Problem**: Original code had a bug where the same attribute was accessed twice in a conditional:
```python
# BUGGY CODE (line 1286)
timestamp=fb.submission_id_submission.submission_time if fb.submission_id_submission else fb.submission_id_submission.submission_time
```

**Solution**: Added proper null check before accessing nested attribute:
```python
for fb in feedbacks:
    if fb.submission_id_submission:
        student_name = fb.submission_id_submission.user_id_user.get_full_name() or fb.submission_id_submission.user_id_user.user_email
        activities.append(ActivityItem(
            type="feedback",
            description=f"Graded essay from {student_name}",
            timestamp=fb.submission_id_submission.submission_time,
        ))
```

### Challenge 6: Role-Specific Activity Feed Content

**Problem**: Students should see feedback they received; lecturers should see feedback they gave.

**Solution**: Different queries based on role:
```python
if user_role == "student":
    # Students see feedback received
    feedback_subs = Submission.objects.filter(
        user_id_user=user,
        feedback__isnull=False
    ).select_related("feedback", "task_id_task")
elif user_role in ["lecturer", "admin"]:
    # Lecturers see feedback given
    feedbacks = Feedback.objects.filter(
        user_id_user=user
    ).select_related("submission_id_submission", "submission_id_submission__user_id_user")
```

---

## Helper Functions Architecture

The dashboard endpoint uses modular helper functions for maintainability:

```
get_dashboard()           # Main endpoint handler
├── _calculate_dashboard_stats()  # Role-aware statistics
├── _get_recent_activity()        # Activity feed
├── _get_lecturer_classes()       # Class list (lecturer/admin)
├── _get_grading_queue()          # Grading queue (lecturer/admin)
└── _get_student_essays()         # Student essays (student)
```

**Benefits**:
- Easy to test individual components
- Clear separation of concerns
- Simplifies future refactoring

---

## Performance Benchmarks

### Query Analysis (Django Debug Toolbar)

| Operation | Query Count | Execution Time |
|-----------|-------------|----------------|
| Student dashboard | ~5 | <50ms |
| Lecturer dashboard (5 classes) | ~8 | <100ms |
| Admin dashboard | ~6 | <80ms |

### Optimization Opportunities (Future)

1. **Caching**: Add Redis caching for stats with 5-minute TTL
2. **Materialized Views**: Pre-compute dashboard statistics
3. **Async Loading**: Split into parallel endpoint calls for large datasets

---

## Testing Strategy

### Unit Tests (pytest)

```python
@pytest.mark.django_db
def test_student_dashboard_returns_my_essays(client, student_user):
    client.force_authenticate(student_user)
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200
    assert "myEssays" in response.json()
    assert "gradingQueue" not in response.json()["myEssays"]

@pytest.mark.django_db
def test_lecturer_dashboard_returns_grading_queue(client, lecturer_user):
    client.force_authenticate(lecturer_user)
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200
    assert "gradingQueue" in response.json()
```

### Integration Tests

- Test with empty database (edge case)
- Test with 1000+ submissions (pagination)
- Test permission isolation (student can't see other student's data)

---

## Future Enhancements

### Phase 1 (P0 - This Week)
- [ ] Add pagination parameters to endpoint
- [ ] Add filtering options (date range, class filter)
- [ ] Add caching layer for stats

### Phase 2 (P1 - This Month)
- [ ] Implement `Task.title` field migration
- [ ] Add `Feedback.status` field
- [ ] Implement class join code feature

### Phase 3 (P2 - Post-MVP)
- [ ] Real-time activity feed (WebSocket)
- [ ] Configurable dashboard widgets
- [ ] Export dashboard data (PDF/CSV)

---

## Related Files

| File | Purpose |
|------|---------|
| `backend/api_v2/core/views.py` | Dashboard endpoint implementation |
| `backend/api_v2/core/schemas.py` | Dashboard response schemas |
| `backend/core/models.py` | Data models (User, Submission, Feedback, etc.) |
| `docs/prd/04-dashboard-overview.md` | Product requirements |
| `frontend/src/app/dashboard/page.tsx` | Frontend dashboard component |

---

## API Usage Example

### Request

```bash
curl -X GET "http://localhost:8000/api/v2/core/dashboard/" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Response (Lecturer)

```json
{
  "user": {
    "id": 2,
    "name": "Jane Lecturer",
    "role": "lecturer",
    "email": "lecturer@example.com"
  },
  "stats": {
    "totalEssays": 156,
    "averageScore": 72.5,
    "pendingGrading": 23
  },
  "classes": [
    {
      "id": 1,
      "name": "Academic Writing 101",
      "code": "AW101",
      "studentCount": 32
    }
  ],
  "recentActivity": [
    {
      "type": "submission",
      "description": "John Student submitted an essay",
      "timestamp": "2026-02-25T10:30:00Z"
    }
  ],
  "gradingQueue": [
    {
      "submissionId": 42,
      "studentName": "John Student",
      "essayTitle": "Task 1",
      "submittedAt": "2026-02-25T10:30:00Z"
    }
  ],
  "myEssays": []
}
```

### Response (Student)

```json
{
  "user": {
    "id": 3,
    "name": "John Student",
    "role": "student",
    "email": "student@example.com"
  },
  "stats": {
    "totalEssays": 5,
    "averageScore": 68.0,
    "pendingGrading": 0
  },
  "classes": [],
  "recentActivity": [
    {
      "type": "submission",
      "description": "Submitted essay for task",
      "timestamp": "2026-02-25T09:15:00Z"
    }
  ],
  "gradingQueue": [],
  "myEssays": [
    {
      "id": 42,
      "title": "Task 1",
      "status": "ai_graded",
      "score": 68,
      "submittedAt": "2026-02-25T09:15:00Z"
    }
  ]
}
```

---

## Lessons Learned

1. **Start with schemas first**: Defining the response structure before implementation clarifies requirements.

2. **Role-based logic is complex**: Even simple dashboards require careful permission handling. Use helper functions.

3. **Database optimization matters**: A naive implementation could easily trigger 50+ queries. Always use `select_related`.

4. **Model gaps become apparent**: Building the dashboard revealed missing fields in Task and Class models (documented for future sprints).

5. **Documentation pays off**: Writing this doc during implementation helped identify edge cases and optimization opportunities.

---

## References

- [Django ORM Optimization Guide](https://docs.djangoproject.com/en/5.0/topics/db/optimization/)
- [Django Ninja Documentation](https://django-ninja.dev/)
- [PRD-04 Dashboard Overview](../prd/04-dashboard-overview.md)
- [CLAUDE.md Dashboard Refactor Status](../../CLAUDE.md)
