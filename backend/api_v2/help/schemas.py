from __future__ import annotations

from datetime import datetime

from ninja import Schema
from pydantic import Field

from api_v2.schemas.base import TimestampSchema
from api_v2.types.enums import ArticleCategory, TicketPriority, TicketStatus
from api_v2.types.ids import UserId


class ArticleOut(TimestampSchema):
    """Output schema for a Help Center article."""

    id: int
    title: str
    slug: str
    category: ArticleCategory
    content: str
    views_count: int = 0
    helpful_count: int = 0


class ArticleSearchIn(Schema):
    """Input for searching articles."""

    query: str
    category: ArticleCategory | None = None


class SupportTicketIn(Schema):
    """Input for creating a support ticket."""

    subject: str = Field(..., max_length=200)
    description: str
    priority: TicketPriority = TicketPriority.NORMAL
    attachment_ids: list[str] | None = None


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
    messages: list[TicketMessageOut] | None = None
