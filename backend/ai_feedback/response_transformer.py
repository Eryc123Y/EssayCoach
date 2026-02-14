"""
Response transformer for converting AI provider responses to standard format.

This module provides transformers that convert responses from different AI
providers (Dify, LangChain, etc.) into the standardized EssayAnalysisOutput
format used by EssayCoach.
"""

from __future__ import annotations

from typing import Any

from .exceptions import APIError
from .interfaces import WorkflowOutput, WorkflowStatus
from .schemas import (
    EssayAnalysisOutput,
    FeedbackItem,
)


class ResponseTransformer:
    """
    Transform AI provider responses to standard EssayAnalysisOutput format.

    This class handles the conversion of raw responses from various AI
    providers into a consistent output format, regardless of the provider.
    """

    def __init__(self, provider_name: str = "unknown") -> None:
        self.provider_name = provider_name

    def to_analysis_output(self, raw_response: dict[str, Any]) -> EssayAnalysisOutput:
        """
        Convert raw provider response to EssayAnalysisOutput.

        Args:
            raw_response: Raw response from the AI provider

        Returns:
            Standardized EssayAnalysisOutput

        Raises:
            APIError: If the response cannot be parsed
        """
        try:
            # Extract outputs from response
            outputs = raw_response.get("outputs", {}) or {}

            # Parse feedback items
            feedback_items = self._parse_feedback_items(outputs.get("results", []))

            # Calculate overall score
            overall_score = self._parse_score(outputs)
            total_possible = self._parse_total_possible(outputs)

            # Calculate percentage
            percentage = (overall_score / total_possible * 100) if total_possible > 0 else 0

            return EssayAnalysisOutput(
                overall_score=overall_score,
                total_possible=total_possible,
                percentage_score=round(percentage, 2),
                feedback_items=feedback_items,
                overall_feedback=self._parse_overall_feedback(outputs),
                strengths=self._parse_list_field(outputs, "strengths"),
                suggestions=self._parse_list_field(outputs, "overall_suggestions"),
                analysis_metadata={
                    "provider": self.provider_name,
                    "model_used": outputs.get("model_used"),
                    "tokens_used": outputs.get("total_tokens"),
                    "raw_response_keys": list(raw_response.keys()),
                },
                rubric_name=outputs.get("rubric_name"),
                rubric_id=outputs.get("rubric_id"),
            )
        except Exception as e:
            raise APIError(
                message=f"Failed to parse AI provider response: {str(e)}",
                recoverable=False,
                details={"provider": self.provider_name},
                original_error=e,
            )

    def to_workflow_output(self, raw_response: dict[str, Any]) -> WorkflowOutput:
        """
        Convert raw provider response to WorkflowOutput.

        Args:
            raw_response: Raw response from the AI provider

        Returns:
            Standardized WorkflowOutput
        """
        return WorkflowOutput(
            run_id=raw_response.get("workflow_run_id", ""),
            task_id=raw_response.get("task_id", ""),
            status=self._parse_status(raw_response.get("status")),
            outputs=raw_response.get("outputs"),
            error_message=raw_response.get("error_message"),
            elapsed_time_seconds=raw_response.get("elapsed_time"),
            token_usage=raw_response.get("metadata", {}).get("usage"),
            created_at=raw_response.get("created_at"),
            finished_at=raw_response.get("finished_at"),
        )

    def _parse_feedback_items(self, results: list[dict[str, Any]] | None) -> list[FeedbackItem]:
        """Parse feedback items from results list."""
        if not results:
            return []

        items = []
        for result in results:
            if not isinstance(result, dict):
                continue

            items.append(
                FeedbackItem(
                    criterion_name=result.get("criterion", "Unknown Criterion"),
                    score=float(result.get("score", 0)),
                    max_score=float(result.get("max_score", 100)),
                    feedback=result.get("feedback", ""),
                    suggestions=self._parse_list_field(result, "suggestions"),
                    level_name=result.get("level_name"),
                    level_description=result.get("level_description"),
                )
            )

        return items

    def _parse_score(self, outputs: dict[str, Any]) -> float:
        """Parse overall score from outputs."""
        # Try different field names that providers might use
        for field in ["total_score", "overall_score", "score", "total"]:
            if field in outputs:
                return float(outputs[field])
        return 0.0

    def _parse_total_possible(self, outputs: dict[str, Any]) -> float:
        """Parse maximum possible score from outputs."""
        for field in ["max_score", "total_possible", "max_possible", "total"]:
            if field in outputs:
                return float(outputs[field])
        return 100.0

    def _parse_overall_feedback(self, outputs: dict[str, Any]) -> str:
        """Parse overall feedback from outputs."""
        for field in ["overall_feedback", "summary", "feedback_summary", "conclusion"]:
            if field in outputs:
                return str(outputs[field])
        return "No overall feedback available."

    def _parse_list_field(self, data: dict[str, Any], field_name: str) -> list[str]:
        """Parse a list field, handling various formats."""
        value = data.get(field_name)
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item) for item in value]
        if isinstance(value, str):
            return [value] if value else []
        return []

    def _parse_status(self, status: str | None) -> WorkflowStatus:
        """Parse workflow status from string."""
        if not status:
            return WorkflowStatus.PENDING

        status_lower = status.lower()
        status_map = {
            "pending": WorkflowStatus.PENDING,
            "running": WorkflowStatus.RUNNING,
            "succeeded": WorkflowStatus.SUCCEEDED,
            "failed": WorkflowStatus.FAILED,
            "error": WorkflowStatus.FAILED,
            "cancelled": WorkflowStatus.CANCELLED,
            "canceled": WorkflowStatus.CANCELLED,
        }

        return status_map.get(status_lower, WorkflowStatus.PENDING)


