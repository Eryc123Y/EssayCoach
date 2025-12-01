# REST API Endpoints (MVP)

All endpoints are prefixed with `/api/v1` and use JSON for request and response bodies. Authentication is handled via a Token supplied in the `Authorization: Token <token>` header (or `Authorization: Bearer <token>` for compatibility). Unless noted otherwise, responses follow the structure:

```json
{
  "success": true,
  "data": { }
}
```

Error responses return `success: false` with an `error` object describing the issue.

---

## Authentication

All authentication endpoints are under `/api/v1/auth/`.

### POST /api/v1/auth/register
Register a new user account and return authentication token.

**Request**

```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "password_confirm": "securePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student"
}
```

**Request Fields:**
- `email` (required): Valid email address
- `password` (required): Password (must meet validation requirements)
- `password_confirm` (required): Password confirmation (must match password)
- `first_name` (optional): User's first name
- `last_name` (optional): User's last name
- `role` (optional): User role - `student`, `teacher`, or `admin` (defaults to `student`)

**Response** `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "student",
      "status": "active"
    }
  }
}
```

**Error Responses**

When email is already taken:
**Response** `409 Conflict`

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_TAKEN",
    "message": "Email is already registered"
  }
}
```

When passwords don't match:
**Response** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Password fields didn't match",
    "details": {
      "password": ["Password fields didn't match."]
    }
  }
}
```

When password validation fails:
**Response** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Password does not meet requirements",
    "details": {
      "password": ["This password is too short. It must contain at least 8 characters."]
    }
  }
}
```

### POST /api/v1/auth/login
Authenticate a user and return authentication token.

**Request**

```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "student",
      "status": "active"
    }
  }
}
```

**Error Responses**

When credentials are invalid:
**Response** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

When account is locked/suspended:
**Response** `423 Locked`

```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account is locked. Please contact administrator."
  }
}
```

When input is invalid:
**Response** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email and password are required"
  }
}
```

### POST /api/v1/auth/logout
Log out the current user and invalidate their token.

**Headers:**
- `Authorization: Token <token>` (required)

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

**Error Responses**

When not authenticated:
**Response** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication credentials were not provided"
  }
}
```

### POST /api/v1/auth/password-reset
Reset password with email and new password.

> **Note:** This is a dummy endpoint for the MVP phase. It currently resets the password directly without verification. In the future, this will require email or SMS validation (e.g., sending a reset token).

**Request**

```json
{
  "email": "user@example.com",
  "new_password": "newSecurePassword123!",
  "new_password_confirm": "newSecurePassword123!"
}
```

**Request Fields:**
- `email` (required): User's email address
- `new_password` (required): New password (must meet validation requirements)
- `new_password_confirm` (required): Password confirmation (must match new_password)

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Error Responses**

When email is not registered:
**Response** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_NOT_FOUND",
    "message": "Email is not registered"
  }
}
```

When passwords don't match:
**Response** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Password fields didn't match",
    "details": {
      "new_password": ["Password fields didn't match."]
    }
  }
}
```

When password validation fails:
**Response** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Password does not meet requirements",
    "details": {
      "new_password": ["This password is too short. It must contain at least 8 characters."]
    }
  }
}
```

When input is invalid:
**Response** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid input data",
    "details": {
      "email": ["Enter a valid email address."]
    }
  }
}
```

### PUT /api/v1/auth/password-change
Change password for authenticated user. Requires validation of the current password before setting a new one.

**Headers:**
- `Authorization: Token <token>` (required)

**Request**

```json
{
  "current_password": "oldPassword123!",
  "new_password": "newSecurePassword123!",
  "new_password_confirm": "newSecurePassword123!"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**

When current password is incorrect:
**Response** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "Current password is incorrect"
  }
}
```

When not authenticated:
**Response** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication credentials were not provided"
  }
}
```

### GET /api/v1/auth/me
Retrieve the current authenticated user's profile.

**Headers:**
- `Authorization: Token <token>` (required)

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "status": "active",
    "date_joined": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**

