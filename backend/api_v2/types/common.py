"""
Common Pydantic schemas shared across all API v2 modules.

These schemas were previously duplicated in core/schemas.py, auth/schemas.py,
and schemas/base.py. This module is now the single source of truth.
"""

from __future__ import annotations

from ninja import Schema
from pydantic import Field


class PaginationParams(Schema):
    """Query parameters for paginated list endpoints."""

    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(50, ge=1, le=100, description="Items per page")


class MessageResponse(Schema):
    """Simple message response for operations that do not return data."""

    message: str = Field(..., description="Response message")


class ErrorResponse(Schema):
    """Lightweight error response for non-structured error payloads."""

    error: str = Field(..., description="Error description")
