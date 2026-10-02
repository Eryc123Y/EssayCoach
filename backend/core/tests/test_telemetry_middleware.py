from types import SimpleNamespace

from core.observability import bind_ai_job, current_ai_job, reset_ai_job
from core.telemetry_middleware import ApiTelemetryMiddleware


def test_api_middleware_clears_stale_job_context_for_each_request():
    stale_token = bind_ai_job("formal", "stale-job")
    seen = []

    def response(_request):
        seen.append(current_ai_job())
        return SimpleNamespace(status_code=200)

    middleware = ApiTelemetryMiddleware(response)
    request = SimpleNamespace(path="/api/v2/health/", method="GET")
    middleware(request)
    middleware(request)

    assert seen == [None, None]
    reset_ai_job(stale_token)
