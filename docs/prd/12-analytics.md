# Analytics

> **Status:** Planned
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Analytics page provides comprehensive data visualization and insights for all users:
- **Students**: Personal progress tracking, strengths/weaknesses, and growth visualization
- **Lecturers**: Class performance tracking and student insights
- **Admins**: Institution-wide usage and performance analytics

### Product Context
- **Target User:** Students (personal), Lecturers (class), Admins (institution)
- **Role:** Student (personal level), Lecturer (class-level), Admin (institution-level)
- **Parent Feature:** Student Dashboard, Lecturer Dashboard, Admin Dashboard
- **Dependencies:** Essay submissions, Users, Classes

---

## 2. Target Users & User Stories

### Primary Users

| Persona | Role | Goals |
|---------|------|-------|
| **Student** | Learner | Track personal progress, identify strengths/weaknesses, visualize growth |
| **Lecturer** | Course Instructor | Track student progress and identify struggling students |
| **Department Head** | Academic Lead | Compare performance across classes |
| **Admin** | Platform Manager | Monitor institution-wide usage and performance |

### User Stories

```
As a student,
I want to see my own score history and progress,
So that I can understand how I'm improving over time.

As a student,
I want to see my strengths and weaknesses by criterion,
So that I know what to focus on to improve.

As a student,
I want to compare my scores to the class average,
So that I can understand where I stand.

As a student,
I want to see my improvement trend visualized,
So that I can celebrate growth and stay motivated.

As a student,
I want recommendations for what to work on next,
So that I have clear next steps for improvement.

As a lecturer,
I want to see an overview of my class performance,
So that I can understand how students are doing overall.

As a lecturer,
I want to see individual student scores and progress,
So that I can identify students who need extra help.

As a lecturer,
I want to see common writing issues across my class,
So that I can adjust my teaching to address them.

As a lecturer,
I want to compare task performance,
So that I can see which tasks were most challenging.

As a department head,
I want to compare performance across different classes,
So that I can identify best practices.

As an admin,
I want to see platform usage statistics,
So that I can report on adoption and engagement.

As an admin,
I want to export analytics data,
So that I can perform further analysis or create reports.
```

---

## 3. Functional Requirements

### 3.0 Personal Analytics (Student)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Personal Overview | Summary stats: avg score, total submissions, improvement | Required |
| Score History | Line chart of scores over time | Required |
| Class Comparison | Compare personal scores to class average | Required |
| Strengths/Weaknesses | Analysis of criterion performance | Required |
| Improvement Trend | Visualize growth trajectory | Required |
| Actionable Recommendations | Suggestions for next steps | Required |

### 3.1 Class Analytics (Lecturer)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Class Overview | Summary stats: avg score, submissions, completion rate | Required |
| Score Distribution | Histogram of score distribution | Required |
| Student Performance Table | Individual student scores and trends | Required |
| Task Performance | Compare scores across tasks | Required |
| Common Issues | Top recurring issues across submissions | Required |
| Progress Over Time | Line chart of class improvement | Required |

### 3.2 Student Analytics (for Lecturers)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Individual Student Profile | Single student detailed analytics | Required |
| Score History | Graph of scores over time | Required |
| Strengths/Weaknesses | Analysis of criterion performance | Required |
| Revision History | Track improvement across drafts | Required |

### 3.3 Institution Analytics (Admin)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Usage Statistics | Active users, logins, submissions | Required |
| Class Comparison | Compare metrics across classes | Required |
| Lecturer Activity | Grading activity by lecturer | Required |
| Platform Health | System performance metrics | Required |

### 3.4 Reporting

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Date Range Filter | Select time period for analytics | Required |
| Export Data | Export to CSV/Excel | Required |
| PDF Reports | Generate printable reports | Optional |
| Scheduled Reports | Auto-generate weekly/monthly reports | Optional |

---

## 4. UI/UX Requirements

