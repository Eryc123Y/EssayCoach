"""The operations view exposes job state without essay text or provider errors."""

import json
import logging
from pathlib import Path

import pytest
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import User, WorkerHeartbeat
from core.observability import SafeJsonFormatter


def _client(user: User) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


@pytest.mark.django_db
def test_observability_is_admin_only_and_redacts_job_errors(monkeypatch, tmp_path):
    from django.conf import settings

    monkeypatch.setattr(settings, "LOG_DIR", Path(tmp_path))
    admin = User.objects.create_user(user_email="ops-admin@example.com", password="TestPass123!", user_role="admin")
    student = User.objects.create_user(user_email="ops-student@example.com", password="TestPass123!")
    assert _client(student).get("/api/v2/admin/observability/overview/").status_code == 403
    assert _client(student).get("/api/v2/admin/observability/traces/").status_code == 403

    WorkerHeartbeat.objects.create(pk=1, last_seen_at=timezone.now())
    trace_path = tmp_path / "traces-123.jsonl"
    trace_path.write_text(
        json.dumps({"name": "ai.formal", "started_at": "2026-01-01T00:00:00Z", "attributes": {"job.id": "abc"}})
        + "\n"
    )
    admin_client = _client(admin)
    overview = admin_client.get("/api/v2/admin/observability/overview/")
    assert overview.status_code == 200
    assert overview.json()["database_ok"] is True
    assert overview.json()["worker_ok"] is True
    assert admin_client.get("/api/v2/admin/observability/traces/?job_id=abc").json()[0]["name"] == "ai.formal"


def test_structured_logger_does_not_render_legacy_exception_text():
    record = logging.LogRecord("ai_feedback.rubric_parser", logging.ERROR, __file__, 1, "essay text: private", (), None)
    payload = json.loads(SafeJsonFormatter().format(record))
    assert payload["event"] == "ai_feedback.rubric_parser"
    assert "private" not in json.dumps(payload)
