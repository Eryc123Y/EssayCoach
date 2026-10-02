"""The operations view exposes job state without essay text or provider errors."""

import json
import logging
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import User, WorkerHeartbeat
from core.observability import (
    MAX_TRACE_BYTES_PER_FILE,
    SafeJsonFormatter,
    _append_bounded_job_index,
    read_recent_traces,
)


def _client(user: User) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


@pytest.mark.django_db
def test_observability_is_admin_only_and_redacts_job_errors(monkeypatch, tmp_path):
    from django.conf import settings

    monkeypatch.setattr(settings, "LOG_DIR", Path(tmp_path))
    monkeypatch.setattr(
        "api_v2.observability.views.codex_runtime_status",
        lambda: {"codex_binary_found": True, "codex_login_status": "valid"},
    )
    admin = User.objects.create_user(user_email="ops-admin@example.com", password="TestPass123!", user_role="admin")
    student = User.objects.create_user(user_email="ops-student@example.com", password="TestPass123!")
    assert _client(student).get("/api/v2/admin/observability/overview/").status_code == 403
    assert _client(student).get("/api/v2/admin/observability/traces/").status_code == 403
    assert Client().get("/api/v2/observability/health/").json() == {"ready": True}

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
    assert overview.json()["codex_login_status"] == "valid"
    assert admin_client.get("/api/v2/admin/observability/traces/?job_id=abc").json()[0]["name"] == "ai.formal"


def test_structured_logger_does_not_render_legacy_exception_text():
    record = logging.LogRecord("ai_feedback.rubric_parser", logging.ERROR, __file__, 1, "essay text: private", (), None)
    payload = json.loads(SafeJsonFormatter().format(record))
    assert payload["event"] == "ai_feedback.rubric_parser"
    assert "private" not in json.dumps(payload)


def test_trace_reader_only_reads_bounded_file_tails(tmp_path):
    trace_path = tmp_path / "traces-123.jsonl"
    trace_path.write_bytes(
        b'{"started_at":"2000-01-01T00:00:00Z","attributes":{"job.id":"old"}}\n'
        + b"x" * (MAX_TRACE_BYTES_PER_FILE + 100)
        + b'\n{"started_at":"2026-01-01T00:00:00Z","attributes":{"job.id":"new"}}\n'
    )
    assert read_recent_traces(tmp_path, job_id="old") == []
    assert read_recent_traces(tmp_path, job_id="new") == [
        {"started_at": "2026-01-01T00:00:00Z", "attributes": {"job.id": "new"}}
    ]


def test_codex_login_probe_is_cached_without_starting_a_model_turn(monkeypatch):
    import core.observability as observability

    calls = []

    async def fake_probe(codex_bin, timeout_seconds):
        calls.append((codex_bin, timeout_seconds))
        return "valid"

    monkeypatch.setattr(observability, "_runtime_status_cache", None)
    monkeypatch.setattr(observability.shutil, "which", lambda _: "/fake/codex")
    monkeypatch.setattr(observability.os.path, "isfile", lambda _: True)
    monkeypatch.setattr(observability, "_probe_codex_login", fake_probe)
    assert observability.codex_runtime_status() == {"codex_binary_found": True, "codex_login_status": "valid"}
    assert observability.codex_runtime_status() == {"codex_binary_found": True, "codex_login_status": "valid"}
    assert calls == [("/fake/codex", 2.0)]


def test_codex_login_probe_cache_invalidates_when_the_binary_path_changes(monkeypatch):
    import core.observability as observability

    calls = []

    async def fake_probe(codex_bin, timeout_seconds):
        calls.append(codex_bin)
        return "valid"

    monkeypatch.setattr(observability, "_runtime_status_cache", None)
    monkeypatch.setattr(observability.os.path, "isfile", lambda _: True)
    monkeypatch.setattr(observability, "_probe_codex_login", fake_probe)
    monkeypatch.setenv("CODEX_BIN", "/fake/one")
    observability.codex_runtime_status()
    monkeypatch.setenv("CODEX_BIN", "/fake/two")
    observability.codex_runtime_status()
    assert calls == ["/fake/one", "/fake/two"]


def test_trace_reader_skips_json_rows_without_an_attribute_object(tmp_path):
    trace_path = tmp_path / "traces-123.jsonl"
    trace_path.write_text('["not", "a trace"]\n{"attributes": []}\n')
    assert read_recent_traces(tmp_path) == []


