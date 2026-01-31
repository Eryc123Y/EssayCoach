# API Reference
Generated: 2026-01-28 01:47:10
---

## Authentication

All API endpoints require authentication. The API uses token-based authentication:

```bash
Authorization: Token <your-access-token>
```

### Supported Authentication Methods

| Scheme | Type | Description |
|--------|------|-------------|
| basicAuth | HTTP (basic) |  |
| cookieAuth | API Key (cookie) |  |
| tokenAuth | API Key (header) | Token-based authentication with required prefix "Token" |

## Endpoints

### Authentication

User authentication and authorization endpoints

| Method | Endpoint | Summary | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/auth/login/` | User login | API Key (sessionid) |
| POST | `/api/v1/auth/logout/` | User logout | API Key (sessionid) |
| GET | `/api/v1/auth/me/` | Get current user profile | API Key (sessionid) |
| PATCH | `/api/v1/auth/me/` | Update current user profile | API Key (sessionid) |
| POST | `/api/v1/auth/password-change/` | Change password | API Key (sessionid) |
| POST | `/api/v1/auth/password-reset/` | Reset password | API Key (sessionid) |
| POST | `/api/v1/auth/register/` | Register a new user | API Key (sessionid) |

**Endpoint Details**

#### POST `/api/v1/auth/login/`

**User login**

Authenticate a user with email and password. Returns an authentication token and user profile information.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `UserLoginRequest`

**Responses**:
- `200: Response`
- `401: Invalid credentials`

---

#### POST `/api/v1/auth/logout/`

**User logout**

Invalidate the current user's authentication token.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Logout successful`

---

#### GET `/api/v1/auth/me/`

**Get current user profile**

User profile view.
GET /api/v1/auth/me/
PATCH /api/v1/auth/me/

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/auth/me/`

**Update current user profile**

User profile view.
GET /api/v1/auth/me/
PATCH /api/v1/auth/me/

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedUserUpdateRequest`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/auth/password-change/`

**Change password**

Change password endpoint.
POST /api/v1/auth/password-change/

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PasswordChangeRequest`

**Responses**:
- `200: Password changed successfully`

---

#### POST `/api/v1/auth/password-reset/`

**Reset password**

Reset password endpoint.
POST /api/v1/auth/password-reset/

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PasswordResetRequest`

**Responses**:
- `200: Password reset successful`

---

#### POST `/api/v1/auth/register/`

**Register a new user**

Create a new user account and receive an authentication token. The user will be assigned the 'student' role by default if not specified.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `UserRegistrationRequest`

**Responses**:
- `201: Response`
- `400: Invalid input data`

---

### Users

User management endpoints

| Method | Endpoint | Summary | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/core/users/` | User management | API Key (sessionid) |
| POST | `/api/v1/core/users/` | User management | API Key (sessionid) |
| DELETE | `/api/v1/core/users/{user_id}/` | User management | API Key (sessionid) |
| GET | `/api/v1/core/users/{user_id}/` | User management | API Key (sessionid) |
| PATCH | `/api/v1/core/users/{user_id}/` | User management | API Key (sessionid) |
| PUT | `/api/v1/core/users/{user_id}/` | User management | API Key (sessionid) |

**Endpoint Details**

#### GET `/api/v1/core/users/`

**User management**

CRUD operations for user accounts. Supports students, lecturers, and administrators.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/users/`

**User management**

CRUD operations for user accounts. Supports students, lecturers, and administrators.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `UserRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/users/{user_id}/`

**User management**

CRUD operations for user accounts. Supports students, lecturers, and administrators.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/users/{user_id}/`

**User management**

CRUD operations for user accounts. Supports students, lecturers, and administrators.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/users/{user_id}/`

**User management**

CRUD operations for user accounts. Supports students, lecturers, and administrators.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedUserRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/users/{user_id}/`

**User management**

CRUD operations for user accounts. Supports students, lecturers, and administrators.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `UserRequest`

**Responses**:
- `200: Response`

---

### Courses

Course structure management (Units, Classes, Enrollments, Teaching Assignments)

