# Dashboard Overview Refactor Plan

**Date**: 2026-02-24
**Priority**: P0 - Critical
**Estimated Time**: ~16 hours

---

## Objective

Refactor the Dashboard Overview to implement three distinct role-based dashboards:
- **Student Dashboard** - Personal progress, tasks, feedback
- **Lecturer Dashboard** - Grading queue, class management, student performance
- **Admin Dashboard** - Platform analytics, user management, system health

---

## Current State Analysis

### What Exists
- Basic dashboard page at `frontend/src/app/dashboard/page.tsx`
- Essay analysis integration
- Feedback display components

### What's Missing (per PRD-04)
1. ❌ Role-based dashboard separation
2. ❌ Lecturer: Grading queue with pending essays
3. ❌ Lecturer: Class overview cards with metrics
4. ❌ Student: My essays list with status
5. ❌ Student: Progress tracking over time
6. ❌ All roles: Activity feed / recent activity timeline
7. ❌ All roles: Personalized welcome section with stats

---

## Implementation Plan

### Phase 1: Backend API (4h)

**New Endpoints Required**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/core/dashboard/` | GET | Get role-specific dashboard data |
| `/api/v2/core/classes/{id}/metrics/` | GET | Class performance metrics |
| `/api/v2/core/tasks/pending/` | GET | Pending tasks for grading queue |
| `/api/v2/core/activity-feed/` | GET | Recent activity timeline |

**Files to Modify/Create**:
- `backend/api_v2/core/views.py` - Add dashboard view
- `backend/api_v2/core/schemas.py` - Add dashboard response schemas
- `backend/core/services.py` - Add dashboard data aggregation logic

### Phase 2: Frontend Structure (4h)

**Component Architecture**:

```
frontend/src/app/dashboard/
├── page.tsx                    # Main dashboard router (role-based)
└── components/
    ├── dashboard-header.tsx    # Welcome section + stats
    ├── activity-feed.tsx       # Recent activity timeline
    └── [role]/
        ├── student-dashboard.tsx
        ├── lecturer-dashboard.tsx
        └── admin-dashboard.tsx
```

**Files to Create**:
- `frontend/src/features/dashboard/` - New feature directory
- `frontend/src/features/dashboard/components/` - Shared components
- `frontend/src/features/dashboard/hooks/useDashboardData.ts` - Data fetching hook

### Phase 3: Lecturer Dashboard (4h)

**Components**:
1. **GradingQueue** - List of essays pending review
2. **ClassOverviewCards** - Class performance metrics
3. **RecentGradedEssays** - Recently AI-graded essays for review

**Data Requirements**:
```typescript
interface LecturerDashboardData {
  gradingQueue: PendingEssay[];
  classOverview: ClassMetrics[];
  recentActivity: ActivityItem[];
  stats: {
    essaysReviewedToday: number;
    pendingReviews: number;
    totalClasses: number;
    avgGradingTime: number;
  };
}
```

### Phase 4: Student Dashboard (4h)

**Components**:
1. **MyEssaysList** - Recent submissions with status
2. **ProgressTracker** - Score improvement over time (chart)
3. **FeedbackReceived** - Recent AI/teacher feedback

**Data Requirements**:
```typescript
interface StudentDashboardData {
  myEssays: EssaySubmission[];
  progressTrend: ScoreTrend[];
  recentActivity: ActivityItem[];
  stats: {
    essaysSubmitted: number;
    avgScore: number;
    feedbackReceived: number;
    improvementRate: number;
  };
}
```

---

## API Schema Draft

### Dashboard Response Schema

```python
# backend/api_v2/core/schemas.py

class DashboardStatsOut(Schema):
    """Base stats for any role."""
    total_submissions: int
    recent_activity_count: int

class LecturerDashboardOut(Schema):
    """Lecturer-specific dashboard data."""
    grading_queue: list[PendingEssayOut]
    class_overview: list[ClassMetricsOut]
    stats: DashboardStatsOut
    recent_activity: list[ActivityItemOut]

class StudentDashboardOut(Schema):
    """Student-specific dashboard data."""
    my_essays: list[EssaySubmissionOut]
    progress_trend: list[ScoreTrendOut]
    stats: DashboardStatsOut
    recent_activity: list[ActivityItemOut]
```

---

## Dependencies

### Blockers
- None - Dashboard can be developed independently

### Dependencies On Dashboard
- Task Module (PRD-09) - Uses class data from dashboard
- Class Module (PRD-10) - Uses class overview from dashboard

---

## Testing Strategy

### Unit Tests
- Dashboard data aggregation functions
- Component rendering with different states

### Integration Tests
- API endpoint returns correct role-based data
- Role-based routing works correctly

### E2E Tests
- Student sees student dashboard
- Lecturer sees lecturer dashboard
- Activity feed updates after actions

---

## Success Criteria

- [ ] Three distinct dashboards implemented
- [ ] Grading queue displays pending essays for lecturers
- [ ] Class overview cards show metrics
- [ ] Activity feed shows recent actions
- [ ] Progress tracking shows improvement trend for students
- [ ] All tests passing
- [ ] Matches PRD-04 UI/UX requirements

---

## Migration Notes

### Existing Code to Preserve
- Essay analysis integration
- Feedback display components
- Any custom hooks for data fetching

### Breaking Changes
- Dashboard page URL structure may change
- API response format changes

---

## References

- PRD-04: `docs/prd/04-dashboard-overview.md`
- UI Design: `docs/prd/pencil-shadcn.pen`
- Implementation Contract: `docs/prd/D2C_IMPLEMENTATION_CONTRACT_STANDARD.md`
