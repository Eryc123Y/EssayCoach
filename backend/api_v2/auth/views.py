from __future__ import annotations

import logging
from pathlib import Path
from typing import cast
from uuid import UUID

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from core.email_change import EmailChangeError, complete_email_change, issue_email_change, preview_email_change
from core.invitations import InvitationError, InviteRole, accept_invitation, issue_invitation, preview_invitation
from core.models import AuthSession, Class, Unit, User
from core.password_reset import PasswordResetError, complete_password_reset, preview_password_reset

from ..utils.auth import TokenAuth
from ..utils.jwt_auth import JWTAuth, blacklist_jwt_token, create_jwt_pair, refresh_jwt_token, verify_jwt_token
from .schemas import (
    AuthResponse,
    AuthResponseWithRefresh,
    AvatarUploadOut,
    EmailChangeCompleteIn,
    EmailChangePreviewIn,
    EmailChangePreviewOut,
    EmailChangeRequestIn,
    InvitationBatchFailureOut,
    InvitationBatchIn,
    InvitationBatchOut,
    InvitationCreateIn,
    InvitationCreateOut,
    InvitationPreviewIn,
    InvitationPreviewOut,
    LoginHistoryListOut,
    LoginHistoryOut,
    MessageResponse,
    PasswordChangeIn,
    PasswordResetCompleteIn,
    PasswordResetIn,
    PasswordResetPreviewIn,
    PasswordResetPreviewOut,
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
        avatar=f"/api/v2/core/profiles/{user.pk}/avatar/" if user.avatar_url else None,
        role=user.user_role or "student",
        status=user.user_status or "active",
        date_joined=user.date_joined.isoformat() if user.date_joined else "",
    )


@router.post("/invitations/", response=InvitationCreateOut, auth=JWTAuth())
def create_invitation(request: HttpRequest, data: InvitationCreateIn) -> InvitationCreateOut:
    """Issue an expiring, one-time invitation for staff or a class student."""
    if data.role.value not in ("student", "lecturer"):
        raise HttpError(400, "Only student and lecturer accounts can be invited")
    class_obj = None
    if data.class_id is not None:
        class_obj = Class.objects.filter(pk=data.class_id).first()
        if class_obj is None:
            raise HttpError(404, "Class not found")
    lead_unit = None
    if data.lead_unit_id is not None:
        lead_unit = Unit.objects.filter(pk=data.lead_unit_id).first()
        if lead_unit is None:
            raise HttpError(404, "Course not found")
    try:
        invitation, token = issue_invitation(
            actor=request.auth,
            email=str(data.email),
            role=cast(InviteRole, data.role.value),
            class_obj=class_obj,
            lead_unit=lead_unit,
        )
    except InvitationError as exc:
        raise HttpError(exc.status, str(exc)) from exc
    return InvitationCreateOut(
        id=invitation.pk,
        token=token,
        email=invitation.email,
        role=invitation.role,
        expires_at=invitation.expires_at,
    )


@router.post("/invitations/preview/", response=InvitationPreviewOut)
def get_invitation_preview(request: HttpRequest, data: InvitationPreviewIn) -> InvitationPreviewOut:
    """Show the fixed account and class scope before activation."""
    try:
        invitation = preview_invitation(data.token)
    except InvitationError as exc:
        raise HttpError(exc.status, str(exc)) from exc
    return InvitationPreviewOut(
        email=invitation.email,
        role=invitation.role,
        class_name=invitation.class_id_class.class_name if invitation.class_id_class else None,
        unit_name=invitation.lead_unit.unit_name if invitation.lead_unit else None,
        expires_at=invitation.expires_at,
    )


@router.post("/invitations/batch/", response=InvitationBatchOut, auth=JWTAuth())
def create_student_invitations(request: HttpRequest, data: InvitationBatchIn) -> InvitationBatchOut:
    """Issue class invitation links for up to 50 distinct student addresses."""
    class_obj = Class.objects.filter(pk=data.class_id).first()
    if class_obj is None:
        raise HttpError(404, "Class not found")
    created: list[InvitationCreateOut] = []
    failed: list[InvitationBatchFailureOut] = []
    addresses = dict.fromkeys(str(email).strip().lower() for email in data.emails)
    for email in addresses:
        try:
            invitation, token = issue_invitation(actor=request.auth, email=email, role="student", class_obj=class_obj)
        except InvitationError as exc:
            if exc.status == 403:
                raise HttpError(403, str(exc)) from exc
            failed.append(InvitationBatchFailureOut(email=email, reason=str(exc)))
            continue
        created.append(
            InvitationCreateOut(
                id=invitation.pk,
                token=token,
                email=invitation.email,
                role=invitation.role,
                expires_at=invitation.expires_at,
            )
        )
    return InvitationBatchOut(created=created, failed=failed)


