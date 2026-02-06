"""
Django Ninja API v2 for EssayCoach.

This module provides a modern, async-ready API layer using Django Ninja.
It coexists with the existing DRF API (v1) during the migration period.

Usage:
    from api_v2.api import api_v2

    # In urls.py:
    urlpatterns = [
        path("api/v2/", api_v2.urls),  # Ninja API
        path("api/v1/", include(...)),  # DRF API (legacy)
    ]
"""

from ninja import NinjaAPI
from ninja.security import django_auth

# Create the main Ninja API instance
api_v2 = NinjaAPI(
    title="EssayCoach API v2",
    version="2.0.0",
    description="""
    Modern async API for EssayCoach - AI-powered essay analysis platform.

    This API uses Django Ninja for type-safe, high-performance endpoints.

    ## Authentication
    All endpoints require authentication via:
    - **Token Authentication**: `Authorization: Token <your-token>`
    - **Session Authentication**: For browser-based access

    ## Features
    - **AI Feedback**: Essay analysis and feedback generation
    - **Authentication**: User management and authentication
    - **Core**: Classes, rubrics, tasks, submissions, feedback

    ## Migration Status
    This is the new v2 API. The legacy v1 API (DRF) is still available at `/api/v1/`.
    """,
    docs_url="/docs/",
    openapi_url="/openapi.json",
)


# Import and register routers from each module
from .advanced.views import router as advanced_router
from .ai_feedback.views import router as ai_feedback_router
from .auth.views import router as auth_router
from .core.views import router as core_router

api_v2.add_router("/ai-feedback/", ai_feedback_router)
api_v2.add_router("/auth/", auth_router)
api_v2.add_router("/core/", core_router)
api_v2.add_router("/advanced/", advanced_router)
