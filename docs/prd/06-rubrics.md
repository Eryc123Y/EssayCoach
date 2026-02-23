# Rubrics

> **Status:** Planned
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Rubrics page is where lecturers create, manage, and organize grading rubrics for essay tasks. Rubrics define the criteria and scoring standards that the AI engine uses to evaluate student submissions. Students can also view public rubrics and create private rubrics for self-assessment.

### Current Implementation Status
- **Already Implemented:** Upload PDF rubrics, list rubrics, view rubric details, delete rubrics
- **Needs Implementation:** Visibility (public/private), student access to view rubrics, tabbed interface

### Product Context
- **Target User:** Lecturers (primary), Students (secondary), Admins (tertiary)
- **Role:** Lecturer, Student, and Admin
- **Parent Feature:** Dashboard (unified route for all roles)
- **Dependencies:** Essay submissions, AI feedback engine

---

## 2. Target Users & User Stories

### Primary Users

| Persona | Role | Goals |
|---------|------|-------|
| **Writing Lecturer** | Course Instructor | Create detailed rubrics for essay tasks |
| **Department Head** | Curriculum Manager | Standardize rubrics across courses |
| **Student** | Learner | View rubrics for assignment guidance, create personal study rubrics |
| **Admin** | Platform Manager | Create institution-wide rubric templates |

### User Stories

```
As a lecturer,
I want to create a new rubric with multiple criteria,
So that I can define clear grading standards for my tasks.

As a lecturer,
I want to set weightage for each criterion,
So that I can emphasize certain skills over others in grading.

As a lecturer,
I want to copy an existing rubric and modify it,
So that I don't have to create similar rubrics from scratch.

As a lecturer,
I want to preview how my rubric will look to students,
So that I can ensure clarity before publishing.

As a lecturer,
I want to import rubric templates from the institution,
So that I can use standardized rubrics in my courses.

As a lecturer,
I want to see which tasks use a specific rubric,
So that I can understand the impact before making changes.

As a student,
I want to view rubrics for my assignments,
So that I understand the grading criteria and expectations.

As a student,
I want to create a private rubric for self-assessment,
So that I can practice evaluating my own work without others seeing it.
```

---

## 3. Functional Requirements

### 3.1 Rubric Management

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Create Rubric (PDF) | Upload PDF and let AI extract rubric criteria | Required |
| Create Rubric (Manual) | Fill form to customize rubric manually | Required |
| Create Private Rubric | Create rubric visible only to self (students/lecturers) | Required |
| Create Public Rubric | Create rubric visible to students (lecturer/admin only) | Required |
| Edit Rubric | Modify existing rubric criteria and weights | Required |
| Delete Rubric | Remove rubric (with confirmation if in use) | Required |
| Duplicate Rubric | Copy existing rubric as template for new one | Required |
| Set Visibility | Toggle rubric between public and private | Required |

### 3.2 Rubric Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CREATE NEW RUBRIC                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────┐    ┌─────────────────────┐      │
│   │   📄 Upload PDF     │    │   ✏️  Create Manually │      │
│   │                     │    │                     │      │
│   │  Drop a rubric     │    │  Start from scratch │      │
│   │  PDF and let AI    │    │  and build your own │      │
│   │  extract criteria  │    │  criteria & levels  │      │
│   └─────────────────────┘    └─────────────────────┘      │
│                                                              │
│   Student: "Create Private" (only option)                   │
│   Lecturer: "Create Public" or "Create Private"             │
│   Admin: "Create Public" or "Create Private"                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Criteria Management

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Add Criterion | Add new criterion with description and levels | Required |
| Edit Criterion | Modify criterion name, description, levels | Required |
| Delete Criterion | Remove criterion from rubric | Required |
| Reorder Criteria | Drag-and-drop to reorder criteria | Required |
| Set Weights | Assign percentage weight to each criterion | Required |
| Add Levels | Define performance levels (e.g., Excellent, Good, Fair, Poor) | Required |
| Set Point Values | Assign point values to each level | Required |

### 3.4 Preview & Validation

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Student Preview | View rubric as students will see it | Required |
| Validation | Ensure rubric has valid weights (total 100%) | Required |
| Sample Scoring | Test rubric with sample essay | Optional |

