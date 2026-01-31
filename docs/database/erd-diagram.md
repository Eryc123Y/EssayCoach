# Database ERD Diagram
Generated: 2026-01-29 03:18:46
---

## 📊 Visual Schema Representation

The complete entity-relationship diagram for the EssayCoach database system is generated from the Django models.

> **Note**: This ERD is automatically generated from Django models during documentation build. Run `make docs-erd` or `make docs-generate` to regenerate.

## 🖼️ Database Schema Diagram

```mermaid
erDiagram
    %% django.contrib.contenttypes - ContentType
    ContentType {
        id AutoField PK
        permission ForeignKey FK "Permission.id"
        app_label CharField 
        model CharField 
    }

    %% django.contrib.auth - Permission
    Permission {
        id AutoField PK
        name CharField 
        content_type ForeignKey FK "ContentType.id"
        codename CharField 
    }

    %% django.contrib.auth - Group
    Group {
        id AutoField PK
        name CharField 
    }

    %% django.contrib.auth - User
    User {
        id AutoField PK
        password CharField 
        last_login DateTimeField NULL
        is_superuser BooleanField 
        username CharField 
        first_name CharField 
        last_name CharField 
        email CharField 
        is_staff BooleanField 
        is_active BooleanField 
        date_joined DateTimeField 
    }

    %% core - Class
    Class {
        class_id SmallAutoField PK
        enrollment ForeignKey FK "Enrollment.id"
        teachingassn ForeignKey FK "TeachingAssn.id"
        unit_id_unit ForeignKey FK "Unit.id"
        class_size SmallIntegerField 
    }

    %% core - Enrollment
    Enrollment {
        enrollment_id AutoField PK
        user_id_user ForeignKey FK "User.id"
        class_id_class ForeignKey FK "Class.id"
        unit_id_unit ForeignKey FK "Unit.id"
        enrollment_time DateTimeField 
    }

    %% core - Feedback
    Feedback {
        feedback_id AutoField PK
        feedbackitem ForeignKey FK "FeedbackItem.id"
        submission_id_submission OneToOneField FK "Submission.id"
        user_id_user ForeignKey FK "User.id"
    }

    %% core - FeedbackItem
    FeedbackItem {
        feedback_item_id AutoField PK
        feedback_id_feedback ForeignKey FK "Feedback.id"
        rubric_item_id_rubric_item ForeignKey FK "RubricItem.id"
        feedback_item_score SmallIntegerField 
        feedback_item_comment TextField NULL
        feedback_item_source CharField 
    }

    %% core - MarkingRubric
    MarkingRubric {
        rubric_id AutoField PK
        rubric_items ForeignKey FK "RubricItem.id"
        task ForeignKey FK "Task.id"
        user_id_user ForeignKey FK "User.id"
        rubric_create_time DateTimeField 
        rubric_desc CharField NULL
    }

    %% core - RubricItem
    RubricItem {
        rubric_item_id AutoField PK
        feedbackitem ForeignKey FK "FeedbackItem.id"
        level_descriptions ForeignKey FK "RubricLevelDesc.id"
        rubric_id_marking_rubric ForeignKey FK "MarkingRubric.id"
        rubric_item_name CharField 
        rubric_item_weight DecimalField 
    }

    %% core - RubricLevelDesc
    RubricLevelDesc {
        level_desc_id AutoField PK
        rubric_item_id_rubric_item ForeignKey FK "RubricItem.id"
        level_min_score SmallIntegerField 
        level_max_score SmallIntegerField 
        level_desc TextField 
    }

    %% core - Submission
    Submission {
        submission_id AutoField PK
        feedback OneToOneField FK "Feedback.id"
        submission_time DateTimeField 
        task_id_task ForeignKey FK "Task.id"
        user_id_user ForeignKey FK "User.id"
        submission_txt TextField 
    }

    %% core - Task
    Task {
        task_id AutoField PK
        submission ForeignKey FK "Submission.id"
        unit_id_unit ForeignKey FK "Unit.id"
        rubric_id_marking_rubric ForeignKey FK "MarkingRubric.id"
        task_publish_datetime DateTimeField 
        task_due_datetime DateTimeField 
    }

    %% core - TeachingAssn
    TeachingAssn {
        teaching_assn_id SmallAutoField PK
        user_id_user ForeignKey FK "User.id"
        class_id_class ForeignKey FK "Class.id"
    }

    %% core - Unit
    Unit {
        unit_id CharField PK
        class ForeignKey FK "Class.id"
        enrollment ForeignKey FK "Enrollment.id"
        task ForeignKey FK "Task.id"
        unit_name CharField 
        unit_desc TextField NULL
    }

    %% Relationships
    ContentType }o--{ Permission : "permission"
    Permission }o--{ ContentType : "content_type"
    Class }o--{ Enrollment : "enrollment"
    Class }o--{ TeachingAssn : "teachingassn"
    Class }o--{ Unit : "unit_id_unit"
    Enrollment }o--{ User : "user_id_user"
    Enrollment }o--{ Class : "class_id_class"
    Enrollment }o--{ Unit : "unit_id_unit"
    Feedback }o--{ FeedbackItem : "feedbackitem"
    Feedback ||--|| Submission : "submission_id_submission"
    Feedback }o--{ User : "user_id_user"
    FeedbackItem }o--{ Feedback : "feedback_id_feedback"
    FeedbackItem }o--{ RubricItem : "rubric_item_id_rubric_item"
    MarkingRubric }o--|| RubricItem : "rubric_items"
    MarkingRubric }o--{ Task : "task"
    MarkingRubric }o--{ User : "user_id_user"
    RubricItem }o--{ FeedbackItem : "feedbackitem"
    RubricItem }o--|| RubricLevelDesc : "level_descriptions"
    RubricItem }o--{ MarkingRubric : "rubric_id_marking_rubric"
    RubricLevelDesc }o--{ RubricItem : "rubric_item_id_rubric_item"
    Submission ||--|| Feedback : "feedback"
    Submission }o--{ Task : "task_id_task"
    Submission }o--{ User : "user_id_user"
    Task }o--{ Submission : "submission"
    Task }o--{ Unit : "unit_id_unit"
    Task }o--{ MarkingRubric : "rubric_id_marking_rubric"
    TeachingAssn }o--{ User : "user_id_user"
    TeachingAssn }o--{ Class : "class_id_class"
    Unit }o--{ Class : "class"
    Unit }o--{ Enrollment : "enrollment"
    Unit }o--{ Task : "task"
    User }o--{ Enrollment : "enrollment"
    User }o--{ Feedback : "feedback"
    User }o--{ MarkingRubric : "markingrubric"
    User }o--{ Submission : "submission"
    User }o--{ TeachingAssn : "teachingassn"
```

## 🔄 Regenerating the ERD

To regenerate this diagram:

```bash
# Option 1: Generate ERD only
make docs-erd

# Option 2: Generate all documentation including ERD
make docs-generate
```

This will run the documentation generator to create an updated ERD from the current Django models.
