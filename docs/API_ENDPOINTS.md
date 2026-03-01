# EssayCoach API Endpoints (v2)

This document lists the active API v2 endpoints.

Source of truth:

- `backend/api_v2/api.py`
- `backend/api_v2/**/views.py`
- `backend/api_v2/core/routers/*.py`

## Base URLs

| Environment | URL |
| --- | --- |
| Development | `http://127.0.0.1:8000/api/v2/` |
| Production | `https://api.essaycoach.com/api/v2/` |

## Authentication

- Protected endpoints use Bearer auth: `Authorization: Bearer <access_token>`
- Frontend server proxy route: `frontend/src/app/api/v2/[...path]/route.ts`

## Auth (`/auth/`)

| Method | Endpoint |
| --- | --- |
| POST | `/api/v2/auth/register/` |
| POST | `/api/v2/auth/login/` |
| POST | `/api/v2/auth/logout/` |
| GET | `/api/v2/auth/me/` |
| GET | `/api/v2/auth/me/jwt/` |
| PATCH | `/api/v2/auth/me/` |
| POST | `/api/v2/auth/password-change/` |
| POST | `/api/v2/auth/password-reset/` |
| POST | `/api/v2/auth/login-with-jwt/` |
| POST | `/api/v2/auth/refresh/` |
| GET | `/api/v2/auth/getUserInfo` |
| POST | `/api/v2/auth/logout-jwt/` |
| GET | `/api/v2/auth/settings/preferences/` |
| PUT | `/api/v2/auth/settings/preferences/` |
| POST | `/api/v2/auth/settings/avatar/` |
| GET | `/api/v2/auth/settings/sessions/` |
| DELETE | `/api/v2/auth/settings/sessions/{session_id}/` |
| GET | `/api/v2/auth/settings/login-history/` |

## Core Dashboard (`/core/`)

| Method | Endpoint |
| --- | --- |
| GET | `/api/v2/core/dashboard/` |
| GET | `/api/v2/core/dashboard/student/` |
| GET | `/api/v2/core/dashboard/lecturer/` |
| GET | `/api/v2/core/dashboard/admin/` |

## Core Users (`/core/`)

| Method | Endpoint |
| --- | --- |
| GET | `/api/v2/core/users/` |
| POST | `/api/v2/core/users/` |
| GET | `/api/v2/core/users/me/` |
| GET | `/api/v2/core/users/{user_id}/` |
| PUT | `/api/v2/core/users/{user_id}/` |
| DELETE | `/api/v2/core/users/{user_id}/` |
| GET | `/api/v2/core/users/{user_id}/stats/` |
| GET | `/api/v2/core/users/{user_id}/badges/` |
| GET | `/api/v2/core/users/{user_id}/progress/` |
| GET | `/api/v2/core/users/me/classes/` |

## Core Classes and Enrollment (`/core/`)

| Method | Endpoint |
| --- | --- |
| GET | `/api/v2/core/classes/` |
| POST | `/api/v2/core/classes/` |
| POST | `/api/v2/core/classes/join/` |
| GET | `/api/v2/core/classes/{class_id}/` |
| PUT | `/api/v2/core/classes/{class_id}/` |
| DELETE | `/api/v2/core/classes/{class_id}/` |
| GET | `/api/v2/core/enrollments/` |
| POST | `/api/v2/core/enrollments/` |
| GET | `/api/v2/core/enrollments/{enrollment_id}/` |
| DELETE | `/api/v2/core/enrollments/{enrollment_id}/` |
| GET | `/api/v2/core/teaching-assignments/` |
| POST | `/api/v2/core/teaching-assignments/` |
| GET | `/api/v2/core/teaching-assignments/{assignment_id}/` |
| DELETE | `/api/v2/core/teaching-assignments/{assignment_id}/` |
| GET | `/api/v2/core/classes/{class_id}/students/` |
| POST | `/api/v2/core/classes/{class_id}/students/` |
| DELETE | `/api/v2/core/classes/{class_id}/students/{user_id}/` |
| POST | `/api/v2/core/classes/{class_id}/archive/` |
| DELETE | `/api/v2/core/classes/{class_id}/leave/` |
| POST | `/api/v2/core/admin/classes/batch-enroll/` |
| POST | `/api/v2/core/admin/users/invite-lecturer/` |

## Core Tasks (`/core/`)

| Method | Endpoint |
| --- | --- |
| GET | `/api/v2/core/tasks/` |
| POST | `/api/v2/core/tasks/` |
| GET | `/api/v2/core/tasks/{task_id}/` |
| PUT | `/api/v2/core/tasks/{task_id}/` |
| DELETE | `/api/v2/core/tasks/{task_id}/` |
| POST | `/api/v2/core/tasks/{task_id}/publish/` |
| POST | `/api/v2/core/tasks/{task_id}/unpublish/` |
| GET | `/api/v2/core/tasks/{task_id}/submissions/` |
| POST | `/api/v2/core/tasks/{task_id}/duplicate/` |
| POST | `/api/v2/core/tasks/{task_id}/extend/` |

