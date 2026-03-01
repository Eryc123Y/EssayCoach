# Users (Admin)

> **Status:** Planned
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Users page is the admin dashboard for managing all users in the system. Admins can view, create, edit, disable, and manage user accounts across the entire organization.

### Product Context
- **Target User:** Administrators
- **Role:** Admin only
- **Parent Feature:** Admin Dashboard
- **Dependencies:** Authentication, Classes

---

## 2. Target Users & User Stories

### Primary Users

| Persona | Role | Goals |
|---------|------|-------|
| **Admin** | System Manager | Manage all user accounts in the organization |

### User Stories

```
As an admin,
I want to see a list of all users in the system,
So that I can monitor account activity.

As an admin,
I want to create new user accounts,
So that I can manually add lecturers and students.

As an admin,
I want to edit user information,
So that I can update user details when needed.

As an admin,
I want to disable or enable user accounts,
So that I can manage access to the platform.

As an admin,
I want to search for specific users,
So that I can quickly find and manage accounts.

As an admin,
I want to assign roles to users,
So that I can control their permissions.

As an admin,
I want to view user activity history,
So that I can audit account usage.
```

---

## 3. Functional Requirements

### 3.1 User Management

| Requirement | Description | Priority |
|-------------|-------------|----------|
| User List | View all users with search and filters | Required |
| Create User | Add new user (student/lecturer/admin) | Required |
| Edit User | Modify user details | Required |
| Delete User | Remove user account | Required |
| Disable/Enable | Toggle account active status | Required |
| Bulk Actions | Select and perform actions on multiple users | Required |

### 3.2 User Properties

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Role Assignment | Set user role (student/lecturer/admin) | Required |
| Email Verification | View/manage email verification status | Required |
| Password Reset | Force password reset for user | Required |
| Class Assignment | Assign student to classes | Required |

### 3.3 Search & Filter

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Search | Search by name or email | Required |
| Filter by Role | Filter by student/lecturer/admin | Required |
| Filter by Status | Filter by active/disabled | Required |
| Filter by Date | Filter by creation date | Required |

### 3.4 User Details

| Requirement | Description | Priority |
|-------------|-------------|----------|
| View Profile | See full user details | Required |
| Activity Log | View user login and activity history | Required |
| Classes | View classes user is enrolled in/teaches | Required |
| Submissions | View user's essay submissions (if student) | Required |

---

## 4. UI/UX Requirements

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Users                                    | + Add User | Search │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Filter: [All Roles ▼] [All Status ▼] [Date ▼]    │   │
│ └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Name          | Email           | Role    | Status │   │
│ │ ─────────────────────────────────────────────────  │   │
│ │ John Smith    | john@school.edu | Lecturer | Active │   │
│ │ Jane Doe      | jane@school.edu | Student | Active │   │
│ │ Admin User    | admin@school... | Admin   | Active │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Components

| Component | Description |
|-----------|-------------|
| **User Table** | Sortable table with all user data |
| **Search Bar** | Search users by name or email |
| **Filter Dropdowns** | Filter by role, status, date |
| **User Modal** | Form for creating/editing users |
| **Bulk Actions** | Select multiple users for batch operations |
| **Status Badge** | Active/Disabled indicator |

### 4.3 User Modal

```
┌─────────────────────────────────────┐
│ Add/Edit User                      │
├─────────────────────────────────────┤
│ Email: [________________]          │
│ Name:  [________________]          │
│ Role:  [Student ▼]                │
│        [Lecturer]                  │
│        [Admin]                     │
│                                     │
│ ☐ Send invitation email             │
│ ☐ Require password reset           │
│                                     │
│ [Cancel]  [Save]                   │
└─────────────────────────────────────┘
```

### 4.4 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Card list instead of table |
| Tablet/Desktop (> 640px) | Full table view |

---

## 5. Data Model

### Core Entities

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

// User Activity Log
interface UserActivityLog {
  id: number;
  user_id: number;
  action: string;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/core/users/` | List all users |
| POST | `/api/v2/core/users/` | Create new user |
| GET | `/api/v2/core/users/{user_id}/` | Get user details |
| PUT | `/api/v2/core/users/{user_id}/` | Update user |
| DELETE | `/api/v2/core/users/{user_id}/` | Delete user |
| POST | `/api/v2/core/users/{user_id}/disable` | Disable user |
| POST | `/api/v2/core/users/{user_id}/enable` | Enable user |
| POST | `/api/v2/core/users/{user_id}/reset-password` | Reset user password |
| GET | `/api/v2/core/users/{user_id}/activity` | Get user activity log |

---

## 7. Permissions

| Action | Student | Lecturer | Admin |
|--------|---------|----------|-------|
| View user list | ✗ | ✗ | ✓ |
| Create users | ✗ | ✗ | ✓ |
| Edit users | ✗ | ✗ | ✓ |
| Delete users | ✗ | ✗ | ✓ |
| Disable/enable users | ✗ | ✗ | ✓ |
| View activity logs | ✗ | ✗ | ✓ |

---

## 8. Acceptance Criteria

### User Management
- [ ] Admin can view list of all users
- [ ] Admin can search users by name or email
- [ ] Admin can filter by role and status
- [ ] Admin can create new user accounts
- [ ] Admin can edit user details
- [ ] Admin can disable/enable user accounts
- [ ] Admin can reset user passwords

### Bulk Operations
- [ ] Admin can select multiple users
- [ ] Admin can perform bulk actions (disable, delete)

### User Details
- [ ] Admin can view full user profile
- [ ] Admin can see user activity history
- [ ] Admin can see classes user belongs to

### UI/UX
- [ ] Table is sortable by column
- [ ] Filters work correctly
- [ ] Modal form validates input
- [ ] Mobile responsive layout works

---

## MVP Boundary

### In Scope (MVP)
- Admin user directory with search/filter and role/status management
- Create/edit/disable users and basic bulk actions
- User detail view with class associations and activity log access

### Out of Scope (Post-MVP)
- Fine-grained custom role policy builder
- Advanced anomaly detection in account behavior
- Cross-tenant federation controls

### Current Implementation Alignment
- Users page is planned and linked to admin roadmap; supports pending class pre-registration workflows.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| User list fetch | Table skeleton |
| Bulk action execution | Toolbar loading state |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| User list failure | Failed to load users. | Retry |
| Duplicate email on create | A user with this email already exists. | Update email |
| Action forbidden | You do not have permission for this action. | Refresh permissions |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| No users match filters | No users found for current filters. | Clear filters |