| Method | Endpoint | Summary | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/core/classes/` | Class management | API Key (sessionid) |
| POST | `/api/v1/core/classes/` | Class management | API Key (sessionid) |
| DELETE | `/api/v1/core/classes/{class_id}/` | Class management | API Key (sessionid) |
| GET | `/api/v1/core/classes/{class_id}/` | Class management | API Key (sessionid) |
| PATCH | `/api/v1/core/classes/{class_id}/` | Class management | API Key (sessionid) |
| PUT | `/api/v1/core/classes/{class_id}/` | Class management | API Key (sessionid) |
| GET | `/api/v1/core/enrollments/` | Enrollment management | API Key (sessionid) |
| POST | `/api/v1/core/enrollments/` | Enrollment management | API Key (sessionid) |
| DELETE | `/api/v1/core/enrollments/{enrollment_id}/` | Enrollment management | API Key (sessionid) |
| GET | `/api/v1/core/enrollments/{enrollment_id}/` | Enrollment management | API Key (sessionid) |
| PATCH | `/api/v1/core/enrollments/{enrollment_id}/` | Enrollment management | API Key (sessionid) |
| PUT | `/api/v1/core/enrollments/{enrollment_id}/` | Enrollment management | API Key (sessionid) |
| GET | `/api/v1/core/teaching-assignments/` | Teaching assignment management | API Key (sessionid) |
| POST | `/api/v1/core/teaching-assignments/` | Teaching assignment management | API Key (sessionid) |
| DELETE | `/api/v1/core/teaching-assignments/{teaching_assn_id}/` | Teaching assignment management | API Key (sessionid) |
| GET | `/api/v1/core/teaching-assignments/{teaching_assn_id}/` | Teaching assignment management | API Key (sessionid) |
| PATCH | `/api/v1/core/teaching-assignments/{teaching_assn_id}/` | Teaching assignment management | API Key (sessionid) |
| PUT | `/api/v1/core/teaching-assignments/{teaching_assn_id}/` | Teaching assignment management | API Key (sessionid) |
| GET | `/api/v1/core/units/` | Unit management | API Key (sessionid) |
| POST | `/api/v1/core/units/` | Unit management | API Key (sessionid) |
| DELETE | `/api/v1/core/units/{unit_id}/` | Unit management | API Key (sessionid) |
| GET | `/api/v1/core/units/{unit_id}/` | Unit management | API Key (sessionid) |
| PATCH | `/api/v1/core/units/{unit_id}/` | Unit management | API Key (sessionid) |
| PUT | `/api/v1/core/units/{unit_id}/` | Unit management | API Key (sessionid) |

**Endpoint Details**

#### GET `/api/v1/core/classes/`

**Class management**

CRUD operations for classes. Classes are instances of units with a specific class size.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/classes/`

**Class management**

CRUD operations for classes. Classes are instances of units with a specific class size.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `ClassRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/classes/{class_id}/`

**Class management**

CRUD operations for classes. Classes are instances of units with a specific class size.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/classes/{class_id}/`

**Class management**

CRUD operations for classes. Classes are instances of units with a specific class size.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/classes/{class_id}/`

**Class management**

CRUD operations for classes. Classes are instances of units with a specific class size.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedClassRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/classes/{class_id}/`

**Class management**

CRUD operations for classes. Classes are instances of units with a specific class size.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `ClassRequest`

**Responses**:
- `200: Response`

---

#### GET `/api/v1/core/enrollments/`

**Enrollment management**

CRUD operations for student enrollments. Students enroll in classes for specific units.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/enrollments/`

**Enrollment management**

CRUD operations for student enrollments. Students enroll in classes for specific units.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `EnrollmentRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/enrollments/{enrollment_id}/`

**Enrollment management**

CRUD operations for student enrollments. Students enroll in classes for specific units.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/enrollments/{enrollment_id}/`

**Enrollment management**

CRUD operations for student enrollments. Students enroll in classes for specific units.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/enrollments/{enrollment_id}/`

**Enrollment management**

CRUD operations for student enrollments. Students enroll in classes for specific units.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedEnrollmentRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/enrollments/{enrollment_id}/`

**Enrollment management**

CRUD operations for student enrollments. Students enroll in classes for specific units.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `EnrollmentRequest`

**Responses**:
- `200: Response`

---

#### GET `/api/v1/core/teaching-assignments/`

**Teaching assignment management**

CRUD operations for teaching assignments. Assigns lecturers to specific classes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/teaching-assignments/`

**Teaching assignment management**

CRUD operations for teaching assignments. Assigns lecturers to specific classes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `TeachingAssnRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/teaching-assignments/{teaching_assn_id}/`

**Teaching assignment management**

CRUD operations for teaching assignments. Assigns lecturers to specific classes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/teaching-assignments/{teaching_assn_id}/`

**Teaching assignment management**

CRUD operations for teaching assignments. Assigns lecturers to specific classes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/teaching-assignments/{teaching_assn_id}/`