@router.post("/register/", response=AuthResponseWithRefresh)
def register(request: HttpRequest, data: UserRegistrationIn) -> AuthResponseWithRefresh:
    """Activate an invitation; public self-registration is unavailable."""
    if data.password != data.password_confirm:
        raise HttpError(400, "Password fields didn't match")

    try:
        user = accept_invitation(
            token=data.invitation_token,
            password=data.password,
            first_name=data.first_name,
            last_name=data.last_name,
        )
    except ValidationError as exc:
        raise HttpError(400, f"Password validation failed: {', '.join(exc.messages)}") from exc
    except InvitationError as exc:
        raise HttpError(exc.status, str(exc)) from exc

    jwt_pair = create_jwt_pair(user, request=request)

    return AuthResponseWithRefresh(
        data={
            "token": jwt_pair.access,
            "refresh": jwt_pair.refresh,
            "expires_at": jwt_pair.expires_at.isoformat(),
            "user": _user_to_schema(user),
        },
        message="Invitation activated successfully",
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

    if user.user_status != "active":
        raise HttpError(423, "Account is not active. Please contact an administrator.")

    jwt_pair = create_jwt_pair(user, request=request)

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
    header = request.headers.get("Authorization", "")
    payload = verify_jwt_token(header.removeprefix("Bearer ")) if header.startswith("Bearer ") else None
    if payload:
        from django.utils import timezone

        AuthSession.objects.filter(pk=payload.get("session_id"), user=request.auth, revoked_at__isnull=True).update(
            revoked_at=timezone.now()
        )
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
    user.auth_version += 1
    user.save(update_fields=["password", "auth_version"])
    from django.utils import timezone

    AuthSession.objects.filter(user=user, revoked_at__isnull=True).update(revoked_at=timezone.now())

    return MessageResponse(message="Password changed successfully")


@router.post("/password-reset/", response=MessageResponse)
def password_reset(request: HttpRequest, data: PasswordResetIn) -> MessageResponse:
    # The former endpoint accepted an email and new password without proof of
    # account ownership. A token-based recovery flow will replace it.
    raise HttpError(410, "Password recovery requires a verified reset link")


@router.post("/password-reset/preview/", response=PasswordResetPreviewOut)
def get_password_reset_preview(request: HttpRequest, data: PasswordResetPreviewIn):
    try:
        grant = preview_password_reset(data.token)
    except PasswordResetError as exc:
        raise HttpError(exc.status, str(exc)) from exc
    return PasswordResetPreviewOut(email=grant.user.user_email, expires_at=grant.expires_at)


@router.post("/password-reset/complete/", response=MessageResponse)
def reset_password_with_token(request: HttpRequest, data: PasswordResetCompleteIn):
    if data.new_password != data.new_password_confirm:
        raise HttpError(400, "Password fields do not match")
    try:
        complete_password_reset(data.token, data.new_password)
    except PasswordResetError as exc:
        raise HttpError(exc.status, str(exc)) from exc
    return MessageResponse(message="Password reset complete. Sign in with the new password.")


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

    if user.user_status != "active":
        raise HttpError(423, "Account is not active. Please contact an administrator.")

    # Create JWT token pair
    jwt_pair = create_jwt_pair(user, request=request)

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


@router.get("/getUserInfo", response=UserInfoResponse)
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
    except Exception:
        logger.warning("Token verification failed", exc_info=True)
        raise HttpError(401, "Invalid token")

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


@router.post("/email-change/request/", response=MessageResponse, auth=JWTAuth())
def request_email_change(request: HttpRequest, data: EmailChangeRequestIn):
    try:
        issue_email_change(request.auth, str(data.new_email), data.current_password)
    except EmailChangeError as exc:
        raise HttpError(exc.status, str(exc)) from exc
    return MessageResponse(message="Verification link sent to the new email address")


@router.post("/email-change/preview/", response=EmailChangePreviewOut)
def email_change_preview(request: HttpRequest, data: EmailChangePreviewIn):
    try:
        grant = preview_email_change(data.token)
    except EmailChangeError as exc:
        raise HttpError(exc.status, str(exc)) from exc
    return EmailChangePreviewOut(new_email=grant.new_email, expires_at=grant.expires_at)


@router.post("/email-change/complete/", response=MessageResponse)
def confirm_email_change(request: HttpRequest, data: EmailChangeCompleteIn):
    try:
        complete_email_change(data.token)
    except EmailChangeError as exc:
        raise HttpError(exc.status, str(exc)) from exc
    return MessageResponse(message="Email address updated. Sign in again with the new address.")


def _get_default_preferences() -> dict:
    """Return default user preferences."""
    return {
        "email_notifications": True,
        "in_app_notifications": True,
        "submission_alerts": True,
        "grading_alerts": False,
        "social_alerts": True,
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
    if avatar.size is None or avatar.size > max_size:
        raise HttpError(400, "File size must be less than 5MB")

    # Create avatars directory if it doesn't exist
    avatars_dir = (
        Path(settings.MEDIA_ROOT) / "avatars" if hasattr(settings, "MEDIA_ROOT") else Path("media") / "avatars"
    )
    avatars_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    import uuid

    file_extension = "png" if avatar.content_type == "image/png" else "jpg"
    filename = f"{user.user_id}_{uuid.uuid4().hex}.{file_extension}"
    file_path = avatars_dir / filename

    # Save file
    with open(file_path, "wb") as f:
        for chunk in avatar.chunks():
            f.write(chunk)

    # The file path stays server-side; the returned URL requires a valid profile viewer.
    avatar_url = f"/media/avatars/{filename}"
    previous_avatar = user.avatar_url
    user.avatar_url = avatar_url
    user.save(update_fields=["avatar_url"])
    if previous_avatar.startswith("/media/avatars/"):
        (avatars_dir / Path(previous_avatar).name).unlink(missing_ok=True)

    return AvatarUploadOut(
        success=True,
        avatar_url=f"/api/v2/core/profiles/{user.pk}/avatar/",
        message="Avatar uploaded successfully",
    )


@router.get("/settings/sessions/", response=SessionListOut, auth=JWTAuth())
def get_sessions(request: HttpRequest) -> SessionListOut:
    """List actual persisted JWT sessions for the current account."""
    from django.utils import timezone

    token = request.headers.get("Authorization", "").removeprefix("Bearer ")
    current_id = (verify_jwt_token(token) or {}).get("session_id")
    rows = AuthSession.objects.filter(
        user=request.auth, revoked_at__isnull=True, expires_at__gt=timezone.now()
    ).order_by("-last_activity")
    return SessionListOut(
        success=True,
        data=[
            SessionOut(
                session_key=str(row.pk),
                device=row.device,
                ip_address=row.ip_address,
                created_at=row.created_at,
                last_activity=row.last_activity,
                is_current=str(row.pk) == current_id,
            )
            for row in rows
        ],
    )


@router.delete("/settings/sessions/{session_id}/", response=MessageResponse, auth=JWTAuth())
def revoke_session(request: HttpRequest, session_id: str) -> MessageResponse:
    """Revoke one other JWT session and its refresh capability."""
    from django.utils import timezone

    token = request.headers.get("Authorization", "").removeprefix("Bearer ")
    current_id = (verify_jwt_token(token) or {}).get("session_id")
    if session_id == current_id:
        raise HttpError(400, "Cannot revoke current session. Use logout instead.")
    try:
        UUID(session_id)
    except ValueError as exc:
        raise HttpError(404, "Session not found") from exc
    session = AuthSession.objects.filter(pk=session_id, user=request.auth).first()
    if session is None:
        raise HttpError(404, "Session not found")
    session.revoked_at = timezone.now()
    session.save(update_fields=["revoked_at"])
    return MessageResponse(success=True, message="Session revoked successfully")


@router.get("/settings/login-history/", response=LoginHistoryListOut, auth=JWTAuth())
def get_login_history(request: HttpRequest) -> LoginHistoryListOut:
    """Show successful login events; no approximate timestamps or fabricated attempts."""
    from django.utils import timezone

    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    rows = AuthSession.objects.filter(user=request.auth, created_at__gte=thirty_days_ago).order_by("-created_at")[:20]
    return LoginHistoryListOut(
        success=True,
        data=[
            LoginHistoryOut(login_time=row.created_at, ip_address=row.ip_address, device=row.device, success=True)
            for row in rows
        ],
    )
