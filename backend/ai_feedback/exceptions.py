"""
Unified exception hierarchy for EssayCoach AI Feedback system.

This module provides a standardized exception framework that abstracts away
the underlying AI provider (Dify, LangChain, etc.) from the rest of the
application. All AI-related errors inherit from EssayAgentError.
"""

from __future__ import annotations

from enum import Enum
from typing import Any


class ErrorCode(str, Enum):
    """Standardized error codes for AI feedback operations."""

    # Authentication & Configuration
    AUTH_MISSING_API_KEY = "AUTH_MISSING_API_KEY"
    AUTH_INVALID_API_KEY = "AUTH_INVALID_API_KEY"
    CONFIG_MISSING = "CONFIG_MISSING"
    CONFIG_INVALID = "CONFIG_INVALID"

    # Input Validation
    INPUT_EMPTY_ESSAY = "INPUT_EMPTY_ESSAY"
    INPUT_ESSAY_TOO_LONG = "INPUT_ESSAY_TOO_LONG"
    INPUT_MISSING_REQUIRED = "INPUT_MISSING_REQUIRED"
    INPUT_INVALID_FORMAT = "INPUT_INVALID_FORMAT"

    # Resource Issues
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    RESOURCE_UPLOAD_FAILED = "RESOURCE_UPLOAD_FAILED"
    RESOURCE_QUOTA_EXCEEDED = "RESOURCE_QUOTA_EXCEEDED"

    # API Errors
    API_REQUEST_FAILED = "API_REQUEST_FAILED"
    API_TIMEOUT = "API_TIMEOUT"
    API_RATE_LIMITED = "API_RATE_LIMITED"
    API_SERVER_ERROR = "API_SERVER_ERROR"
    API_RESPONSE_INVALID = "API_RESPONSE_INVALID"

    # Workflow Errors
    WORKFLOW_NOT_FOUND = "WORKFLOW_NOT_FOUND"
    WORKFLOW_EXECUTION_FAILED = "WORKFLOW_EXECUTION_FAILED"
    WORKFLOW_CANCELLED = "WORKFLOW_CANCELLED"

    # Rubric Errors
    RUBRIC_NOT_FOUND = "RUBRIC_NOT_FOUND"
    RUBRIC_EMPTY = "RUBRIC_EMPTY"
    RUBRIC_BUILD_FAILED = "RUBRIC_BUILD_FAILED"

    # General
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


class EssayAgentError(Exception):
    """
    Base exception for all AI feedback related errors.

    This exception abstracts away the specific AI provider (Dify, LangChain, etc.)
    from the rest of the application. All provider-specific errors should be
    caught and re-raised as this or a subclass.

    Attributes:
        message: Human-readable error description
        code: Standardized error code
        recoverable: Whether the operation can be retried
        details: Additional context for debugging
        original_error: The underlying exception that caused this error
    """

    def __init__(
        self,
        message: str,
        code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        recoverable: bool = False,
        details: dict[str, Any] | None = None,
        original_error: Exception | None = None,
    ) -> None:
        self.message = message
        self.code = code
        self.recoverable = recoverable
        self.details = details or {}
        self.original_error = original_error

        super().__init__(self.message)

    def __str__(self) -> str:
        return f"[{self.code.value}] {self.message}"

    def to_dict(self) -> dict[str, Any]:
        """Convert exception to a dictionary suitable for API responses."""
        return {
            "error": {
                "code": self.code.value,
                "message": self.message,
                "recoverable": self.recoverable,
                "details": self.details,
            }
        }


class AuthenticationError(EssayAgentError):
    """Raised when authentication with AI provider fails."""

    def __init__(
        self,
        message: str = "Authentication with AI provider failed",
        details: dict[str, Any] | None = None,
        original_error: Exception | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code=ErrorCode.AUTH_INVALID_API_KEY,
            recoverable=False,
            details=details,
            original_error=original_error,
        )


