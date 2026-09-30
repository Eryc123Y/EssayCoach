from __future__ import annotations

from datetime import datetime

from ninja import Schema
from pydantic import EmailStr, Field

from api_v2.types.enums import ThemePreference, UserRole, UserStatus


class UserRegistrationIn(Schema):
    invitation_token: str = Field(..., min_length=32)
    password: str = Field(..., min_length=8)
    password_confirm: str = Field(...)
    first_name: str | None = Field(None, max_length=20)
    last_name: str | None = Field(None, max_length=20)


class InvitationCreateIn(Schema):
    email: EmailStr
    role: UserRole
    class_id: int | None = None
    lead_unit_id: str | None = None


class InvitationCreateOut(Schema):
    id: int
    token: str
    email: EmailStr
    role: UserRole
    expires_at: datetime


class InvitationBatchIn(Schema):
    class_id: int
    emails: list[EmailStr] = Field(..., min_length=1, max_length=50)


class InvitationBatchFailureOut(Schema):
    email: EmailStr
    reason: str


class InvitationBatchOut(Schema):
    created: list[InvitationCreateOut]
    failed: list[InvitationBatchFailureOut]


class InvitationPreviewIn(Schema):
    token: str = Field(..., min_length=32)


class InvitationPreviewOut(Schema):
    email: EmailStr
    role: UserRole
    class_name: str | None
    unit_name: str | None
    expires_at: datetime


class EmailChangeRequestIn(Schema):
    new_email: EmailStr
    current_password: str = Field(..., min_length=1)


class EmailChangePreviewIn(Schema):
    token: str = Field(..., min_length=32)


class EmailChangePreviewOut(Schema):
    new_email: EmailStr
    expires_at: datetime


class EmailChangeCompleteIn(Schema):
    token: str = Field(..., min_length=32)


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
    role: UserRole
    status: UserStatus
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
    social_alerts: bool | None = None
    weekly_digest: bool | None = None
    language: str | None = Field(None, pattern="^(en|zh)$")
    theme: ThemePreference | None = None


class UserPreferencesOut(Schema):
    """Output schema for user preferences."""

    email_notifications: bool = True
    in_app_notifications: bool = True
    submission_alerts: bool = True
    grading_alerts: bool = False
    social_alerts: bool = True
    weekly_digest: bool = False
    language: str = "en"
    theme: ThemePreference = ThemePreference.SYSTEM


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


class PasswordResetPreviewIn(Schema):
    token: str = Field(..., min_length=32)


class PasswordResetPreviewOut(Schema):
    email: EmailStr
    expires_at: datetime


class PasswordResetCompleteIn(Schema):
    token: str = Field(..., min_length=32)
    new_password: str = Field(..., min_length=8, max_length=128)
    new_password_confirm: str


class UserUpdateIn(Schema):
    first_name: str | None = Field(None, max_length=20)
    last_name: str | None = Field(None, max_length=20)


class MessageResponse(Schema):
    success: bool = True
    message: str
    data: dict = Field(default_factory=dict)


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
