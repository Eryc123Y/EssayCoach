"""
Authentication utilities for Django Ninja API v2.

This module provides authentication classes and utilities for the Ninja API.
It integrates with JWT-based authentication.
"""

from __future__ import annotations

from ninja.security import HttpBearer

from core.models import User

from .jwt_auth import JWTAuth, JWTPair, blacklist_jwt_token, create_jwt_pair


class OptionalTokenAuth(HttpBearer):
    """Optional JWT authentication.

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
        """Authenticate if JWT is provided, otherwise return None."""
        if not token:
            return None
        return JWTAuth().authenticate(request, token)


def create_jwt_for_user(user: User) -> JWTPair:
    """Create a JWT pair for a user.

    Args:
        user: User instance

    Returns:
        JWTPair instance
    """
    return create_jwt_pair(user)


def blacklist_user_tokens(user: User) -> None:
    """Blacklist all outstanding JWT refresh tokens for a user.

    This performs best-effort revocation by blacklisting each known
    outstanding refresh token for the user when token blacklist models
    are available.

    Args:
        user: User instance
    """
    try:
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

        for outstanding in OutstandingToken.objects.filter(user=user):
            blacklist_jwt_token(str(outstanding.token))
    except Exception:
        return


TokenAuth = JWTAuth
get_or_create_token = create_jwt_for_user
delete_user_tokens = blacklist_user_tokens
