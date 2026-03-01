# Tasks

> **Status:** Planned
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Tasks page allows lecturers to create, manage, and publish essay tasks for their classes. Students can view and submit essays to these tasks. This is the central hub for managing the teaching workflow.

### Product Context
- **Target User:** Lecturers (create/manage), Students (view/submit)
- **Role:** Lecturer (primary), Student (secondary)
- **Parent Feature:** Lecturer Dashboard, Student Dashboard
- **Dependencies:** Classes, Rubrics, Essay Practice

---

## 2. Target Users & User Stories

### Primary Users

| Persona | Role | Goals |
|---------|------|-------|
| **Lecturer** | Course Instructor | Create and manage essay tasks for classes |
| **Student** | Learner | View and complete assigned essays |

### User Stories

```
As a lecturer,
I want to create a new essay task with title and instructions,
So that I can give students a clear writing task.

As a lecturer,
I want to attach a rubric to a task,
So that students know how their essays will be graded.

As a lecturer,
I want to set a deadline for submissions,
So that students have clear time expectations.

As a lecturer,
I want to view all submissions for a task,
So that I can grade them efficiently.

As a lecturer,
I want to publish or unpublish a task,
So that I can control when students can see it.

As a student,
I want to view all my tasks with deadlines,
So that I can plan my work accordingly.

As a student,
I want to submit my essay to a task,
So that I can complete the task.

As a student,
I want to see my grade and feedback after grading,
So that I can understand my performance.
```

---

## 3. Functional Requirements

### 3.1 Task Management (Lecturer)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Create Task | Create new task with title, description, instructions | Required |
| Edit Task | Modify task details before publishing | Required |
| Delete Task | Remove task (with confirmation) | Required |
| Duplicate Task | Copy task as template for new one | Required |
| Publish Task | Make task visible to students | Required |
| Unpublish Task | Hide task from students | Required |
| Set Deadline | Define submission deadline | Required |
| Extend Deadline | Extend deadline for individual students | Required |

### 3.2 Rubric Integration

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Attach Rubric | Link rubric to task | Required |
| Detach Rubric | Remove rubric from task | Required |
| Change Rubric | Switch rubric after task is active | Required |

### 3.3 Submission Management (Lecturer)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| View All Submissions | List all student submissions | Required |
| Grade Submissions | View and grade individual submissions | Required |
| Bulk Actions | Select multiple submissions for grading | Required |
| Download Submissions | Export all essays as documents | Required |
| Mark as Reviewed | Manually mark submissions as reviewed | Required |

### 3.4 Student View

| Requirement | Description | Priority |
|-------------|-------------|----------|
| View Tasks | List of tasks for enrolled classes | Required |
| Task Details | Full instructions and rubric preview | Required |
| Submit Essay | Submit essay to task | Required |
| View Grade | See score and feedback after grading | Required |
| Resubmit | Submit revised version if allowed | Required |

### 3.5 Status & Notifications

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Status Indicators | Draft/Published/Closed/Graded | Required |
| Submission Count | Show submitted/total students | Required |
| Notification to Students | Alert when new task posted | Required |
| Reminder Alerts | Notify students before deadline | Optional |

---

## 4. UI/UX Requirements

### 4.1 Lecturer Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header: "Tasks" | + New Task | Filter | Search │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Class Filter: [All Classes ▼]  Status: [All ▼]         │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│ │ Task 1       │ │ Task 2       │ │ Task 3       │       │
│ │ Essay Prompt │ │ Research     │ │ Creative     │       │
│ │ Due: Jan 15 │ │ Due: Jan 20  │ │ Due: Jan 25  │       │
│ │ 15/20 sub   │ │ 10/20 sub    │ │ 0/20 sub     │       │
│ └──────────────┘ └──────────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Task Editor (Lecturer)

```
┌─────────────────────────────────────────────────────────────┐
│ Task Editor                                                 │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Title: [________________________________]              │   │
│ │ Description: [____________________________________]    │   │
│ │ Instructions: [____________________________________]   │   │
│ │                                                       │   │
│ │ Class: [Select Class ▼]                              │   │
│ │ Rubric: [Select Rubric ▼]                           │   │
│ │                                                       │   │
│ │ Deadline: [Date Picker]    Time: [Time Picker]      │   │
│ │ Allow late submissions: [Toggle]                    │   │
│ │                                                       │   │
│ │ [Save Draft]  [Publish]  [Cancel]                   │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Student Layout

```
┌─────────────────────────────────────────────────────────────┐
│ My Tasks                                                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [Status Badge]  Task Title                         │     │
│ │ Class: English 101     |     Due: Jan 15, 11:59 PM  │     │
│ │ Rubric: Essay Rubric v2                             │     │
│ │ ─────────────────────────────────────────────────── │     │
│ │ [View Details]  [Start Writing]  [View Submission] │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Components

