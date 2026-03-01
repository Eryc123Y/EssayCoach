# Social Learning Hub (Feed)

> **Status:** Planned
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Social Learning Hub is a community feed where students can share their essays (optionally), view peer submissions, give and receive feedback, and engage in writing-focused discussions. It promotes collaborative learning and peer-to-peer feedback.

### Product Context
- **Target User:** Students (primary), Lecturers (moderate)
- **Role:** Student-only feature with lecturer moderation
- **Parent Feature:** Student Dashboard
- **Dependencies:** Essay submissions, User profiles

---

## 2. Target Users & User Stories

### Primary Users

| Persona | Role | Goals |
|---------|------|-------|
| **Student** | Learner | Share work and get peer feedback |
| **Peer Reviewer** | Fellow Student | Provide constructive feedback to peers |
| **Lecturer** | Moderator | Monitor and guide discussions |

### User Stories

```
As a student,
I want to share my essay to the community feed,
So that I can receive feedback from my peers.

As a student,
I want to view essays shared by other students,
So that I can learn from their writing styles.

As a student,
I want to give feedback on peers' essays,
So that I can help others improve and practice reviewing.

As a student,
I want to like or bookmark useful essays,
So that I can reference them later.

As a student,
I want to comment on essays,
So that I can engage with the writing community.

As a student,
I want to share my essay anonymously (visible to lecturer only),
So that I can get feedback without my peers knowing who wrote it.

As a student,
I want to report inappropriate content,
So that the community remains safe and constructive.

As a lecturer,
I want to see all essays shared from my classes,
So that I can monitor and provide guidance.

As a lecturer,
I want to delete or hide inappropriate posts,
So that I can maintain community standards.

As a lecturer,
I want to review reported content and take action,
So that I can enforce community guidelines.

As a student,
I want to receive notifications when someone likes, comments, or gives feedback on my essay,
So that I stay engaged with the community. (Future Feature)
```

---

## 3. Functional Requirements

### 3.1 Feed Features

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Activity Feed | Chronological list of shared essays and activities | Required |
| Essay Cards | Preview cards showing title, excerpt, author | Required |
| Like/React | Express appreciation for essays | Required |
| Bookmark | Save essays for later reference | Required |
| Share Essay | Post own essay to community feed | Required |

### 3.2 Essay Sharing

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Share from Submission | Share graded essay to feed | Required |
| Anonymous Option | Share anonymously (visible to lecturer only, hidden from peers) | Required |
| Privacy Controls | Choose visibility: public, class-only, or anonymous | Required |
| Remove Share | Remove essay from feed | Required |

### 3.3 Peer Feedback & Comments

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Written Feedback | Give text-based feedback on essays | Required |
| Comments | Comment on essays | Required |
| Feedback Guidelines | Show tips for giving good feedback | Required |
| Thank Feedback | Acknowledge helpful reviewers | Optional |

### 3.4 Discovery & Filtering

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Search | Search essays by title, author, content | Required |
| Filter by Genre | Filter by essay type (argumentative, narrative, etc.) | Required |
| Filter by Class | See essays from specific class | Required |
| Trending | Most liked/bookmarked essays | Optional |

### 3.5 Discussions

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Discussion Threads | Start discussion topics | Optional |
| Comments | Comment on essays or discussions | Required |

### 3.6 Moderation (Lecturer/Admin)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| View Class Essays | View all essays shared from my classes | Required |
| Delete Post | Delete inappropriate posts | Required |
| Hide Post | Hide posts from feed | Required |
| View Reports | See reported content | Required |
| Review Report | Review and take action on reports | Required |
| Ban User | Temporarily ban student from posting | Required |

### 3.7 Content Reporting

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Report Content | Report inappropriate essay/feedback/comment | Required |
| Report Reason | Select reason for report (spam, offensive, other) | Required |
| Report Status | Track report status (pending, reviewed, resolved) | Required |

### 3.8 Notifications (Future Feature)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Like Notification | Notify when someone likes your essay | Future |
| Comment Notification | Notify when someone comments on your essay | Future |
| Feedback Notification | Notify when someone gives you feedback | Future |
| Report Resolution | Notify when your report is reviewed | Future |