### 3.5 Visibility Management

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Set Public | Make rubric visible to other lecturers and students | Required (Lecturer/Admin) |
| Set Private | Make rubric visible only to creator | Required (All users) |
| View Public Rubrics | Browse rubrics shared by lecturers | Required (Students) |
| Filter by Visibility | Filter rubrics list by public/private | Required |

### 3.6 User-Specific Behavior

| User Role | Can View Rubrics | Can Create Private | Can Create Public | Can Edit Own | Can Delete Own |
|-----------|------------------|--------------------|-------------------|--------------|----------------|
| Student | ✓ | ✓ (for practice) | ✗ | ✓ (private only) | ✓ (private only) |
| Lecturer | ✓ | ✓ | ✓ | ✓ (all own) | ✓ (all own) |
| Admin | ✓ | ✓ | ✓ | ✓ (all) | ✓ (all) |

---

## 4. UI/UX Requirements

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header: "Rubrics"                                          │
│ [+ Create New Rubric]                           [Search]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           CREATE NEW RUBRIC (Modal)                 │    │
│  │                                                      │    │
│  │   ┌──────────────────┐   ┌──────────────────┐     │    │
│  │   │   📄 Upload PDF  │   │  ✏️  Create Manually │     │    │
│  │   │                  │   │                  │     │    │
│  │   │  Drop a rubric   │   │  Start from     │     │    │
│  │   │  PDF and let AI │   │  scratch and     │     │    │
│  │   │  extract criteria│   │  build your     │     │    │
│  │   │                  │   │  own criteria   │     │    │
│  │   └──────────────────┘   └──────────────────┘     │    │
│  │                                                      │    │
│  │   Visibility: ○ Public  ● Private                  │    │
│  │   (Student: Private only / Lecturer: Public/Private)│    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Your Rubrics                              [Filter] │    │
│  │ ┌──────┬───────────┬───────────┬─────────┬──────┐ │    │
│  │ │ Name │ Created   │ Visibility│ Status  │Actns │ │    │
│  │ ├──────┼───────────┼───────────┼─────────┼──────┤ │    │
│  │ │ ...  │ ...      │ 🔓 Public │ Active  │ ...  │ │    │
│  │ │ ...  │ ...      │ 🔒 Private│ Draft   │ ...  │ │    │
│  │ └──────┴───────────┴───────────┴─────────┴──────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Components

| Component | Status | Description |
|-----------|--------|-------------|
| **Rubric List** | ✅ Implemented | Table view of rubrics |
| **RubricUpload** | ✅ Implemented | PDF upload with AI import |
| **Rubric Detail Page** | ✅ Implemented | Accordion UI for items/levels |
| **Create Rubric Modal** | ⬜ Needed | Modal with PDF/Manual options |
| **Manual Form Builder** | ⬜ Needed | Form to manually create rubric |
| **Visibility Toggle** | ⬜ Needed | Radio/checkbox for public/private |

### 4.3 Navigation Changes Required

**Current:** Rubrics in `frontend/src/constants/data.ts` restricted to `['lecturer', 'admin']`

**Needed:** Allow students to access Rubrics page (same route)

---

## 5. Data Model

### Existing Implementation (backend/core/models.py)

The current database schema does NOT have a visibility field. It must be added.

```python
# MarkingRubric - The main rubric entity (EXISTING + NEW FIELD)
class MarkingRubric(models.Model):
    rubric_id = models.AutoField(primary_key=True)
    user_id_user = models.ForeignKey("User", on_delete=models.CASCADE)  # Creator
    rubric_create_time = models.DateTimeField(auto_now_add=True)
    rubric_desc = models.CharField(max_length=100, blank=True, null=True)
    # ===========================================================
    # NEW FIELD TO ADD: visibility
    # ===========================================================
    visibility = models.CharField(
        max_length=10,
        choices=[('public', 'Public'), ('private', 'Private')],
        default='private'
    )

# RubricItem - Criterion under a rubric (EXISTING)
class RubricItem(models.Model):
    rubric_item_id = models.AutoField(primary_key=True)
    rubric_id_marking_rubric = models.ForeignKey(MarkingRubric, on_delete=models.CASCADE)
    rubric_item_name = models.CharField(max_length=50)
    rubric_item_weight = models.DecimalField(max_digits=3, decimal_places=1)  # xx.x%

# RubricLevelDesc - Performance levels (EXISTING)
class RubricLevelDesc(models.Model):
    level_desc_id = models.AutoField(primary_key=True)
    rubric_item_id_rubric_item = models.ForeignKey(RubricItem, on_delete=models.CASCADE)
    level_min_score = models.SmallIntegerField()
    level_max_score = models.SmallIntegerField()
    level_desc = models.TextField()
```