**Teaching assignment management**

CRUD operations for teaching assignments. Assigns lecturers to specific classes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedTeachingAssnRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/teaching-assignments/{teaching_assn_id}/`

**Teaching assignment management**

CRUD operations for teaching assignments. Assigns lecturers to specific classes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `TeachingAssnRequest`

**Responses**:
- `200: Response`

---

#### GET `/api/v1/core/units/`

**Unit management**

CRUD operations for educational units (courses/subjects). Units are identified by unique unit codes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/units/`

**Unit management**

CRUD operations for educational units (courses/subjects). Units are identified by unique unit codes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `UnitRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/units/{unit_id}/`

**Unit management**

CRUD operations for educational units (courses/subjects). Units are identified by unique unit codes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/units/{unit_id}/`

**Unit management**

CRUD operations for educational units (courses/subjects). Units are identified by unique unit codes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/units/{unit_id}/`

**Unit management**

CRUD operations for educational units (courses/subjects). Units are identified by unique unit codes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedUnitRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/units/{unit_id}/`

**Unit management**

CRUD operations for educational units (courses/subjects). Units are identified by unique unit codes.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `UnitRequest`

**Responses**:
- `200: Response`

---

### Classes

| Method | Endpoint | Summary | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/core/users/me/classes/` | User accessible classes | API Key (sessionid) |
| GET | `/api/v1/core/users/me/classes/{id}/` | User accessible classes | API Key (sessionid) |

**Endpoint Details**

#### GET `/api/v1/core/users/me/classes/`

**User accessible classes**

Get list of classes accessible by the current user based on their role.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### GET `/api/v1/core/users/me/classes/{id}/`

**User accessible classes**

Get list of classes accessible by the current user based on their role.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

### Tasks

Assignment and task management

| Method | Endpoint | Summary | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/core/tasks/` | Task management | API Key (sessionid) |
| POST | `/api/v1/core/tasks/` | Task management | API Key (sessionid) |
| DELETE | `/api/v1/core/tasks/{task_id}/` | Task management | API Key (sessionid) |
| GET | `/api/v1/core/tasks/{task_id}/` | Task management | API Key (sessionid) |
| PATCH | `/api/v1/core/tasks/{task_id}/` | Task management | API Key (sessionid) |
| PUT | `/api/v1/core/tasks/{task_id}/` | Task management | API Key (sessionid) |

**Endpoint Details**

#### GET `/api/v1/core/tasks/`

**Task management**

CRUD operations for tasks/assignments. Tasks are created by lecturers for students to complete.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/tasks/`

**Task management**

CRUD operations for tasks/assignments. Tasks are created by lecturers for students to complete.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `TaskRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/tasks/{task_id}/`

**Task management**

CRUD operations for tasks/assignments. Tasks are created by lecturers for students to complete.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/tasks/{task_id}/`

**Task management**

CRUD operations for tasks/assignments. Tasks are created by lecturers for students to complete.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/tasks/{task_id}/`

**Task management**

