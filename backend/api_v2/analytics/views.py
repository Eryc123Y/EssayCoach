from __future__ import annotations

from django.http import HttpRequest
from ninja import Router

from api_v2.schemas.base import SuccessResponse
from api_v2.utils.auth import JWTAuth

from .schemas import AnalyticsQueryIn, AnalyticsReportOut

router = Router(tags=["Analytics"], auth=JWTAuth())

# =============================================================================
# PRD-12: Analytics Endpoints
# =============================================================================


@router.post("/query/", response=AnalyticsReportOut)
def query_analytics(request: HttpRequest, data: AnalyticsQueryIn):
    """Retrieve detailed analytics for student progress, class performance, etc."""
    # STUB: implementation pending
    raise NotImplementedError("Analytics querying not implemented yet")


@router.get("/export/", response=SuccessResponse)
def export_analytics(request: HttpRequest, scope: str, class_id: str | None = None):
    """Export analytics as CSV or PDF report."""
    # STUB: implementation pending
    raise NotImplementedError("Analytics export not implemented yet")