def test_selected_job_trace_survives_newer_worker_log_files(tmp_path):
    from core.observability import MAX_TRACE_FILES

    job_id = str(uuid4())
    directory = tmp_path / "jobs"
    directory.mkdir()
    saved = {"started_at": "2026-01-01T00:00:00Z", "name": "ai.formal_feedback_generation",
             "attributes": {"job.id": job_id}}
    (directory / f"{job_id}.jsonl").write_text(json.dumps(saved) + "\n")
    for index in range(MAX_TRACE_FILES + 2):
        (tmp_path / f"traces-{index}.jsonl").write_text('{"attributes":{}}\n')
    assert read_recent_traces(tmp_path, job_id=job_id) == [saved]
    assert read_recent_traces(tmp_path, job_id="../jobs/" + job_id) == []


def test_exporter_writes_a_redacted_persistent_job_index(monkeypatch, tmp_path):
    from django.conf import settings
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor

    from core.observability import LocalJsonSpanExporter

    monkeypatch.setattr(settings, "LOG_DIR", tmp_path)
    exporter = LocalJsonSpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    job_id = str(uuid4())
    with provider.get_tracer("index-test").start_as_current_span("ai.formal_feedback_generation") as span:
        span.set_attribute("job.id", job_id)
        span.set_attribute("job.kind", "formal")
        span.set_attribute("essay.text", "private essay must never be indexed")
    rows = read_recent_traces(tmp_path, job_id=job_id)
    assert rows[0]["name"] == "ai.formal_feedback_generation"
    assert rows[0]["attributes"] == {"job.id": job_id, "job.kind": "formal"}
    assert "private essay" not in (tmp_path / "jobs" / f"{job_id}.jsonl").read_text()
    provider.shutdown()


def test_job_index_storage_keeps_only_the_newest_complete_rows(tmp_path):
    index_path = tmp_path / "jobs" / f"{uuid4()}.jsonl"
    index_path.parent.mkdir()
    lines = [json.dumps({"sequence": index, "payload": "x" * 30_000}) for index in range(6)]

    for line in lines:
        _append_bounded_job_index(index_path, [line])

    contents = index_path.read_bytes()
    assert len(contents) <= MAX_TRACE_BYTES_PER_FILE
    rows = [json.loads(row) for row in contents.splitlines()]
    expected: list[int] = []
    total = 0
    for line in reversed(lines):
        line_bytes = len((line + "\n").encode("utf-8"))
        if total + line_bytes > MAX_TRACE_BYTES_PER_FILE:
            break
        expected.append(json.loads(line)["sequence"])
        total += line_bytes
    assert [row["sequence"] for row in rows] == list(reversed(expected))


def test_exporter_bounds_its_process_trace_file_to_complete_jsonl_rows(monkeypatch, tmp_path):
    """The main per-process file must not grow forever while a worker stays alive."""
    from django.conf import settings

    from core.observability import LocalJsonSpanExporter

    monkeypatch.setattr(settings, "LOG_DIR", tmp_path)
    exporter = LocalJsonSpanExporter()
    status = SimpleNamespace(status_code=SimpleNamespace(name="OK"))
    spans = [
        SimpleNamespace(
            context=SimpleNamespace(trace_id=index + 1, span_id=index + 1),
            parent=None,
            name="api.request",
            start_time=0,
            end_time=1_000_000,
            status=status,
            attributes={"ai.model": f"{index}:" + "x" * 30_000},
        )
        for index in range(6)
    ]

    exporter.export(spans)

    contents = exporter.path.read_bytes()
    assert len(contents) <= MAX_TRACE_BYTES_PER_FILE
    rows = [json.loads(row) for row in contents.splitlines()]
    assert rows
    assert rows[-1]["attributes"]["ai.model"].startswith("5:")


def test_health_returns_503_when_the_database_connection_fails(monkeypatch):
    from api_v2.observability.views import health

    def unavailable_cursor():
        raise RuntimeError("database unavailable")

    monkeypatch.setattr("api_v2.observability.views.connection.cursor", unavailable_cursor)
    result = health(SimpleNamespace())
    assert result.status_code == 503
    assert result.value == {"ready": False}
