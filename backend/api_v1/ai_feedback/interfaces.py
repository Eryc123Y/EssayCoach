"""
Abstract interface layer for EssayCoach AI feedback agents.

This module defines the EssayAgentInterface that abstracts away the specific
AI provider (Dify, LangChain, etc.) from the rest of the application.

All AI agents must implement this interface, enabling seamless switching
between providers without affecting the rest of the codebase.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any


class ResponseMode(str, Enum):
    """Response mode for workflow execution."""

    BLOCKING = "blocking"
    STREAMING = "streaming"


class WorkflowStatus(str, Enum):
    """Status of a workflow execution."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class WorkflowInput:
    """Standardized input for essay analysis workflow."""

    essay_question: str
    essay_content: str
    language: str = "English"
    response_mode: ResponseMode = ResponseMode.BLOCKING
    user_id: str = "essaycoach-service"
    rubric_id: int | None = None


@dataclass
class WorkflowOutput:
    """Standardized output from essay analysis workflow."""

    run_id: str
    task_id: str
    status: WorkflowStatus
    outputs: dict[str, Any] | None = None
    error_message: str | None = None
    elapsed_time_seconds: float | None = None
    token_usage: dict[str, int] | None = None
    created_at: datetime | None = None
    finished_at: datetime | None = None


@dataclass
class RubricInput:
    """Standardized rubric input for essay analysis."""

    rubric_id: int | None = None
    user_id: str | None = None


class EssayAgentInterface(ABC):
    """
    Abstract interface for AI essay feedback agents.

    This interface defines the contract that all AI providers (Dify, LangChain,
    OpenAI, Anthropic, etc.) must implement to work with EssayCoach.

    The interface is designed to:
    - Abstract away provider-specific details
    - Enable plug-and-play AI provider switching
    - Provide consistent error handling
    - Support both blocking and streaming responses

    Example:
        ```python
        # Using the interface (provider-agnostic code)
        agent: EssayAgentInterface = DifyAgent()
        result = agent.analyze_essay(
            essay_question="Analyze this thesis statement",
            essay_content="The essay content...",
            user_id="student-123"
        )
        ```
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the name of the AI provider (e.g., 'dify', 'langchain')."""
        pass

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if the agent is properly configured with API keys, etc."""
        pass

    @abstractmethod
    def analyze_essay(
        self,
        inputs: WorkflowInput,
    ) -> WorkflowOutput:
        """
        Analyze an essay and generate feedback.

        This is the main entry point for essay analysis. The implementation
        should handle all aspects of the analysis workflow including:
        - Rubric retrieval and processing
        - Essay analysis
        - Feedback generation

        Args:
            inputs: Standardized workflow input containing essay and parameters

        Returns:
            WorkflowOutput containing analysis results or error information

        Raises:
            EssayAgentError: If the analysis fails
        """
        pass

    @abstractmethod
    def get_workflow_status(self, run_id: str) -> WorkflowOutput:
        """
        Get the status of a running or completed workflow.

        Args:
            run_id: The workflow run ID returned from analyze_essay()

        Returns:
            WorkflowOutput with current status and results if completed

        Raises:
            EssayAgentError: If the status check fails
        """
        pass

    @abstractmethod
    def upload_file(
        self,
        file_path: Path,
        user_id: str,
        file_type: str = "PDF",
    ) -> str:
        """
        Upload a file to the AI provider.

        Used for uploading rubrics and other documents that need to be
        processed by the AI agent.

        Args:
            file_path: Path to the file to upload
            user_id: User identifier for the upload
            file_type: Type of file (PDF, TXT, etc.)

        Returns:
            Upload ID that can be used in subsequent operations

        Raises:
            EssayAgentError: If the upload fails
        """
        pass

    @abstractmethod
    def cancel_workflow(self, run_id: str) -> bool:
        """
        Cancel a running workflow.

        Args:
            run_id: The workflow run ID to cancel

        Returns:
            True if cancelled successfully, False if not found or already completed

        Raises:
            EssayAgentError: If the cancellation fails
        """
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """
        Check if the AI provider is accessible and healthy.

        Returns:
            True if the provider is accessible, False otherwise
        """
        pass


class RubricProcessorInterface(ABC):
    """
    Abstract interface for rubric processing.

    This interface defines how rubrics are converted to a format
    compatible with the AI provider.
    """

    @abstractmethod
    def build_rubric_input(
        self,
        rubric_input: RubricInput,
    ) -> dict[str, Any]:
        """
        Build rubric input structure for the AI provider.

        Args:
            rubric_input: Rubric input containing rubric_id and user_id

        Returns:
            Dictionary structure compatible with the AI provider

        Raises:
            RubricError: If rubric cannot be found or processed
        """
        pass

    @abstractmethod
    def validate_rubric(self, rubric_id: int) -> bool:
        """
        Validate that a rubric exists and has required fields.

        Args:
            rubric_id: The rubric ID to validate

        Returns:
            True if rubric is valid

        Raises:
            RubricError: If rubric is invalid or not found
        """
        pass
