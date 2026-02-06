"""
Authentication utilities for Django Ninja API v2.

This module provides authentication classes and utilities for the Ninja API.
It integrates with Django's existing authentication system.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib.auth import get_user_model
from ninja.security import APIKeyHeader, HttpBearer
from rest_framework.authtoken.models import Token

if TYPE_CHECKING:
    from api_v1.core.models import User
else:
    User = get_user_model()


class TokenAuth(HttpBearer):
    """Token-based authentication for Django Ninja.

    This uses the existing DRF Token model for compatibility
    during the migration period.

    Usage:
        @api.get("/protected", auth=TokenAuth())
        def protected_endpoint(request):
            return {"user": request.auth.user_email}
    """

    def authenticate(self, request, token: str) -> User | None:
        """Authenticate using DRF Token.

        Args:
            request: Django request object
            token: The token string from the Authorization header

        Returns:
            User instance if valid, None otherwise
        """
        try:
            token_obj = Token.objects.select_related("user").get(key=token)
            user = token_obj.user
            # Attach token to request for potential logout
            request.token = token_obj
            return user
        except Token.DoesNotExist:
            return None


class OptionalTokenAuth(HttpBearer):
    """Optional token authentication.

    Allows endpoints to work with or without authentication.
    Useful for public endpoints that can provide more data to authenticated users.

    Usage:
        @api.get("/public", auth=OptionalTokenAuth())
        def public_endpoint(request):
            if request.auth:
                return {"message": f"Hello {request.auth.user_email}"}
            return {"message": "Hello guest"}
    """

    def authenticate(self, request, token: str) -> User | None:
        """Authenticate if token provided, otherwise return None."""
        if not token:
            return None
        try:
            token_obj = Token.objects.select_related("user").get(key=token)
            request.token = token_obj
            return token_obj.user
        except Token.DoesNotExist:
            return None


def get_or_create_token(user: User) -> Token:
    """Get existing token or create new one for user.

    This maintains compatibility with the existing auth system.

    Args:
        user: User instance

    Returns:
        Token instance
    """
    token, _ = Token.objects.get_or_create(user=user)
    return token


def delete_user_tokens(user: User) -> None:
    """Delete all tokens for a user (logout).

    Args:
        user: User instance
    """
    Token.objects.filter(user=user).delete()
