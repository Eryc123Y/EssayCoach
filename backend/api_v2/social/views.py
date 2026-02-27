from __future__ import annotations

from django.http import HttpRequest
from ninja import Router

from api_v2.types.ids import SubmissionId
from api_v2.utils.auth import JWTAuth

from .schemas import (
    ContentReportIn,
    ContentReportOut,
    SharedEssayIn,
    SharedEssayOut,
    SocialInteractionIn,
    SocialInteractionOut,
)

router = Router(tags=["Social Hub"], auth=JWTAuth())

# =============================================================================
# PRD-11: Social Learning Hub Endpoints
# =============================================================================


@router.get("/feed/", response=list[SharedEssayOut])
def get_social_feed(request: HttpRequest):
    """Retrieve the public feed of shared essays."""
    # STUB: implementation pending
    return []


@router.post("/share/", response=SharedEssayOut)
def share_essay(request: HttpRequest, data: SharedEssayIn):
    """Share a submission to the social hub."""
    # STUB: implementation pending
    raise NotImplementedError("Social hub sharing not implemented yet")


@router.post("/{submission_id}/interact/", response=SocialInteractionOut)
def interact_with_essay(request: HttpRequest, submission_id: SubmissionId, data: SocialInteractionIn):
    """Like, bookmark, or comment on a shared essay."""
    # STUB: implementation pending
    raise NotImplementedError("Social hub interaction not implemented yet")


@router.post("/report/", response=ContentReportOut)
def report_content(request: HttpRequest, data: ContentReportIn):
    """Report inappropriate content in the social hub."""
    # STUB: implementation pending
    raise NotImplementedError("Social hub reporting not implemented yet")
