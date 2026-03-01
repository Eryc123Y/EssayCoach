"""
JWT utilities for Django Ninja API v2.

This module provides JWT token generation and verification for the Ninja API.
It uses djangorestframework-simplejwt for JWT handling.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

import jwt
from django.conf import settings
from ninja.security import HttpBearer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

if TYPE_CHECKING:
    from core.models import User


logger = logging.getLogger(__name__)

# In-memory token blacklist (for single-instance deployments)
# In production, use Redis or database-backed storage
_token_blacklist: set[str] = set()


def get_jwt_secret() -> str:
    """Get JWT secret from settings."""
    secret = getattr(settings, "JWT_SECRET_KEY", None)
    if not secret:
        secret = getattr(settings, "SECRET_KEY", None)
    if not secret:
        raise RuntimeError("JWT secret is not configured")
    return secret


def get_jwt_algorithm() -> str:
    """Get JWT algorithm from settings."""
    return getattr(settings, "JWT_ALGORITHM", "HS256")


def get_jwt_issuer() -> str:
    return getattr(settings, "JWT_ISSUER", "essaycoach-backend")


def get_jwt_audience() -> str:
    return getattr(settings, "JWT_AUDIENCE", "essaycoach-frontend")


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
    role = user.user_role or "student"
    refresh["role"] = role
    refresh["user_role"] = role

    # Get access token from refresh token
    access = refresh.access_token

    # Calculate expiration
    expires_at = datetime.fromtimestamp(access["exp"], tz=UTC)

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

        payload = dict(access_token)
        role = payload.get("user_role") or payload.get("role")
        if not role or not isinstance(role, str):
            return None

        payload["user_role"] = role
        payload["role"] = role
        return payload
    except (TokenError, jwt.InvalidTokenError, Exception):
        pass

    # Fallback to manual verification
    try:
        decode_kwargs: dict[str, object] = {
            "key": get_jwt_secret(),
            "algorithms": [get_jwt_algorithm()],
        }

        issuer = get_jwt_issuer()
        if issuer:
            decode_kwargs["issuer"] = issuer

        audience = get_jwt_audience()
        if audience:
            decode_kwargs["audience"] = audience

        payload = jwt.decode(
            token,
            **decode_kwargs,
        )

        # Check if token is blacklisted
        jti = payload.get("jti")
        if jti and _is_token_blacklisted(jti):
            return None

        role = payload.get("user_role") or payload.get("role")
        if not role or not isinstance(role, str):
            return None

        payload["user_role"] = role
        payload["role"] = role
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
        # Get the old JTI before creating new token
        old_payload = jwt.decode(
            refresh_token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
            options={"verify_signature": False},
        )
        old_jti = old_payload.get("jti")

        # Check if already blacklisted
        if old_jti and _is_token_blacklisted(old_jti):
            return None

        # Verify the token is valid and get user info
        from rest_framework_simplejwt.tokens import RefreshToken as SimpleJWTRefreshToken

        old_refresh = SimpleJWTRefreshToken(refresh_token)
        user_id = old_refresh.get("user_id")

        if not user_id:
            return None

        # Get user from database
        from core.models import User

        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            return None

        # Create BRAND NEW token pair (this ensures rotation)
        new_pair = create_jwt_pair(user)

        # Blacklist the old refresh token AFTER generating new ones
        if old_jti:
            _add_to_blacklist(old_jti)

        return new_pair
    except (TokenError, jwt.InvalidTokenError, Exception):
        logger.warning("JWT refresh failed", exc_info=True)
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


class JWTAuth(HttpBearer):
    """
    JWT-based authentication for Django Ninja.

    Usage:
        @api.get("/protected", auth=JWTAuth())
        def protected_endpoint(request):
            return {"user": request.auth.user_email}
    """

    def authenticate(self, request, token: str) -> User | None:
        """
        Authenticate using JWT.

        Args:
            request: Django request object
            token: The JWT token string (from Bearer header)

        Returns:
            User instance if valid, None otherwise
        """
        payload = verify_jwt_token(token)
        if payload is None:
            return None

        # Get user from token payload
        user_id = payload.get("user_id")
        if not user_id:
            return None

        try:
            from core.models import User

            user = User.objects.get(user_id=user_id)
            if not user.is_active:
                return None
            return user
        except User.DoesNotExist:
            return None
