from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Annotated  # For Pydantic V2 compatible FilterSchema syntax

from ninja import FilterLookup, FilterSchema, Schema  # FieldLookup replaces Field(q=...)
from ninja.orm import ModelSchema
from pydantic import Field

from core.models import (
    Class,
    Enrollment,
    Feedback,
    FeedbackItem,
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


class UserUpdateIn(Schema):
    """Input schema for updating users - password is optional."""

    user_email: str | None = None
    password: str | None = None
    user_fname: str | None = None
    user_lname: str | None = None
    user_role: str | None = None
    user_status: str | None = None
    is_active: bool | None = None
    is_staff: bool | None = None


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
    class_name: str
    class_desc: str | None = None
    class_join_code: str | None = None
    class_term: str = "full_year"
    class_year: int | None = None
    class_size: int = 0


class ClassOut(ModelSchema):
    """Output schema for classes - auto-generated from Class model."""

    class Meta:
        model = Class
        fields = [
            "class_id",
            "unit_id_unit",
            "class_name",
            "class_desc",
            "class_join_code",
            "class_term",
            "class_year",
            "class_status",
            "class_archived_at",
            "class_size",
        ]


class ClassDetailOut(Schema):
    """Output schema for classes with computed unit_name field."""

    class_id: int
    unit_id_unit: str
    class_name: str | None = None
    class_desc: str | None = None
    class_join_code: str | None = None
    class_term: str | None = None
    class_year: int | None = None
    class_status: str | None = None


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
    visibility: str = "private"


class MarkingRubricOut(Schema):
    """Output schema for marking rubrics."""
    rubric_id: int
    user_id_user: int
    rubric_create_time: datetime
    rubric_desc: str | None = None
    visibility: str = "private"


class RubricVisibilityUpdate(Schema):
    """Input schema for toggling rubric visibility."""

    visibility: str = Field(..., description="Visibility status: 'public' or 'private'")


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
    task_title: str
    task_desc: str | None = None
    task_instructions: str = ""
    class_id_class: int | None = None
    task_status: str = "draft"
    task_allow_late_submission: bool = False


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
            "task_title",
            "task_desc",
            "task_instructions",
            "class_id_class",
            "task_status",
            "task_allow_late_submission",
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

    level_descriptions: list[RubricLevelDescDetailOut] = Field(default_factory=list)


class RubricDetailOut(MarkingRubricOut):
    """Extended rubric with nested rubric items and level descriptions."""

    rubric_items: list[RubricItemDetailOut] = Field(default_factory=list)


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
    class_status: str | None = None
    class_name: Annotated[str | None, FilterLookup(q="class_name__icontains")] = None


class EnrollmentFilterParams(FilterSchema):
    """Filter parameters for Enrollment list endpoint."""

    user_id_user: int | None = None
    class_id_class: int | None = None
    unit_id_unit: str | None = None


class RubricFilterParams(FilterSchema):
    """Filter parameters for MarkingRubric list endpoint."""

    user_id_user: int | None = Field(None, description="Filter by user ID")
    visibility: str | None = Field(None, description="Filter by visibility (public/private)")
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
    class_id_class: int | None = None
    task_status: str | None = None
    task_title: Annotated[str | None, FilterLookup(q="task_title__icontains")] = None

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


# =============================================================================
# Profile Schemas
# =============================================================================


class UserStatsOut(Schema):
    """Output schema for user statistics."""

    total_essays: int
    average_score: float | None
    total_submissions: int
    last_activity: datetime | None


class BadgeOut(Schema):
    """Output schema for user badges."""

    id: int
    name: str
    description: str
    icon: str
    earned_at: datetime | None


class ProgressEntryOut(Schema):
    """Output schema for progress timeline entry."""

    date: datetime
    essay_count: int
    average_score: float | None


class UserProgressOut(Schema):
    """Output schema for user progress over time."""

    user_id: int
    entries: list[ProgressEntryOut]


# =============================================================================
# Dashboard Schemas
# =============================================================================


class DashboardUserInfoOut(Schema):
    """Common user identity payload for dashboard responses."""

    id: int
    name: str
    role: str
    email: str


class DashboardActivityItemOut(Schema):
    """Recent activity item shown on all dashboard variants."""

    id: int
    type: str
    title: str
    description: str
    timestamp: datetime
    icon: str


class DashboardStatsOut(Schema):
    """Base stats shared across all roles."""

    totalEssays: int
    averageScore: float | None
    pendingGrading: int


class LecturerStatsOut(DashboardStatsOut):
    """Lecturer specific dashboard metrics."""

    essaysReviewedToday: int
    pendingReviews: int
    activeClasses: int
    avgGradingTime: float | None


class StudentStatsOut(DashboardStatsOut):
    """Student specific dashboard metrics."""

    essaysSubmitted: int
    avgScore: float | None
    improvementTrend: str
    feedbackReceived: int


class AdminStatsOut(DashboardStatsOut):
    """Admin specific dashboard metrics."""

    totalUsers: int
    activeStudents: int
    activeLecturers: int
    totalClasses: int
    systemHealth: str


class ClassOverviewOut(Schema):
    """Class overview card data for lecturer dashboard."""

    id: int
    name: str
    unitName: str | None
    studentCount: int
    essayCount: int
    avgScore: float | None
    pendingReviews: int


class GradingQueueItemOut(Schema):
    """Pending grading queue item for lecturer dashboard."""

    submissionId: int
    studentName: str
    essayTitle: str
    submittedAt: datetime
    dueDate: datetime | None = None
    status: str | None = None
    aiScore: float | None = None


class StudentEssayOut(Schema):
    """Student essay list item."""

    id: int
    title: str
    status: str
    submittedAt: datetime
    score: float | None
    unitName: str | None
    taskTitle: str | None


class SystemStatusOut(Schema):
    """Admin system health summary."""

    database: str
    submissionsLast24h: int
    feedbacksLast24h: int
    activeUsers: int


class LecturerDashboardOut(Schema):
    """Complete lecturer dashboard response."""

    user: DashboardUserInfoOut
    stats: LecturerStatsOut
    classes: list[ClassOverviewOut]
    gradingQueue: list[GradingQueueItemOut]
    recentActivity: list[DashboardActivityItemOut]


class StudentDashboardOut(Schema):
    """Complete student dashboard response."""

    user: DashboardUserInfoOut
    stats: StudentStatsOut
    myEssays: list[StudentEssayOut]
    recentActivity: list[DashboardActivityItemOut]


class AdminDashboardOut(Schema):
    """Complete admin dashboard response."""

    user: DashboardUserInfoOut
    stats: AdminStatsOut
    recentActivity: list[DashboardActivityItemOut]
    systemStatus: SystemStatusOut


# Backward-compatible alias used by integration tests.
DashboardResponse = LecturerDashboardOut | StudentDashboardOut | AdminDashboardOut