### 4.1 Teacher Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Class Analytics: English 101              | Date: [This Term]│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │  Avg Score │ │ Completion  │ │ Submissions │           │
│ │    82%     │ │    95%     │ │    142      │           │
│ └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │           Score Distribution Chart                    │   │
│ │  ████████████████████                                │   │
│ │  ██████████████████████████                          │   │
│ └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │  Student Performance Table                           │   │
│ │  Name        | Avg Score | Trend | Submissions      │   │
│ │  ─────────────────────────────────────────────────  │   │
│ │  John Smith  |   88%    |  ↑   |      12          │   │
│ │  Jane Doe    |   75%    |  ↓   |      10          │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Components

| Component | Description |
|-----------|-------------|
| **Stat Cards** | Key metrics with labels and trends |
| **Score Chart** | Bar/histogram chart for distribution |
| **Line Chart** | Progress over time visualization |
| **Data Table** | Sortable table with student data |
| **Date Picker** | Select date range for analysis |
| **Export Button** | Download data options |

### 4.3 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Stacked stat cards, scrollable table |
| Tablet (640-1024px) | Two-column stats, scrollable table |
| Desktop (> 1024px) | Full dashboard layout |

---

## 5. Data Model

### Core Entities

```typescript
// Class Analytics
interface ClassAnalytics {
  classId: string;
  averageScore: number;
  completionRate: number;
  totalSubmissions: number;
  scoreDistribution: { range: string; count: number }[];
  topIssues: { issue: string; count: number }[];
  period: { start: Date; end: Date };
}

// Student Analytics
interface StudentAnalytics {
  studentId: string;
  averageScore: number;
  totalSubmissions: number;
  scoreHistory: { date: Date; score: number }[];
  criterionPerformance: { criterionId: string; avgScore: number }[];
  strengths: string[];
  weaknesses: string[];
}

// Institution Analytics
interface InstitutionAnalytics {
  organizationId: string;
  activeUsers: number;
  totalSubmissions: number;
  averageScore: number;
  lecturerActivity: { lecturerId: string; gradedCount: number }[];
  period: { start: Date; end: Date };
}
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/core/classes/{classId}/analytics/` | Get class analytics |
| GET | `/api/v2/core/users/{studentId}/analytics/` | Get student analytics |
| GET | `/api/v2/analytics/institution/` | Get institution analytics |
| GET | `/api/v2/analytics/export/` | Export analytics data |
| GET | `/api/v2/analytics/trends/` | Get trend data |

---

## 7. Permissions

| Action | Student | Lecturer | Admin |
|--------|---------|----------|-------|
| View class analytics | ✗ | ✓ (own) | ✓ |
| View student analytics | ✗ | ✓ (own students) | ✓ |
| View institution analytics | ✗ | ✗ | ✓ |
| Export data | ✗ | ✓ (own) | ✓ |

---

## 8. Acceptance Criteria

### Lecturer Features
- [ ] Lecturer can view class overview with key metrics
- [ ] Lecturer can see score distribution chart
- [ ] Lecturer can view individual student performance
- [ ] Lecturer can see common writing issues
- [ ] Lecturer can filter by date range
- [ ] Lecturer can export data to CSV

### Admin Features
- [ ] Admin can view institution-wide analytics
- [ ] Admin can compare class performance
- [ ] Admin can see lecturer activity metrics
- [ ] Admin can export analytics data

### UI/UX
- [ ] Charts render correctly with data
- [ ] Tables are sortable
- [ ] Date filter works correctly
- [ ] Export generates valid files
- [ ] Mobile responsive layout works

---

## MVP Boundary

### In Scope (MVP)
- Lecturer class-level analytics: overview metrics, distribution, student table, trend view
- Admin institution-level analytics and export
- Date-range filtering for core reports

### Out of Scope (Post-MVP)
- Scheduled report delivery
- Predictive analytics and at-risk forecasting
- Deep custom dashboard builder

### Current Implementation Alignment
- Analytics dashboard page is currently missing; this PRD defines the initial implementation baseline.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Analytics query | Chart and table skeletons |
| Export generation | Button loading and file-preparing status |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Query failure | Failed to load analytics data. | Retry |
| Empty period result | No data available for selected date range. | Adjust date range |
| Export failure | Failed to export analytics file. | Retry export |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| Class has no graded submissions | Not enough data to show analytics yet. | View assignments/submissions |