class DifyResponseTransformer(ResponseTransformer):
    """Transformer specifically for Dify API responses."""

    def __init__(self) -> None:
        super().__init__(provider_name="dify")

    def to_analysis_output(self, raw_response: dict[str, Any]) -> EssayAnalysisOutput:
        """
        Convert Dify-specific response to EssayAnalysisOutput.

        Dify returns responses in a specific format with outputs nested
        under the 'data' key for some endpoints.
        """
        # Handle Dify's response structure
        data = raw_response.get("data", raw_response)
        outputs = data.get("outputs", {}) if data else {}

        return super().to_analysis_output({"outputs": outputs})

    def to_workflow_output(self, raw_response: dict[str, Any]) -> WorkflowOutput:
        """Convert Dify workflow response to WorkflowOutput."""
        return WorkflowOutput(
            run_id=raw_response.get("workflow_run_id", ""),
            task_id=raw_response.get("task_id", ""),
            status=self._parse_status(raw_response.get("status")),
            outputs=raw_response.get("outputs"),
            error_message=raw_response.get("error"),
            elapsed_time_seconds=raw_response.get("elapsed_time"),
            token_usage=raw_response.get("metadata", {}).get("usage") if "metadata" in raw_response else None,
            created_at=raw_response.get("created_at"),
            finished_at=raw_response.get("finished_at"),
        )


class LangChainResponseTransformer(ResponseTransformer):
    """Transformer specifically for LangChain responses."""

    def __init__(self) -> None:
        super().__init__(provider_name="langchain")

    def to_analysis_output(self, raw_response: dict[str, Any]) -> EssayAnalysisOutput:
        """
        Convert LangChain-specific response to EssayAnalysisOutput.

        LangChain responses have a different structure than Dify.
        """
        # LangChain responses are typically direct
        return super().to_analysis_output(raw_response)


class ResponseTransformerFactory:
    """Factory for creating appropriate response transformers."""

    _transformers: dict[str, type[ResponseTransformer]] = {
        "dify": DifyResponseTransformer,
        "langchain": LangChainResponseTransformer,
    }

    @classmethod
    def get_transformer(cls, provider: str) -> ResponseTransformer:
        """
        Get the appropriate transformer for a provider.

        Args:
            provider: Provider name (e.g., 'dify', 'langchain')

        Returns:
            ResponseTransformer instance

        Raises:
            ValueError: If provider is not supported
        """
        if provider in cls._transformers:
            return cls._transformers[provider]()

        # Return generic transformer for unknown providers
        return ResponseTransformer(provider_name=provider)

    @classmethod
    def register_transformer(cls, provider: str, transformer_class: type[ResponseTransformer]) -> None:
        """Register a new transformer for a provider."""
        cls._transformers[provider] = transformer_class