---

## 4. UI/UX Requirements

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Social Learning Hub          | Search | Filter | + Share    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Filter: [All] [My Class] [Trending] [Recent]        │   │
│ └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ┌──────┐  Essay Title                      [Like]  │   │
│ │ │Avatar│  Author: John D.                    [Save] │   │
│ │ └──────┘  Excerpt of essay content...               │   │
│ │          Tags: #argumentative #environment          │   │
│ │          💬 12 Comments   👍 24 Likes               │   │
│ └─────────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ┌──────┐  Another Essay Title...                    │   │
│ │ │Avatar│                                              │   │
│ │ └──────┘  ...                                        │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Components

| Component | Description |
|-----------|-------------|
| **Feed Filter** | Tabs for All, My Class, Trending, Recent |
| **Essay Card** | Preview card with author, excerpt, stats |
| **Search Bar** | Search essays and discussions |
| **Like Button** | Heart icon with count |
| **Bookmark Button** | Save icon |
| **Share Modal** | Form to share essay with privacy options |

### 4.3 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Single column, full-width cards |
| Tablet (640-1024px) | Single column, wider cards |
| Desktop (> 1024px) | Single column, max-width centered |

---

## 5. Data Model

### Core Entities

```typescript
// Shared Essay
interface SharedEssay {
  id: string;
  essayId: string;
  authorId: string;
  title: string;
  excerpt: string;
  tags: string[];
  // Visibility rules:
  // - public: visible to all users
  // - class: visible to students in the same class
  // - anonymous: visible to lecturer only, hidden from peers
  visibility: 'public' | 'class' | 'anonymous';
  likesCount: number;
  commentsCount: number;
  sharedAt: Date;
  status: 'active' | 'hidden' | 'deleted';
}

// Like
interface Like {
  id: string;
  userId: string;
  sharedEssayId: string;
  createdAt: Date;
}

// Bookmark
interface Bookmark {
  id: string;
  userId: string;
  sharedEssayId: string;
  createdAt: Date;
}

// Feedback
interface Feedback {
  id: string;
  sharedEssayId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

// Comment
interface Comment {
  id: string;
  sharedEssayId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

// Report
interface Report {
  id: string;
  reporterId: string;
  // Can report: essay, feedback, comment
  targetType: 'essay' | 'feedback' | 'comment';
  targetId: string;
  reason: 'spam' | 'offensive' | 'inappropriate' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

// Notification (Future Feature)
interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'feedback' | 'report_resolved';
  targetId: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
```

---

## 6. API Endpoints

### Feed & Essays

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/core/feed/` | Get social feed |
| POST | `/api/v2/core/submissions/{id}/share/` | Share essay to feed |
| DELETE | `/api/v2/core/submissions/{id}/share/` | Remove from feed |
| PUT | `/api/v2/core/feed/{id}/` | Update share (visibility) |
| DELETE | `/api/v2/core/feed/{id}/` | Delete shared essay |

### Interactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/core/feed/{id}/like/` | Like essay |
| DELETE | `/api/v2/core/feed/{id}/like/` | Unlike essay |
| POST | `/api/v2/core/feed/{id}/bookmark/` | Bookmark essay |
| DELETE | `/api/v2/core/feed/{id}/bookmark/` | Remove bookmark |

### Feedback & Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/core/feed/{id}/feedback/` | Get feedback for essay |
| POST | `/api/v2/core/feedback/` | Give feedback |
| DELETE | `/api/v2/core/feedback/{id}/` | Delete feedback |
| GET | `/api/v2/core/feed/{id}/comments/` | Get comments |
| POST | `/api/v2/core/comments/` | Add comment |
| DELETE | `/api/v2/core/comments/{id}/` | Delete comment |

### Moderation (Lecturer/Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/admin/feed/class/{classId}/` | Get all essays from class |
| DELETE | `/api/v2/admin/feed/{id}/` | Delete inappropriate essay |
| PUT | `/api/v2/admin/feed/{id}/hide/` | Hide essay from feed |
| PUT | `/api/v2/admin/feed/{id}/restore/` | Restore hidden essay |

