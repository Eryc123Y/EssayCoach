from __future__ import annotations

from datetime import datetime
from typing import Literal

from ninja import Schema
from pydantic import Field, field_validator


class UserRegistrationIn(Schema):
    email: str = Field(..., max_length=254)
    password: str = Field(..., min_length=8)
    password_confirm: str = Field(...)
    first_name: str | None = Field(None, max_length=20)
    last_name: str | None = Field(None, max_length=20)
    role: str | None = Field(None, max_length=10)

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str | None) -> str | None:
        if v is not None:
            allowed_roles = ["student", "lecturer", "admin"]
            if v not in allowed_roles:
                raise ValueError(f"Role must be one of: {', '.join(allowed_roles)}")
        return v


class UserLoginIn(Schema):
    email: str = Field(...)
    password: str = Field(...)


class UserOut(Schema):
    id: int
    email: str
    username: str
    first_name: str | None
    last_name: str | None
    name: str
    avatar: str | None
    role: str
    status: str
    date_joined: str


# =============================================================================
# Settings Schemas
# =============================================================================


class UserPreferencesIn(Schema):
    """Input schema for updating user preferences."""

    email_notifications: bool | None = None
    in_app_notifications: bool | None = None
    submission_alerts: bool | None = None
    grading_alerts: bool | None = None
    weekly_digest: bool | None = None
    language: str | None = None
    theme: Literal["light", "dark", "system"] | None = None


class UserPreferencesOut(Schema):
    """Output schema for user preferences."""

    email_notifications: bool = True
    in_app_notifications: bool = True
    submission_alerts: bool = True
    grading_alerts: bool = False
    weekly_digest: bool = False
    language: str = "en"
    theme: Literal["light", "dark", "system"] = "system"


class UserPreferencesResponse(Schema):
    """Response schema for user preferences endpoint."""

    success: bool = True
    data: UserPreferencesOut
    message: str | None = None


class AvatarUploadOut(Schema):
    """Output schema for avatar upload response."""

    success: bool = True
    avatar_url: str
    message: str = "Avatar uploaded successfully"


class SessionOut(Schema):
    """Output schema for session information."""

    session_key: str
    device: str
    ip_address: str | None
    created_at: datetime
    last_activity: datetime
    is_current: bool = False


class SessionListOut(Schema):
    """Output schema for session list response."""

    success: bool = True
    data: list[SessionOut]


class LoginHistoryOut(Schema):
    """Output schema for login history entry."""

    login_time: datetime
    ip_address: str | None
    device: str
    success: bool


class LoginHistoryListOut(Schema):
    """Output schema for login history list response."""

    success: bool = True
    data: list[LoginHistoryOut]


class AuthResponse(Schema):
    success: bool = True
    data: AuthData
    message: str | None = None


class AuthData(Schema):
    token: str
    user: UserOut


class PasswordChangeIn(Schema):
    current_password: str = Field(...)
    new_password: str = Field(..., min_length=8)
    new_password_confirm: str = Field(...)


class PasswordResetIn(Schema):
    email: str = Field(...)
    new_password: str = Field(..., min_length=8)
    new_password_confirm: str = Field(...)


class UserUpdateIn(Schema):
    first_name: str | None = Field(None, max_length=20)
    last_name: str | None = Field(None, max_length=20)


class MessageResponse(Schema):
    success: bool = True
    message: str
    data: dict = {}


class UserInfoResponse(Schema):
    success: bool = True
    data: UserOut


class RefreshTokenIn(Schema):
    """Input schema for token refresh request."""

    refresh: str = Field(..., description="Refresh token")


class RefreshTokenOut(Schema):
    """Output schema for token refresh response."""

    access: str = Field(..., description="New access token")
    refresh: str = Field(..., description="New refresh token")
    expires_at: str = Field(..., description="Access token expiration time (ISO format)")


class AuthDataWithRefresh(Schema):
    """Auth response data including refresh token."""

    token: str = Field(..., description="Access token")
    refresh: str = Field(..., description="Refresh token")
    expires_at: str = Field(..., description="Access token expiration time (ISO format)")
    user: UserOut


class AuthResponseWithRefresh(Schema):
    """Auth response with refresh token."""

    success: bool = True
    data: AuthDataWithRefresh
    message: str | None = None