CRUD operations for tasks/assignments. Tasks are created by lecturers for students to complete.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedTaskRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/tasks/{task_id}/`

**Task management**

CRUD operations for tasks/assignments. Tasks are created by lecturers for students to complete.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `TaskRequest`

**Responses**:
- `200: Response`

---

### Rubrics

Rubric configuration and management (Marking Rubrics, Rubric Items, Rubric Level Descriptions)

| Method | Endpoint | Summary | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/core/marking-rubrics/` | Marking rubric management | API Key (sessionid) |
| POST | `/api/v1/core/marking-rubrics/` | Marking rubric management | API Key (sessionid) |
| DELETE | `/api/v1/core/marking-rubrics/{rubric_id}/` | Marking rubric management | API Key (sessionid) |
| GET | `/api/v1/core/marking-rubrics/{rubric_id}/` | Marking rubric management | API Key (sessionid) |
| PATCH | `/api/v1/core/marking-rubrics/{rubric_id}/` | Marking rubric management | API Key (sessionid) |
| PUT | `/api/v1/core/marking-rubrics/{rubric_id}/` | Marking rubric management | API Key (sessionid) |
| GET | `/api/v1/core/rubric-items/` | Rubric item management | API Key (sessionid) |
| POST | `/api/v1/core/rubric-items/` | Rubric item management | API Key (sessionid) |
| DELETE | `/api/v1/core/rubric-items/{rubric_item_id}/` | Rubric item management | API Key (sessionid) |
| GET | `/api/v1/core/rubric-items/{rubric_item_id}/` | Rubric item management | API Key (sessionid) |
| PATCH | `/api/v1/core/rubric-items/{rubric_item_id}/` | Rubric item management | API Key (sessionid) |
| PUT | `/api/v1/core/rubric-items/{rubric_item_id}/` | Rubric item management | API Key (sessionid) |
| GET | `/api/v1/core/rubric-level-descs/` | Rubric level description management | API Key (sessionid) |
| POST | `/api/v1/core/rubric-level-descs/` | Rubric level description management | API Key (sessionid) |
| DELETE | `/api/v1/core/rubric-level-descs/{level_desc_id}/` | Rubric level description management | API Key (sessionid) |
| GET | `/api/v1/core/rubric-level-descs/{level_desc_id}/` | Rubric level description management | API Key (sessionid) |
| PATCH | `/api/v1/core/rubric-level-descs/{level_desc_id}/` | Rubric level description management | API Key (sessionid) |
| PUT | `/api/v1/core/rubric-level-descs/{level_desc_id}/` | Rubric level description management | API Key (sessionid) |
| GET | `/api/v1/core/rubrics/` | Rubric management with AI-assisted PDF import | API Key (sessionid) |
| POST | `/api/v1/core/rubrics/` | Rubric management with AI-assisted PDF import | API Key (sessionid) |
| POST | `/api/v1/core/rubrics/import_from_pdf_with_ai/` | Rubric management with AI-assisted PDF import | API Key (sessionid) |
| DELETE | `/api/v1/core/rubrics/{id}/` | Rubric management with AI-assisted PDF import | API Key (sessionid) |
| GET | `/api/v1/core/rubrics/{id}/` | Rubric management with AI-assisted PDF import | API Key (sessionid) |
| PATCH | `/api/v1/core/rubrics/{id}/` | Rubric management with AI-assisted PDF import | API Key (sessionid) |
| PUT | `/api/v1/core/rubrics/{id}/` | Rubric management with AI-assisted PDF import | API Key (sessionid) |
| GET | `/api/v1/core/rubrics/{id}/detail_with_items/` | Rubric management with AI-assisted PDF import | API Key (sessionid) |

**Endpoint Details**

#### GET `/api/v1/core/marking-rubrics/`

**Marking rubric management**

CRUD operations for marking rubrics. Rubrics define the criteria and structure for evaluating submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/marking-rubrics/`

**Marking rubric management**

CRUD operations for marking rubrics. Rubrics define the criteria and structure for evaluating submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `MarkingRubricRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/marking-rubrics/{rubric_id}/`

**Marking rubric management**

CRUD operations for marking rubrics. Rubrics define the criteria and structure for evaluating submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/marking-rubrics/{rubric_id}/`

**Marking rubric management**

CRUD operations for marking rubrics. Rubrics define the criteria and structure for evaluating submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/marking-rubrics/{rubric_id}/`

**Marking rubric management**

CRUD operations for marking rubrics. Rubrics define the criteria and structure for evaluating submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedMarkingRubricRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/marking-rubrics/{rubric_id}/`

**Marking rubric management**

CRUD operations for marking rubrics. Rubrics define the criteria and structure for evaluating submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `MarkingRubricRequest`

**Responses**:
- `200: Response`

---

#### GET `/api/v1/core/rubric-items/`

**Rubric item management**

CRUD operations for rubric items. Rubric items are individual criteria within a marking rubric.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/rubric-items/`

**Rubric item management**

CRUD operations for rubric items. Rubric items are individual criteria within a marking rubric.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `RubricItemRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/rubric-items/{rubric_item_id}/`

**Rubric item management**

CRUD operations for rubric items. Rubric items are individual criteria within a marking rubric.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/rubric-items/{rubric_item_id}/`

**Rubric item management**

CRUD operations for rubric items. Rubric items are individual criteria within a marking rubric.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/rubric-items/{rubric_item_id}/`

**Rubric item management**

CRUD operations for rubric items. Rubric items are individual criteria within a marking rubric.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedRubricItemRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/rubric-items/{rubric_item_id}/`

**Rubric item management**

CRUD operations for rubric items. Rubric items are individual criteria within a marking rubric.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `RubricItemRequest`

**Responses**:
- `200: Response`

---

#### GET `/api/v1/core/rubric-level-descs/`

**Rubric level description management**

