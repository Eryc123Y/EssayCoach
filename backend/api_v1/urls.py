"""URL configuration for legacy DRF API v1."""

from django.urls import include, path

urlpatterns = [
    path("auth/", include("api_v1.auth.urls")),
    path("core/", include("api_v1.core.urls")),
    path("ai-feedback/", include("api_v1.ai_feedback.urls")),
]
