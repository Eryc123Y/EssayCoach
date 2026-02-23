# Sign In

> **Status:** In Progress
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Sign In page allows registered users (students, lecturers, admins) to authenticate and access the platform using their email and password.

### Product Context
- **Target User:** All authenticated users
- **Role:** Public access
- **Dependencies:** Authentication system, User model

---

## 2. Target Users & User Stories

| Persona | Role | Goals |
|---------|------|-------|
| **Student** | Learner | Login to access assignments and submit essays |
| **Lecturer** | Instructor | Login to access dashboard and manage classes |
| **Admin** | System Manager | Login to access admin panel and manage users |
| **User** | Any | View password in plain text to verify entry |
| **User** | Any | Reset forgotten password to regain account access |

### User Stories

```
As a user,
I want to log in with email and password,
So that I can access the platform securely.

As a user,
I want to view my password in plain text,
So that I can verify my password entry is correct.

As a user,
I want to reset my forgotten password,
So that I can regain access to my account.
```

---

## 3. Functional Requirements

### 3.1 Email/Password Login

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Email Input | Email field with validation | Required |
| Password Input | Password field with show/hide toggle | Required |
| Remember Me | Checkbox for extended session (30 days) | Required |
| Submit Button | Submit credentials for authentication | Required |
| Error Handling | Display error for invalid credentials | Required |

### 3.2 Password Recovery

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Forgot Password Link | Link to password reset flow | Required |
| Password Reset Email | Send reset link via email | Required |
| Reset Token | Token-based reset flow (expires in 1 hour) | Required |

### 3.3 Session Management

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Token Authentication | DRF Token-based authentication | Required |
| Token Storage | Token returned in response body | Required |
| Logout | Invalidate token on logout | Required |

### 3.4 Rate Limiting

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Login Attempts | Max 5 attempts per 15 minutes per IP | Required |
| Account Lockout | Lock after 10 failed attempts (15 min) | Required |

---

## 4. UI/UX Requirements

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Sign In Page                             │
│                                                              │
│    ┌─────────────────────────────────────────────┐        │
│    │           [EssayCoach Logo]                 │        │
│    │                                             │        │
│    │  Email                                      │        │
│    │  [________________________]                 │        │
│    │                                             │        │
│    │  Password                                   │        │
│    │  [________________________] [👁]            │        │
│    │                                             │        │
│    │  ☐ Remember me                              │        │
│    │                                             │        │
│    │  [Sign In]                                 │        │
│    │                                             │        │
│    │  Forgot password?                          │        │
│    └─────────────────────────────────────────────┘        │
│                                                              │
│    Don't have an account? Sign up                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Components

| Component | Description |
|-----------|-------------|
| **Logo** | EssayCoach branding at top |
| **Email Input** | Text input with email icon |
| **Password Input** | Password field with visibility toggle |
| **Remember Me** | Checkbox for extended session |
| **Sign In Button** | Primary action button |
| **Forgot Password Link** | Text link to reset flow |
| **Error Alert** | Red alert for invalid credentials |

### 4.3 States

| State | Description |
|-------|-------------|
| **Default** | Empty form ready for input |
| **Loading** | Spinner on button during submission |
| **Error** | Red border + message for invalid credentials |
| **Success** | Redirect to dashboard |

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

// Login Response
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
| POST | `/api/v2/auth/login/` | User login, returns token |
| POST | `/api/v2/auth/logout/` | User logout, deletes token |
| GET | `/api/v2/auth/me/` | Get current user info |
| POST | `/api/v2/auth/password-change/` | Change password (requires current password) |
| POST | `/api/v2/auth/password-reset/` | Reset password (admin operation) |

---

## 7. Permissions

| Action | Public | Student | Lecturer | Admin |
|--------|--------|---------|----------|-------|
| View sign in page | ✓ | ✓ | ✓ | ✓ |
| Login | ✓ | ✓ | ✓ | ✓ |
| Forgot password | ✓ | ✓ | ✓ | ✓ |
| Reset password | ✓ | ✓ | ✓ | ✓ |

---

## 8. Acceptance Criteria

### Login Flow
- [ ] User can enter email and password
- [ ] User can toggle password visibility
- [ ] User can check "Remember me"
- [ ] Invalid credentials show error message
- [ ] Successful login returns token and redirects to dashboard

### Password Recovery
- [ ] User can request password reset
- [ ] Reset token expires after 1 hour
- [ ] User can set new password
- [ ] Invalid/expired token shows error

### Security
- [ ] Rate limiting prevents brute force
- [ ] Passwords never returned in API responses
- [ ] Token is validated on each request

---

## MVP Boundary

### In Scope (MVP)
- Email/password login flow against `/api/v2/auth/login/`
- Validation and auth error feedback (invalid credentials, missing fields)
- Remembered session and redirect to dashboard on success

### Out of Scope (Post-MVP)
- Social login providers (Google/Microsoft)
- Passwordless magic-link flow
- Advanced risk scoring and adaptive authentication

### Current Implementation Alignment
- Auth v2 is already wired and login flow has been verified in browser testing.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Submitting credentials | Disable submit button + spinner |
| Session bootstrap | Full-page auth loading placeholder |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Invalid credentials | Email or password is incorrect. | Retry, show forgot password link |
| Network/API failure | Unable to sign in right now. | Retry button |
| Unauthorized redirect loop | Session expired, please sign in again. | Force re-auth |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| No remembered account | Sign in with your account to continue. | Show standard login form |

