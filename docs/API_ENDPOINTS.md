# EssayCoach API Endpoints

This document provides a comprehensive reference for all REST API endpoints in the EssayCoach backend.

## Base URLs

| Environment | URL                                    |
|-------------|----------------------------------------|
| Development | `http://127.0.0.1:8000/api/v1/`       |
| Production  | `https://api.essaycoach.com/api/v1/`   |

## Authentication

All API endpoints (except `/auth/`) require authentication via Token authentication.

```bash
# Include token in Authorization header
Authorization: Token <access_token>
```

The access token is obtained via the login endpoint and stored as an HttpOnly cookie.

---

## Authentication Endpoints

### POST /api/v1/auth/login/

Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "access_token": "abcd1234...",
  "token_type": "Token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

### POST /api/v1/auth/logout/

Invalidate the current token.

**Headers:**
```
Authorization: Token <access_token>
```

**Success Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

### GET /api/v1/auth/me/

Get current authenticated user information.

**Headers:**
```
Authorization: Token <access_token>
```

**Success Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "date_joined": "2026-01-15T10:30:00Z"
}
```

---

## Core Endpoints

### GET /api/v1/core/users/me/classes/

Get classes accessible to the authenticated user. Returns different results based on user role.

**Headers:**
```
Authorization: Token <access_token>
```

**Response (Student - Enrolled Classes):**
```json
[
  {
    "class_id": 1,
    "unit_name": "Introduction to Computer Science",
    "unit_code": "CS101",
    "class_size": 25
  },
  {
    "class_id": 2,
    "unit_name": "Creative Writing",
    "unit_code": "ENG201",
    "class_size": 18
  }
]
```

**Response (Lecturer - Assigned Classes via TeachingAssn):**
```json
[
  {
    "class_id": 3,
    "unit_name": "Advanced Essay Writing",
    "unit_code": "ENG301",
    "class_size": 15
  }
]
```

**Response (Admin - All Classes):**
```json
[
  {
    "class_id": 1,
    "unit_name": "Introduction to Computer Science",
    "unit_code": "CS101",
    "class_size": 25
  },
  {
    "class_id": 2,
    "unit_name": "Creative Writing",
    "unit_code": "ENG201",
    "class_size": 18
  }
  // ... all classes in system
]
```

**Role-Based Behavior:**
| Role     | Returns                                    |
|----------|-------------------------------------------|
| Student  | Classes where user is enrolled            |
| Lecturer | Classes assigned via TeachingAssn         |
| Admin    | All classes in the system                 |

---

## Rubrics Endpoints

### GET /api/v1/core/rubrics/

List all rubrics accessible to the authenticated user.

**Query Parameters:**
| Parameter | Type    | Description                    |
|-----------|---------|--------------------------------|
| page      | integer | Page number for pagination     |
| page_size | integer | Number of items per page       |
| search    | string  | Search in title and description|

**Response:**
```json
{
  "count": 10,
  "next": "http://127.0.0.1:8000/api/v1/core/rubrics/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Argumentative Essay Rubric",
      "description": "Rubric for evaluating argumentative essays",
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-20T14:45:00Z",
      "is_active": true
    }
  ]
}
```

### POST /api/v1/core/rubrics/

Create a new rubric.

**Request Body:**
```json
{
  "name": "New Rubric Name",
  "description": "Description of the rubric",
  "items": [
    {
      "name": "Criterion 1",
      "description": "Description of criterion",
      "level_descs": [
        {
          "name": "Excellent",
          "description": "Excellent performance",
          "score_min": 9,
          "score_max": 10
        }
      ]
    }
  ]
}
```

### GET /api/v1/core/rubrics/{id}/

Retrieve a specific rubric with all items and levels.

**Response:**
```json
{
  "id": 1,
  "name": "Argumentative Essay Rubric",
  "description": "Full rubric description",
  "items": [
    {
      "id": 1,
      "name": "Thesis Statement",
      "description": "Quality of thesis statement",
      "level_descs": [
        {
          "id": 1,
          "name": "Excellent",
          "description": "Clear, specific thesis",
          "score_min": 9,
          "score_max": 10
        },
        {
          "id": 2,
          "name": "Good",
          "description": "Clear thesis",
          "score_min": 7,
          "score_max": 8
        }
      ]
    }
  ],
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-20T14:45:00Z"
}
```

### PUT /api/v1/core/rubrics/{id}/

Update a rubric completely (replace all fields).

### PATCH /api/v1/core/rubrics/{id}/

Update a rubric partially (only provided fields).

### DELETE /api/v1/core/rubrics/{id}/

Delete a rubric. Uses CASCADE deletion, so related tasks and submissions are also deleted.

**Response (204):**
```
No Content
```

---

## Tasks Endpoints

### GET /api/v1/core/tasks/

List all tasks for the authenticated user.

**Query Parameters:**
| Parameter | Type    | Description                    |
|-----------|---------|--------------------------------|
| page      | integer | Page number for pagination     |
| rubric_id | integer | Filter by rubric               |
| status    | string  | Filter by status               |

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "title": "Essay Assignment 1",
      "description": "Write a 500-word essay",
      "rubric": {
        "id": 1,
        "name": "Argumentative Essay Rubric"
      },
      "due_date": "2026-02-01T23:59:59Z",
      "status": "open"
    }
  ]
}
```