CRUD operations for rubric level descriptions. These define score ranges and their meanings for each rubric item.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/rubric-level-descs/`

**Rubric level description management**

CRUD operations for rubric level descriptions. These define score ranges and their meanings for each rubric item.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `RubricLevelDescRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/rubric-level-descs/{level_desc_id}/`

**Rubric level description management**

CRUD operations for rubric level descriptions. These define score ranges and their meanings for each rubric item.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/rubric-level-descs/{level_desc_id}/`

**Rubric level description management**

CRUD operations for rubric level descriptions. These define score ranges and their meanings for each rubric item.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/rubric-level-descs/{level_desc_id}/`

**Rubric level description management**

CRUD operations for rubric level descriptions. These define score ranges and their meanings for each rubric item.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedRubricLevelDescRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/rubric-level-descs/{level_desc_id}/`

**Rubric level description management**

CRUD operations for rubric level descriptions. These define score ranges and their meanings for each rubric item.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `RubricLevelDescRequest`

**Responses**:
- `200: Response`

---

#### GET `/api/v1/core/rubrics/`

**Rubric management with AI-assisted PDF import**

Manage marking rubrics with AI-powered PDF parsing and import functionality.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/rubrics/`

**Rubric management with AI-assisted PDF import**

Manage marking rubrics with AI-powered PDF parsing and import functionality.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `MarkingRubricRequest`

**Responses**:
- `201: Response`

---

#### POST `/api/v1/core/rubrics/import_from_pdf_with_ai/`

**Rubric management with AI-assisted PDF import**

Upload PDF rubric and auto-import using AI parsing

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `RubricUploadRequest`

**Responses**:
- `200: Response`

---

#### DELETE `/api/v1/core/rubrics/{id}/`

**Rubric management with AI-assisted PDF import**

Manage marking rubrics with AI-powered PDF parsing and import functionality.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/rubrics/{id}/`

**Rubric management with AI-assisted PDF import**

Manage marking rubrics with AI-powered PDF parsing and import functionality.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/rubrics/{id}/`

**Rubric management with AI-assisted PDF import**

Manage marking rubrics with AI-powered PDF parsing and import functionality.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedMarkingRubricRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/rubrics/{id}/`

**Rubric management with AI-assisted PDF import**

Manage marking rubrics with AI-powered PDF parsing and import functionality.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `MarkingRubricRequest`

**Responses**:
- `200: Response`

---

#### GET `/api/v1/core/rubrics/{id}/detail_with_items/`

**Rubric management with AI-assisted PDF import**

Get rubric with full structure (items + levels)

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

### Submissions

Student submission management

| Method | Endpoint | Summary | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/core/submissions/` | Submission management | API Key (sessionid) |
| POST | `/api/v1/core/submissions/` | Submission management | API Key (sessionid) |
| DELETE | `/api/v1/core/submissions/{submission_id}/` | Submission management | API Key (sessionid) |
| GET | `/api/v1/core/submissions/{submission_id}/` | Submission management | API Key (sessionid) |
| PATCH | `/api/v1/core/submissions/{submission_id}/` | Submission management | API Key (sessionid) |
| PUT | `/api/v1/core/submissions/{submission_id}/` | Submission management | API Key (sessionid) |

**Endpoint Details**

#### GET `/api/v1/core/submissions/`

**Submission management**

CRUD operations for essay submissions. Students submit their work for tasks, which can then receive feedback.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/submissions/`

**Submission management**

CRUD operations for essay submissions. Students submit their work for tasks, which can then receive feedback.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `SubmissionRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/submissions/{submission_id}/`

**Submission management**

CRUD operations for essay submissions. Students submit their work for tasks, which can then receive feedback.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/submissions/{submission_id}/`

**Submission management**

CRUD operations for essay submissions. Students submit their work for tasks, which can then receive feedback.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/submissions/{submission_id}/`

**Submission management**

