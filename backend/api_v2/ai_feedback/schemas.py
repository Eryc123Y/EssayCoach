"""
Django Ninja schemas for AI Feedback module.

These schemas define the input/output formats for AI feedback endpoints.
They are compatible with the existing Pydantic schemas in ai_feedback/schemas.py.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from ninja import Schema
from pydantic import Field, field_validator


class WorkflowRunIn(Schema):
    """Input schema for running AI workflow."""

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
    response_mode: Literal["blocking", "streaming"] = Field(
        default="blocking",
        description="Blocking waits for completion, streaming returns SSE chunks",
    )
    user_id: str = Field(
        default="essaycoach-service",
        max_length=128,
        description="Unique user identifier",
    )
    rubric_id: int | None = Field(
        default=None,
        description="ID of the marking rubric to use for grading",
    )

    @field_validator("response_mode")
    @classmethod
    def validate_response_mode(cls, v: str) -> str:
        if v not in ("blocking", "streaming"):
            raise ValueError("response_mode must be 'blocking' or 'streaming'")
        return v


class WorkflowRunOut(Schema):
    """Output schema for workflow run response."""

    workflow_run_id: str = Field(..., description="Unique identifier for this run")
    task_id: str = Field(..., description="Task identifier for tracking")
    data: WorkflowDataOut = Field(..., description="Workflow execution data")
    inputs: WorkflowInputsOut = Field(..., description="Input parameters")
    response_mode: str = Field(..., description="Requested response mode")


class WorkflowDataOut(Schema):
    """Workflow execution data."""

    id: str = Field(..., description="Workflow run ID")
    status: str = Field(..., description="Current status of the workflow")
    outputs: dict | None = Field(None, description="Workflow outputs if completed")
    error: str | None = Field(None, description="Error message if failed")
    elapsed_time: float | None = Field(None, description="Elapsed time in seconds")
    total_tokens: int | None = Field(None, description="Total tokens used")
    total_steps: None = Field(None, description="Total steps (reserved)")
    created_at: int | None = Field(None, description="Creation timestamp")
    finished_at: int | None = Field(None, description="Completion timestamp")


class WorkflowInputsOut(Schema):
    """Workflow input parameters."""

    essay_question: str
    essay_content: str
    language: str
    essay_rubric: str = Field(default="rubric_file", description="Indicator that rubric was used")


class FeedbackItemOut(Schema):
    """Individual feedback item for a rubric criterion."""

    criterion_name: str = Field(..., description="Name of the rubric criterion")
    score: float = Field(..., ge=0, description="Score awarded for this criterion")
    max_score: float = Field(..., ge=0.000001, description="Maximum possible score")
    feedback: str = Field(..., description="Detailed feedback for this criterion")
    suggestions: list[str] = Field(
        default_factory=list,
        description="Actionable suggestions for improvement",
    )
    level_name: str | None = Field(None, description="Name of the achievement level")
    level_description: str | None = Field(None, description="Description of the achievement level")


class EssayAnalysisOut(Schema):
    """Complete output from essay analysis."""

    overall_score: float = Field(..., ge=0, description="Total score awarded")
    total_possible: float = Field(..., ge=0.000001, description="Maximum possible score")
    percentage_score: float = Field(
        ...,
        ge=0,
        le=100,
        description="Score as a percentage",
    )
    feedback_items: list[FeedbackItemOut] = Field(
        ...,
        description="Feedback for each rubric criterion",
    )
    overall_feedback: str = Field(..., description="Overall summary feedback")
    strengths: list[str] = Field(default_factory=list, description="Identified strengths")
    suggestions: list[str] = Field(default_factory=list, description="General suggestions")
    analysis_metadata: dict = Field(default_factory=dict, description="Provider-specific metadata")
    rubric_name: str | None = Field(None, description="Name of the rubric used")
    rubric_id: int | None = Field(None, description="ID of the rubric used")


class WorkflowStatusOut(Schema):
    """Response for workflow status check."""

    workflow_run_id: str
    task_id: str
    status: str
    outputs: EssayAnalysisOut | None = None
    error_message: str | None = None
    elapsed_time_seconds: float | None = None
    token_usage: dict = Field(default_factory=dict)
    created_at: datetime | None = None
    finished_at: datetime | None = None
    tracing: dict = Field(default_factory=dict)


class ChatMessageIn(Schema):
    """Input for AI chat."""

    message: str = Field(..., min_length=1, max_length=5000)
    context: dict = Field(default_factory=dict, description="Additional context")


class ChatMessageOut(Schema):
    """Output for AI chat response."""

    message: str
    role: Literal["assistant", "system"] = "assistant"
    timestamp: datetime = Field(default_factory=datetime.now)