### POST /api/v1/core/tasks/

Create a new task.

**Request Body:**
```json
{
  "title": "New Assignment",
  "description": "Assignment description",
  "rubric_id": 1,
  "due_date": "2026-02-15T23:59:59Z"
}
```

### GET /api/v1/core/tasks/{id}/

Retrieve task details with associated rubric.

---

## Submissions Endpoints

### GET /api/v1/core/submissions/

List submissions for the authenticated user.

**Response:**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "task": {
        "id": 1,
        "title": "Essay Assignment 1"
      },
      "student": {
        "id": 5,
        "first_name": "John",
        "last_name": "Doe"
      },
      "content": "Essay content here...",
      "status": "submitted",
      "score": null,
      "submitted_at": "2026-01-25T10:30:00Z"
    }
  ]
}
```

### POST /api/v1/core/submissions/

Submit an essay for grading.

**Request Body (multipart/form-data):**
```
content: "The essay text content..."
or
file: [PDF or document file]
rubric_id: 1
```

**Response (202):**
```json
{
  "message": "Submission received. AI feedback generation started.",
  "submission_id": 1,
  "status": "processing"
}
```

### GET /api/v1/core/submissions/{id}/

Retrieve submission with AI feedback.

**Response:**
```json
{
  "id": 1,
  "task": {
    "id": 1,
    "title": "Essay Assignment 1"
  },
  "content": "Essay content here...",
  "status": "graded",
  "score": 85,
  "feedback": {
    "overall_score": 85,
    "rubric_scores": [
      {
        "criterion": "Thesis Statement",
        "score": 9,
        "max_score": 10,
        "feedback": "Strong thesis statement..."
      }
    ],
    "suggestions": [
      "Consider expanding the counter-argument section...",
      "Improve transitions between paragraphs..."
    ]
  },
  "submitted_at": "2026-01-25T10:30:00Z",
  "graded_at": "2026-01-25T10:35:00Z"
}
```

---

## AI Feedback Endpoints

### POST /api/v1/ai/feedback/generate/

Generate AI feedback for a submission.

**Request Body:**
```json
{
  "submission_id": 1,
  "rubric_id": 1,
  "options": {
    "include_suggestions": true,
    "detail_level": "detailed"
  }
}
```

**Response (202):**
```json
{
  "message": "Feedback generation started",
  "task_id": "feedback-123",
  "estimated_time": 30
}
```

### GET /api/v1/ai/feedback/status/{task_id}/

Check feedback generation status.

**Response:**
```json
{
  "task_id": "feedback-123",
  "status": "completed",
  "progress": 100
}
```

---

## Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code                    | HTTP Status | Description                           |
|-------------------------|-------------|---------------------------------------|
| `authentication_failed` | 401         | Invalid or missing authentication     |
| `permission_denied`     | 403         | User lacks permission for this action |
| `not_found`             | 404         | Resource not found                    |
| `validation_error`      | 400         | Invalid request data                  |
| `rate_limit_exceeded`   | 429         | Too many requests                     |

### Example Error Response

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid submission data",
    "details": {
      "content": ["This field is required."]
    }
  }
}
```

---

## Rate Limiting

| Endpoint Type          | Rate Limit              |
|------------------------|-------------------------|
| Authentication         | 5 requests / minute     |
| Read Operations        | 60 requests / minute    |
| Write Operations       | 20 requests / minute    |
| AI Feedback Generation | 10 requests / minute    |

---

## Versioning

The API uses URL versioning: `/api/v1/`

Future versions will be `/api/v2/`, etc. Backward-incompatible changes will require version increments.

---

## Related Documentation

- [System Architecture](../architecture/system-architecture.md)
- [Authentication Architecture](../architecture/authentication.md)
- [Database Schema](../database/schema-overview.md)
- [API Specification (OpenAPI)](http://127.0.0.1:8000/api/docs/)
