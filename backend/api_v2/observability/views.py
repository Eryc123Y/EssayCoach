"""Admin-only local health, job state, and redacted OpenTelemetry traces."""

from __future__ import annotations

import json
import os
import shutil
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.db.models import Count
from django.http import HttpRequest
from django.utils import timezone
from ninja import Router

from api_v2.utils.auth import JWTAuth
from api_v2.utils.permissions import IsAdmin
from core.models import AIJob, PracticeChatTurn, PracticeRun, WorkerHeartbeat

router = Router(tags=["Observability"], auth=JWTAuth())


def _status_counts(model) -> dict[str, int]:
    return dict(model.objects.values("status").annotate(count=Count("status")).values_list("status", "count"))


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
    codex_bin = os.environ.get("CODEX_BIN") or shutil.which("codex")
    if not database_ok:
        return {
            "database_ok": False,
            "worker_ok": False,
            "worker_last_seen_at": None,
            "worker_processed_jobs": 0,
            "codex_binary_found": bool(codex_bin and os.path.isfile(codex_bin)),
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
        "codex_binary_found": bool(codex_bin and os.path.isfile(codex_bin)),
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
    limit = max(1, min(limit, 200))
    rows = []
    for path in settings.LOG_DIR.glob("traces-*.jsonl"):
        if not path.is_file():
            continue
        try:
            with path.open(encoding="utf-8") as source:
                for line in source:
                    try:
                        row = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if job_id and row.get("attributes", {}).get("job.id") != job_id:
                        continue
                    rows.append(row)
        except OSError:
            continue
    rows.sort(key=lambda row: row.get("started_at", ""), reverse=True)
    return rows[:limit]