| Component | Description |
|-----------|-------------|
| **Task Card** | Summary with title, class, deadline, submission count |
| **Task Form** | Full editor for creating/editing tasks |
| **Submission List** | Table of student submissions with status |
| **Deadline Picker** | Date and time selection for due date |
| **Status Badge** | Visual indicator (Draft, Published, Closed, Graded) |

---

## 5. Data Model

### Core Entities

```typescript
// Task (replaces Assignment in original design)
interface Task {
  task_id: number;
  title: string;
  description: string;
  instructions: string;
  class_id: number;
  rubric_id: number | null;
  created_by: number; // user_id
  status: 'draft' | 'published' | 'closed' | 'archived';
  deadline: Date | null;
  allow_late_submission: boolean;
  created_at: Date;
  updated_at: Date;
}

// Submission
interface Submission {
  submission_id: number;
  task_id: number;
  student_id: number;
  essay_content: string;
  submitted_at: Date;
  status: 'draft' | 'submitted' | 'graded';
  score: number | null;
  feedback: string | null;
  graded_by: number | null;
  graded_at: Date | null;
}

// Deadline Extension
interface DeadlineExtension {
  id: number;
  task_id: number;
  student_id: number;
  new_deadline: Date;
  reason: string;
  created_by: number;
}
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/core/tasks/` | List tasks (filtered by role) |
| POST | `/api/v2/core/tasks/` | Create new task |
| GET | `/api/v2/core/tasks/{task_id}/` | Get task details |
| PUT | `/api/v2/core/tasks/{task_id}/` | Update task |
| DELETE | `/api/v2/core/tasks/{task_id}/` | Delete task |
| POST | `/api/v2/core/tasks/{task_id}/publish` | Publish task |
| POST | `/api/v2/core/tasks/{task_id}/unpublish` | Unpublish task |
| POST | `/api/v2/core/tasks/{task_id}/duplicate` | Duplicate task |
| GET | `/api/v2/core/tasks/{task_id}/submissions` | List submissions |
| POST | `/api/v2/core/tasks/{task_id}/extend` | Extend deadline for student |

---

## 7. Permissions

| Action | Student | Lecturer | Admin |
|--------|---------|----------|-------|
| View tasks | ✓ (enrolled) | ✓ (own) | ✓ |
| Create tasks | ✗ | ✓ | ✓ |
| Edit tasks | ✗ | ✓ (own) | ✓ |
| Delete tasks | ✗ | ✓ (own) | ✓ |
| Publish tasks | ✗ | ✓ (own) | ✓ |
| View all submissions | ✗ | ✓ (own) | ✓ |
| Grade submissions | ✗ | ✓ (own) | ✓ |
| Extend deadlines | ✗ | ✓ (own) | ✓ |

---

## 8. Acceptance Criteria

### Lecturer Features
- [ ] Lecturer can create new task with title, description, instructions
- [ ] Lecturer can attach rubric to task
- [ ] Lecturer can set deadline with date and time
- [ ] Lecturer can publish/unpublish tasks
- [ ] Lecturer can view all submissions for a task
- [ ] Lecturer can see submission count (submitted/total)
- [ ] Lecturer can extend deadline for individual students
- [ ] Lecturer can duplicate tasks

### Student Features
- [ ] Student can view all tasks for enrolled classes
- [ ] Student can see task details and rubric
- [ ] Student can submit essay to task
- [ ] Student can see submission status
- [ ] Student can view grade and feedback after grading

### UI/UX
- [ ] Task list displays as card grid
- [ ] Status badges show correct states
- [ ] Deadline warnings shown for approaching due dates
- [ ] Mobile responsive layout works correctly

---

## MVP Boundary

### In Scope (MVP)
- Lecturer/admin task CRUD, publish state, due dates, and class association
- Student task list/detail with submission entry points
- Basic grading status and submission overview per task

### Out of Scope (Post-MVP)
- Automated task generation from curriculum plans
- Multi-stage approval workflows
- Advanced anti-cheating similarity checks in task creation flow

### Current Implementation Alignment
- Dashboard assignments page is currently missing; PRD should define the first complete implementation target.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Task list fetch | Table/card skeleton |
| Task publish/save | Disable actions + spinner |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Task fetch failure | Failed to load tasks. | Retry |
| Permission denied | You cannot modify this task. | Return to list |
| Invalid due date | Due date must be in the future. | Inline validation |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| Lecturer has no tasks | No tasks yet. Create your first task. | Create Task CTA |
| Student has no assigned tasks | No tasks assigned yet. | Refresh / view classes |