CRUD operations for essay submissions. Students submit their work for tasks, which can then receive feedback.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedSubmissionRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/submissions/{submission_id}/`

**Submission management**

CRUD operations for essay submissions. Students submit their work for tasks, which can then receive feedback.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `SubmissionRequest`

**Responses**:
- `200: Response`

---

### Feedback

Feedback and evaluation management (Feedbacks, Feedback Items)

| Method | Endpoint | Summary | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/core/feedback-items/` | Feedback item management | API Key (sessionid) |
| POST | `/api/v1/core/feedback-items/` | Feedback item management | API Key (sessionid) |
| DELETE | `/api/v1/core/feedback-items/{feedback_item_id}/` | Feedback item management | API Key (sessionid) |
| GET | `/api/v1/core/feedback-items/{feedback_item_id}/` | Feedback item management | API Key (sessionid) |
| PATCH | `/api/v1/core/feedback-items/{feedback_item_id}/` | Feedback item management | API Key (sessionid) |
| PUT | `/api/v1/core/feedback-items/{feedback_item_id}/` | Feedback item management | API Key (sessionid) |
| GET | `/api/v1/core/feedbacks/` | Feedback management | API Key (sessionid) |
| POST | `/api/v1/core/feedbacks/` | Feedback management | API Key (sessionid) |
| DELETE | `/api/v1/core/feedbacks/{feedback_id}/` | Feedback management | API Key (sessionid) |
| GET | `/api/v1/core/feedbacks/{feedback_id}/` | Feedback management | API Key (sessionid) |
| PATCH | `/api/v1/core/feedbacks/{feedback_id}/` | Feedback management | API Key (sessionid) |
| PUT | `/api/v1/core/feedbacks/{feedback_id}/` | Feedback management | API Key (sessionid) |

**Endpoint Details**

#### GET `/api/v1/core/feedback-items/`

**Feedback item management**

CRUD operations for feedback items. Feedback items are individual scores and comments for each rubric criterion.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/feedback-items/`

**Feedback item management**

CRUD operations for feedback items. Feedback items are individual scores and comments for each rubric criterion.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `FeedbackItemRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/feedback-items/{feedback_item_id}/`

**Feedback item management**

CRUD operations for feedback items. Feedback items are individual scores and comments for each rubric criterion.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/feedback-items/{feedback_item_id}/`

**Feedback item management**

CRUD operations for feedback items. Feedback items are individual scores and comments for each rubric criterion.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/feedback-items/{feedback_item_id}/`

**Feedback item management**

CRUD operations for feedback items. Feedback items are individual scores and comments for each rubric criterion.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedFeedbackItemRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/feedback-items/{feedback_item_id}/`

**Feedback item management**

CRUD operations for feedback items. Feedback items are individual scores and comments for each rubric criterion.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `FeedbackItemRequest`

**Responses**:
- `200: Response`

---

#### GET `/api/v1/core/feedbacks/`

**Feedback management**

CRUD operations for feedback. Feedback is provided by lecturers/admins for student submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### POST `/api/v1/core/feedbacks/`

**Feedback management**

CRUD operations for feedback. Feedback is provided by lecturers/admins for student submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `FeedbackRequest`

**Responses**:
- `201: Response`

---

#### DELETE `/api/v1/core/feedbacks/{feedback_id}/`

**Feedback management**

CRUD operations for feedback. Feedback is provided by lecturers/admins for student submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `204: No response body`

---

#### GET `/api/v1/core/feedbacks/{feedback_id}/`

**Feedback management**

CRUD operations for feedback. Feedback is provided by lecturers/admins for student submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `None`

**Responses**:
- `200: Response`

---

#### PATCH `/api/v1/core/feedbacks/{feedback_id}/`

**Feedback management**

CRUD operations for feedback. Feedback is provided by lecturers/admins for student submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `PatchedFeedbackRequest`

**Responses**:
- `200: Response`

---

#### PUT `/api/v1/core/feedbacks/{feedback_id}/`

**Feedback management**

CRUD operations for feedback. Feedback is provided by lecturers/admins for student submissions.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `FeedbackRequest`

**Responses**:
- `200: Response`

---

### AI Feedback

| Method | Endpoint | Summary | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/ai-feedback/agent/workflows/run/` | Run the Essay Agent Dify workflow | API Key (sessionid) |

**Endpoint Details**

#### POST `/api/v1/ai-feedback/agent/workflows/run/`

**Run the Essay Agent Dify workflow**

Triggers the Essay Agent workflow using Dify. Provide `essay_question` and `essay_content`; the API automatically handles rubric upload. Optional `language` and `response_mode` (blocking or streaming) are supported. Uses EssayAgentInterface for provider-agnostic architecture.

**Authentication**: `API Key (sessionid)`, `API Key (Authorization)`

**Request Body**: `WorkflowRunRequestRequest`

**Responses**:
- `200: Dify workflow run metadata`

---

## Error Responses

All API errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| authentication_failed | 401 | Invalid or missing authentication |
| permission_denied | 403 | User lacks permission for this action |
| not_found | 404 | Resource not found |
| validation_error | 400 | Invalid request data |
| rate_limit_exceeded | 429 | Too many requests |

