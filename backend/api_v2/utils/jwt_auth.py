"""
JWT utilities for Django Ninja API v2.

This module provides JWT token generation and verification for the Ninja API.
It uses djangorestframework-simplejwt for JWT handling.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

import jwt
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

if TYPE_CHECKING:
    from core.models import User


# In-memory token blacklist (for single-instance deployments)
# In production, use Redis or database-backed storage
_token_blacklist: set[str] = set()


def get_jwt_secret() -> str:
    """Get JWT secret from settings or use a default for development."""
    secret = getattr(settings, "JWT_SECRET_KEY", None)
    if not secret:
        secret = getattr(settings, "SECRET_KEY", "dev-secret-key-change-in-production")
    return secret


def get_jwt_algorithm() -> str:
    """Get JWT algorithm from settings."""
    return getattr(settings, "JWT_ALGORITHM", "HS256")


def get_token_lifetime() -> timedelta:
    """Get token lifetime from settings."""
    hours = getattr(settings, "JWT_ACCESS_TOKEN_LIFETIME_HOURS", 24)
    return timedelta(hours=hours)


def get_refresh_token_lifetime() -> timedelta:
    """Get refresh token lifetime from settings."""
    days = getattr(settings, "JWT_REFRESH_TOKEN_LIFETIME_DAYS", 7)
    return timedelta(days=days)


class JWTPair:
    """
    JWT token pair (access + refresh).

    Attributes:
        access: The short-lived access token
        refresh: The long-lived refresh token
        expires_at: Access token expiration datetime
    """

    def __init__(self, access: str, refresh: str, expires_at: datetime):
        self.access = access
        self.refresh = refresh
        self.expires_at = expires_at


def create_jwt_pair(user: User) -> JWTPair:
    """
    Create a JWT token pair for a user.

    Uses djangorestframework-simplejwt to generate tokens.

    Args:
        user: User instance

    Returns:
        JWTPair containing access token, refresh token, and expiration
    """
    # Use DRF SimpleJWT's built-in token generation
    refresh = RefreshToken.for_user(user)

    # Set custom claims
    refresh["user_id"] = user.user_id
    refresh["email"] = user.user_email
    refresh["role"] = user.user_role or "student"

    # Get access token from refresh token
    access = refresh.access_token

    # Calculate expiration
    expires_at = datetime.fromtimestamp(access["exp"], tz=timezone.utc)

    return JWTPair(
        access=str(access),
        refresh=str(refresh),
        expires_at=expires_at,
    )


def _get_token_jti(token: str) -> str | None:
    """Extract JTI (JWT ID) from a token."""
    try:
        # Decode without verification to get JTI
        # We just need the JTI for blacklisting
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
            options={"verify_signature": False},
        )
        return payload.get("jti")
    except Exception:
        return None


def _is_token_blacklisted(jti: str) -> bool:
    """Check if a token JTI is blacklisted."""
    return jti in _token_blacklist


def _add_to_blacklist(jti: str) -> None:
    """Add a token JTI to the blacklist."""
    _token_blacklist.add(jti)


def verify_jwt_token(token: str) -> dict | None:
    """
    Verify a JWT token and return its payload.

    Args:
        token: The JWT token string to verify

    Returns:
        Token payload dict if valid, None otherwise
    """
    try:
        # First try with SimpleJWT
        from rest_framework_simplejwt.tokens import AccessToken

        access_token = AccessToken(token)

        # Check if token is blacklisted
        jti = access_token.get("jti")
        if jti and _is_token_blacklisted(jti):
            return None

        return dict(access_token)
    except (TokenError, jwt.InvalidTokenError, Exception):
        pass

    # Fallback to manual verification
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
        )

        # Check if token is blacklisted
        jti = payload.get("jti")
        if jti and _is_token_blacklisted(jti):
            return None

        return payload
    except jwt.InvalidTokenError:
        return None


def refresh_jwt_token(refresh_token: str) -> JWTPair | None:
    """
    Refresh a JWT token pair using a refresh token.

    This implements token rotation - each refresh generates new tokens
    and blacklists the old refresh token.

    Args:
        refresh_token: The refresh token string

    Returns:
        New JWTPair if refresh is valid, None otherwise
    """
    try:
        # Use SimpleJWT's refresh mechanism
        from rest_framework_simplejwt.tokens import RefreshToken

        # Get the old JTI before creating new token
        old_payload = jwt.decode(
            refresh_token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
            options={"verify_signature": False},
        )
        old_jti = old_payload.get("jti")

        # Create new tokens
        refresh = RefreshToken(refresh_token)

        # Blacklist the old refresh token
        if old_jti:
            _add_to_blacklist(old_jti)

        # Get new access token
        access = refresh.access_token

        # Calculate expiration
        expires_at = datetime.fromtimestamp(access["exp"], tz=timezone.utc)

        return JWTPair(
            access=str(access),
            refresh=str(refresh),
            expires_at=expires_at,
        )
    except (TokenError, jwt.InvalidTokenError, Exception):
        return None


def blacklist_jwt_token(token: str) -> bool:
    """
    Blacklist a JWT token (add to denied list).

    Args:
        token: The token to blacklist

    Returns:
        True if successful, False otherwise
    """
    try:
        # Try to decode and get JTI
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
            options={"verify_signature": False},
        )

        jti = payload.get("jti")
        if jti:
            _add_to_blacklist(jti)
            return True

        return False
    except (TokenError, jwt.InvalidTokenError, Exception):
        return False
