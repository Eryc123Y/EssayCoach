"""
Shared Pydantic schemas for Django Ninja API v2.

These schemas provide base classes and common patterns used across all API modules.
All schemas use Pydantic v2 syntax for maximum compatibility and performance.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from ninja import Schema
from pydantic import Field


class TimestampSchema(Schema):
    """Base schema with timestamp fields.

    Use this as a base for any schema that represents a database model
    with created_at and updated_at fields.
    """

    created_at: datetime = Field(..., description="Timestamp when the record was created")
    updated_at: datetime | None = Field(None, description="Timestamp when the record was last updated")


class ErrorResponse(Schema):
    """Standard error response schema.

    All API errors should return this structure for consistency.
    """

    success: bool = Field(False, description="Always false for error responses")
    error: ErrorDetail = Field(..., description="Error details")


class ErrorDetail(Schema):
    """Detailed error information."""

    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    details: dict[str, Any] | None = Field(None, description="Additional error details (validation errors, etc.)")


class SuccessResponse(Schema):
    """Standard success response schema.

    Most successful operations should return this structure.
    """

    success: bool = Field(True, description="Always true for success responses")
    message: str | None = Field(None, description="Optional success message")


# Generic type parameter for paginated items (PEP 695)


class PaginatedResponse[T](Schema):
    """Generic paginated response schema.

    Use this for list endpoints that support pagination.

    Example:
        class UserOut(Schema):
            id: int
            name: str

        class UserListOut(PaginatedResponse[UserOut]):
            pass
    """

    count: int = Field(..., description="Total number of items")
    next: str | None = Field(None, description="URL for next page (if available)")
    previous: str | None = Field(None, description="URL for previous page (if available)")
    results: list[T] = Field(..., description="List of items for current page")


class PaginationParams(Schema):
    """Query parameters for pagination.

    Use this as a dependency for list endpoints.
    """

    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(50, ge=1, le=100, description="Number of items per page")


class BaseFilterSchema(Schema):
    """Base schema for list filtering.

    Extend this to create filter schemas for specific resources.

    Example:
        class UserFilter(BaseFilterSchema):
            role: str | None = None
            status: str | None = None
            search: str | None = None
    """

    ordering: str | None = Field(None, description="Field to order by (prefix with - for descending)")


# Common field type aliases for consistency
UserId = int
Score = float
Percentage = float
Timestamp = datetime
JSONData = dict[str, Any]


class MessageResponse(Schema):
    """Simple message response for operations that don't return data."""

    message: str = Field(..., description="Response message")
