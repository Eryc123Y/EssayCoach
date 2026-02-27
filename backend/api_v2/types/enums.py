"""
Domain StrEnum types for EssayCoach backend.

These enums are the single source of truth for all constrained string fields
across Django models, Pydantic schemas, and business logic. They use Python 3.11+
StrEnum so that each member compares equal to its string value.

Every value here MUST match the corresponding Django model CheckConstraint / choices.
"""

from __future__ import annotations

from enum import StrEnum


class UserRole(StrEnum):
    """User roles matching core.models.User.user_role constraint."""

    STUDENT = "student"
    LECTURER = "lecturer"
    ADMIN = "admin"


class UserStatus(StrEnum):
    """User account status matching core.models.User.user_status constraint."""

    ACTIVE = "active"
    SUSPENDED = "suspended"
    UNREGISTERED = "unregistered"


class TaskStatus(StrEnum):
    """Task lifecycle status matching core.models.Task.task_status choices."""

    DRAFT = "draft"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"
    ARCHIVED = "archived"


class ClassStatus(StrEnum):
    """Class status matching core.models.Class.class_status choices."""

    ACTIVE = "active"
    ARCHIVED = "archived"


class ClassTerm(StrEnum):
    """Academic term matching core.models.Class.class_term choices."""

    SEMESTER1 = "semester1"
    SEMESTER2 = "semester2"
    TERM1 = "term1"
    TERM2 = "term2"
    FULL_YEAR = "full_year"


class Visibility(StrEnum):
    """Content visibility matching core.models.MarkingRubric.visibility choices."""

    PUBLIC = "public"
    PRIVATE = "private"


class FeedbackSource(StrEnum):
    """Feedback origin matching core.models.FeedbackItem.feedback_item_source constraint."""

    AI = "ai"
    HUMAN = "human"
    REVISED = "revised"


class ResponseMode(StrEnum):
    """AI workflow response mode."""

    BLOCKING = "blocking"
    STREAMING = "streaming"


class WorkflowStatus(StrEnum):
    """AI workflow execution status."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ThemePreference(StrEnum):
    """UI theme preference for user settings."""

    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


class ImprovementTrend(StrEnum):
    """Student performance trend direction."""

    UP = "up"
    DOWN = "down"
    STABLE = "stable"

class SubmissionStatus(StrEnum):
    """Submission lifecycle status used in dashboards."""

    SUBMITTED = "submitted"
    AI_GRADED = "ai_graded"
    REVIEWED = "reviewed"
