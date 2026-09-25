"""Local OpenTelemetry spans and structured logs without essay content."""

from __future__ import annotations

import json
import logging
import os
from datetime import UTC, datetime
from pathlib import Path
from threading import Lock

from django.conf import settings
from opentelemetry import trace
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SpanExporter, SpanExportResult

_configured = False
_write_lock = Lock()
_ATTRIBUTES = {
    "http.method", "http.route", "http.status_code", "job.kind", "job.id", "job.status",
    "job.attempts", "job.error_category", "ai.model", "ai.provider", "worker.processed",
}


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
        for span in spans:
            attributes = {key: value for key, value in (span.attributes or {}).items() if key in _ATTRIBUTES}
            if span.name.startswith("ai.") and not attributes.get("job.id"):
                continue
            lines.append(json.dumps({
                "trace_id": f"{span.context.trace_id:032x}",
                "span_id": f"{span.context.span_id:016x}",
                "parent_span_id": f"{span.parent.span_id:016x}" if span.parent else None,
                "name": span.name,
                "started_at": datetime.fromtimestamp(span.start_time / 1e9, tz=UTC).isoformat(),
                "finished_at": datetime.fromtimestamp(span.end_time / 1e9, tz=UTC).isoformat(),
                "duration_ms": round((span.end_time - span.start_time) / 1e6, 2),
                "status": span.status.status_code.name,
                "attributes": attributes,
            }, ensure_ascii=False))
        if lines:
            try:
                with _write_lock, self.path.open("a", encoding="utf-8") as output:
                    output.write("\n".join(lines) + "\n")
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
