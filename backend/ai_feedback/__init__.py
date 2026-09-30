"""Shared AI Feedback module for EssayCoach.

This module provides AI-powered essay analysis and feedback generation.
It is designed for API v2 (Django Ninja).
"""

from __future__ import annotations

from .exceptions import (
    APIError,
    APIRateLimitError,
    APIServerError,
    APITimeoutError,
    AuthenticationError,
    ConfigurationError,
    ErrorCode,
    EssayAgentError,
    InputValidationError,
    ResourceError,
    RubricError,
    WorkflowError,
)
from .interfaces import (
    EssayAgentInterface,
    ResponseMode,
    RubricInput,
    RubricProcessorInterface,
    WorkflowInput,
    WorkflowOutput,
    WorkflowStatus,
)
from .rubric_parser import (
    RubricParseError,
    SiliconFlowRubricParser,
)

__all__ = [
    "ErrorCode",
    "EssayAgentError",
    "AuthenticationError",
    "ConfigurationError",
    "InputValidationError",
    "ResourceError",
    "APIError",
    "APITimeoutError",
    "APIRateLimitError",
    "APIServerError",
    "WorkflowError",
    "RubricError",
    "ResponseMode",
    "WorkflowStatus",
    "WorkflowInput",
    "WorkflowOutput",
    "RubricInput",
    "EssayAgentInterface",
    "RubricProcessorInterface",
    "RubricParseError",
    "SiliconFlowRubricParser",
]
