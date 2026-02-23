from __future__ import annotations

import logging

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from core.models import User

from ..utils.auth import TokenAuth, delete_user_tokens, get_or_create_token
from ..utils.jwt_auth import create_jwt_pair, refresh_jwt_token, blacklist_jwt_token
from .schemas import (
    AuthResponse,
    AuthResponseWithRefresh,
    MessageResponse,
    PasswordChangeIn,
    PasswordResetIn,
    RefreshTokenIn,
    RefreshTokenOut,
    UserInfoResponse,
    UserLoginIn,
    UserOut,
    UserRegistrationIn,
    UserUpdateIn,
)

logger = logging.getLogger(__name__)

router = Router(tags=["Authentication"])


def _user_to_schema(user: User) -> UserOut:
    return UserOut(
        id=user.user_id,
        email=user.user_email,
        username=user.user_email,
        first_name=user.user_fname,
        last_name=user.user_lname,
        name=f"{user.user_fname or ''} {user.user_lname or ''}".strip() or user.user_email,
        avatar=None,
        role=user.user_role or "student",
        status=user.user_status or "active",
        date_joined=user.date_joined.isoformat() if user.date_joined else "",
    )


@router.post("/register/", response=AuthResponse)
def register(request: HttpRequest, data: UserRegistrationIn) -> AuthResponse:
    if data.password != data.password_confirm:
        raise HttpError(400, "Password fields didn't match")

    try:
        validate_password(data.password)
    except ValidationError as e:
        raise HttpError(400, f"Password validation failed: {', '.join(e.messages)}")

    if User.objects.filter(user_email=data.email).exists():
        raise HttpError(409, "Email is already registered")

    role = data.role or "student"
    user = User.objects.create_user(
        user_email=data.email,
        password=data.password,
        user_fname=data.first_name or "",
        user_lname=data.last_name or "",
        user_role=role,
        user_status="active",
    )

    token = get_or_create_token(user)

    return AuthResponse(
        data={
            "token": token.key,
            "user": _user_to_schema(user),
        },
        message="User registered successfully",
    )


@router.post("/login/", response=AuthResponse)
def login(request: HttpRequest, data: UserLoginIn) -> AuthResponse:
    user = authenticate(request, username=data.email, password=data.password)

    if not user:
        try:
            existing_user = User.objects.get(user_email=data.email)
            if existing_user.check_password(data.password) and not existing_user.is_active:
                raise HttpError(423, "Account is locked. Please contact administrator.")
        except User.DoesNotExist:
            pass
        raise HttpError(401, "Invalid email or password")

    token = get_or_create_token(user)

    return AuthResponse(
        data={
            "token": token.key,
            "user": _user_to_schema(user),
        },
    )


@router.post("/logout/", response=MessageResponse, auth=TokenAuth())
def logout(request: HttpRequest) -> MessageResponse:
    if hasattr(request, "auth") and request.auth:
        delete_user_tokens(request.auth)
    return MessageResponse(message="Successfully logged out")


@router.get("/me/", response=UserInfoResponse, auth=TokenAuth())
def get_me(request: HttpRequest) -> UserInfoResponse:
    user = request.auth
    return UserInfoResponse(data=_user_to_schema(user))


@router.patch("/me/", response=AuthResponse, auth=TokenAuth())
def update_me(request: HttpRequest, data: UserUpdateIn) -> AuthResponse:
    user = request.auth

    if data.first_name is not None:
        user.user_fname = data.first_name
    if data.last_name is not None:
        user.user_lname = data.last_name

    user.save()

    return AuthResponse(
        data={"token": "", "user": _user_to_schema(user)},
    )


@router.post("/password-change/", response=MessageResponse, auth=TokenAuth())
def password_change(request: HttpRequest, data: PasswordChangeIn) -> MessageResponse:
    user = request.auth

    if not user.check_password(data.current_password):
        raise HttpError(400, "Current password is incorrect")

    if data.new_password != data.new_password_confirm:
        raise HttpError(400, "Password fields didn't match")

    try:
        validate_password(data.new_password)
    except ValidationError as e:
        raise HttpError(400, f"Password validation failed: {', '.join(e.messages)}")

    user.set_password(data.new_password)
    user.save()

    return MessageResponse(message="Password changed successfully")


@router.post("/password-reset/", response=MessageResponse)
def password_reset(request: HttpRequest, data: PasswordResetIn) -> MessageResponse:
    if data.new_password != data.new_password_confirm:
        raise HttpError(400, "Password fields didn't match")

    try:
        validate_password(data.new_password)
    except ValidationError as e:
        raise HttpError(400, f"Password validation failed: {', '.join(e.messages)}")

    try:
        user = User.objects.get(user_email=data.email)
    except User.DoesNotExist:
        raise HttpError(404, "Email is not registered")

    user.set_password(data.new_password)
    user.save()

    return MessageResponse(message="Password reset successful")


@router.post("/login-with-jwt/", response=AuthResponseWithRefresh)
def login_with_jwt(request: HttpRequest, data: UserLoginIn) -> AuthResponseWithRefresh:
    """
    Login and receive JWT access + refresh tokens.

    This endpoint returns both access and refresh tokens for use with JWT authentication.
    """
    user = authenticate(request, username=data.email, password=data.password)

    if not user:
        try:
            existing_user = User.objects.get(user_email=data.email)
            if existing_user.check_password(data.password) and not existing_user.is_active:
                raise HttpError(423, "Account is locked. Please contact administrator.")
        except User.DoesNotExist:
            pass
        raise HttpError(401, "Invalid email or password")

    # Create JWT token pair
    jwt_pair = create_jwt_pair(user)

    return AuthResponseWithRefresh(
        data={
            "token": jwt_pair.access,
            "refresh": jwt_pair.refresh,
            "expires_at": jwt_pair.expires_at.isoformat(),
            "user": _user_to_schema(user),
        },
        message="Login successful",
    )


@router.post("/refresh/", response=RefreshTokenOut)
def refresh_token(request: HttpRequest, data: RefreshTokenIn) -> RefreshTokenOut:
    """
    Refresh access token using refresh token.

    This endpoint implements token rotation - a new refresh token is issued
    each time, and the old one is blacklisted for security.
    """
    result = refresh_jwt_token(data.refresh)

    if result is None:
        raise HttpError(401, "Invalid or expired refresh token")

    return RefreshTokenOut(
        access=result.access,
        refresh=result.refresh,
        expires_at=result.expires_at.isoformat(),
    )


@router.post("/logout-jwt/", response=MessageResponse)
def logout_jwt(request: HttpRequest, refresh: str) -> MessageResponse:
    """
    Logout by blacklisting the refresh token.

    This invalidates the refresh token, preventing further token refreshes.
    """
    success = blacklist_jwt_token(refresh)
    if not success:
        # Token might already be expired or blacklisted
        pass

    return MessageResponse(message="Successfully logged out")
