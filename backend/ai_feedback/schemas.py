"""
Standardized Pydantic schemas for EssayCoach AI feedback.

These schemas define the input and output formats that are independent of
the underlying AI provider (Dify, LangChain, etc.). They provide a consistent
contract between the frontend and backend.

This module uses drf_pydantic.BaseModel to automatically generate DRF serializers
for API documentation while maintaining full Pydantic validation capabilities.
"""

from __future__ import annotations

from datetime import datetime

from drf_pydantic import BaseModel as DRFBaseModel
from pydantic import Field, field_validator


class EssayAnalysisInput(DRFBaseModel):
    """Input for essay analysis."""

    essay_question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Prompt or question that the student is responding to",
    )
    essay_content: str = Field(
        ...,
        min_length=1,
        max_length=20000,
        description="The full essay text submitted by the student",
    )
    language: str = Field(
        default="English",
        max_length=48,
        description="Optional language hint for the analysis",
    )
    rubric_id: int | None = Field(
        default=None,
        description="ID of the marking rubric to use for grading",
    )
    user_id: str = Field(
        default="essaycoach-service",
        max_length=128,
        description="Unique user identifier",
    )
    response_mode: str = Field(
        default="blocking",
        description="Blocking waits for completion, streaming returns SSE chunks",
    )

    # Enable DRF-Pydantic integration for full validation
    drf_config = {
        "validate_pydantic": True,
    }


class FeedbackItem(DRFBaseModel):
    """Individual feedback item for a rubric criterion."""

    criterion_name: str = Field(..., description="Name of the rubric criterion")
    score: float = Field(..., ge=0, description="Score awarded for this criterion")
    max_score: float = Field(..., gt=0, description="Maximum possible score")
    feedback: str = Field(..., description="Detailed feedback for this criterion")
    suggestions: list[str] = Field(
        default_factory=list,
        description="Actionable suggestions for improvement",
    )
    level_name: str | None = Field(
        default=None,
        description="Name of the achievement level",
    )
    level_description: str | None = Field(
        default=None,
        description="Description of the achievement level",
    )


class EssayAnalysisOutput(DRFBaseModel):
    """Complete output from essay analysis."""

    overall_score: float = Field(..., ge=0, description="Total score awarded")
    total_possible: float = Field(..., gt=0, description="Maximum possible score")
    percentage_score: float = Field(
        ...,
        ge=0,
        le=100,
        description="Score as a percentage",
    )
    feedback_items: list[FeedbackItem] = Field(
        ...,
        description="Feedback for each rubric criterion",
    )
    overall_feedback: str = Field(
        ...,
        description="Overall summary feedback",
    )
    strengths: list[str] = Field(
        default_factory=list,
        description="Identified strengths in the essay",
    )
    suggestions: list[str] = Field(
        default_factory=list,
        description="General suggestions for improvement",
    )
    # Use string type for JSON data to avoid drf_pydantic conversion issues
    # The field will be serialized/deserialized as JSON string
    analysis_metadata: str = Field(
        default="{}",
        description="Provider-specific metadata as JSON string",
    )
    rubric_name: str | None = Field(
        default=None,
        description="Name of the rubric used",
    )
    rubric_id: int | None = Field(
        default=None,
        description="ID of the rubric used",
    )


class WorkflowRunRequest(DRFBaseModel):
    """Request to start a workflow run."""

    essay_question: str = Field(..., min_length=1, max_length=2000)
    essay_content: str = Field(..., min_length=1, max_length=20000)
    language: str = Field(default="English", max_length=48)
    response_mode: str = Field(default="blocking")
    user_id: str | None = Field(default=None, max_length=128)
    rubric_id: int | None = Field(default=None)

    @field_validator("response_mode")
    @classmethod
    def validate_response_mode(cls, v: str) -> str:
        if v not in ("blocking", "streaming"):
            raise ValueError("response_mode must be 'blocking' or 'streaming'")
        return v


class WorkflowRunResponse(DRFBaseModel):
    """Response from starting a workflow run."""

    workflow_run_id: str = Field(..., description="Unique identifier for this run")
    task_id: str = Field(..., description="Task identifier for tracking")
    status: str = Field(..., description="Current status of the workflow")
    # Use string type for JSON data to avoid drf_pydantic conversion issues
    data: str = Field(default="{}", description="Additional data as JSON string")
    inputs: str = Field(default="{}", description="Input parameters as JSON string")
    response_mode: str = Field(..., description="Requested response mode")
    created_at: datetime = Field(default_factory=datetime.now)


class WorkflowStatusResponse(DRFBaseModel):
    """Response for workflow status check."""

    workflow_run_id: str = Field(...)
    task_id: str = Field(...)
    status: str = Field(...)
    outputs: EssayAnalysisOutput | None = Field(default=None)
    error_message: str | None = Field(default=None)
    elapsed_time_seconds: float | None = Field(default=None)
    # Use string type for JSON data to avoid drf_pydantic conversion issues
    token_usage: str = Field(default="{}", description="Token usage as JSON string")
    created_at: datetime | None = Field(default=None)
    finished_at: datetime | None = Field(default=None)
    tracing: str = Field(default="{}", description="Tracing data as JSON string")


class RubricInfo(DRFBaseModel):
    """Information about a rubric."""

    rubric_id: int = Field(...)
    rubric_name: str = Field(...)
    rubric_desc: str | None = Field(default=None)
    item_count: int = Field(default=0)
    is_valid: bool = Field(default=True)


class ErrorResponse(DRFBaseModel):
    """Standard error response."""

    error: str = Field(
        ...,
        description="Error details as JSON string",
    )
