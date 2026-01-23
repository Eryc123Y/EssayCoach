"""
Utility functions for authentication app.
"""
from typing import TYPE_CHECKING, Any

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.response import Response

# Use TYPE_CHECKING to provide type hints while maintaining runtime flexibility.
# This pattern allows type checkers (mypy/pyright) to see the concrete User model
# for accurate type checking, while Python runtime uses get_user_model() to support
# custom user models as per Django best practices.
if TYPE_CHECKING:
    # Type checkers will see this import and know the exact User model type
    from ..core.models import User
else:
    # Python runtime will execute this, maintaining flexibility for custom user models
    User = get_user_model()


def format_success_response(
    data: dict[str, Any],
    message: str | None = None
) -> dict[str, Any]:
    """
    Format a successful API response.

    Args:
        data: Response data dictionary
        message: Optional success message

    Returns:
        dict: Formatted response
    """
    response: dict[str, Any] = {
        "success": True,
        "data": data
    }
    if message:
        response["message"] = message
    return response


def format_error_response(
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
    status_code: int = 400
) -> Response:
    """
    Format an error API response.

    Args:
        code: Error code string
        message: Error message
        details: Optional error details dictionary
        status_code: HTTP status code

    Returns:
        Response: DRF Response object with error format
    """
    error: dict[str, Any] = {
        "code": code,
        "message": message
    }
    if details:
        error["details"] = details

    return Response(
        {
            "success": False,
            "error": error
        },
        status=status_code
    )


def get_or_create_token(user: User) -> Token:
    """
    Get or create a token for a user.

    Args:
        user: User instance

    Returns:
        Token: Token object
    """
    token, created = Token.objects.get_or_create(user=user)
    return token
