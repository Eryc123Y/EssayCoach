from __future__ import annotations

from datetime import datetime

from ninja import Schema
from pydantic import Field

from api_v2.schemas.base import TimestampSchema
from api_v2.types.enums import ArticleCategory, TicketPriority, TicketStatus
from api_v2.types.ids import UserId


class ArticleOut(Schema):
    """Output schema for a Help Center article."""

    id: int
    title: str
    slug: str
    category: ArticleCategory
    content: str
    language: str
    roles: list[str]
    tags: list[str]


class ArticleSearchIn(Schema):
    """Input for searching articles."""

    query: str = ""
    category: ArticleCategory | None = None
    language: str = Field("en", pattern="^(en|zh)$")


class ArticleVoteIn(Schema):
    helpful: bool


class ArticleVoteOut(Schema):
    helpful: bool | None
    helpful_count: int
    unhelpful_count: int


class SupportTicketIn(Schema):
    """Input for creating a support ticket."""

    subject: str = Field(..., max_length=200)
    description: str
    priority: TicketPriority = TicketPriority.NORMAL
    attachment_ids: list[str] | None = None


class SupportTicketUpdateIn(Schema):
    status: TicketStatus
    staff_reply: str = Field("", max_length=10000)


class TicketMessageOut(Schema):
    sender_id: UserId
    content: str
    sent_at: datetime


class SupportTicketOut(TimestampSchema):
    """Output for a support ticket."""

    id: int
    user_id: UserId
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    staff_reply: str = ""
