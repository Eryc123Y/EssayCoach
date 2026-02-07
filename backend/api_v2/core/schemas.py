from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Annotated  # For Pydantic V2 compatible FilterSchema syntax

from ninja import FilterLookup, FilterSchema, Schema  # FieldLookup replaces Field(q=...)
from ninja.orm import ModelSchema
from pydantic import Field

from api_v1.core.models import (
    Class,
    Enrollment,
    Feedback,
    FeedbackItem,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Submission,
    Task,
    TeachingAssn,
    Unit,
    User,
)

# =============================================================================
# User Schemas
# =============================================================================


class UserIn(Schema):
    """Input schema for creating users with validation."""

    user_email: str
    password: str
    user_fname: str | None = None
    user_lname: str | None = None
    user_role: str = "student"
    user_status: str = "active"
    is_active: bool = True
    is_staff: bool = False


class UserOut(ModelSchema):
    """Output schema for users - auto-generated from User model."""

    class Meta:
        model = User
        fields = [
            "user_id",
            "user_email",
            "user_fname",
            "user_lname",
            "user_role",
            "user_status",
            "is_active",
            "is_staff",
            "date_joined",
        ]


# =============================================================================
# Unit Schemas
# =============================================================================


class UnitIn(Schema):
    """Input schema for creating units with validation."""

    unit_id: str = Field(..., max_length=10)
    unit_name: str = Field(..., max_length=50)
    unit_desc: str | None = None


class UnitOut(ModelSchema):
    """Output schema for units - auto-generated from Unit model."""

    class Meta:
        model = Unit
        fields = ["unit_id", "unit_name", "unit_desc"]


# =============================================================================
# Class Schemas
# =============================================================================


class ClassIn(Schema):
    """Input schema for creating classes."""

    unit_id_unit: str
    class_size: int = 0


class ClassOut(ModelSchema):
    """Output schema for classes - auto-generated from Class model."""

    class Meta:
        model = Class
        fields = ["class_id", "unit_id_unit", "class_size"]


class ClassDetailOut(Schema):
    """Output schema for classes with computed unit_name field."""

    class_id: int
    unit_id_unit: str
    class_size: int
    unit_name: str | None = None


# =============================================================================
# Enrollment Schemas
# =============================================================================


class EnrollmentIn(Schema):
    """Input schema for creating enrollments."""

    user_id_user: int
    class_id_class: int
    unit_id_unit: str


class EnrollmentOut(ModelSchema):
    """Output schema for enrollments - auto-generated from Enrollment model."""

    class Meta:
        model = Enrollment
        fields = [
            "enrollment_id",
            "user_id_user",
            "class_id_class",
            "unit_id_unit",
            "enrollment_time",
        ]


# =============================================================================
# MarkingRubric Schemas
# =============================================================================


class MarkingRubricIn(Schema):
    """Input schema for creating marking rubrics with validation."""

    rubric_desc: str | None = Field(None, max_length=100)


class MarkingRubricOut(ModelSchema):
    """Output schema for marking rubrics - auto-generated from MarkingRubric model."""

    class Meta:
        model = MarkingRubric
        fields = ["rubric_id", "user_id_user", "rubric_create_time", "rubric_desc"]


# =============================================================================
# RubricItem Schemas
# =============================================================================


class RubricItemIn(Schema):
    """Input schema for creating rubric items with validation."""

    rubric_id_marking_rubric: int
    rubric_item_name: str = Field(..., max_length=50)
    rubric_item_weight: Decimal


class RubricItemOut(ModelSchema):
    """Output schema for rubric items - auto-generated from RubricItem model."""

    class Meta:
        model = RubricItem
        fields = [
            "rubric_item_id",
            "rubric_id_marking_rubric",
            "rubric_item_name",
            "rubric_item_weight",
        ]


# =============================================================================
# RubricLevelDesc Schemas
# =============================================================================


class RubricLevelDescIn(Schema):
    """Input schema for creating rubric level descriptions."""

    rubric_item_id_rubric_item: int
    level_min_score: int
    level_max_score: int
    level_desc: str


class RubricLevelDescOut(ModelSchema):
    """Output schema for rubric level descriptions - auto-generated from RubricLevelDesc model."""

    class Meta:
        model = RubricLevelDesc
        fields = [
            "level_desc_id",
            "rubric_item_id_rubric_item",
            "level_min_score",
            "level_max_score",
            "level_desc",
        ]


# =============================================================================
# Task Schemas
# =============================================================================


class TaskIn(Schema):
    """Input schema for creating tasks."""

    unit_id_unit: str
    rubric_id_marking_rubric: int
    task_due_datetime: datetime


class TaskOut(ModelSchema):
    """Output schema for tasks - auto-generated from Task model."""

    class Meta:
        model = Task
        fields = [
            "task_id",
            "unit_id_unit",
            "rubric_id_marking_rubric",
            "task_publish_datetime",
            "task_due_datetime",
        ]


# =============================================================================
# Submission Schemas
# =============================================================================


class SubmissionIn(Schema):
    """Input schema for creating submissions."""

    task_id_task: int
    user_id_user: int
    submission_txt: str


class SubmissionOut(ModelSchema):
    """Output schema for submissions - auto-generated from Submission model."""

    class Meta:
        model = Submission
        fields = [
            "submission_id",
            "submission_time",
            "task_id_task",
            "user_id_user",
            "submission_txt",
        ]


# =============================================================================
# Feedback Schemas
# =============================================================================


