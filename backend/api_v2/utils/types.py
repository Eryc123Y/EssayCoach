"""
Type utilities and helpers for Django Ninja API v2.

This module re-exports centralized types from ``api_v2.types`` and provides
helper functions for pagination and response formatting.

Migration note (2026-02-28): Literal types and bare int aliases previously
defined here have been replaced by StrEnum and NewType definitions in
``api_v2.types.enums`` and ``api_v2.types.ids``. This module now re-exports
them for backward compatibility.
"""

from __future__ import annotations

from typing import TypedDict

# Re-export all enums from centralized kernel
from api_v2.types.enums import (  # noqa: F401
    FeedbackSource,
    ResponseMode,
    UserRole,
    UserStatus,
    WorkflowStatus,
)

# Re-export all typed IDs from centralized kernel
from api_v2.types.ids import (  # noqa: F401
    ClassId,
    FeedbackId,
    RubricId,
    SubmissionId,
    TaskId,
    UserId,
)

# =============================================================================
# TypedDict for API Responses
# =============================================================================


class TokenResponse(TypedDict):
    """Token authentication response."""

    token: str
    user: UserDict


class UserDict(TypedDict, total=False):
    """User data dictionary."""

    id: int
    email: str
    username: str
    first_name: str | None
    last_name: str | None
    name: str
    avatar: str | None
    role: UserRole
    status: UserStatus
    date_joined: str


class ErrorDict(TypedDict):
    """Error response dictionary."""

    code: str
    message: str
    details: dict | None


# =============================================================================
# Helper Functions
# =============================================================================


def drf_serializer_to_ninja_schema(serializer_class: type) -> type:
    """Convert a DRF serializer to a Ninja/Pydantic schema.

    This is a helper for gradual migration. It extracts field information
    from a DRF serializer and creates an equivalent Pydantic model.

    Args:
        serializer_class: The DRF serializer class to convert

    Returns:
        A Pydantic BaseModel class equivalent to the serializer

    Example:
        UserSchema = drf_serializer_to_ninja_schema(UserSerializer)
    """
    # This is a placeholder for actual implementation
    # In practice, you'd inspect the serializer fields and create
    # equivalent Pydantic fields
    raise NotImplementedError("Automatic serializer conversion not yet implemented. Please create schemas manually.")


def paginate_queryset(queryset, page: int, page_size: int) -> dict:
    """Paginate a Django queryset.

    Args:
        queryset: Django queryset to paginate
        page: Page number (1-indexed)
        page_size: Number of items per page

    Returns:
        Dict with count, results, and pagination metadata

    Example:
        data = paginate_queryset(User.objects.all(), page=1, page_size=50)
        return PaginatedResponse[UserOut](**data)
    """
    total = queryset.count()
    start = (page - 1) * page_size
    end = start + page_size

    return {
        "count": total,
        "next": f"?page={page + 1}&page_size={page_size}" if end < total else None,
        "previous": f"?page={page - 1}&page_size={page_size}" if page > 1 else None,
        "results": list(queryset[start:end]),
    }


def format_success_response(data: dict | None = None, message: str | None = None) -> dict:
    """Format a standard success response.

    This maintains compatibility with the existing frontend response format.

    Args:
        data: Response data (optional)
        message: Success message (optional)

    Returns:
        Formatted response dict
    """
    response: dict = {"success": True}
    if data is not None:
        response["data"] = data
    if message is not None:
        response["message"] = message
    return response


def format_error_response(
    code: str, message: str, details: dict | None = None, status_code: int = 400
) -> tuple[dict, int]:
    """Format a standard error response.

    This maintains compatibility with the existing frontend response format.

    Args:
        code: Error code (e.g., "INVALID_INPUT", "NOT_FOUND")
        message: Human-readable error message
        details: Additional error details (e.g., validation errors)
        status_code: HTTP status code

    Returns:
        Tuple of (response dict, status code)
    """
    response = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
    }
    if details is not None:
        response["error"]["details"] = details
    return response, status_code


# =============================================================================
# Score type aliases
# =============================================================================

Score = float
Percentage = float
Weight = float
