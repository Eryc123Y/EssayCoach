# EssayCoach 数据库表结构详解

生成时间：2026-03-01 21:26:28

## Class (`class`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `enrollment` | ForeignKey |  | ✅ | - | - | `Enrollment` | CASCADE |
| `task` | ForeignKey |  | ✅ | - | - | `Task` | CASCADE |
| `teachingassn` | ForeignKey |  | ✅ | - | - | `TeachingAssn` | CASCADE |
| `class_id` | SmallAutoField | ✅ |  | - | - | - | - |
| `unit_id_unit` | ForeignKey |  |  | - | - | `Unit` | - |
| `class_name` | CharField |  |  | 100 | - | - | - |
| `class_desc` | TextField |  | ✅ | - | - | - | - |
| `class_join_code` | CharField |  |  | 10 | - | - | - |
| `class_term` | CharField |  |  | 20 | full_year | - | - |
| `class_year` | PositiveSmallIntegerField |  |  | - | - | - | - |
| `class_status` | CharField |  |  | 20 | active | - | - |
| `class_archived_at` | DateTimeField |  | ✅ | - | - | - | - |
| `class_size` | SmallIntegerField |  |  | - | - | - | - |

### 元数据

- **表注释**: A table for class entity
- **排序**: 未指定

### 约束

- `class_size_ck`: <CheckConstraint: check=(AND: ('class_size__gte', 0)) name='class_size_ck'>
- `class_status_ck`: <CheckConstraint: check=(AND: ('class_status__in', ['active', 'archived'])) name='class_status_ck'>
- `class_year_range_ck`: <CheckConstraint: check=(AND: ('class_year__gte', 2000), ('class_year__lte', 2100)) name='class_year_range_ck'>

### 索引

- `class_unit_idx`: fields=['unit_id_unit']
- `class_join_code_idx`: fields=['class_join_code']

---

## Enrollment (`enrollment`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `enrollment_id` | AutoField | ✅ |  | - | - | - | - |
| `user_id_user` | ForeignKey |  |  | - | - | `User` | - |
| `class_id_class` | ForeignKey |  |  | - | - | `Class` | - |
| `unit_id_unit` | ForeignKey |  |  | - | - | `Unit` | - |
| `enrollment_time` | DateTimeField |  |  | - | - | - | - |

### 元数据

- **表注释**: The enrollment of student to a specific class. A student can only have one enrollment to one class of one unit anytime.
- **排序**: 未指定

### 约束

- `user_id_class_id_unit_id_uq`: <UniqueConstraint: fields=('user_id_user', 'class_id_class', 'unit_id_unit') name='user_id_class_id_unit_id_uq'>

---

## Feedback (`feedback`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `feedbackitem` | ForeignKey |  | ✅ | - | - | `FeedbackItem` | CASCADE |
| `feedback_id` | AutoField | ✅ |  | - | - | - | - |
| `submission_id_submission` | OneToOneField |  |  | - | - | `Submission` | - |
| `user_id_user` | ForeignKey |  |  | - | - | `User` | - |

### 元数据

- **表注释**: 无
- **排序**: 未指定

---

## FeedbackItem (`feedback_item`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `feedback_item_id` | AutoField | ✅ |  | - | - | - | - |
| `feedback_id_feedback` | ForeignKey |  |  | - | - | `Feedback` | - |
| `rubric_item_id_rubric_item` | ForeignKey |  |  | - | - | `RubricItem` | - |
| `feedback_item_score` | SmallIntegerField |  |  | - | - | - | - |
| `feedback_item_comment` | TextField |  | ✅ | - | - | - | - |
| `feedback_item_source` | CharField |  |  | 10 | - | - | - |

### 元数据

- **表注释**: A section in the feedback as per the rubric
- **排序**: 未指定

### 约束

- `feedback_id_rubric_item_id_uq`: <UniqueConstraint: fields=('feedback_id_feedback', 'rubric_item_id_rubric_item') name='feedback_id_rubric_item_id_uq'>
- `feedback_item_source_ck`: <CheckConstraint: check=(AND: ('feedback_item_source__in', ['ai', 'human', 'revised'])) name='feedback_item_source_ck'>

---

## MarkingRubric (`marking_rubric`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `rubric_items` | ForeignKey |  | ✅ | - | - | `RubricItem` | CASCADE |
| `task` | ForeignKey |  | ✅ | - | - | `Task` | CASCADE |
| `rubric_id` | AutoField | ✅ |  | - | - | - | - |
| `user_id_user` | ForeignKey |  |  | - | - | `User` | - |
| `rubric_create_time` | DateTimeField |  |  | - | - | - | - |
| `rubric_desc` | CharField |  | ✅ | 100 | - | - | - |
| `visibility` | CharField |  |  | 10 | private | - | - |

### 元数据

- **表注释**: entity for a marking rubric. A marking rubric has many items.
- **排序**: 未指定

### 索引

- `marking_rubric_visibility_idx`: fields=['visibility']

---

