from __future__ import annotations

from ninja import Schema
from pydantic import Field

from api_v2.schemas.base import TimestampSchema
from api_v2.types.enums import InteractionType, ReportStatus, Visibility
from api_v2.types.ids import SubmissionId, UserId


class SocialInteractionIn(Schema):
    """Input for creating an interaction on a shared essay."""

    interaction_type: InteractionType = Field(..., description="Type of interaction (like/bookmark)")
    content: str | None = Field(None, description="Optional content for comments")


class SocialInteractionOut(TimestampSchema):
    """Output for a single interaction."""

    id: int
    user_id: UserId
    submission_id: SubmissionId
    interaction_type: InteractionType
    content: str | None = None


class SharedEssayIn(Schema):
    """Input for sharing an essay."""

    submission_id: SubmissionId
    visibility: Visibility = Visibility.PUBLIC
    caption: str | None = Field(None, description="Optional caption for the shared essay")
    tags: list[str] = Field(default_factory=list, description="Tags for categorization")


class SharedEssayOut(TimestampSchema):
    """Output for a shared essay."""

    id: int
    submission_id: SubmissionId
    user_id: UserId
    visibility: Visibility
    caption: str | None = None
    tags: list[str] = Field(default_factory=list)
    likes_count: int = 0
    comments_count: int = 0
    bookmarks_count: int = 0


class ContentReportIn(Schema):
    """Input for reporting content."""

    submission_id: SubmissionId | None = None
    interaction_id: int | None = None
    reason: str = Field(..., description="Reason for reporting")


class ContentReportOut(TimestampSchema):
    """Output for a content report."""

    id: int
    reporter_id: UserId
    submission_id: SubmissionId | None = None
    interaction_id: int | None = None
    reason: str
    status: ReportStatus
