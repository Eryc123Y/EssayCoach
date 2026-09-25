"""Legacy essay endpoints are closed after the practice workflow migration."""

from __future__ import annotations

from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from api_v2.utils.auth import JWTAuth

router = Router(tags=["AI Feedback (legacy)"], auth=JWTAuth())

_MIGRATION_MESSAGE = (
    "This legacy workflow has been retired. Use /api/v2/practice/essays/ for student "
    "practice analysis and /api/v2/practice/runs/{run_id}/chat/ for follow-up coaching."
)


@router.post("/agent/workflows/run/")
def run_workflow(request: HttpRequest):
    raise HttpError(410, _MIGRATION_MESSAGE)


@router.post("/chat/")
def chat_with_ai(request: HttpRequest):
    raise HttpError(410, _MIGRATION_MESSAGE)


@router.get("/agent/workflows/run/{workflow_run_id}/status/")
def get_workflow_status(request: HttpRequest, workflow_run_id: str):
    raise HttpError(410, _MIGRATION_MESSAGE)