## RubricItem (`rubric_item`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `feedbackitem` | ForeignKey |  | ✅ | - | - | `FeedbackItem` | CASCADE |
| `level_descriptions` | ForeignKey |  | ✅ | - | - | `RubricLevelDesc` | CASCADE |
| `rubric_item_id` | AutoField | ✅ |  | - | - | - | - |
| `rubric_id_marking_rubric` | ForeignKey |  |  | - | - | `MarkingRubric` | - |
| `rubric_item_name` | CharField |  |  | 50 | - | - | - |
| `rubric_item_weight` | DecimalField |  |  | - | - | - | - |

### 元数据

- **表注释**: An item(dimension) under one rubric
- **排序**: 未指定

### 约束

- `item_weight_ck`: <CheckConstraint: check=(AND: ('rubric_item_weight__gt', 0)) name='item_weight_ck'>

---

## RubricLevelDesc (`rubric_level_desc`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `level_desc_id` | AutoField | ✅ |  | - | - | - | - |
| `rubric_item_id_rubric_item` | ForeignKey |  |  | - | - | `RubricItem` | - |
| `level_min_score` | SmallIntegerField |  |  | - | - | - | - |
| `level_max_score` | SmallIntegerField |  |  | - | - | - | - |
| `level_desc` | TextField |  |  | - | - | - | - |

### 元数据

- **表注释**: The detailed description to each of the score range under a rubric item under a rubric.
- **排序**: 未指定

### 约束

- `min_max_ck`: <CheckConstraint: check=(AND: ('level_min_score__gte', 0), ('level_max_score__gte', 0), ('level_min_score__lte', F(level_max_score))) name='min_max_ck'>

---

## DeadlineExtension (`deadline_extension`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `extension_id` | AutoField | ✅ |  | - | - | - | - |
| `task_id_task` | ForeignKey |  |  | - | - | `Task` | - |
| `user_id_user` | ForeignKey |  |  | - | - | `User` | - |
| `original_deadline` | DateTimeField |  |  | - | - | - | - |
| `extended_deadline` | DateTimeField |  |  | - | - | - | - |
| `reason` | TextField |  |  | - | - | - | - |
| `granted_by` | ForeignKey |  |  | - | - | `User` | - |
| `created_at` | DateTimeField |  |  | - | - | - | - |

### 元数据

- **表注释**: Per-student deadline extensions for tasks
- **排序**: 未指定

### 约束

- `task_user_extension_uq`: <UniqueConstraint: fields=('task_id_task', 'user_id_user') name='task_user_extension_uq'>
- `extension_after_original_ck`: <CheckConstraint: check=(AND: ('extended_deadline__gt', F(original_deadline))) name='extension_after_original_ck'>

### 索引

- `extension_task_idx`: fields=['task_id_task']
- `extension_user_idx`: fields=['user_id_user']

---

## Submission (`submission`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `feedback` | OneToOneField |  | ✅ | - | - | `Feedback` | CASCADE |
| `submission_id` | AutoField | ✅ |  | - | - | - | - |
| `submission_time` | DateTimeField |  |  | - | - | - | - |
| `task_id_task` | ForeignKey |  |  | - | - | `Task` | - |
| `user_id_user` | ForeignKey |  |  | - | - | `User` | - |
| `submission_txt` | TextField |  |  | - | - | - | - |

### 元数据

- **表注释**: A weak entity for task submissions.
- **排序**: 未指定

---

## Task (`task`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `deadline_extensions` | ForeignKey |  | ✅ | - | - | `DeadlineExtension` | CASCADE |
| `submission` | ForeignKey |  | ✅ | - | - | `Submission` | CASCADE |
| `task_id` | AutoField | ✅ |  | - | - | - | - |
| `unit_id_unit` | ForeignKey |  |  | - | - | `Unit` | - |
| `rubric_id_marking_rubric` | ForeignKey |  |  | - | - | `MarkingRubric` | - |
| `task_publish_datetime` | DateTimeField |  |  | - | - | - | - |
| `task_due_datetime` | DateTimeField |  |  | - | - | - | - |
| `task_title` | CharField |  |  | 200 | - | - | - |
| `task_desc` | TextField |  | ✅ | - | - | - | - |
| `task_instructions` | TextField |  |  | - | - | - | - |
| `class_id_class` | ForeignKey |  | ✅ | - | - | `Class` | - |
| `task_status` | CharField |  |  | 20 | draft | - | - |
| `task_allow_late_submission` | BooleanField |  |  | - | - | - | - |

### 元数据

- **表注释**: Task created by lecturer/admin for students in some classes/units to complete
- **排序**: 未指定

### 约束

- `task_publish_time_task_due_time_ck`: <CheckConstraint: check=(AND: ('task_publish_datetime__lt', F(task_due_datetime))) name='task_publish_time_task_due_time_ck'>
- `task_status_ck`: <CheckConstraint: check=(AND: ('task_status__in', ['draft', 'published', 'unpublished', 'archived'])) name='task_status_ck'>

---