### Existing API Schemas (backend/api_v2/core/schemas.py)

Current schemas need to be extended with visibility field:

```python
# EXISTING - MarkingRubricIn (needs visibility field added)
class MarkingRubricIn(BaseModel):
    rubric_desc: str | None = Field(None, max_length=100)
    # ADD: visibility: str | None = Field('private', pattern='^(public|private)$')

# EXISTING - MarkingRubricOut (needs visibility field added)
class MarkingRubricOut(ModelSchema):
    class Config:
        model = MarkingRubric
        include = ['rubric_id', 'user_id_user', 'rubric_create_time', 'rubric_desc']
        # ADD: 'visibility'
```

### Existing Frontend Types (frontend/src/service/api/v2/types.ts)

Current interfaces need visibility field added:

```typescript
// EXISTING - RubricListItem (needs visibility added)
export interface RubricListItem {
  rubric_id: number;
  rubric_desc: string;
  rubric_create_time: string;
  // ADD: visibility?: 'public' | 'private';
}

// EXISTING - RubricDetail (needs visibility added)
export interface RubricDetail extends RubricListItem {
  rubric_items: RubricItem[];
  // ADD: visibility?: 'public' | 'private';
}
```

---

## 6. API Endpoints

### Existing Endpoints (Already Implemented)

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| GET | `/api/v2/core/rubrics/` | ✅ Implemented | List user's rubrics |
| POST | `/api/v2/core/rubrics/` | ✅ Implemented | Create new rubric |
| GET | `/api/v2/core/rubrics/{rubric_id}/` | ✅ Implemented | Get rubric details |
| GET | `/api/v2/core/rubrics/{rubric_id}/detail/` | ✅ Implemented | Get rubric with items & levels |
| GET | `/api/v2/core/rubrics/{rubric_id}/detail_with_items/` | ✅ Implemented | Alias for detail |
| PUT | `/api/v2/core/rubrics/{rubric_id}/` | ✅ Implemented | Update rubric |
| DELETE | `/api/v2/core/rubrics/{rubric_id}/` | ✅ Implemented | Delete rubric |
| POST | `/api/v2/core/rubrics/import_from_pdf_with_ai/` | ✅ Implemented | Import rubric from PDF |

