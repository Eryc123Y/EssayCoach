# Dashboard Overview

> **Status:** In Progress
> **Updated:** Added separate dashboards for Student, Lecturer, and Admin roles

## Overview

The Dashboard Overview is the main landing page for authenticated users after signing in. There are **three distinct dashboards** based on user role:

| Role | Dashboard Focus |
|------|-----------------|
| **Student** | Personal progress, tasks, feedback |
| **Lecturer** | Grading queue, class management, student performance |
| **Admin** | Platform-wide analytics, user management, system health |

**Icon Library:** Lucide React (lucide-react)

---

## User Stories

### As a Lecturer, I want to:
1. See my grading queue with pending essays to review
2. View class performance metrics at a glance
3. Access recent AI-graded essays for review
4. Navigate quickly to specific classes or tasks
5. See overall student improvement trends

### As a Student, I want to:
1. See my submitted essays and their feedback status
2. Track my writing improvement over time
3. View pending assignments and deadlines
4. Access AI feedback on my recent submissions
5. See my teacher's annotations and suggestions

### As an Admin, I want to:
1. View platform-wide analytics and usage metrics
2. Monitor system health and performance
3. Manage users (teachers, students) and institutions
4. View revenue and subscription metrics
5. Access audit logs and compliance reports

---

## Functional Requirements

### 1. Welcome Section
- Display personalized greeting with user name and role
- Show current date/time
- Quick stats summary cards

### 2. For Lecturers: Grading Queue
- List of essays pending review (AI-graded, needs lecturer approval)
- Show submission date, student name, essay title
- Priority indicators for overdue items
- Quick action: "Review" button to open essay

### 3. For Lecturers: Class Overview
- Class/Unit cards with key metrics
- Metrics: Total students, essays submitted, average score, pending reviews
- Progress indicators for each class

### 4. For Students: My Essays
- Recent submissions list with status
- Status types: Draft, Submitted, AI Graded, Teacher Reviewed, Returned
- Submission date and AI score

### 5. Statistics Cards
- **Lecturers:** Essays reviewed today, pending reviews, classes, avg grading time
- **Students:** Essays submitted, avg score, improvement trend, feedback received

### 6. Recent Activity Feed
- Timeline of recent actions (submissions, feedback, grades)
- Filterable by type (submission, feedback, grade)

### 7. Quick Actions
- Submit new essay (students)
- Start grading (lecturers)
- View rubrics
- Access settings

---

## UI/UX Requirements

### Layout Structure
- **Sidebar:** Fixed left sidebar (240px) with navigation
- **Main Content:** Fluid width, max-width 1400px
- **Header:** Top bar with search, notifications, user menu

### Responsive Breakpoints
- Desktop: 1200px+ (full sidebar)
- Tablet: 768px-1199px (collapsible sidebar)
- Mobile: <768px (bottom navigation)

### Visual Design

**Color Palette:**
- Primary: `$primary` (#2563EB)
- Success (graded): `$success` (#16A34A)
- Warning (pending): `$warning` (#D97706)
- Error (overdue): `$destructive` (#DC2626)
- Background: `$background` (#FFFFFF)
- Surface: `$secondary` (#F1F5F9)

**Typography:**
- Headings: Inter, 600-700 weight
- Body: Inter, 400-500 weight
- Sizes: H1(32px), H2(24px), H3(18px), Body(15px), Small(13px)

**Spacing:**
- Base unit: 4px
- Card padding: 24px
- Section gaps: 32px
- Component gaps: 16px

### Components Required
1. **Sidebar Navigation** - Logo, nav items, user profile
2. **Stat Cards** - Icon, value, label, trend indicator
3. **Essay List Item** - Status badge, title, metadata, actions
4. **Class Card** - Name, metrics, progress bar
5. **Activity Feed Item** - Icon, description, timestamp
6. **Quick Action Button** - Icon + label
7. **Search Bar** - With filters
8. **Notification Bell** - With badge count
9. **User Avatar Dropdown** - Profile, settings, logout

### Interactions
- Hover states on all interactive elements
- Loading skeletons for async data
- Pull-to-refresh on mobile
- Infinite scroll for lists

---

## Data Model

### Dashboard Stats
```typescript
interface DashboardStats {
  userId: string;
  role: 'lecturer' | 'student';
  // Lecturer fields
  pendingReviews?: number;
  essaysReviewedToday?: number;
  activeClasses?: number;
  avgGradingTime?: number;
  // Student fields
  totalSubmissions?: number;
  avgScore?: number;
  improvementTrend?: 'up' | 'down' | 'stable';
  // Common
  notifications: number;
}
```

### Recent Essay
```typescript
interface RecentEssay {
  id: string;
  title: string;
  status: 'draft' | 'submitted' | 'ai_graded' | 'lecturer_reviewed' | 'returned';
  submittedAt: Date;
  score?: number;
  studentName?: string; // for lecturers
  className?: string;
}
```

### Class Overview
```typescript
interface ClassOverview {
  id: string;
  name: string;
  studentCount: number;
  essayCount: number;
  avgScore: number;
  pendingReviews: number;
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/dashboard/stats` | Get user dashboard statistics |
| GET | `/api/v2/dashboard/grading-queue` | Get essays pending review (lecturer) |
| GET | `/api/v2/dashboard/my-essays` | Get recent essays (student) |
| GET | `/api/v2/dashboard/classes` | Get class overviews (lecturer) |
| GET | `/api/v2/dashboard/activity` | Get recent activity feed |
| GET | `/api/v2/notifications` | Get unread notification count |

---

## Permissions

| Role | Access |
|------|--------|
| Lecturer | Full dashboard, grading queue, class overviews |
| Student | My essays, my stats, submit essay |
| Admin | All lecturer features + user management |

---

## Acceptance Criteria

### Visual Checkpoints
- [ ] Sidebar displays correctly with navigation items
- [ ] Welcome section shows personalized greeting
- [ ] Stat cards display with proper icons and formatting
- [ ] Essay list shows correct status badges with colors
- [ ] Class cards show progress bars and metrics
- [ ] Activity feed displays with timestamps
- [ ] Quick action buttons are visible and accessible

### Functional Checkpoints
- [ ] Dashboard loads within 2 seconds
- [ ] Role-based content displays correctly (lecturer vs student)
- [ ] All navigation links work
- [ ] Search functionality returns results
- [ ] Notifications badge shows correct count
- [ ] Responsive layout works on all breakpoints
- [ ] Loading states display during data fetch

### Edge Cases
- [ ] Empty states display when no data
- [ ] Error states display on API failure
- [ ] Long text truncates properly
- [ ] Zero values display correctly

---

## MVP Boundary

### In Scope (MVP)
- Role-aware dashboard overview cards and core activity widgets
- Parallelized dashboard modules with loading and error boundaries
- Quick navigation entry points to key learning/admin workflows

### Out of Scope (Post-MVP)
- Fully configurable dashboard widgets
- Personalized recommendation engine
- Cross-role custom dashboard templates

### Current Implementation Alignment
- Implemented with route-segment `loading.tsx`/`error.tsx` patterns in dashboard overview modules.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Module data loading | Feature skeletons (e.g., graph/submission skeleton components) |
| Initial dashboard load | Parallel loading slots per module |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Module query failure | Failed to load [module]: {error.message} | Retry/reset where available |
| Partial module failure | Some dashboard sections could not be loaded. | Keep unaffected modules visible |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| No submissions yet | No submissions yet. Start with your first task. | CTA to assignments/essay practice |