When not authenticated:
**Response** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication credentials were not provided"
  }
}
```

### PATCH /api/v1/auth/me
Update the current authenticated user's profile.

**Headers:**
- `Authorization: Token <token>` (required)

**Request**

```json
{
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Request Fields:**
- `first_name` (optional): User's first name
- `last_name` (optional): User's last name
- Note: `email` and `role` cannot be changed via this endpoint

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "student",
    "status": "active"
  }
}
```

**Error Responses**

When not authenticated:
**Response** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication credentials were not provided"
  }
}
```

When validation fails:
**Response** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "first_name": ["This field may not be longer than 20 characters."]
    }
  }
}
```

---

## Users

**Note:** User management endpoints are under `/api/v1/users/`. For current user operations, use `/api/v1/auth/me` instead.

### GET /api/v1/users/{user-id}
Retrieve a specific user's public profile (admin/teacher only).

**Headers:**
- `Authorization: Token <token>` (required)
- Requires `admin` or `teacher` role

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "status": "active"
  }
}
```

**Error Responses**

When user not found:
**Response** `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User with id 123 not found"
  }
}
```

When permission denied:
**Response** `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to perform this action"
  }
}
```

---

## Tasks

### GET /api/v1/tasks
Return tasks relevant to the authenticated user. Teachers see their created tasks; students see assigned tasks.

### POST /api/v1/tasks
Create a new task (teacher only).

**Request**

```json
{
  "unitId": "ENG101",
  "rubricId": 3,
  "title": "Argumentative Essay",
  "dueAt": "2024-07-01T12:00:00Z"
}
```

**Response** `201 Created`

```json
{
  "success": true,
  "data": {"taskId": 10}
}
```

### GET /api/v1/tasks/{taskId}
Retrieve details for a single task.

### PATCH /api/v1/tasks/{taskId}
Modify task attributes such as due date or rubric.

---

## Submissions

### POST /api/v1/tasks/{taskId}/submissions
Create or replace the authenticated student's submission for the task.

**Request**

```json
{
  "content": "Full essay text..."
}
```

**Response** `201 Created`

```json
{
  "success": true,
  "data": {"submissionId": 42}
}
```

### GET /api/v1/tasks/{taskId}/submissions/{submissionId}
Retrieve a specific submission. Teachers can access any submission for their tasks; students can access their own.

### PATCH /api/v1/tasks/{taskId}/submissions/{submissionId}
Update submission content if revisions are allowed.

---

## Rubrics

### GET /api/v1/rubrics
List rubrics accessible to the user.

### POST /api/v1/rubrics
Create a rubric composed of multiple rubric items.

### GET /api/v1/rubrics/{rubricId}
Retrieve rubric details including items and level descriptions.

### GET /api/v1/tasks/{taskId}/rubric
Fetch the rubric associated with a task.

---

## Feedback

### GET /api/v1/submissions/{submissionId}/feedback
Return AI and human feedback for a submission.

### POST /api/v1/submissions/{submissionId}/feedback
Add or update coach feedback for the submission.

**Request**

```json
{
  "items": [
    {
      "rubricItemId": 5,
      "score": 8,
      "comment": "Strong thesis statement"
    }
  ]
}
```

---

## Instant Feedback

### POST /api/v1/instant-feedback
Provide immediate AI evaluation for ad‑hoc writing practice. Each request includes the text and an optional rubric.

**Request**

```json
{
  "content": "Draft paragraph...",
  "rubricId": 3
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "comments": [
      {
        "type": "grammar",
        "message": "Consider revising sentence 2"
      }
    ]
  }
}
```

---

## Standard Status Codes

- `200 OK` – Successful request
- `201 Created` – Resource created
- `204 No Content` – Successful request with no response body
- `400 Bad Request` – Invalid input
- `401 Unauthorized` – Authentication required or failed
- `403 Forbidden` – Authenticated but not permitted
- `404 Not Found` – Resource does not exist
- `500 Internal Server Error` – Unexpected server error

