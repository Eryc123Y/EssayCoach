# Profile

> **Status:** Planned
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Profile page displays a user's public profile information, including their writing history, achievements, and statistics. It serves as a personal portfolio showcase for students and a professional profile for lecturers.

### Product Context
- **Target User:** All users (students, lecturers)
- **Role:** Viewable by other users based on privacy settings
- **Parent Feature:** User Dashboard
- **Dependencies:** Essay submissions, achievements system

---

## 2. Target Users & User Stories

### Primary Users

| Persona | Role | Goals |
|---------|------|-------|
| **Student** | Learner | Showcase writing achievements and progress |
| **Lecturer** | Instructor | Display professional credentials and teaching history |
| **Peer Student** | Viewer | View classmates' profiles for social learning |

### User Stories

```
As a student,
I want to view my profile with all my essay submissions,
So that I can see my progress over time.

As a student,
I want to see my achievements and badges,
So that I can celebrate my accomplishments.

As a student,
I want to share my profile with classmates,
So that we can learn from each other's work.

As a lecturer,
I want to view student profiles,
So that I can understand their writing journey.

As a student,
I want to customize my profile visibility,
So that I can control what others see.
```

---

## 3. Functional Requirements

### 3.1 Profile Display

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Profile Header | Avatar, name, role, join date | Required |
| Bio/Introduction | Short personal description | Required |
| Statistics | Essay count, average score, submissions | Required |
| Recent Activity | Latest essay submissions and feedback | Required |

### 3.2 Student Profile Features

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Essay History | List of submitted essays with scores | Required |
| Achievement Badges | Display earned badges and milestones | Required |
| Progress Chart | Visual representation of improvement | Required |
| Peer Reviews Given | Reviews provided to other students | Optional |

### 3.3 Lecturer Profile Features

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Classes Taught | List of current classes | Required |
| Student Count | Number of students taught | Required |
| Rubrics Created | Number of rubrics authored | Required |
| Teaching Stats | Grading activity summary | Required |

### 3.4 Privacy Controls

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Profile Visibility | Public/Classmates/Private | Required |
| Essay Visibility | Control who sees essay content | Required |
| Score Visibility | Show/hide scores on profile | Required |

---

## 4. UI/UX Requirements

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      Profile Header                          │
│  ┌──────────┐  Name                           Role          │
│  │  Avatar │  Bio text here...                           │
│  │  150x150│  Join Date: January 2025                     │
│  └──────────┘                                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │ Total Essays    │ │ Average Score   │ │ Badges       │  │
│  │      42         │ │     85%         │ │      5       │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Tabs: [Essays] [Achievements] [Progress]                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Essay List / Achievement Cards / Progress Chart            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Components

| Component | Description |
|-----------|-------------|
| **Profile Header** | Avatar, name, role, bio, join date |
| **Stat Cards** | Key metrics in card format |
| **Tab Navigation** | Switch between Essays/Achievements/Progress |
| **Essay Card** | Essay title, score, date, status |
| **Badge** | Icon with tooltip showing achievement details |
| **Progress Chart** | Line/bar chart showing improvement over time |

### 4.3 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Single column, stacked stats |
| Tablet (640-1024px) | Two-column stats grid |
| Desktop (> 1024px) | Full layout with sidebar |

---

## 5. Data Model

### Core Entities

```typescript
// User Profile
// NOTE: No separate Profile model exists in backend. Profile data uses User model fields.
// See backend/core/models.py for actual User model: user_id, user_email, user_fname, user_lname, user_role
interface Profile {
  userId: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  role: 'student' | 'lecturer' | 'admin';
  joinDate: Date;
  visibility: 'public' | 'classmates' | 'private';
}

// Student Stats
interface StudentStats {
  userId: string;
  totalEssays: number;
  averageScore: number;
  totalSubmissions: number;
  badges: Badge[];
  lastActivity: Date;
}

// Badge/Achievement
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/core/users/{user_id}/` | Get user profile |
| PUT | `/api/v2/core/users/{user_id}/` | Update own profile |
| GET | `/api/v2/core/submissions/?user={user_id}` | Get user's essay list |
| GET | `/api/v2/core/submissions/?user={user_id}&stats=true` | Get user's statistics |

---

## 7. Permissions

| Action | Student | Lecturer | Admin |
|--------|---------|----------|-------|
| View own profile | ✓ | ✓ | ✓ |
| Edit own profile | ✓ | ✓ | ✓ |
| View other student profiles | ✓ (if visible) | ✓ | ✓ |
| View other lecturer profiles | ✓ | ✓ | ✓ |
| View admin profiles | ✗ | ✗ | ✓ |

---

## 8. Acceptance Criteria

### Profile Display
- [ ] Profile shows avatar, name, role, and join date
- [ ] Bio is displayed if provided
- [ ] Statistics cards show key metrics

### Student Features
- [ ] Essay history displays with scores and dates
- [ ] Achievements/badges display with icons
- [ ] Progress chart shows improvement over time

### Lecturer Features
- [ ] Classes taught are listed
- [ ] Rubrics created count is shown

### Privacy
- [ ] Users can set profile visibility
- [ ] Essays respect visibility settings
- [ ] Scores can be hidden from profile

### UI/UX
- [ ] Profile loads without errors
- [ ] Tabs switch content correctly
- [ ] Mobile responsive layout works

---

## MVP Boundary

### In Scope (MVP)
- Standalone profile page for identity, academic summary, and personal details
- Edit core profile fields and avatar with validation
- Access entry from Settings for profile-focused edits

### Out of Scope (Post-MVP)
- Public profile sharing outside course context
- Rich social profile badges/endorsed portfolios
- Multi-profile themes and deep customization

### Current Implementation Alignment
- Profile exists as a dedicated route component; Settings should link users to this page instead of duplicating full profile editing.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Profile fetch | Profile header and stats skeleton |
| Avatar upload | Upload progress indicator |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Fetch failure | Failed to load profile. | Retry |
| Save failure | Failed to update profile. | Retry with retained edits |
| Invalid avatar file | Unsupported image format/size. | Show upload constraints |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| Missing bio/about | Add a short bio to complete your profile. | Edit Profile CTA |

