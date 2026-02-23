# Classes

> **Status:** Planned
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Classes page is where lecturers create and manage their classes (courses), and students view the classes they are enrolled in. Classes serve as containers for tasks, students, and the overall teaching workflow.

### Product Context
- **Target User:** Lecturers (create/manage), Students (view), Admin (oversight)
- **Role:** Lecturer (primary), Student (secondary), Admin (oversight)
- **Parent Feature:** Lecturer Dashboard, Student Dashboard, Admin Dashboard
- **Dependencies:** Tasks, Users, Rubrics

---

## 2. Target Users & User Stories

### Primary Users

| Persona | Role | Goals |
|---------|------|-------|
| **Lecturer** | Course Instructor | Create and manage classes/courses |
| **Student** | Learner | View enrolled classes and access tasks |
| **Admin** | Platform Manager | Oversee all classes and manage user pre-registration |

### User Stories

```
As a lecturer,
I want to create a new class with name and description,
So that I can organize my students into courses.

As a lecturer,
I want to invite students to join my class,
So that they can access my tasks.

As a lecturer,
I want to see a list of all my classes,
So that I can manage them efficiently.

As a lecturer,
I want to archive a class at the end of a term,
So that I can keep my dashboard organized.

As a lecturer,
I want to view all students in a class,
So that I can monitor enrollment and progress.

As a student,
I want to view all my enrolled classes,
So that I can access my coursework.

As a student,
I want to see upcoming tasks for each class,
So that I can plan my work.

As a student,
I want to leave a class if I'm no longer taking it,
So that I only see relevant coursework.

As an admin,
I want to view all classes across all lecturers,
So that I can monitor platform usage.

As an admin,
I want to manage any class (edit, archive, delete),
So that I can moderate content.

As an admin,
I want to pre-register students to specific classes,
So that students can access classes without manual enrollment.

As an admin,
I want to pre-register lecturer accounts and send activation links,
So that new lecturers can sign up and activate their accounts.
```

---

## 3. Functional Requirements

### 3.1 Class Management (Lecturer)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Create Class | Create new class with name, description, term | Required |
| Edit Class | Modify class details | Required |
| Delete Class | Remove class (with confirmation) | Required |
| Archive Class | Archive class to hide from active list | Required |
| Duplicate Class | Copy class structure as template | Required |
| Set Term | Define semester/quarter/term dates | Required |

### 3.2 Student Management

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Invite Students | Generate join code or send invitations | Required |
| Enroll Student | Manually add student to class | Required |
| Remove Student | Remove student from class | Required |
| View Roster | See all students enrolled in class | Required |
| Student Progress | View overall class progress | Required |
| Join Code | Students join via unique class code | Required |
| Lecturer Invite | Lecturer manually adds students | Required |

### 3.3 Class Features

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Class Dashboard | Overview of class activity and tasks | Required |
| Task List | View all tasks for class | Required |
| Class Statistics | Student count, submission rates | Required |
| Announcement | Post class-wide announcements | Optional |

### 3.4 Student Features

| Requirement | Description | Priority |
|-------------|-------------|----------|
| View Classes | List of enrolled classes | Required |
| Class Details | View class info and upcoming work | Required |
| Leave Class | Request to leave a class | Required |

### 3.5 Join Methods

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Join Code | Students join via unique class code | Required |
| Lecturer Invite | Lecturer manually adds students | Required |
| Self-Enrollment | Allow open enrollment (optional) | Optional |

### 3.6 Admin Management

| Requirement | Description | Priority |
|-------------|-------------|----------|
| View All Classes | View all classes across all lecturers | Required |
| Manage Any Class | Edit, archive, delete any class | Required |
| Batch Student Enrollment | Pre-register multiple students to class | Required |
| Pre-register Lecturer | Create lecturer account and send activation link | Required |
| View Platform Statistics | See class count, student count, lecturer count | Required |

---

## 4. UI/UX Requirements

### 4.1 Lecturer Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Classes                              | + Create Class | Search │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Filter: [All] [Active] [Archived]  | Search Classes │   │
│ └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐           │
│ │ Class Card         │ │ Class Card         │           │
│ │ ─────────────      │ │ ─────────────      │           │
│ │ English 101        │ │ Writing 201        │           │
│ │ Spring 2026       │ │ Spring 2026       │           │
│ │ 25 Students       │ │ 18 Students       │           │
│ │ 5 Tasks          │ │ 3 Tasks           │           │
│ │ [Edit] [Archive]  │ │ [Edit] [Archive]  │           │
│ └────────────────────┘ └────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Class Detail View (Lecturer)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back    English 101 - Spring 2026     [Edit] [Settings]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐           │
│ │ Class Info          │ │ Quick Stats         │           │
│ │ ─────────────────── │ │ ─────────────────── │           │
│ │ Code: ENG101-SPR26 │ │ 25 Students         │           │
│ │ Term: Spring 2026  │ │ 20 Active           │           │
│ │ Created: Jan 1     │ │ 5 Graded            │           │
│ └─────────────────────┘ └─────────────────────┘           │
├─────────────────────────────────────────────────────────────┤
│ Tabs: [Overview] [Tasks] [Students] [Announcements] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              Tab Content Area                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Student Layout

