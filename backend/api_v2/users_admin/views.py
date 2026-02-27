from __future__ import annotations

from django.http import HttpRequest
from ninja import Router

from api_v2.schemas.base import SuccessResponse
from api_v2.types.ids import UserId
from api_v2.utils.auth import JWTAuth

from .schemas import (
    ActivityLogOut,
    ActivityLogQueryIn,
    AdminActionIn,
)

router = Router(tags=["Users Admin"], auth=JWTAuth())

# =============================================================================
# PRD-13: Users Admin Endpoints
# =============================================================================


@router.post("/{user_id}/action/", response=SuccessResponse)
def perform_admin_action(request: HttpRequest, user_id: UserId, data: AdminActionIn):
    """Disable, enable, reset password, or force logout a user."""
    # STUB: implementation pending
    raise NotImplementedError(f"Admin action {data.action} not implemented yet")


@router.get("/{user_id}/activity/", response=list[ActivityLogOut])
def get_user_activity(request: HttpRequest, user_id: UserId, filters: ActivityLogQueryIn = ActivityLogQueryIn()):
    """Get the activity log for a specific user."""
    # STUB: implementation pending
    return []