### New Endpoints to Implement

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/core/rubrics/{rubric_id}/visibility` | Toggle rubric visibility (public/private) |
| GET | `/api/v2/core/rubrics/public/` | List public rubrics (for students) |
| POST | `/api/v2/core/rubrics/{rubric_id}/duplicate` | Duplicate rubric |

### Filter Parameters (Existing)

The list endpoint supports filtering:
- `user_id_user` - Filter by creator
- `rubric_desc` - Search by description (icontains)
- **NEW:** `visibility` - Filter by 'public' or 'private'

---

## 7. Permissions

| Action | Student | Lecturer | Admin |
|--------|---------|----------|-------|
| View own rubrics (private) | ✓ | ✓ | ✓ |
| View own rubrics (public) | - | ✓ | ✓ |
| View public rubrics | ✓ | ✓ | ✓ |
| View all rubrics | ✗ | ✗ | ✓ |
| Create private rubric | ✓ (for practice) | ✓ | ✓ |
| Create public rubric | ✗ | ✓ | ✓ |
| Edit own private rubrics | ✓ | ✓ | ✓ |
| Edit own public rubrics | ✗ | ✓ | ✓ |
| Edit all rubrics | ✗ | ✗ | ✓ |
| Delete own private rubrics | ✓ | ✓ | ✓ |
| Delete own public rubrics | ✗ | ✓ | ✓ |
| Delete all rubrics | ✗ | ✗ | ✓ |
| Manage all rubrics | ✗ | ✗ | ✓ |

---

## 8. Acceptance Criteria

### Rubric Management
- [ ] Lecturer can create new rubric with PDF upload (AI extraction)
- [ ] Lecturer can create new rubric manually (form builder)
- [ ] Lecturer can create public rubric visible to students
- [ ] Lecturer can create private rubric
- [ ] Student can create private rubric for self-practice
- [ ] Student CANNOT create public rubric
- [ ] Lecturer/Student can add multiple criteria to rubric
- [ ] Lecturer/Student can set weightage for each criterion
- [ ] Lecturer/Student can define performance levels with points
- [ ] Lecturer/Student can duplicate existing rubrics
- [ ] Lecturer/Student can set rubric visibility (public/private)
- [ ] Lecturer/Student can filter rubrics by visibility

### Create Rubric Flow
- [ ] "Create New Rubric" button opens modal
- [ ] Modal shows two options: "Upload PDF" and "Create Manually"
- [ ] PDF upload triggers AI extraction
- [ ] Manual form allows building criteria from scratch
- [ ] Visibility toggle in modal (Student: Private only / Lecturer: Public or Private)

### UI/UX
- [ ] Rubric list displays as table (existing) with visibility badges (NEW)
- [ ] "Create New Rubric" button opens modal with PDF/Manual options
- [ ] Modal shows visibility options based on user role
- [ ] Preview mode shows rubric as students see it
- [ ] Mobile responsive layout works correctly (existing)
- [ ] Validation errors displayed clearly
- [ ] Private rubrics are visually distinguished (e.g., lock icon)
- [ ] Public rubrics show visibility badge
- [ ] Students cannot see "Create Public" option
- [ ] Lecturers can toggle visibility when creating rubric

---

## 9. Implementation Summary

### Phase 1: Backend Changes (Required)
1. **Add visibility field to MarkingRubric model** (`backend/core/models.py`)
2. **Run migration** to add field to database
3. **Update API schemas** to include visibility field (`backend/api_v2/core/schemas.py`)
4. **Add new endpoints:**
   - `POST /api/v2/core/rubrics/{id}/visibility` - Toggle visibility
   - `GET /api/v2/core/rubrics/public/` - List public rubrics

### Phase 2: Frontend Changes (Required)
1. **Update navigation** (`frontend/src/constants/data.ts`) - Allow students to access Rubrics
2. **Update types** to include visibility field
3. **Create Rubric Modal** - Add modal with PDF/Manual options
4. **Manual Form Builder** - Add form to create rubric from scratch
5. **Add visibility toggle** UI in modal
6. **Update RubricsClient** to show visibility badges and filter

### Phase 3: Testing (Required)
1. Test student can view public rubrics
2. Test student can create private rubric
3. Test student CANNOT create public rubric
4. Test lecturer can create public/private rubrics via PDF upload
5. Test lecturer can create public/private rubrics via manual form
6. Test visibility toggle works correctly

---

## MVP Boundary

### In Scope (MVP)
- Single "Create Rubric" entry with two creation modes: PDF import (AI extraction) and manual form builder
- Role constraints: students can create private practice rubrics only; lecturers/admin can create public or private
- Rubric list/detail/delete and visibility-aware filtering aligned with current rubric endpoints

### Out of Scope (Post-MVP)
- Department/institution template marketplace
- Cross-org rubric sharing workflows
- AI auto-improvement suggestions for existing rubrics

### Current Implementation Alignment
- Core rubric CRUD and PDF import endpoints already exist; visibility/public-feed additions remain planned.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Rubric list fetch | Center loader/skeleton list |
| PDF import processing | Blocking upload progress and extraction status |
| Manual save | Disable submit + inline spinner |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Unauthorized access | Please login to view rubrics. | Redirect to sign-in |
| List fetch failure | Failed to load rubrics. | Retry fetch |
| Delete failure | Failed to delete rubric. | Retry/cancel |
| Invalid weight total | Total rubric weight must equal 100%. | Highlight invalid rows |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| No rubrics | No rubrics yet. Create your first rubric. | Create Rubric CTA |
| No public rubrics for student filter | No public rubrics available yet. | Switch filter / clear search |

