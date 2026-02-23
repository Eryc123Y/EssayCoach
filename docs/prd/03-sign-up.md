# Sign Up

> **Status:** In Progress
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Sign Up page allows new users (students, lecturers) to register for an account. Admin accounts are created directly by existing admins.

### Product Context
- **Target User:** New users (students, lecturers)
- **Role:** Public access
- **Dependencies:** Authentication system, User model

---

## 2. Target Users & User Stories

| Persona | Role | Goals |
|---------|------|-------|
| **New Student** | Learner | Register to access assignments and submit essays |
| **New Lecturer** | Instructor | Register to manage classes and create assignments |
| **Admin** | System Manager | Invite new team members via email |
| **User** | Any | Verify email address to activate account |

### User Stories

```
As a new student,
I want to register with email and password,
So that I can create a student account to submit essays.

As a new lecturer,
I want to register with email and password,
So that I can create a lecturer account to manage classes.

As a user,
I want to verify my email address,
So that I can activate my account and access the platform.
```

---

## 3. Functional Requirements

### 3.1 Email/Password Registration

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Email Input | Email field with validation | Required |
| Password Input | Password field with strength indicator | Required |
| Confirm Password | Password confirmation field | Required |
| Role Selection | Select role (Student/Lecturer) | Required |
| Terms Acceptance | Accept terms of service checkbox | Required |

### 3.2 Email Verification

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Verification Email | Send verification email on registration | Required |
| Verification Token | Token-based verification (expires in 24 hours) | Required |
| Resend Option | Allow resending verification email | Optional |

### 3.3 Password Requirements

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Minimum Length | At least 8 characters | Required |
| Uppercase | At least one uppercase letter | Required |
| Number | At least one number | Required |
| Special Character | At least one special character | Required |
| Strength Indicator | Real-time password strength display | Required |

### 3.4 Registration Flow

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Student Registration | Self-registration allowed | Required |
| Lecturer Registration | Self-registration allowed | Required |
| Admin Creation | Admin accounts created by existing admins | Required |

---

## 4. UI/UX Requirements

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   Sign Up Page                               │
│                                                              │
│    ┌─────────────────────────────────────────────┐        │
│    │           [EssayCoach Logo]                   │        │
│    │                                             │        │
│    │  Email                                      │        │
│    │  [________________________]                 │        │
│    │                                             │        │
│    │  Password                                  │        │
│    │  [________________________]                  │        │
│    │  [Weak] [Medium] [Strong]                   │        │
│    │                                             │        │
│    │  Confirm Password                           │        │
│    │  [________________________]                 │        │
│    │                                             │        │
│    │  Role                                      │        │
│    │  (•) Student    ( ) Lecturer                │        │
│    │                                             │        │
│    │  ☐ I accept the Terms of Service           │        │
│    │                                             │        │
│    │  [Sign Up]                                 │        │
│    │                                             │        │
│    └─────────────────────────────────────────────┘        │
│                                                              │
│    Already have an account? Sign in                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Components

| Component | Description |
|-----------|-------------|
| **Logo** | EssayCoach branding at top |
| **Email Input** | Text input with validation |
| **Password Input** | Password field with strength meter |
| **Confirm Password** | Password confirmation field |
| **Role Selector** | Radio buttons for Student/Lecturer |
| **Terms Checkbox** | Terms acceptance checkbox |
| **Sign Up Button** | Primary action button |
| **Error/Success Alert** | Message display |

### 4.3 States

| State | Description |
|-------|-------------|
| **Default** | Empty form ready for input |
| **Loading** | Spinner on button during submission |
| **Error** | Red border + message for invalid input |
| **Success** | Email sent or redirect to dashboard |
| **Password Strength** | Weak/Medium/Strong indicator |

### 4.4 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Full-width card with padding |
| Desktop (> 640px) | 400px max-width card, centered |

---

## 5. Data Model

### User Model (Actual Implementation)

```typescript
// User entity (from /backend/core/models.py)
interface User {
  user_id: number;
  user_email: string;
  user_fname: string | null;
  user_lname: string | null;
  user_role: 'student' | 'lecturer' | 'admin';
  user_status: 'active' | 'suspended' | 'unregistered';
  is_active: boolean;
  is_staff: boolean;
  date_joined: Date;
}

// Registration Request
interface UserRegistrationIn {
  user_email: string;
  password: string;
  user_fname?: string;
  user_lname?: string;
  user_role: 'student' | 'lecturer';
}

// Registration Response
interface AuthResponse {
  access: string; // Token key
  user: UserInfo;
}

interface UserInfo {
  user_id: number;
  user_email: string;
  user_fname: string;
  user_lname: string;
  user_role: 'student' | 'lecturer' | 'admin';
  is_active: boolean;
}
```

---

## 6. API Endpoints (Actual)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/auth/register/` | Register new user, returns token |

---

## 7. Permissions

| Action | Public | Student | Lecturer | Admin |
|--------|--------|---------|----------|-------|
| View sign up page | ✓ | - | - | - |
| Register as student | ✓ | - | - | - |
| Register as lecturer | ✓ | - | - | - |

---

## 8. Acceptance Criteria

### Registration Flow
- [ ] User can enter email, password, confirm password
- [ ] Password strength indicator shows real-time feedback
- [ ] Email validation checks format and uniqueness
- [ ] Passwords must match
- [ ] Role selection works (Student/Lecturer)
- [ ] Terms must be accepted

### Security
- [ ] Passwords meet strength requirements
- [ ] Rate limiting prevents abuse
- [ ] No sensitive data in responses

---

## MVP Boundary

### In Scope (MVP)
- Email/password registration with role selection (student/lecturer)
- Field validation (email format, password rules, confirm password)
- Successful sign-up redirects to activation/sign-in flow

### Out of Scope (Post-MVP)
- Organization/domain-based auto role assignment
- Social sign-up providers
- Multi-step profile onboarding wizard

### Current Implementation Alignment
- Auth v2 registration pathway is in progress; PRD should track validation and role-selection parity.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Submitting registration form | Disable submit + spinner |
| Email uniqueness check | Inline field loading indicator |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Email already exists | This email is already registered. | Sign in or use another email |
| Weak password | Password does not meet requirements. | Inline password guidance |
| Network/API failure | Unable to create account now. | Retry button |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| No role selected | Select your role to continue. | Highlight role selector |

