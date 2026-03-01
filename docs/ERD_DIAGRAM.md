# EssayCoach 数据库 ERD 图

生成时间：2026-03-01 21:26:12

## 实体关系图

```mermaid
erDiagram
    %% EssayCoach Core Database Schema

    User {
        user_id int PK
        logentry int FK
        enrollment int FK
        feedback int FK
        markingrubric int FK
        deadline_extensions int FK
        granted_extensions int FK
        submission int FK
        teachingassn int FK
        userbadge int FK
        user_id AutoField
        user_email CharField
        user_fname CharField nullable
        user_lname CharField nullable
        user_role CharField nullable
        user_status CharField nullable
    }

    Class {
        class_id int PK
        enrollment int FK
        task int FK
        teachingassn int FK
        class_id SmallAutoField
        unit_id_unit int FK
        class_name CharField
        class_join_code CharField
        class_term CharField
        class_year PositiveSmallIntegerField
        class_status CharField
    }

    Unit {
        unit_id int PK
        class int FK
        enrollment int FK
        task int FK
        unit_id CharField
        unit_name CharField
        unit_desc TextField nullable
    }

    Enrollment {
        enrollment_id int PK
        enrollment_id AutoField
        user_id_user int FK
        class_id_class int FK
        unit_id_unit int FK
        enrollment_time DateTimeField
    }

    TeachingAssn {
        teachingassn_id int PK
        teaching_assn_id SmallAutoField
        user_id_user int FK
        class_id_class int FK
    }

    MarkingRubric {
        markingrubric_id int PK
        rubric_items int FK
        task int FK
        rubric_id AutoField
        user_id_user int FK
        rubric_create_time DateTimeField
        visibility CharField
    }

    RubricItem {
        rubricitem_id int PK
        feedbackitem int FK
        level_descriptions int FK
        rubric_item_id AutoField
        rubric_id_marking_rubric int FK
        rubric_item_name CharField
        rubric_item_weight DecimalField
    }

    RubricLevelDesc {
        rubricleveldesc_id int PK
        level_desc_id AutoField
        rubric_item_id_rubric_item int FK
        level_min_score SmallIntegerField
        level_max_score SmallIntegerField
        level_desc TextField
    }

    Task {
        task_id int PK
        deadline_extensions int FK
        submission int FK
        task_id AutoField
        unit_id_unit int FK
        rubric_id_marking_rubric int FK
        task_due_datetime DateTimeField
        task_title CharField
        class_id_class int FK
        task_status CharField
    }

    Submission {
        submission_id int PK
        feedback int FK
        submission_id AutoField
        submission_time DateTimeField
        task_id_task int FK
        user_id_user int FK
        submission_txt TextField
    }

    Feedback {
        feedback_id int PK
        feedbackitem int FK
        feedback_id AutoField
        submission_id_submission int FK
        user_id_user int FK
    }

    FeedbackItem {
        feedbackitem_id int PK
        feedback_item_id AutoField
        feedback_id_feedback int FK
        rubric_item_id_rubric_item int FK
        feedback_item_score SmallIntegerField
        feedback_item_source CharField
    }

    DeadlineExtension {
        deadlineextension_id int PK
        extension_id AutoField
        task_id_task int FK
        user_id_user int FK
        original_deadline DateTimeField
        extended_deadline DateTimeField
        reason TextField
        granted_by int FK
    }

    Badge {
        badge_id int PK
        userbadge int FK
        badge_id AutoField
        name CharField
        description CharField
        icon CharField
        criteria JSONField
    }

    UserBadge {
        userbadge_id int PK
        user_badge_id AutoField
        user_id_user int FK
        badge_id_badge int FK
        earned_at DateTimeField
    }

    %% Core Relationships
    User --|o LogEntry: logentry
    User --|o Enrollment: enrollment
    User --|o Feedback: feedback
    User --|o MarkingRubric: markingrubric
    User --|o DeadlineExtension: deadline_extensions
    User --|o DeadlineExtension: granted_extensions
    User --|o Submission: submission
    User --|o TeachingAssn: teachingassn
    User --|o UserBadge: userbadge
    Class --|o Enrollment: enrollment
    Class --|o Task: task
    Class --|o TeachingAssn: teachingassn
    Class --|o Unit: unit_id_unit
    Unit --|o Class: class
    Unit --|o Enrollment: enrollment
    Unit --|o Task: task
    Enrollment --|o User: user_id_user
    Enrollment --|o Class: class_id_class
    Enrollment --|o Unit: unit_id_unit
    TeachingAssn --|o User: user_id_user
    TeachingAssn --|o Class: class_id_class
    MarkingRubric --|o RubricItem: rubric_items
    MarkingRubric --|o Task: task
    MarkingRubric --|o User: user_id_user
    RubricItem --|o FeedbackItem: feedbackitem
    RubricItem --|o RubricLevelDesc: level_descriptions
    RubricItem --|o MarkingRubric: rubric_id_marking_rubric
    RubricLevelDesc --|o RubricItem: rubric_item_id_rubric_item
    Task --|o DeadlineExtension: deadline_extensions
    Task --|o Submission: submission
    Task --|o Unit: unit_id_unit
    Task --|o MarkingRubric: rubric_id_marking_rubric
    Task --|o Class: class_id_class
    Submission --|| Feedback: feedback
    Submission --|o Task: task_id_task
    Submission --|o User: user_id_user
    Feedback --|o FeedbackItem: feedbackitem
    Feedback --|| Submission: submission_id_submission
    Feedback --|o User: user_id_user
    FeedbackItem --|o Feedback: feedback_id_feedback
    FeedbackItem --|o RubricItem: rubric_item_id_rubric_item
    DeadlineExtension --|o Task: task_id_task
    DeadlineExtension --|o User: user_id_user
    DeadlineExtension --|o User: granted_by
    Badge --|o UserBadge: userbadge
    UserBadge --|o User: user_id_user
    UserBadge --|o Badge: badge_id_badge
```


## 数据表说明


| 表名 | 说明 |
|------|------|
| User | 用户表 (学生/讲师/管理员) |
| Class | 班级表 |
| Unit | 课程单元表 |
| Enrollment | 学生选课记录 |
| TeachingAssn | 讲师-班级分配 |
| MarkingRubric | 评分标准 |
| RubricItem | 评分维度 |
| RubricLevelDesc | 评分等级描述 |
| Task | 作业任务 |
| Submission | 学生提交 |
| Feedback | AI 反馈 |
| FeedbackItem | 反馈明细 (每个评分维度) |
| DeadlineExtension | 延期申请 |
| Badge | 成就徽章 |
| UserBadge | 用户获得的徽章 |