```
┌─────────────────────────────────────────────────────────────┐
│ My Classes                                                  │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐           │
│ │ English 101        │ │ Writing 201        │           │
│ │ Prof. Smith       │ │ Prof. Johnson     │           │
│ │ Spring 2026       │ │ Spring 2026       │           │
│ │ 3 Tasks           │ │ 2 Tasks           │           │
│ │ [View Class]      │ │ [View Class]      │           │
│ └────────────────────┘ └────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Components

| Component | Description |
|-----------|-------------|
| **Class Card** | Summary with name, term, student count |
| **Class Form** | Editor for creating/editing classes |
| **Student Roster** | Table with student names and status |
| **Join Code Display** | Copyable class join code |
| **Tab Navigation** | Switch between Overview/Tasks/Students |

---

## 5. Data Model

### Core Entities

```typescript
// Class
interface Class {
  id: string;
  name: string;
  description: string;
  code: string; // Unique join code
  term: string;
  year: number;
  createdBy: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// Class Enrollment
interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: Date;
  enrolledBy: string; // teacher who added or self
  status: 'active' | 'completed' | 'dropped';
}

// Class Announcement
interface Announcement {
  id: string;
  classId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Date;
}
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/core/classes/` | List classes (filtered by role) |
| POST | `/api/v2/core/classes/` | Create new class |
| GET | `/api/v2/core/classes/{id}/` | Get class details |
| PUT | `/api/v2/core/classes/{id}/` | Update class |
| DELETE | `/api/v2/core/classes/{id}/` | Delete class |
| POST | `/api/v2/core/classes/{id}/archive/` | Archive class |
| GET | `/api/v2/core/classes/{id}/students/` | List enrolled students |
| POST | `/api/v2/core/classes/{id}/students/` | Add student to class |
| DELETE | `/api/v2/core/classes/{id}/students/{studentId}/` | Remove student |
| POST | `/api/v2/core/classes/join/` | Join class via code |
| DELETE | `/api/v2/core/classes/{id}/leave/` | Leave class (student) |
| POST | `/api/v2/admin/classes/batch-enroll/` | Batch enroll students (Admin) |
| POST | `/api/v2/admin/users/invite-lecturer/` | Pre-register lecturer and send activation |

---

## 7. Permissions

| Action | Student | Lecturer | Admin |
|--------|---------|----------|-------|
| View own classes | ✓ | ✓ | ✓ |
| View all classes | ✗ | ✗ | ✓ |
| Create classes | ✗ | ✓ | ✓ |
| Edit own classes | ✗ | ✓ | ✗ |
| Edit any class | ✗ | ✗ | ✓ |
| Delete own classes | ✗ | ✓ | ✗ |
| Delete any class | ✗ | ✗ | ✓ |
| Archive classes | ✗ | ✓ (own) | ✓ (any) |
| View class students | ✗ | ✓ (own) | ✓ (any) |
| Add students | ✗ | ✓ (own) | ✓ (any) |
| Remove students | ✗ | ✓ (own) | ✓ (any) |
| Batch enroll students | ✗ | ✗ | ✓ |
| Pre-register lecturer | ✗ | ✗ | ✓ |
| Join class | ✓ | ✗ | ✗ |
| Leave class | ✓ | ✗ | ✗ |

---

## 8. Acceptance Criteria

### Lecturer Features
- [ ] Lecturer can create new class with name, description, term
- [ ] Lecturer can see list of all classes
- [ ] Lecturer can edit class details
- [ ] Lecturer can archive classes
- [ ] Lecturer can view student roster
- [ ] Lecturer can add students to class
- [ ] Lecturer can remove students from class
- [ ] Lecturer can generate/display join code

### Student Features
- [ ] Student can view enrolled classes
- [ ] Student can see class details
- [ ] Student can join class via code
- [ ] Student can leave class

### Admin Features
- [ ] Admin can view all classes across all lecturers
- [ ] Admin can edit any class
- [ ] Admin can delete any class
- [ ] Admin can archive any class
- [ ] Admin can view any class roster
- [ ] Admin can batch enroll students to classes
- [ ] Admin can pre-register lecturer and send activation link

### UI/UX
- [ ] Class list displays as card grid
- [ ] Class detail shows students and tasks
- [ ] Join code is copyable
- [ ] Mobile responsive layout works correctly

---

## MVP Boundary

### In Scope (MVP)
- Lecturer: manage own classes only (create/edit/archive/delete)
- Admin: view/manage all classes, pre-register students, and pre-register lecturers with invitation activation flow
- Student: view enrolled classes and join via code

### Out of Scope (Post-MVP)
- Automated timetable sync with external SIS/LMS
- Complex multi-term class cloning policies
- Predictive enrollment recommendations

### Current Implementation Alignment
- Classes dashboard module is not fully implemented; this PRD is the source for first-pass role-aware class management.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Class list fetch | Card grid skeleton |
| Enrollment batch action | Action-level progress state |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Join code invalid/expired | This class code is invalid or expired. | Re-enter or contact lecturer |
| Enrollment conflict | Student is already enrolled in this class. | Close and refresh roster |
| Invite send failure | Failed to send invitation email. | Retry sending |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| Lecturer has no classes | No classes yet. Create your first class. | Create Class CTA |
| Admin class search empty | No classes match the selected filters. | Clear filters |
| Student not enrolled | You are not enrolled in any classes yet. | Join via code |

