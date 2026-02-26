from __future__ import annotations

import logging
import os
from pathlib import Path

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.sessions.models import Session
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from core.models import User

from ..utils.auth import TokenAuth, delete_user_tokens, get_or_create_token
from ..utils.jwt_auth import JWTAuth, blacklist_jwt_token, create_jwt_pair, refresh_jwt_token
from .schemas import (
    AuthResponse,
    AuthResponseWithRefresh,
    AvatarUploadOut,
    LoginHistoryListOut,
    LoginHistoryOut,
    MessageResponse,
    PasswordChangeIn,
    PasswordResetIn,
    RefreshTokenIn,
    RefreshTokenOut,
    SessionListOut,
    SessionOut,
    UserInfoResponse,
    UserLoginIn,
    UserOut,
    UserPreferencesIn,
    UserPreferencesOut,
    UserPreferencesResponse,
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


@router.post("/register/", response=AuthResponseWithRefresh)
def register(request: HttpRequest, data: UserRegistrationIn) -> AuthResponseWithRefresh:
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

    jwt_pair = create_jwt_pair(user)

    return AuthResponseWithRefresh(
        data={
            "token": jwt_pair.access,
            "refresh": jwt_pair.refresh,
            "expires_at": jwt_pair.expires_at.isoformat(),
            "user": _user_to_schema(user),
        },
        message="User registered successfully",
    )


@router.post("/login/", response=AuthResponseWithRefresh)
def login(request: HttpRequest, data: UserLoginIn) -> AuthResponseWithRefresh:
    user = authenticate(request, username=data.email, password=data.password)

    if not user:
        try:
            existing_user = User.objects.get(user_email=data.email)
            if existing_user.check_password(data.password) and not existing_user.is_active:
                raise HttpError(423, "Account is locked. Please contact administrator.")
        except User.DoesNotExist:
            pass
        raise HttpError(401, "Invalid email or password")

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


@router.post("/logout/", response=MessageResponse, auth=TokenAuth())
def logout(request: HttpRequest) -> MessageResponse:
    if hasattr(request, "auth") and request.auth:
        delete_user_tokens(request.auth)
    return MessageResponse(message="Successfully logged out")


@router.get("/me/", response=UserInfoResponse, auth=TokenAuth())
def get_me(request: HttpRequest) -> UserInfoResponse:
    user = request.auth
    return UserInfoResponse(data=_user_to_schema(user))


@router.get("/me/jwt/", response=UserInfoResponse, auth=JWTAuth())
def get_me_jwt(request: HttpRequest) -> UserInfoResponse:
    """Get current user info using JWT authentication."""
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


@router.get("/getUserInfo")
def get_user_info(request: HttpRequest) -> UserInfoResponse:
    """
    Get current user info.
    Used by frontend to check authentication status.
    """
    from ..utils.jwt_auth import verify_jwt_token
    
    # Extract token from Authorization header or cookie
    auth_header = request.headers.get("Authorization")
    token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
    else:
        # Try to get token from cookie
        token = request.COOKIES.get("access_token")
    
    if not token:
        raise HttpError(401, "No token provided")
    
    # Verify token and get payload
    try:
        payload = verify_jwt_token(token)
    except Exception as e:
        raise HttpError(401, f"Invalid token: {str(e)}")
    
    if not payload:
        raise HttpError(401, "Invalid or expired token")

    
    # Get user from payload
    user_id = payload.get("user_id")
    if not user_id:
        raise HttpError(401, "Invalid token payload")
    
    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        raise HttpError(401, "User not found")
    
    return UserInfoResponse(
        success=True,
        data=_user_to_schema(user),
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


# =============================================================================
# Settings Endpoints
# =============================================================================


def _get_default_preferences() -> dict:
    """Return default user preferences."""
    return {
        "email_notifications": True,
        "in_app_notifications": True,
        "submission_alerts": True,
        "grading_alerts": False,
        "weekly_digest": False,
        "language": "en",
        "theme": "system",
    }


def _get_user_preferences(user: User) -> dict:
    """Get user preferences with defaults for missing keys."""
    defaults = _get_default_preferences()
    user_prefs = user.preferences or {}
    # Merge with defaults
    return {**defaults, **user_prefs}


def _detect_device(user_agent: str | None) -> str:
    """Detect device type from user agent string."""
    if not user_agent:
        return "Unknown"
    user_agent_lower = user_agent.lower()
    if "mobile" in user_agent_lower or "android" in user_agent_lower or "iphone" in user_agent_lower:
        return "Mobile"
    elif "tablet" in user_agent_lower or "ipad" in user_agent_lower:
        return "Tablet"
    else:
        return "Desktop"


@router.get("/settings/preferences/", response=UserPreferencesResponse, auth=JWTAuth())
def get_preferences(request: HttpRequest) -> UserPreferencesResponse:
    """
    Get current user's preferences.

    Returns user preferences with defaults for any missing keys.
    """
    user = request.auth
    preferences = _get_user_preferences(user)
    return UserPreferencesResponse(
        success=True,
        data=UserPreferencesOut(**preferences),
    )


@router.put("/settings/preferences/", response=UserPreferencesResponse, auth=JWTAuth())
def update_preferences(request: HttpRequest, data: UserPreferencesIn) -> UserPreferencesResponse:
    """
    Update current user's preferences.

    Only provided fields will be updated. Other preferences remain unchanged.
    """
    user = request.auth

    # Get current preferences or initialize with defaults
    current_prefs = _get_user_preferences(user)

    # Update only provided fields
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            current_prefs[key] = value

    # Save updated preferences
    user.preferences = current_prefs
    user.save(update_fields=["preferences"])

    return UserPreferencesResponse(
        success=True,
        data=UserPreferencesOut(**_get_user_preferences(user)),
        message="Preferences updated successfully",
    )


@router.post("/settings/avatar/", response=AvatarUploadOut, auth=JWTAuth())
def upload_avatar(request: HttpRequest, avatar: UploadedFile) -> AvatarUploadOut:
    """
    Upload user avatar.

    Accepts image files (PNG, JPG, JPEG). Max size: 5MB.
    Avatar is stored in MEDIA_ROOT/avatars/<user_id>_<filename>
    """
    user = request.auth

    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/jpg"]
    if avatar.content_type not in allowed_types:
        raise HttpError(400, "Only PNG and JPG images are allowed")

    # Validate file size (5MB max)
    max_size = 5 * 1024 * 1024  # 5MB
    if avatar.size > max_size:
        raise HttpError(400, "File size must be less than 5MB")

    # Create avatars directory if it doesn't exist
    avatars_dir = Path(settings.MEDIA_ROOT) / "avatars" if hasattr(settings, "MEDIA_ROOT") else Path("media") / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    import uuid
    file_extension = avatar.name.split(".")[-1] if "." in avatar.name else "png"
    filename = f"{user.user_id}_{uuid.uuid4().hex}.{file_extension}"
    file_path = avatars_dir / filename

    # Save file
    with open(file_path, "wb") as f:
        for chunk in avatar.chunks():
            f.write(chunk)

    # Generate avatar URL
    avatar_url = f"/media/avatars/{filename}"

    return AvatarUploadOut(
        success=True,
        avatar_url=avatar_url,
        message="Avatar uploaded successfully",
    )


@router.get("/settings/sessions/", response=SessionListOut, auth=JWTAuth())
def get_sessions(request: HttpRequest) -> SessionListOut:
    """
    Get list of active sessions for current user.

    Returns all active Django sessions with device and IP information.
    """
    from django.utils import timezone

    user = request.auth
    current_session_key = request.session.session_key if request.session else None

    # Get all active sessions
    now = timezone.now()
    active_sessions = Session.objects.filter(expire_date__gt=now)

    sessions_data = []
    for session in active_sessions:
        # Get session data
        session_data = session.get_decoded()
        user_id = session_data.get("_auth_user_id")

        # Only include sessions for current user
        if user_id != user.user_id:
            continue

        # Get session metadata
        auth_hash = session_data.get("_auth_user_hash", "")
        ip_address = session_data.get("_auth_user_ip", None)
        backend = session_data.get("_auth_user_backend", "")

        # Detect device from session data or default to Desktop
        device = session_data.get("device", "Desktop")

        # Get last activity from expiry date (approximation)
        last_activity = session.expire_date

        # Determine if this is the current session
        is_current = session.session_key == current_session_key

        sessions_data.append(
            SessionOut(
                session_key=session.session_key,
                device=device,
                ip_address=ip_address,
                created_at=now,  # Django Session model doesn't track created_at
                last_activity=last_activity,
                is_current=is_current,
            )
        )

    # Sort by last activity, most recent first
    sessions_data.sort(key=lambda s: s.last_activity, reverse=True)

    return SessionListOut(success=True, data=sessions_data)


@router.delete("/settings/sessions/{session_id}/", response=MessageResponse, auth=JWTAuth())
def revoke_session(request: HttpRequest, session_id: str) -> MessageResponse:
    """
    Revoke a specific session.

    This will log out the user from that session/device.
    Cannot revoke the current session.
    """
    user = request.auth
    current_session_key = request.session.session_key if request.session else None

    # Cannot revoke current session
    if session_id == current_session_key:
        raise HttpError(400, "Cannot revoke current session. Use logout instead.")

    # Get the session
    try:
        session = Session.objects.get(session_key=session_id)
    except Session.DoesNotExist:
        raise HttpError(404, "Session not found")

    # Verify session belongs to user
    session_data = session.get_decoded()
    if session_data.get("_auth_user_id") != user.user_id:
        raise HttpError(403, "Cannot revoke session that doesn't belong to you")

    # Delete the session
    session.delete()

    return MessageResponse(success=True, message="Session revoked successfully")


@router.get("/settings/login-history/", response=LoginHistoryListOut, auth=JWTAuth())
def get_login_history(request: HttpRequest) -> LoginHistoryListOut:
    """
    Get login history for current user.

    Returns recent login attempts (success and failed) from Django session data.
    Note: This is a basic implementation. For production, consider using
    django-axes or similar for comprehensive login tracking.
    """
    from django.utils import timezone

    user = request.auth

    # Get all sessions (expired and active) for login history
    # Note: Django doesn't track login history by default, so we'll return
    # session-based activity as a proxy

    # Get recent sessions (last 30 days)
    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    recent_sessions = Session.objects.filter(expire_date__gt=thirty_days_ago)

    login_history = []
    for session in recent_sessions:
        session_data = session.get_decoded()
        user_id = session_data.get("_auth_user_id")

        if user_id != user.user_id:
            continue

        ip_address = session_data.get("_auth_user_ip", None)
        device = session_data.get("device", "Desktop")

        # Use expire_date as proxy for last activity
        login_history.append(
            LoginHistoryOut(
                login_time=session.expire_date - timezone.timedelta(hours=2),  # Approximate
                ip_address=ip_address,
                device=device,
                success=True,
            )
        )

    # Sort by login time, most recent first
    login_history.sort(key=lambda h: h.login_time, reverse=True)

    # Return last 20 entries
    return LoginHistoryListOut(success=True, data=login_history[:20])
