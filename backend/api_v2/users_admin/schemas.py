from __future__ import annotations

from datetime import datetime
from typing import Any

from ninja import Schema
from pydantic import Field

from api_v2.schemas.base import TimestampSchema
from api_v2.types.enums import AdminAction
from api_v2.types.ids import UserId


class AdminActionIn(Schema):
    """Input for an admin action on a user."""

    action: AdminAction
    reason: str | None = Field(None, description="Reason for the action")


class ActivityLogOut(TimestampSchema):
    """Output for a user's activity log entry."""

    id: int
    user_id: UserId
    action: str
    details: dict[str, Any] | None = None
    ip_address: str | None = None


class ActivityLogQueryIn(Schema):
    """Query parameters for user activity logs."""

    start_date: datetime | None = None
    end_date: datetime | None = None
    action_type: str | None = None
