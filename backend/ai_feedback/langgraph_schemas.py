"""Pydantic models for LLM structured output (LangGraph essay agent)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class FeedbackItemLLM(BaseModel):
    criterion_name: str = Field(description="Rubric criterion name")
    score: float = Field(ge=0, description="Score awarded")
    max_score: float = Field(gt=0, description="Maximum points for this criterion")
    feedback: str = Field(description="Feedback for this criterion")
    suggestions: list[str] = Field(default_factory=list)
    level_name: str | None = None
    level_description: str | None = None


class EssayAnalysisLLM(BaseModel):
    """Structured analysis returned by the model; mapped to API EssayAnalysisOut."""

    overall_score: float = Field(ge=0)
    total_possible: float = Field(gt=0)
    percentage_score: float = Field(ge=0, le=100)
    feedback_items: list[FeedbackItemLLM]
    overall_feedback: str
    strengths: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    rubric_name: str | None = None
    rubric_id: int | None = None
