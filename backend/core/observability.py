"""Local OpenTelemetry spans and structured logs without essay content."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
import time
from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar, Token
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from threading import Lock
from uuid import UUID

from django.conf import settings
from opentelemetry import trace
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SpanExporter, SpanExportResult
from opentelemetry.trace import Status, StatusCode

_configured = False
_write_lock = Lock()
_job_context: ContextVar[TraceJob | None] = ContextVar("essaycoach_trace_job", default=None)
_runtime_status_cache: tuple[float, str, dict[str, object]] | None = None
CODEX_STATUS_CACHE_SECONDS = 30.0
MAX_TRACE_FILES = 8
MAX_TRACE_BYTES_PER_FILE = 128 * 1024
_ATTRIBUTES = {
    "http.method", "http.route", "http.status_code", "job.kind", "job.id", "job.status",
    "job.attempts", "job.error_category", "ai.model", "ai.provider", "worker.processed",
}


@dataclass(frozen=True)
class TraceJob:
    kind: str
    identifier: str


def classify_ai_error(error: BaseException, *, default: str = "provider") -> str:
    """Return a stable, non-sensitive category for persisted job state."""
    category = getattr(error, "category", None)
    if isinstance(category, str) and category in {
        "runtime_unavailable", "subscription_login", "timeout", "model_output",
        "source_retrieval", "validation", "provider",
    }:
        return category
    return default


def safe_ai_error_message(category: str, *, workflow: str) -> str:
    """Return staff-safe guidance without exposing provider output or account details."""
    messages = {
        "runtime_unavailable": "The local Codex runtime is unavailable; start or configure Codex and retry.",
        "subscription_login": "The local ChatGPT subscription login is unavailable; sign in to Codex and retry.",
        "timeout": "The AI request timed out; retry the job.",
        "model_output": "The AI response could not be validated; retry the job or review manually.",
        "source_retrieval": "Public source retrieval failed; retry the job.",
        "validation": "The rubric or AI result could not be validated; review the rubric before retrying.",
    }
    return messages.get(category, f"{workflow} failed; check the local AI worker status and retry.")


def bind_ai_job(kind: str, identifier: object) -> Token[TraceJob | None]:
    """Attach a durable task identifier to the current request or worker span."""
    job = TraceJob(kind=kind, identifier=str(identifier))
    span = trace.get_current_span()
    if span.is_recording():
        span.set_attribute("job.kind", job.kind)
        span.set_attribute("job.id", job.identifier)
    return _job_context.set(job)


def reset_ai_job(token: Token[TraceJob | None]) -> None:
    _job_context.reset(token)


def begin_request_ai_context() -> Token[TraceJob | None]:
    """Clear any thread-local job context for the duration of one API request."""
    return _job_context.set(None)


def current_ai_job() -> TraceJob | None:
    """Expose the current task context for local telemetry tests and child spans."""
    return _job_context.get()


@contextmanager
def ai_stage(name: str, *, model: str | None = None) -> Iterator[None]:
    """Trace one provider stage while carrying only task metadata."""
    tracer = trace.get_tracer("essaycoach.ai")
    with tracer.start_as_current_span(f"ai.{name}") as span:
        job = _job_context.get()
        if job is not None:
            span.set_attribute("job.kind", job.kind)
            span.set_attribute("job.id", job.identifier)
        if model:
            span.set_attribute("ai.model", model)
            span.set_attribute("ai.provider", "codex")
        try:
            yield
        except Exception as exc:
            span.set_attribute("job.error_category", classify_ai_error(exc))
            span.set_status(Status(StatusCode.ERROR))
            raise


async def _probe_codex_login(codex_bin: str, timeout_seconds: float) -> str:
    """Read account state only; this does not create a thread or run a model turn."""
    from openai_codex import AsyncCodex, CodexConfig

    async def read_account() -> object:
        async with AsyncCodex(CodexConfig(codex_bin=codex_bin)) as codex:
            return await codex.account()

    response = await asyncio.wait_for(read_account(), timeout=timeout_seconds)
    account = getattr(response, "account", None)
    account_type = getattr(getattr(account, "root", None), "type", None)
    return "valid" if account is not None and account_type == "chatgpt" else "not_logged_in"


def codex_runtime_status(*, timeout_seconds: float = 2.0) -> dict[str, object]:
    """Bounded, cached local runtime probe for the admin operations page."""
    global _runtime_status_cache
    codex_bin = os.environ.get("CODEX_BIN") or shutil.which("codex")
    binary_found = bool(codex_bin and os.path.isfile(codex_bin))
    if not binary_found:
        return {"codex_binary_found": False, "codex_login_status": "runtime_unavailable"}
    now = time.monotonic()
    if _runtime_status_cache and _runtime_status_cache[0] > now and _runtime_status_cache[1] == str(codex_bin):
        return dict(_runtime_status_cache[2])
    try:
        status = asyncio.run(_probe_codex_login(str(codex_bin), timeout_seconds))
    except TimeoutError:
        status = "unknown_timeout"
    except Exception:
        status = "unknown_error"
    result = {"codex_binary_found": True, "codex_login_status": status}
    _runtime_status_cache = (now + CODEX_STATUS_CACHE_SECONDS, str(codex_bin), result)
    return dict(result)


def read_recent_traces(log_dir: Path, *, job_id: str = "", limit: int = 100) -> list[dict]:
    """Read a bounded tail of the newest local trace files, never complete logs."""
    limit = max(1, min(limit, 200))
    try:
        paths = sorted(
            (path for path in log_dir.glob("traces-*.jsonl") if path.is_file()),
            key=lambda path: path.stat().st_mtime,
            reverse=True,
        )[:MAX_TRACE_FILES]
        # A task can outlive several worker processes. Its own bounded index
        # remains selectable after newer process files push the old one out.
        if job_id:
            try:
                job_path = log_dir / "jobs" / f"{UUID(job_id)}.jsonl"
            except ValueError:
                job_path = None
            if job_path is not None and job_path.is_file():
                paths = [job_path]
    except OSError:
        return []
    rows: list[dict] = []
    for path in paths:
        try:
            with path.open("rb") as source:
                source.seek(0, os.SEEK_END)
                source.seek(max(0, source.tell() - MAX_TRACE_BYTES_PER_FILE))
                if source.tell():
                    source.readline()
                lines = source.read().decode("utf-8", errors="replace").splitlines()
        except OSError:
            continue
        for line in lines:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(row, dict):
                continue
            attributes = row.get("attributes")
            if not isinstance(attributes, dict):
                continue
            if job_id and attributes.get("job.id") != job_id:
                continue
            rows.append(row)
    rows.sort(key=lambda row: row.get("started_at", ""), reverse=True)
    return rows[:limit]


def _append_bounded_jsonl(path: Path, lines: list[str]) -> None:
    """Keep only the newest complete JSONL rows in a local trace file."""
    appended = ("\n".join(lines) + "\n").encode("utf-8")
    existing = b""
    try:
        size = path.stat().st_size
        with path.open("rb") as source:
            start = max(0, size - MAX_TRACE_BYTES_PER_FILE)
            source.seek(start)
            if start and source.read(1) != b"\n":
                source.readline()
            existing = source.read()
    except FileNotFoundError:
        pass
    combined = existing + appended
    if len(combined) > MAX_TRACE_BYTES_PER_FILE:
        rows: list[bytes] = []
        row_bytes = 0
        for row in reversed(combined.splitlines(keepends=True)):
            # An oversized or incomplete row cannot be retained within the
            # bound without producing invalid JSONL.
            if not row.endswith(b"\n") or len(row) > MAX_TRACE_BYTES_PER_FILE:
                continue
            if row_bytes + len(row) > MAX_TRACE_BYTES_PER_FILE:
                break
            rows.append(row)
            row_bytes += len(row)
        combined = b"".join(reversed(rows))
    with path.open("wb") as output:
        output.write(combined)


def _append_bounded_job_index(path: Path, lines: list[str]) -> None:
    """Keep only the newest complete JSONL rows in one durable job index."""
    _append_bounded_jsonl(path, lines)


class SafeJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        safe_event_loggers = {"core.ai_jobs", "core.practice", "core.practice_chat", "ai_feedback.practice_provider"}
        event = record.getMessage() if record.name in safe_event_loggers else record.name
        return json.dumps({
            "timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "event": event,
            "trace_id": current_trace_id(),
        }, ensure_ascii=False)


def current_trace_id() -> str | None:
    context = trace.get_current_span().get_span_context()
    return f"{context.trace_id:032x}" if context.is_valid else None


class LocalJsonSpanExporter(SpanExporter):
    def __init__(self) -> None:
        self.path = Path(settings.LOG_DIR) / f"traces-{os.getpid()}.jsonl"

    def export(self, spans) -> SpanExportResult:
        lines = []
        job_lines: dict[str, list[str]] = {}
        for span in spans:
            if span.context is None or span.start_time is None or span.end_time is None:
                continue  # only finished spans are exported; skip anything incomplete
            attributes = {key: value for key, value in (span.attributes or {}).items() if key in _ATTRIBUTES}
            if span.name in {"ai.formal", "ai.practice", "ai.chat"} and not attributes.get("job.id"):
                continue
            line = json.dumps({
                "trace_id": f"{span.context.trace_id:032x}",
                "span_id": f"{span.context.span_id:016x}",
                "parent_span_id": f"{span.parent.span_id:016x}" if span.parent else None,
                "name": span.name,
                "started_at": datetime.fromtimestamp(span.start_time / 1e9, tz=UTC).isoformat(),
                "finished_at": datetime.fromtimestamp(span.end_time / 1e9, tz=UTC).isoformat(),
                "duration_ms": round((span.end_time - span.start_time) / 1e6, 2),
                "status": span.status.status_code.name,
                "attributes": attributes,
            }, ensure_ascii=False)
            lines.append(line)
            if attributes.get("job.id"):
                try:
                    job_id = str(UUID(str(attributes["job.id"])))
                except ValueError:
                    continue
                job_lines.setdefault(job_id, []).append(line)
        if lines:
            try:
                # Both the process trace and each durable job index retain a
                # complete JSONL tail within the same bounded storage budget.
                with _write_lock:
                    _append_bounded_jsonl(self.path, lines)
                    if job_lines:
                        directory = self.path.parent / "jobs"
                        directory.mkdir(exist_ok=True)
                        for job_id, indexed_lines in job_lines.items():
                            _append_bounded_job_index(directory / f"{job_id}.jsonl", indexed_lines)
            except OSError:
                return SpanExportResult.FAILURE
        return SpanExportResult.SUCCESS

    def shutdown(self) -> None:
        return None


def setup_tracing() -> None:
    global _configured
    if _configured or os.environ.get("ESSAYCOACH_TRACING", "1") == "0":
        return
    provider = TracerProvider(resource=Resource.create({SERVICE_NAME: "essaycoach-local"}))
    provider.add_span_processor(BatchSpanProcessor(LocalJsonSpanExporter(), schedule_delay_millis=1000))
    trace.set_tracer_provider(provider)
    _configured = True