class FeedbackIn(Schema):
    """Input schema for creating feedback."""

    submission_id_submission: int
    user_id_user: int


class FeedbackOut(ModelSchema):
    """Output schema for feedback - auto-generated from Feedback model."""

    class Meta:
        model = Feedback
        fields = ["feedback_id", "submission_id_submission", "user_id_user"]


# =============================================================================
# FeedbackItem Schemas
# =============================================================================


class FeedbackItemIn(Schema):
    """Input schema for creating feedback items."""

    feedback_id_feedback: int
    rubric_item_id_rubric_item: int
    feedback_item_score: int
    feedback_item_comment: str | None = None
    feedback_item_source: str = "human"


class FeedbackItemOut(ModelSchema):
    """Output schema for feedback items - auto-generated from FeedbackItem model."""

    class Meta:
        model = FeedbackItem
        fields = [
            "feedback_item_id",
            "feedback_id_feedback",
            "rubric_item_id_rubric_item",
            "feedback_item_score",
            "feedback_item_comment",
            "feedback_item_source",
        ]


# =============================================================================
# TeachingAssn Schemas
# =============================================================================


class TeachingAssnIn(Schema):
    """Input schema for creating teaching assignments."""

    user_id_user: int
    class_id_class: int


class TeachingAssnOut(ModelSchema):
    """Output schema for teaching assignments - auto-generated from TeachingAssn model."""

    class Meta:
        model = TeachingAssn
        fields = ["teaching_assn_id", "user_id_user", "class_id_class"]


# =============================================================================
# Rubric Detail Schemas (for nested responses)
# =============================================================================


class RubricLevelDescDetailOut(RubricLevelDescOut):
    """Extended rubric level description with additional computed fields."""

    pass


class RubricItemDetailOut(RubricItemOut):
    """Extended rubric item with nested level descriptions."""

    level_descriptions: list[RubricLevelDescDetailOut] = []


class RubricDetailOut(MarkingRubricOut):
    """Extended rubric with nested rubric items and level descriptions."""

    rubric_items: list[RubricItemDetailOut] = []


# =============================================================================
# Rubric Import Schemas
# =============================================================================


class RubricUploadIn(Schema):
    """Input schema for uploading rubric files."""

    pass


class RubricImportOut(Schema):
    """Output schema for rubric import results."""

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
# Filter Schemas for List Endpoints (Pydantic V2 Compatible)
# =============================================================================
# NOTE: Using Annotated + FieldLookup instead of Field(q=...) to avoid
# Pydantic V2 deprecation warnings. This syntax is compatible with both V2 and V3.


class UnitFilterParams(FilterSchema):
    """Filter parameters for Unit list endpoint."""

    unit_id: str | None = None
    unit_name: Annotated[str | None, FilterLookup(q="unit_name__icontains")] = None


class ClassFilterParams(FilterSchema):
    """Filter parameters for Class list endpoint."""

    unit_id_unit: str | None = None
    class_size__gte: int | None = None
    class_size__lte: int | None = None


class EnrollmentFilterParams(FilterSchema):
    """Filter parameters for Enrollment list endpoint."""

    user_id_user: int | None = None
    class_id_class: int | None = None
    unit_id_unit: str | None = None


class RubricFilterParams(FilterSchema):
    """Filter parameters for MarkingRubric list endpoint."""

    user_id_user: int | None = None
    rubric_desc: Annotated[str | None, FilterLookup(q="rubric_desc__icontains")] = None


class RubricItemFilterParams(FilterSchema):
    """Filter parameters for RubricItem list endpoint."""

    rubric_id_marking_rubric: int | None = None
    rubric_item_name: Annotated[str | None, FilterLookup(q="rubric_item_name__icontains")] = None


class RubricLevelDescFilterParams(FilterSchema):
    """Filter parameters for RubricLevelDesc list endpoint."""

    rubric_item_id_rubric_item: int | None = None
    level_min_score__gte: int | None = None
    level_max_score__lte: int | None = None


class TaskFilterParams(FilterSchema):
    """Filter parameters for Task list endpoint."""

    unit_id_unit: str | None = None
    rubric_id_marking_rubric: int | None = None
    task_due_datetime__gte: datetime | None = None
    task_due_datetime__lte: datetime | None = None


class SubmissionFilterParams(FilterSchema):
    """Filter parameters for Submission list endpoint."""

    task_id_task: int | None = None
    user_id_user: int | None = None


class FeedbackFilterParams(FilterSchema):
    """Filter parameters for Feedback list endpoint."""

    submission_id_submission: int | None = None
    user_id_user: int | None = None


class FeedbackItemFilterParams(FilterSchema):
    """Filter parameters for FeedbackItem list endpoint."""

    feedback_id_feedback: int | None = None
    rubric_item_id_rubric_item: int | None = None
    feedback_item_score__gte: int | None = None
    feedback_item_score__lte: int | None = None


class TeachingAssnFilterParams(FilterSchema):
    """Filter parameters for TeachingAssn list endpoint."""

    user_id_user: int | None = None
    class_id_class: int | None = None


class PaginationParams(Schema):
    """Pagination parameters for list endpoints."""

    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=100)


class UserFilterParams(FilterSchema):
    """Filter parameters for user list endpoints with multi-field search."""

    user_role: str | None = None
    user_status: str | None = None
    search: Annotated[str | None, FilterLookup(q=["user_email", "user_fname", "user_lname"])] = None
