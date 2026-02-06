from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from ninja import Schema
from pydantic import Field

# =============================================================================
# User Schemas
# =============================================================================


class UserIn(Schema):
    user_email: str
    password: str
    user_fname: str | None = None
    user_lname: str | None = None
    user_role: str = "student"
    user_status: str = "active"
    is_active: bool = True
    is_staff: bool = False


class UserOut(Schema):
    user_id: int
    user_email: str
    user_fname: str | None
    user_lname: str | None
    user_role: str
    user_status: str
    is_active: bool
    is_staff: bool
    date_joined: datetime


# =============================================================================
# Unit Schemas
# =============================================================================


class UnitIn(Schema):
    unit_id: str = Field(..., max_length=10)
    unit_name: str = Field(..., max_length=50)
    unit_desc: str | None = None


class UnitOut(Schema):
    unit_id: str
    unit_name: str
    unit_desc: str | None


# =============================================================================
# Class Schemas
# =============================================================================


class ClassIn(Schema):
    unit_id_unit: str
    class_size: int = 0


class ClassOut(Schema):
    class_id: int
    unit_id_unit: str
    class_size: int


class ClassDetailOut(ClassOut):
    unit_name: str | None


# =============================================================================
# Enrollment Schemas
# =============================================================================


class EnrollmentIn(Schema):
    user_id_user: int
    class_id_class: int
    unit_id_unit: str


class EnrollmentOut(Schema):
    enrollment_id: int
    user_id_user: int
    class_id_class: int
    unit_id_unit: str
    enrollment_time: datetime


# =============================================================================
# MarkingRubric Schemas
# =============================================================================


class MarkingRubricIn(Schema):
    rubric_desc: str | None = Field(None, max_length=100)


class MarkingRubricOut(Schema):
    rubric_id: int
    user_id_user: int
    rubric_create_time: datetime
    rubric_desc: str | None


# =============================================================================
# RubricItem Schemas
# =============================================================================


class RubricItemIn(Schema):
    rubric_id_marking_rubric: int
    rubric_item_name: str = Field(..., max_length=50)
    rubric_item_weight: Decimal


class RubricItemOut(Schema):
    rubric_item_id: int
    rubric_id_marking_rubric: int
    rubric_item_name: str
    rubric_item_weight: Decimal


# =============================================================================
# RubricLevelDesc Schemas
# =============================================================================


class RubricLevelDescIn(Schema):
    rubric_item_id_rubric_item: int
    level_min_score: int
    level_max_score: int
    level_desc: str


class RubricLevelDescOut(Schema):
    level_desc_id: int
    rubric_item_id_rubric_item: int
    level_min_score: int
    level_max_score: int
    level_desc: str


# =============================================================================
# Task Schemas
# =============================================================================


class TaskIn(Schema):
    unit_id_unit: str
    rubric_id_marking_rubric: int
    task_due_datetime: datetime


class TaskOut(Schema):
    task_id: int
    unit_id_unit: str
    rubric_id_marking_rubric: int
    task_publish_datetime: datetime
    task_due_datetime: datetime


# =============================================================================
# Submission Schemas
# =============================================================================


class SubmissionIn(Schema):
    task_id_task: int
    user_id_user: int
    submission_txt: str


class SubmissionOut(Schema):
    submission_id: int
    submission_time: datetime
    task_id_task: int
    user_id_user: int
    submission_txt: str


# =============================================================================
# Feedback Schemas
# =============================================================================


class FeedbackIn(Schema):
    submission_id_submission: int
    user_id_user: int


class FeedbackOut(Schema):
    feedback_id: int
    submission_id_submission: int
    user_id_user: int


# =============================================================================
# FeedbackItem Schemas
# =============================================================================


class FeedbackItemIn(Schema):
    feedback_id_feedback: int
    rubric_item_id_rubric_item: int
    feedback_item_score: int
    feedback_item_comment: str | None = None
    feedback_item_source: str = "human"


class FeedbackItemOut(Schema):
    feedback_item_id: int
    feedback_id_feedback: int
    rubric_item_id_rubric_item: int
    feedback_item_score: int
    feedback_item_comment: str | None
    feedback_item_source: str


# =============================================================================
# TeachingAssn Schemas
# =============================================================================


class TeachingAssnIn(Schema):
    user_id_user: int
    class_id_class: int


class TeachingAssnOut(Schema):
    teaching_assn_id: int
    user_id_user: int
    class_id_class: int


# =============================================================================
# Rubric Detail Schemas (for nested responses)
# =============================================================================


class RubricLevelDescDetailOut(RubricLevelDescOut):
    pass


class RubricItemDetailOut(RubricItemOut):
    level_descriptions: list[RubricLevelDescDetailOut] = []


class RubricDetailOut(MarkingRubricOut):
    rubric_items: list[RubricItemDetailOut] = []


# =============================================================================
# Rubric Import Schemas
# =============================================================================


class RubricUploadIn(Schema):
    pass


class RubricImportOut(Schema):
    success: bool
    rubric_id: int | None = None
    rubric_name: str | None = None
    items_count: int | None = None
    levels_count: int | None = None
    ai_parsed: bool = False
    ai_model: str | None = None
    detection: dict | None = None
    error: str | None = None


# =============================================================================
# Pagination & Filter Schemas
# =============================================================================


class PaginationParams(Schema):
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=100)


class UserFilterParams(Schema):
    user_role: str | None = None
    user_status: str | None = None
    search: str | None = None
    ordering: str | None = None
