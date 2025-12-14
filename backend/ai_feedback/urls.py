from django.urls import path

from .views import (
    SpecificWorkflowRunView,
    WorkflowRunStatusView,
    WorkflowRunView,
)

app_name = "ai_feedback"

urlpatterns = [
    # Default workflow (uses environment-configured workflow ID)
    path("agent/workflows/run/", WorkflowRunView.as_view(), name="workflow-run"),

    # Pin a published workflow version by passing an explicit workflow_id in the path
    path(
        "agent/workflows/<str:workflow_id>/run/",
        SpecificWorkflowRunView.as_view(),
        name="specific-workflow-run",
    ),

    # Poll a previous workflow run for status/output metadata
    path(
        "agent/workflows/run/<str:workflow_run_id>/status/",
        WorkflowRunStatusView.as_view(),
        name="workflow-run-status",
    ),
]
