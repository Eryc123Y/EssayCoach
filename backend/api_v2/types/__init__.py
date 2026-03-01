"""
api_v2.types -- centralized type kernel for EssayCoach backend.

Re-exports all enums, typed IDs, and common schemas so callers can do:

    from api_v2.types import UserRole, UserId, PaginationParams
"""

from api_v2.types.common import ErrorResponse, MessageResponse, PaginationParams
from api_v2.types.enums import (
    ClassStatus,
    ClassTerm,
    FeedbackSource,
    ImprovementTrend,
    ResponseMode,
    SubmissionStatus,
    TaskStatus,
    ThemePreference,
    UserRole,
    UserStatus,
    Visibility,
    WorkflowStatus,
)
from api_v2.types.ids import (
    BadgeId,
    ClassId,
    EnrollmentId,
    FeedbackId,
    RubricId,
    RubricItemId,
    SubmissionId,
    TaskId,
    UnitId,
    UserId,
)

__all__ = [
    # Enums
    "ClassStatus",
    "ClassTerm",
    "FeedbackSource",
    "ImprovementTrend",
    "ResponseMode",
    "ThemePreference",
    "TaskStatus",
    "UserRole",
    "UserStatus",
    "SubmissionStatus",
    "Visibility",
    "WorkflowStatus",
    # IDs
    "BadgeId",
    "ClassId",
    "EnrollmentId",
    "FeedbackId",
    "RubricId",
    "RubricItemId",
    "SubmissionId",
    "TaskId",
    "UnitId",
    "UserId",
    # Common schemas
    "ErrorResponse",
    "MessageResponse",
    "PaginationParams",
]
