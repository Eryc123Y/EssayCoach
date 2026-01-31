# API Reference
Generated: 2026-01-28 01:45:53
---

## Authentication

All API requests require authentication using a Bearer token:

```bash
Authorization: Bearer <your-access-token>
```

**Note**: Backend server is not running. Run `make dev-backend` to generate actual API documentation.

## Endpoints

### Authentication

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/api/v1/auth/me/` | Get current user info |
| POST | `/api/v1/auth/login/` | User login |
| POST | `/api/v1/auth/logout/` | User logout |

### Users

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/api/v1/core/users/me/` | Get current user |
| PUT | `/api/v1/core/users/me/` | Update current user |

### Courses

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/api/v1/core/courses/` | List courses |
| POST | `/api/v1/core/courses/` | Create course |
| GET | `/api/v1/core/courses/{id}/` | Get course details |
| PUT | `/api/v1/core/courses/{id}/` | Update course |
| DELETE | `/api/v1/core/courses/{id}/` | Delete course |

### Rubrics

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/api/v1/core/rubrics/` | List rubrics |
| POST | `/api/v1/core/rubrics/` | Create rubric |
| GET | `/api/v1/core/rubrics/{id}/` | Get rubric details |
| PUT | `/api/v1/core/rubrics/{id}/` | Update rubric |
| DELETE | `/api/v1/core/rubrics/{id}/` | Delete rubric |

### Tasks

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/api/v1/core/tasks/` | List tasks |
| POST | `/api/v1/core/tasks/` | Create task |
| GET | `/api/v1/core/tasks/{id}/` | Get task details |
| PUT | `/api/v1/core/tasks/{id}/` | Update task |
| DELETE | `/api/v1/core/tasks/{id}/` | Delete task |

### Submissions

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/api/v1/core/submissions/` | List submissions |
| POST | `/api/v1/core/submissions/` | Create submission |
| GET | `/api/v1/core/submissions/{id}/` | Get submission details |

### Feedback

| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | `/api/v1/ai-feedback/generate/` | Generate AI feedback |
| GET | `/api/v1/ai-feedback/status/{id}/` | Check feedback status |

---

**Note**: This is a template. Start the backend server and run `python scripts/generate-docs.py` to generate actual documentation.
