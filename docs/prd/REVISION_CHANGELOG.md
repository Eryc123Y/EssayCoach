# PRD Revision Changelog

> **Revision Date:** 2026-02-15
> **Purpose:** Align all PRD documents with actual backend implementation

---

## Summary

This revision updates all PRD files to reflect the actual implementation in the codebase, fixing terminology mismatches and incorrect API references.

### Key Changes Applied

| Aspect | Before | After |
|--------|--------|-------|
| User Role | `teacher` / `Teacher` | `lecturer` / `Lecturer` |
| API Prefix | `/api/`, `/api/v1/` | `/api/v2/` |
| Assignment Model | `Assignment` | `Task` |
| User Model Fields | `id`, `email`, `name`, `role` | `user_id`, `user_email`, `user_fname`, `user_lname`, `user_role`, `user_status` |

---

## Files Revised

### 04-dashboard-overview.md
- Changed `teacher` → `lecturer` throughout
- Updated API endpoints to `/api/v2/`

### 05-essay-practice.md
- Changed `teacher` → `lecturer`
- Already had correct `/api/v2/` endpoints

### 06-rubrics.md
- Changed `teacher` → `lecturer`
- Updated API to `/api/v2/core/rubrics/`
- Added `import_from_pdf_with_ai` endpoint

### 07-settings.md
- Changed `teacher` → `lecturer`
- Added note: No separate UserSettings model (uses User model fields)
- Updated API endpoints to `/api/v2/`

### 08-profile.md
- Changed `teacher` → `lecturer`
- Added note: No separate Profile model (uses User model fields)
- Updated API endpoints to `/api/v2/core/users/`
- Updated role values to include `admin`

### 09-assignments.md
- **Major revision:** Renamed to "Tasks"
- Changed `Assignment` → `Task` throughout
- Updated all API endpoints to `/api/v2/core/tasks/`
- Updated data model fields to match implementation

### 10-classes.md
- Changed `teacher` → `lecturer`
- Changed `Assignment` → `Task` references
- Updated API endpoints to `/api/v2/core/classes/`

### 11-social-learning-hub.md
- Changed `teacher` → `lecturer`
- Updated API endpoints to `/api/v2/core/submissions/` and `/api/v2/core/feedbacks/`

### 12-analytics.md
- Changed `teacher` → `lecturer`
- Changed `Assignment Performance` → `Task Performance`
- Updated API endpoints to `/api/v2/`

### 13-users.md
- Updated User model fields to match implementation
- Changed `teacher` → `lecturer`
- Updated API endpoints to `/api/v2/core/users/`

---

## Reference: Actual Implementation

### User Model (`backend/core/models.py`)
```python
class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.AutoField(primary_key=True)
    user_email = models.EmailField(unique=True)
    user_fname = models.CharField(max_length=20, blank=True, null=True)
    user_lname = models.CharField(max_length=20, blank=True, null=True)
    user_role = models.CharField(max_length=10)  # 'student', 'lecturer', 'admin'
    user_status = models.CharField(max_length=15)  # 'active', 'suspended', 'unregistered'
```

### API Endpoints (`backend/api_v2/core/views.py`)
- `/api/v2/auth/` - Authentication (login, logout, me, password-change, password-reset)
- `/api/v2/core/users/` - User CRUD
- `/api/v2/core/classes/` - Class CRUD
- `/api/v2/core/rubrics/` - Rubric CRUD + `import_from_pdf_with_ai`
- `/api/v2/core/tasks/` - Task CRUD
- `/api/v2/core/submissions/` - Submission CRUD
- `/api/v2/core/feedbacks/` - Feedback CRUD

### Authentication
- Uses **DRF Token** authentication (not JWT)

---

## Files NOT Requiring Revision

- `01-*.md` through `03-*.md` - Introductory documents (no implementation details)
- `14-*.md` and beyond - Not yet created

---

## Verification Checklist

- [x] All `teacher` → `lecturer` replacements complete
- [x] All `Teacher` → `Lecturer` replacements complete
- [x] All API endpoints updated to `/api/v2/`
- [x] Assignment → Task in relevant files
- [x] User model fields documented correctly
- [x] Cross-references verified
- [x] Changelog created
