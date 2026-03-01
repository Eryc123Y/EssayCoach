# Settings

> **Status:** Planned
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Settings page allows users (students, lecturers, admins) to manage their account preferences, notification settings, security options, and display preferences. This is a unified settings hub accessible from the user profile menu.

### Product Context
- **Target User:** All users (students, lecturers, admins)
- **Role:** Role-specific settings sections
- **Parent Feature:** User Profile Dropdown
- **Dependencies:** Authentication, notification system

---

## 2. Target Users & User Stories

### Primary Users

| Persona | Role | Goals |
|---------|------|-------|
| **Student** | Learner | Manage email preferences and display settings |
| **Lecturer** | Instructor | Configure notification rules for student submissions |
| **Admin** | System Manager | Manage institution settings and security policies |

### User Stories

```
As a user,
I want to change my account password,
So that I can maintain account security.

As a user,
I want to update my profile information (name, avatar),
So that my profile reflects my current details.

As a student,
I want to configure when I receive email notifications,
So that I don't get overwhelmed by emails.

As a lecturer,
I want to set up email alerts for new student submissions,
So that I can grade them promptly.

As an admin,
I want to manage institutional branding settings,
So that the platform reflects our organization's identity.
```

---

## 3. Functional Requirements

### 3.1 Account Settings

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Profile Information | Edit name, email, avatar | Required |
| Password Change | Update password with current password verification | Required |
| Email Address | Change email (requires verification) | Required |

### 3.2 Security Settings

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Active Sessions | View and manage active login sessions | Required |
| Login History | View recent login activity | Required |
| Password Requirements | View password policy requirements | Required |

### 3.3 Notification Settings

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Email Notifications | Toggle email notification types | Required |
| In-App Notifications | Configure in-app notification preferences | Required |
| Submission Alerts | Student: alerts for feedback received | Required |
| Grading Alerts | Lecturer: alerts for new submissions | Required |
| Weekly Digest | Summary of activity sent weekly | Optional |

### 3.4 Display Settings

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Language | Select interface language | Required |
| Theme | Light/dark mode toggle | Required |

### 3.5 Admin-Specific Settings (Admin Only)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Organization Branding | Logo, colors, name | Required |
| User Invitation | Enable/disable self-registration | Required |
| API Keys | Manage API access keys | Required |

---

## 4. UI/UX Requirements

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (Navigation)    │    Main Content Area              │
│                         │                                   │
│ • Account               │    ┌─────────────────────────┐   │
│ • Security              │    │ Section Title            │   │
│ • Notifications         │    │ ─────────────────────────│   │
│ • Display              │    │ Settings Form            │   │
│ • [Admin] Organization │    │                         │   │
│ • [Admin] API          │    │ [Save Changes]           │   │
│                         │    └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Components

| Component | Description |
|-----------|-------------|
| **Sidebar Navigation** | Vertical nav with settings categories |
| **Settings Form** | Standard form with labeled inputs |
| **Toggle Switch** | On/off settings |
| **Avatar Upload** | Profile picture upload with crop |
| **Password Strength** | Visual indicator of password strength |
| **Session List** | List of active sessions with revoke option |

### 4.3 States

| State | Description |
|-------|-------------|
| **Default** | Settings displayed |
| **Editing** | Form in edit mode |
| **Saving** | Loading during save |
| **Saved** | Success confirmation |
| **Error** | Validation or server error |

### 4.4 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Full-width, collapsible sidebar |
| Tablet/Desktop (> 640px) | Sidebar + content split |

---

## 5. Data Model

### Core Entities

**Note:** Settings are stored as part of the User model, not in a separate UserSettings entity.

```typescript
// User (Core - matches backend/core/models.py)
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

// User Preferences (stored as JSON or separate key-value store)
interface UserPreferences {
  user_id: number;
  email_notifications: boolean;
  in_app_notifications: boolean;
  submission_alerts: boolean;
  grading_alerts: boolean;
  weekly_digest: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

// Organization Settings (Admin)
interface OrganizationSettings {
  organization_id: string;
  name: string;
  logo: string | null;
  primary_color: string;
  self_registration_enabled: boolean;
  updated_at: Date;
}

// Session
interface Session {
  id: string;
  user_id: number;
  device: string;
  ip_address: string;
  last_active: Date;
  created_at: Date;
}
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/auth/me/` | Get current user info |
| PUT | `/api/v2/core/users/me/` | Update user profile |
| PUT | `/api/v2/auth/password-change/` | Change password |
| POST | `/api/v2/core/users/me/avatar` | Upload avatar |
| GET | `/api/v2/auth/sessions/` | List active sessions |
| DELETE | `/api/v2/auth/sessions/{session_id}/` | Revoke session |
| GET | `/api/v2/auth/login-history/` | Get login history |
| GET | `/api/v2/admin/organization/` | Get org settings (Admin) |
| PUT | `/api/v2/admin/organization/` | Update org settings (Admin) |

---

## 7. Permissions

| Action | Student | Lecturer | Admin |
|--------|---------|----------|-------|
| View own settings | ✓ | ✓ | ✓ |
| Edit profile info | ✓ | ✓ | ✓ |
| Change password | ✓ | ✓ | ✓ |
| Configure notifications | ✓ | ✓ | ✓ |
| View sessions | ✓ | ✓ | ✓ |
| Revoke sessions | ✓ | ✓ | ✓ |
| Organization settings | ✗ | ✗ | ✓ |
| API key management | ✗ | ✗ | ✓ |

---

## 8. Acceptance Criteria

### Account Settings
- [ ] User can update name and profile picture
- [ ] User can change email (verification required)
- [ ] User can change password with current password

### Security
- [ ] User can view active sessions
- [ ] User can revoke individual sessions
- [ ] User can view login history

### Notifications
- [ ] User can toggle email notifications
- [ ] User can toggle in-app notifications
- [ ] Student can configure submission alerts
- [ ] Lecturer can configure grading alerts

### Display
- [ ] User can switch between light/dark theme
- [ ] User can select language

### Admin
- [ ] Admin can update organization branding
- [ ] Admin can toggle self-registration
- [ ] Admin can manage API keys

---

## MVP Boundary

### In Scope (MVP)
- Profile summary card, notifications toggles, and user preferences in settings
- Session and security basics (active sessions/login history) without 2FA/account deletion
- Settings -> Profile navigation entry to the standalone profile page

### Out of Scope (Post-MVP)
- Advanced security center (2FA, device trust)
- Data export and account deletion workflows
- Enterprise SSO and policy enforcement

### Current Implementation Alignment
- Basic settings page is implemented; Profile remains a dedicated page under `/dashboard/profile`.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Settings fetch | Card skeleton placeholders |
| Save preference | Disable relevant control + inline spinner |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Save failure | Failed to save settings. | Retry and keep previous value |
| Session list failure | Failed to load active sessions. | Retry section load |
| Permission mismatch (admin-only area) | You do not have access to this section. | Hide section / show info alert |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| No active sessions besides current | You are signed in on this device only. | No action |

