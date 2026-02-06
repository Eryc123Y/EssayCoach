from django.urls import path

from .views import (
    WorkflowRunView,
)

app_name = "ai_feedback"

urlpatterns = [
    # Default workflow (uses environment-configured workflow ID)
    path("agent/workflows/run/", WorkflowRunView.as_view(), name="workflow-run"),
]
