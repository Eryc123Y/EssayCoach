"""Inputs for the institution's moderated peer learning feed."""

from ninja import Schema
from pydantic import Field

from api_v2.types.enums import InteractionType, SocialVisibility


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


class ContentReportIn(Schema):
    submission_id: int | None = None
    interaction_id: int | None = None
    reason: str
    description: str = Field(default="", max_length=1000)


class ResolveReportIn(Schema):
    decision: str


class PostingBanIn(Schema):
    class_id: int
    days: int = Field(ge=1, le=30)
    reason: str = Field(min_length=3, max_length=300)