class ConfigurationError(EssayAgentError):
    """Raised when required configuration is missing or invalid."""

    def __init__(
        self,
        message: str = "AI service configuration is missing or invalid",
        config_key: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        error_details = {"config_key": config_key} if config_key else {}
        error_details.update(details or {})

        super().__init__(
            message=message,
            code=ErrorCode.CONFIG_INVALID,
            recoverable=False,
            details=error_details,
        )


class InputValidationError(EssayAgentError):
    """Raised when input validation fails."""

    def __init__(
        self,
        message: str,
        field: str | None = None,
        value: Any = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        error_details = {"field": field, "value": value} if field else {}
        error_details.update(details or {})

        super().__init__(
            message=message,
            code=ErrorCode.INPUT_INVALID_FORMAT,
            recoverable=False,
            details=error_details,
        )


class ResourceError(EssayAgentError):
    """Raised when a required resource cannot be accessed or created."""

    def __init__(
        self,
        message: str,
        resource_type: str | None = None,
        resource_id: str | None = None,
        recoverable: bool = False,
        details: dict[str, Any] | None = None,
    ) -> None:
        error_details = {"resource_type": resource_type, "resource_id": resource_id}
        error_details.update(details or {})

        code = ErrorCode.RESOURCE_NOT_FOUND if not recoverable else ErrorCode.RESOURCE_UPLOAD_FAILED

        super().__init__(
            message=message,
            code=code,
            recoverable=recoverable,
            details=error_details,
        )


class APIError(EssayAgentError):
    """Base exception for API-related errors."""

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        recoverable: bool = False,
        details: dict[str, Any] | None = None,
        original_error: Exception | None = None,
    ) -> None:
        error_details = {"status_code": status_code} if status_code else {}
        error_details.update(details or {})

        super().__init__(
            message=message,
            code=ErrorCode.API_REQUEST_FAILED,
            recoverable=recoverable,
            details=error_details,
            original_error=original_error,
        )


class APITimeoutError(APIError):
    """Raised when an API request times out."""

    def __init__(
        self,
        timeout_seconds: int | None = None,
        details: dict[str, Any] | None = None,
        original_error: Exception | None = None,
    ) -> None:
        error_details = {"timeout_seconds": timeout_seconds} if timeout_seconds else {}
        error_details.update(details or {})

        timeout_msg = (
            f"AI service request timed out{' after ' + str(timeout_seconds) + ' seconds' if timeout_seconds else ''}"
        )
        super().__init__(
            message=timeout_msg,
            status_code=504,
            recoverable=True,
            details=error_details,
            original_error=original_error,
        )


class APIRateLimitError(APIError):
    """Raised when API rate limit is exceeded."""

    def __init__(
        self,
        retry_after: int | None = None,
        details: dict[str, Any] | None = None,
        original_error: Exception | None = None,
    ) -> None:
        error_details = {"retry_after": retry_after} if retry_after else {}
        error_details.update(details or {})

        super().__init__(
            message="AI service rate limit exceeded",
            status_code=429,
            recoverable=True,
            details=error_details,
            original_error=original_error,
        )


class APIServerError(APIError):
    """Raised when AI provider server returns an error."""

    def __init__(
        self,
        status_code: int,
        message: str | None = None,
        details: dict[str, Any] | None = None,
        original_error: Exception | None = None,
    ) -> None:
        super().__init__(
            message=message or f"AI provider server error (status {status_code})",
            status_code=status_code,
            recoverable=status_code >= 500,
            details=details,
            original_error=original_error,
        )


class WorkflowError(EssayAgentError):
    """Raised when workflow execution fails."""

    def __init__(
        self,
        message: str,
        workflow_id: str | None = None,
        run_id: str | None = None,
        recoverable: bool = False,
        details: dict[str, Any] | None = None,
    ) -> None:
        error_details = {"workflow_id": workflow_id, "run_id": run_id}
        error_details.update(details or {})

        super().__init__(
            message=message,
            code=ErrorCode.WORKFLOW_EXECUTION_FAILED,
            recoverable=recoverable,
            details=error_details,
        )


class RubricError(EssayAgentError):
    """Raised when rubric-related operations fail."""

    def __init__(
        self,
        message: str,
        rubric_id: int | None = None,
        recoverable: bool = False,
        details: dict[str, Any] | None = None,
    ) -> None:
        error_details = {"rubric_id": rubric_id}
        error_details.update(details or {})

        code = ErrorCode.RUBRIC_NOT_FOUND if "not found" in message.lower() else ErrorCode.RUBRIC_BUILD_FAILED

        super().__init__(
            message=message,
            code=code,
            recoverable=recoverable,
            details=error_details,
        )
