"""Trace API request latency without collecting payloads or full URLs."""

from __future__ import annotations

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

from core.observability import current_trace_id


class ApiTelemetryMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.tracer = trace.get_tracer("essaycoach.api")

    def __call__(self, request):
        if not request.path.startswith("/api/v2/"):
            return self.get_response(request)
        with self.tracer.start_as_current_span("api.request") as span:
            span.set_attribute("http.method", request.method)
            span.set_attribute("http.route", "/api/v2/*")
            try:
                response = self.get_response(request)
            except Exception:
                span.set_status(Status(StatusCode.ERROR))
                raise
            span.set_attribute("http.status_code", response.status_code)
            if response.status_code >= 500:
                span.set_status(Status(StatusCode.ERROR))
            trace_id = current_trace_id()
            if trace_id:
                response["X-Trace-Id"] = trace_id
            return response