### Reporting

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/core/reports/` | Report content |
| GET | `/api/v2/admin/reports/` | Get all reports (Admin/Lecturer) |
| PUT | `/api/v2/admin/reports/{id}/` | Review and resolve report |
| POST | `/api/v2/admin/users/{id}/ban/` | Ban user from posting |

### Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/core/feed/?search={query}` | Search essays |
| GET | `/api/v2/core/feed/?filter={type}` | Filter by genre/class |

### Notifications (Future)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/notifications/` | Get user notifications |
| PUT | `/api/v2/notifications/{id}/read/` | Mark as read |
| PUT | `/api/v2/notifications/read-all/` | Mark all as read |

---

## 7. Permissions

| Action | Student | Lecturer | Admin |
|--------|---------|----------|-------|
| View feed | ✓ | ✓ | ✓ |
| Share essay | ✓ | ✗ | ✗ |
| Edit own share | ✓ | ✗ | ✗ |
| Delete own content | ✓ | ✗ | ✓ |
| Give feedback | ✓ | ✓ | ✓ |
| Comment | ✓ | ✓ | ✓ |
| Like/bookmark | ✓ | ✓ | ✓ |
| Report content | ✓ | ✓ | ✓ |
| View reports | ✗ | ✓ (own class) | ✓ |
| Resolve reports | ✗ | ✓ (own class) | ✓ |
| Delete any post | ✗ | ✓ (own class) | ✓ |
| Hide any post | ✗ | ✓ (own class) | ✓ |
| Ban user | ✗ | ✓ | ✓ |
| View anonymous author | ✗ | ✓ | ✓ |

---

## 8. Acceptance Criteria

### Feed Functionality
- [ ] Feed displays shared essays chronologically
- [ ] Students can share their essays to the feed
- [ ] Students can like essays
- [ ] Students can bookmark essays for later
- [ ] Students can give feedback on essays
- [ ] Students can comment on essays

### Privacy & Visibility
- [ ] Students can choose visibility (public/class/anonymous)
- [ ] Anonymous essays are hidden from peers but visible to lecturer
- [ ] Students can remove their shared essays
- [ ] Students can edit visibility of shared essays

### Discovery
- [ ] Search finds essays by title and author
- [ ] Filters work correctly (All, My Class, Trending)
- [ ] Tags help discover related essays

### Moderation
- [ ] Lecturers can view all essays from their classes
- [ ] Lecturers can delete inappropriate posts
- [ ] Lecturers can hide posts from feed
- [ ] Lecturers can review and resolve reports
- [ ] Lecturers can ban students from posting

### Reporting
- [ ] Students can report inappropriate content
- [ ] Students can select report reason
- [ ] Reported content is flagged for review

### UI/UX
- [ ] Feed loads smoothly with infinite scroll
- [ ] Like and bookmark provide immediate visual feedback
- [ ] Mobile responsive layout works correctly
- [ ] Anonymous posts show "Anonymous" instead of author name

### Notifications (Future)
- [ ] Users receive notifications for likes, comments, feedback
- [ ] Notification badge shows unread count
- [ ] Users can mark notifications as read

---

## MVP Boundary

### In Scope (MVP)
- Feed of shared essays with like/bookmark/comment actions
- Student sharing controls including anonymous-to-peers mode (lecturer-visible author)
- Report -> lecturer moderation workflow (review then keep/remove)

### Out of Scope (Post-MVP)
- Full recommendation engine for feed ranking
- Advanced reputation/gamification system
- Real-time chat channels

### Current Implementation Alignment
- Social Learning Hub is planned and intentionally scheduled as a later feature after core workflows.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Feed fetch | Card list skeleton |
| Interaction action (like/bookmark/comment) | Optimistic UI with pending state |
| Report submission | Modal submit spinner |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Feed load failure | Failed to load community feed. | Retry |
| Interaction failure | Action failed. Please try again. | Revert optimistic state + retry |
| Moderation action failure | Could not complete moderation action. | Retry or defer |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| No shared essays yet | No posts yet. Share your first essay. | Share CTA |
| Filter returns no results | No essays match this filter. | Clear filters |