## Core Rubrics (`/core/`)

| Method | Endpoint |
| --- | --- |
| GET | `/api/v2/core/rubrics/` |
| GET | `/api/v2/core/rubrics/public/` |
| POST | `/api/v2/core/rubrics/` |
| POST | `/api/v2/core/rubrics/import_from_pdf_with_ai/` |
| GET | `/api/v2/core/rubrics/{rubric_id}/` |
| GET | `/api/v2/core/rubrics/{rubric_id}/detail/` |
| GET | `/api/v2/core/rubrics/{rubric_id}/detail_with_items/` |
| PUT | `/api/v2/core/rubrics/{rubric_id}/` |
| PATCH | `/api/v2/core/rubrics/{rubric_id}/visibility/` |
| DELETE | `/api/v2/core/rubrics/{rubric_id}/` |
| GET | `/api/v2/core/rubric-items/` |
| POST | `/api/v2/core/rubric-items/` |
| GET | `/api/v2/core/rubric-items/{item_id}/` |
| PUT | `/api/v2/core/rubric-items/{item_id}/` |
| DELETE | `/api/v2/core/rubric-items/{item_id}/` |
| GET | `/api/v2/core/rubric-levels/` |
| POST | `/api/v2/core/rubric-levels/` |
| GET | `/api/v2/core/rubric-levels/{level_id}/` |
| PUT | `/api/v2/core/rubric-levels/{level_id}/` |
| DELETE | `/api/v2/core/rubric-levels/{level_id}/` |
| POST | `/api/v2/core/rubrics/{rubric_id}/duplicate/` |

## Core Submissions and Feedback (`/core/`)

| Method | Endpoint |
| --- | --- |
| GET | `/api/v2/core/submissions/` |
| POST | `/api/v2/core/submissions/` |
| GET | `/api/v2/core/submissions/{submission_id}/` |
| PUT | `/api/v2/core/submissions/{submission_id}/` |
| DELETE | `/api/v2/core/submissions/{submission_id}/` |
| GET | `/api/v2/core/feedbacks/` |
| POST | `/api/v2/core/feedbacks/` |
| GET | `/api/v2/core/feedbacks/{feedback_id}/` |
| DELETE | `/api/v2/core/feedbacks/{feedback_id}/` |
| GET | `/api/v2/core/feedback-items/` |
| POST | `/api/v2/core/feedback-items/` |
| GET | `/api/v2/core/feedback-items/{item_id}/` |
| PUT | `/api/v2/core/feedback-items/{item_id}/` |
| DELETE | `/api/v2/core/feedback-items/{item_id}/` |

## Core Units (`/core/`)

| Method | Endpoint |
| --- | --- |
| GET | `/api/v2/core/units/` |
| POST | `/api/v2/core/units/` |
| GET | `/api/v2/core/units/{unit_id}/` |
| PUT | `/api/v2/core/units/{unit_id}/` |
| DELETE | `/api/v2/core/units/{unit_id}/` |

## AI Feedback (`/ai-feedback/`)

| Method | Endpoint |
| --- | --- |
| POST | `/api/v2/ai-feedback/agent/workflows/run/` |
| GET | `/api/v2/ai-feedback/agent/workflows/run/{workflow_run_id}/status/` |
| POST | `/api/v2/ai-feedback/chat/` |

## Advanced (`/advanced/`)

| Method | Endpoint |
| --- | --- |
| POST | `/api/v2/advanced/batch-delete/` |
| POST | `/api/v2/advanced/batch-update/` |
| POST | `/api/v2/advanced/import/` |
| GET | `/api/v2/advanced/export/` |

## Social (`/social/`)

| Method | Endpoint |
| --- | --- |
| GET | `/api/v2/social/feed/` |
| POST | `/api/v2/social/share/` |
| POST | `/api/v2/social/{submission_id}/interact/` |
| POST | `/api/v2/social/report/` |

## Analytics (`/analytics/`)

| Method | Endpoint |
| --- | --- |
| POST | `/api/v2/analytics/query/` |
| GET | `/api/v2/analytics/export/` |

## Users Admin (`/admin/users/`)

| Method | Endpoint |
| --- | --- |
| POST | `/api/v2/admin/users/{user_id}/action/` |
| GET | `/api/v2/admin/users/{user_id}/activity/` |

## Help (`/help/`)

| Method | Endpoint |
| --- | --- |
| GET | `/api/v2/help/articles/` |
| GET | `/api/v2/help/articles/{article_slug}/` |
| POST | `/api/v2/help/tickets/` |
| GET | `/api/v2/help/tickets/me/` |

## OpenAPI

- Swagger UI: `http://127.0.0.1:8000/api/v2/docs/`
- OpenAPI JSON: `http://127.0.0.1:8000/api/v2/openapi.json`
