"""Schemas for the institution's moderated peer learning feed."""

from datetime import datetime
from typing import Literal

from ninja import Schema
from pydantic import Field

from api_v2.types.enums import (
    InteractionType,
    ReportDecision,
    ReportStatus,
    ReportTargetType,
    SocialContentStatus,
    SocialVisibility,
)


class SharedEssayIn(Schema):
    submission_id: int
    class_id: int | None = None
    visibility: SocialVisibility = SocialVisibility.CLASS
    caption: str = Field(default="", max_length=300)
    tags: list[str] = Field(default_factory=list, max_length=8)


class ShareUpdateIn(Schema):
    visibility: SocialVisibility
    caption: str = Field(default="", max_length=300)
    tags: list[str] = Field(default_factory=list, max_length=8)


class SocialInteractionIn(Schema):
    interaction_type: InteractionType
    content: str | None = Field(default=None, max_length=3000)


class SocialInteractionOut(Schema):
    id: int
    submission_id: int
    user_id: int
    author: str
    interaction_type: InteractionType
    content: str | None = None
    status: SocialContentStatus
    created_at: datetime
    updated_at: datetime
    is_mine: bool


class ContentReportIn(Schema):
    submission_id: int | None = None
    interaction_id: int | None = None
    reason: str
    description: str = Field(default="", max_length=1000)


class ContentReportOut(Schema):
    id: int
    submission_id: int
    interaction_id: int | None = None
    target_type: ReportTargetType
    target_content: str
    target_author: str
    target_status: SocialContentStatus
    reporter_id: int
    reason: str
    description: str
    status: ReportStatus
    # Empty until a moderator decides.
    decision: ReportDecision | Literal[""]
    resolved_by: int | None = None
    resolved_at: datetime | None = None
    created_at: datetime


class ResolveReportIn(Schema):
    decision: str


class PostingBanIn(Schema):
    class_id: int
    days: int = Field(ge=1, le=30)
    reason: str = Field(min_length=3, max_length=300)
