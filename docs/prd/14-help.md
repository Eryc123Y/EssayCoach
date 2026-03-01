# Help

> **Status:** Planned
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Help page provides comprehensive documentation, FAQs, and support resources to help users navigate and use the EssayCoach platform effectively. It serves as the central help hub for all user types.

### Product Context
- **Target User:** All users (students, teachers, admins)
- **Role:** Self-service support for all roles
- **Parent Feature:** Navigation (accessible from all pages)
- **Dependencies:** Knowledge base content

---

## 2. Target Users & User Stories

### Primary Users

| Persona | Role | Goals |
|---------|------|-------|
| **Student** | Learner | Find answers to platform questions |
| **Teacher** | Instructor | Learn platform features and troubleshooting |
| **Admin** | System Manager | Find admin documentation and support |

### User Stories

```
As a student,
I want to search for help articles,
So that I can quickly find answers to my questions.

As a student,
I want to browse help by category,
So that I can explore topics systematically.

As a teacher,
I want to find guides on creating assignments,
So that I can effectively set up my courses.

As an admin,
I want to find technical documentation,
So that I can manage the platform effectively.

As a user,
I want to contact support if I can't find answers,
So that I can get help when needed.
```

---

## 3. Functional Requirements

### 3.1 Help Content

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Help Articles | Structured documentation pages | Required |
| FAQs | Frequently asked questions | Required |
| Video Tutorials | Embedded video guides | Optional |
| Getting Started | Onboarding guides for each role | Required |

### 3.2 Navigation

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Search | Search help content | Required |
| Categories | Browse by topic category | Required |
| Role-Based | Show relevant content by user role | Required |
| Breadcrumbs | Navigate nested content | Required |

### 3.3 Support

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Contact Form | Submit support request | Required |
| Support Email | Display support contact | Required |
| Status Page | System status indicator | Optional |

### 3.4 Content Categories

| Category | Description |
|----------|-------------|
| Getting Started | Platform introduction, account setup |
| For Students | Essay practice, submissions, feedback |
| For Teachers | Classes, assignments, rubrics, grading |
| For Admins | User management, settings, analytics |
| Troubleshooting | Common issues and solutions |

---

## 4. UI/UX Requirements

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Help Center                    | Search [____________]       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │  Browse by Category                                 │   │
│ │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐  │   │
│ │  │ Getting  │ │ Students │ │ Teachers │ │Admin  │  │   │
│ │  │ Started  │ │          │ │          │ │       │  │   │
│ │  └──────────┘ └──────────┘ └──────────┘ └───────┘  │   │
│ └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │  Frequently Asked Questions                         │   │
│ │  ─────────────────────────────────────────────────  │   │
│ │  ▶ How do I submit an essay?                       │   │
│ │  ▶ How is my essay graded?                         │   │
│ │  ▶ How do I join a class?                         │   │
│ │  ▶ Can I resubmit my essay?                       │   │
│ └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │  Still need help?                                   │   │
│ │  [Contact Support]                                 │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Article Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Help > For Students > Submitting Essays                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │  How to Submit an Essay                             │   │
│ │  ─────────────────────────────────────────────────  │   │
│ │                                                     │   │
│ │  Step 1: Navigate to your dashboard...           │   │
│ │                                                     │   │
│ │  Step 2: Find the assignment...                   │   │
│                                                     │   │
│ │  [Was this helpful? Yes | No]                    │   │
│ └─────────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │  Related Articles                                   │   │
│ │  • Understanding your feedback                     │   │
│ │  • How to revise your essay                        │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Components

| Component | Description |
|-----------|-------------|
| **Search Bar** | Full-text search of help content |
| **Category Cards** | Visual cards for browsing by topic |
| **FAQ Accordion** | Expandable FAQ items |
| **Article Content** | Markdown-rendered documentation |
| **Breadcrumbs** | Navigation trail |
| **Feedback** | "Was this helpful?" voting |
| **Contact Form** | Support ticket submission |

### 4.4 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Stacked category cards |
| Tablet/Desktop (> 640px) | Grid category layout |

---

## 5. Data Model

### Core Entities

```typescript
// Help Article
interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown content
  category: string;
  tags: string[];
  roles: ('student' | 'teacher' | 'admin')[];
  order: number;
  viewCount: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Help Category
interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

// Support Ticket
interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/help/articles` | List help articles |
| GET | `/api/help/articles/:slug` | Get article content |
| GET | `/api/help/categories` | List categories |
| GET | `/api/help/search` | Search articles |
| POST | `/api/help/feedback` | Submit article feedback |
| POST | `/api/help/tickets` | Submit support ticket |
| GET | `/api/help/tickets` | List user's tickets |

---

## 7. Permissions

| Action | Student | Teacher | Admin |
|--------|---------|---------|-------|
| View help articles | ✓ | ✓ | ✓ |
| Search help | ✓ | ✓ | ✓ |
| Submit feedback | ✓ | ✓ | ✓ |
| Submit support ticket | ✓ | ✓ | ✓ |
| View own tickets | ✓ | ✓ | ✓ |
| Manage tickets | ✗ | ✗ | ✓ |

---

## 8. Acceptance Criteria

### Help Content
- [ ] Help articles display correctly with proper formatting
- [ ] Categories are displayed and navigable
- [ ] FAQs are accessible and expandable
- [ ] Search returns relevant results

### Navigation
- [ ] Breadcrumbs work correctly
- [ ] Role-based content shows relevant articles
- [ ] Back navigation works properly

### Support
- [ ] Contact form submits successfully
- [ ] Support tickets are created
- [ ] User can view their submitted tickets

### UI/UX
- [ ] Content is readable on all screen sizes
- [ ] Loading states display properly
- [ ] Mobile responsive layout works
- [ ] "Was this helpful" feedback works

---

## MVP Boundary

### In Scope (MVP)
- Searchable help center with role-based article visibility
- FAQ and category navigation
- Support ticket submission and "was this helpful" feedback

### Out of Scope (Post-MVP)
- Embedded video tutorial library at scale
- Live chat support
- AI conversational support bot

### Current Implementation Alignment
- Help center is planned; content and ticket workflows should launch with static starter knowledge base first.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Article/category fetch | Content skeleton |
| Search query | Inline loading in results list |
| Ticket submission | Submit button loading state |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Search failure | Failed to search help articles. | Retry search |
| Article load failure | Failed to load article. | Retry or return to help home |
| Ticket submit failure | Failed to submit support request. | Retry submit |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| No search results | No matching help articles found. | Try different keywords |
| No tickets yet | You have not submitted any support requests. | Open contact form |

