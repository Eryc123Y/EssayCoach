"""Shared AI Feedback module for EssayCoach.

This module provides AI-powered essay analysis and feedback generation.
It is designed for API v2 (Django Ninja).
"""

from __future__ import annotations

from .dify_client import DifyClient
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
from .response_transformer import (
    DifyResponseTransformer,
    LangChainResponseTransformer,
    ResponseTransformer,
    ResponseTransformerFactory,
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
    "DifyClient",
    "ResponseTransformer",
    "DifyResponseTransformer",
    "LangChainResponseTransformer",
    "ResponseTransformerFactory",
    "RubricParseError",
    "SiliconFlowRubricParser",
]
