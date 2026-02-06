from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from ninja import Router
from ninja.errors import HttpError

from api_v1.core.models import User

from ..utils.auth import TokenAuth, delete_user_tokens, get_or_create_token
from .schemas import (
    AuthResponse,
    MessageResponse,
    PasswordChangeIn,
    PasswordResetIn,
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
def register(request, data: UserRegistrationIn) -> AuthResponse:
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
def login(request, data: UserLoginIn) -> AuthResponse:
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
def logout(request) -> MessageResponse:
    if hasattr(request, "auth") and request.auth:
        delete_user_tokens(request.auth)
    return MessageResponse(message="Successfully logged out")


@router.get("/me/", response=UserInfoResponse, auth=TokenAuth())
def get_me(request) -> UserInfoResponse:
    user = request.auth
    return UserInfoResponse(data=_user_to_schema(user))


@router.patch("/me/", response=AuthResponse, auth=TokenAuth())
def update_me(request, data: UserUpdateIn) -> AuthResponse:
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
def password_change(request, data: PasswordChangeIn) -> MessageResponse:
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
def password_reset(request, data: PasswordResetIn) -> MessageResponse:
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