## TeachingAssn (`teaching_assn`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `teaching_assn_id` | SmallAutoField | ✅ |  | - | - | - | - |
| `user_id_user` | ForeignKey |  |  | - | - | `User` | - |
| `class_id_class` | ForeignKey |  |  | - | - | `Class` | - |

### 元数据

- **表注释**: A weak entity for assignment of teacher to classes
- **排序**: 未指定

### 约束

- `lecturer_id_class_id_uq`: <UniqueConstraint: fields=('user_id_user', 'class_id_class') name='lecturer_id_class_id_uq'>

---

## Unit (`unit`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `class` | ForeignKey |  | ✅ | - | - | `Class` | CASCADE |
| `enrollment` | ForeignKey |  | ✅ | - | - | `Enrollment` | CASCADE |
| `task` | ForeignKey |  | ✅ | - | - | `Task` | CASCADE |
| `unit_id` | CharField | ✅ |  | 10 | - | - | - |
| `unit_name` | CharField |  |  | 50 | - | - | - |
| `unit_desc` | TextField |  | ✅ | - | - | - | - |

### 元数据

- **表注释**: A table for unit entity
- **排序**: 未指定

---

## User (`user`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `logentry` | ForeignKey |  | ✅ | - | - | `LogEntry` | CASCADE |
| `enrollment` | ForeignKey |  | ✅ | - | - | `Enrollment` | CASCADE |
| `feedback` | ForeignKey |  | ✅ | - | - | `Feedback` | CASCADE |
| `markingrubric` | ForeignKey |  | ✅ | - | - | `MarkingRubric` | CASCADE |
| `deadline_extensions` | ForeignKey |  | ✅ | - | - | `DeadlineExtension` | CASCADE |
| `granted_extensions` | ForeignKey |  | ✅ | - | - | `DeadlineExtension` | CASCADE |
| `submission` | ForeignKey |  | ✅ | - | - | `Submission` | CASCADE |
| `teachingassn` | ForeignKey |  | ✅ | - | - | `TeachingAssn` | CASCADE |
| `userbadge` | ForeignKey |  | ✅ | - | - | `UserBadge` | CASCADE |
| `last_login` | DateTimeField |  | ✅ | - | - | - | - |
| `is_superuser` | BooleanField |  |  | - | - | - | - |
| `user_id` | AutoField | ✅ |  | - | - | - | - |
| `user_email` | CharField |  |  | 254 | - | - | - |
| `user_fname` | CharField |  | ✅ | 20 | - | - | - |
| `user_lname` | CharField |  | ✅ | 20 | - | - | - |
| `user_role` | CharField |  | ✅ | 10 | - | - | - |
| `user_status` | CharField |  | ✅ | 15 | - | - | - |
| `password` | CharField |  |  | 255 | - | - | - |
| `is_active` | BooleanField |  |  | - | True | - | - |
| `is_staff` | BooleanField |  |  | - | - | - | - |
| `date_joined` | DateTimeField |  |  | - | - | - | - |
| `preferences` | JSONField |  |  | - | - | - | - |
| `groups` | ManyToManyField |  |  | - | - | `Group` | - |
| `user_permissions` | ManyToManyField |  |  | - | - | `Permission` | - |

### 元数据

- **表注释**: A table for all user entities, including student, teacher, and admins.
- **排序**: 未指定

### 约束

- `user_role_ck`: <CheckConstraint: check=(AND: ('user_role__in', ['student', 'lecturer', 'admin'])) name='user_role_ck'>
- `user_status_ck`: <CheckConstraint: check=(AND: ('user_status__in', ['active', 'suspended', 'unregistered'])) name='user_status_ck'>

---

## Badge (`badge`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `userbadge` | ForeignKey |  | ✅ | - | - | `UserBadge` | CASCADE |
| `badge_id` | AutoField | ✅ |  | - | - | - | - |
| `name` | CharField |  |  | 100 | - | - | - |
| `description` | CharField |  |  | 200 | - | - | - |
| `icon` | CharField |  |  | 50 | - | - | - |
| `criteria` | JSONField |  |  | - | - | - | - |
| `created_at` | DateTimeField |  |  | - | - | - | - |

### 元数据

- **表注释**: Achievement badges for users
- **排序**: 未指定

---

## UserBadge (`user_badge`)

### 字段说明

| 字段名 | 类型 | 主键 | 可空 | 最大长度 | 默认值 | 关联表 | 删除行为 |
|--------|------|------|------|----------|--------|--------|----------|
| `user_badge_id` | AutoField | ✅ |  | - | - | - | - |
| `user_id_user` | ForeignKey |  |  | - | - | `User` | - |
| `badge_id_badge` | ForeignKey |  |  | - | - | `Badge` | - |
| `earned_at` | DateTimeField |  |  | - | - | - | - |

### 元数据

- **表注释**: User earned badges
- **排序**: 未指定

### 约束

- `user_badge_unique`: <UniqueConstraint: fields=('user_id_user', 'badge_id_badge') name='user_badge_unique'>

### 索引

- `user_badge_user_idx`: fields=['user_id_user']

---

