"""
Standardized Pydantic schemas for EssayCoach AI feedback.

These schemas define the input and output formats that are independent of
the underlying AI provider (Dify, LangChain, etc.). They provide a consistent
contract between the frontend and backend.

This module uses Pydantic BaseModel for schema validation with Django Ninja.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class EssayAnalysisInput(BaseModel):
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


class FeedbackItem(BaseModel):
    """Individual feedback item for a rubric criterion."""

    criterion_name: str = Field(..., description="Name of the rubric criterion")
    score: float = Field(..., ge=0, description="Score awarded for this criterion")
    max_score: float = Field(..., ge=0.000001, description="Maximum possible score")
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


class EssayAnalysisOutput(BaseModel):
    """Complete output from essay analysis."""

    overall_score: float = Field(..., ge=0, description="Total score awarded")
    total_possible: float = Field(..., ge=0.000001, description="Maximum possible score")
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
    # Use string type for JSON data to avoid conversion issues
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


class WorkflowRunRequest(BaseModel):
    """Request to start a workflow run."""

    essay_question: str = Field(..., min_length=1, max_length=2000)
    essay_content: str = Field(..., min_length=1, max_length=20000)
    language: str = Field(default="English", max_length=48)
    response_mode: str = Field(default="blocking")
    user_id: str = Field(default="essaycoach-service", max_length=128)
    rubric_id: int | None = Field(default=None)

    @field_validator("response_mode")
    @classmethod
    def validate_response_mode(cls, v: str) -> str:
        if v not in ("blocking", "streaming"):
            raise ValueError("response_mode must be 'blocking' or 'streaming'")
        return v


class WorkflowRunResponse(BaseModel):
    """Response from starting a workflow run."""

    workflow_run_id: str = Field(..., description="Unique identifier for this run")
    task_id: str = Field(..., description="Task identifier for tracking")
    status: str = Field(..., description="Current status of the workflow")
    # Use string type for JSON data to avoid conversion issues
    data: str = Field(default="{}", description="Additional data as JSON string")
    inputs: str = Field(default="{}", description="Input parameters as JSON string")
    response_mode: str = Field(..., description="Requested response mode")
    created_at: datetime = Field(default_factory=datetime.now)


class WorkflowStatusResponse(BaseModel):
    """Response for workflow status check."""

    workflow_run_id: str = Field(...)
    task_id: str = Field(...)
    status: str = Field(...)
    outputs: EssayAnalysisOutput | None = Field(default=None)
    error_message: str | None = Field(default=None)
    elapsed_time_seconds: float | None = Field(default=None)
    # Use string type for JSON data to avoid conversion issues
    token_usage: str = Field(default="{}", description="Token usage as JSON string")
    created_at: datetime | None = Field(default=None)
    finished_at: datetime | None = Field(default=None)
    tracing: str = Field(default="{}", description="Tracing data as JSON string")


class RubricInfo(BaseModel):
    """Information about a rubric."""

    rubric_id: int = Field(...)
    rubric_name: str = Field(...)
    rubric_desc: str | None = Field(default=None)
    item_count: int = Field(default=0)
    is_valid: bool = Field(default=True)


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str = Field(
        ...,
        description="Error details as JSON string",
    )
