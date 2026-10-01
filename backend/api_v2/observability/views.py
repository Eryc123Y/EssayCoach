"""Admin-only local health, job state, and redacted OpenTelemetry traces."""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.db.models import Count
from django.http import HttpRequest
from django.utils import timezone
from ninja import Router, Status

from api_v2.utils.auth import JWTAuth
from api_v2.utils.permissions import IsAdmin
from core.models import AIJob, PracticeChatTurn, PracticeRun, WorkerHeartbeat
from core.observability import codex_runtime_status, read_recent_traces

router = Router(tags=["Observability"], auth=JWTAuth())
health_router = Router(tags=["Readiness"])


def _status_counts(model) -> dict[str, int]:
    return dict(model.objects.values("status").annotate(count=Count("status")).values_list("status", "count"))


@health_router.get("/health/", response={200: dict, 503: dict})
def health(request: HttpRequest):
    """Unauthenticated local readiness check with no operational details."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            ready = cursor.fetchone()[0] == 1
    except Exception:
        ready = False
    if ready:
        return {"ready": True}
    return Status(503, {"ready": False})


@router.get("/overview/", response=dict)
def overview(request: HttpRequest):
    IsAdmin().check(request)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            database_ok = cursor.fetchone()[0] == 1
    except Exception:
        database_ok = False
    heartbeat = WorkerHeartbeat.objects.filter(pk=1).first() if database_ok else None
    worker_ok = bool(heartbeat and heartbeat.last_seen_at >= timezone.now() - timedelta(seconds=15))
    runtime = codex_runtime_status()
    if not database_ok:
        return {
            "database_ok": False,
            "worker_ok": False,
            "worker_last_seen_at": None,
            "worker_processed_jobs": 0,
            **runtime,
            "counts": {"formal": {}, "practice": {}, "chat": {}},
            "jobs": [],
        }
    latest_formal = AIJob.objects.order_by("-created_at")[:20]
    latest_practice = PracticeRun.objects.order_by("-created_at")[:20]
    latest_chat = PracticeChatTurn.objects.order_by("-created_at")[:20]
    jobs = [
        {
            "kind": kind,
            "id": str(job.pk),
            "status": job.status,
            "model": job.model,
            "attempts": job.attempts,
            "error_category": job.error_category,
            "created_at": job.created_at,
            "started_at": job.started_at,
            "finished_at": job.finished_at,
            "usage": job.usage,
        }
        for kind, source in (("formal", latest_formal), ("practice", latest_practice), ("chat", latest_chat))
        for job in source
    ]
    jobs.sort(key=lambda row: row["created_at"], reverse=True)
    return {
        "database_ok": database_ok,
        "worker_ok": worker_ok,
        "worker_last_seen_at": heartbeat.last_seen_at if heartbeat else None,
        "worker_processed_jobs": heartbeat.processed_jobs if heartbeat else 0,
        **runtime,
        "counts": {
            "formal": _status_counts(AIJob),
            "practice": _status_counts(PracticeRun),
            "chat": _status_counts(PracticeChatTurn),
        },
        "jobs": jobs[:30],
    }


@router.get("/traces/", response=list[dict])
def list_traces(request: HttpRequest, job_id: str = "", limit: int = 100):
    IsAdmin().check(request)
    return read_recent_traces(settings.LOG_DIR, job_id=job_id, limit=limit)
