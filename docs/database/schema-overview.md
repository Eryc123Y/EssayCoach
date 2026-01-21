# Database Design

## 📊 Schema Overview

The EssayCoach database is designed as a normalized PostgreSQL schema supporting essay submissions, AI feedback, user management, and educational analytics. The development environment uses the PostgreSQL superuser for simplified setup and management.

## 🗂️ Database Schema Diagram

The current database schema is visualized below:

![Database Schema](../DB/DB-V2.svg)

## 🏗️ Core Entities

### Users and Authentication
- **Users**: Custom `public."user"` table aligned with Django auth fields (password/last_login/is_active/is_staff/is_superuser/date_joined) and business fields (email, first/last name, role, status). Managed via `backend/core/models.py`.
- **Groups/Permissions**: Django-native groups and permissions via `core_user_groups` and `core_user_user_permissions`.
- **Roles**: Student, Lecturer, Admin represented by groups (legacy `user_role` retained and validated via constraints).
- **Authentication**: Token-based authentication (DRF Token Authentication).

### Educational Structure
- **Unit**: Academic units/courses.
- **Class**: Classes belonging to units.
- **Enrollment**: Student enrollments in classes/units.
- **TeachingAssn**: Lecturer assignments to classes.

### Essay Management & Assessment
- **Task**: Assignments created by lecturers.
- **Submission**: Student essay submissions.
- **MarkingRubric**: Assessment criteria.
- **RubricItem**: Individual criteria within a rubric.
- **RubricLevelDesc**: Descriptions for score levels.
- **Feedback**: Feedback on submissions.
- **FeedbackItem**: Scores and comments for specific rubric items.

## 🔄 Relationships and Constraints

### Primary Relationships (selected)
```sql
-- User to Submissions (One-to-Many)
public."user".user_id → submission.user_id_user

-- User to Groups (Many-to-Many)
public."user".user_id ↔ core_user_groups(user_id, group_id) ↔ auth_group.id

-- Unit to Classes (One-to-Many)
unit.unit_id → class.unit_id_unit

-- Task to MarkingRubric (Many-to-One)
task.rubric_id_marking_rubric → marking_rubric.rubric_id
```

### Foreign Key Constraints
- Referential integrity enforced via Django models (`on_delete` rules).
- `CASCADE` deletes used where appropriate (e.g., deleting a User deletes their Submissions).
- `RESTRICT` used to prevent accidental deletion of critical data (e.g., cannot delete a Unit if it has Tasks).

### Check Constraints
Defined in `backend/core/models.py` using `Meta.constraints`:
- `class_size_ck`: `class_size >= 0`
- `user_role_ck`: `user_role IN ('student', 'lecturer', 'admin')`
- `user_status_ck`: `user_status IN ('active', 'suspended', 'unregistered')`
- `item_weight_ck`: `rubric_item_weight > 0`
- `min_max_ck`: `level_min_score >= 0 AND level_max_score >= 0 AND level_min_score <= level_max_score`
- `task_publish_time_task_due_time_ck`: `task_publish_datetime < task_due_datetime`
- `feedback_item_source_ck`: `feedback_item_source IN ('ai', 'human', 'revised')`

**Special Note on `min_max_ck` Constraint**:
The `RubricLevelDesc` table allows `level_min_score <= level_max_score` (not strictly less than), which enables "No submission" levels where both scores are equal (e.g., 0-0). This is a valid educational assessment practice supported by major rubric systems (IB, AP, university standards, Turnitin, Canvas). The constraint enforces `<=` to allow equality while still preventing invalid ranges where `min > max`. Python validation in `rubric_manager.py` ensures equal scores are only used for legitimate "No submission" cases.

## 📈 Performance Optimizations

### Indexes
Django automatically creates indexes for primary keys and foreign keys. Additional indexes can be defined in `Meta.indexes` if needed.

### Triggers and Functions
Database triggers are used to maintain denormalized data for performance:
- `trg_increment_class_size` / `trg_decrement_class_size`: Automatically update `class.class_size` when enrollments change.
- Implemented via migration `backend/core/migrations/0002_triggers.py`.

## 🔄 Migration Strategy

### Schema Evolution
1. **Django Migrations**: All schema changes are managed via `python manage.py makemigrations` and `migrate`.
2. **Managed Models**: All models are `managed = True`, making Django the single source of truth.
3. **Data Seeding**: Development data is populated via `python manage.py seed_db` (replacing SQL scripts).

### Version Control
- Migration files are committed to the repository.
- Review process ensures migrations are safe and reversible.

## 🛡️ Data Security

### Encryption
- Password hashing with Django's default algorithm (PBKDF2).
- Authentication tokens generated securely.

### Access Control
- API endpoints secured with DRF permissions (`IsAuthenticated`, etc.).
- Role-based access control logic in views and serializers.

## 🧪 Testing Strategy

### Database Testing
- **Unit Tests**: `backend/auth/tests.py` and others test model validation and API logic.
- **Test Database**: Django automatically creates and destroys a test database for each run, ensuring isolation.
- **Schema Validation**: Tests verify that constraints and relationships are enforced.

## 📊 Monitoring and Maintenance

### Health Checks
- Standard PostgreSQL monitoring tools.
- Django health check endpoints (to be implemented).

### Optimization
- Query optimization using `select_related` and `prefetch_related` in Django views.
