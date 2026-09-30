"""Admin-issued, one-time password recovery for private local accounts."""

from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from core.models import AdminAuditEvent, PasswordResetGrant, User


class PasswordResetError(ValueError):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


def _digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@transaction.atomic
def issue_password_reset(actor: User, target: User) -> tuple[PasswordResetGrant, str]:
    if actor.user_role != "admin" or actor.user_status != "active":
        raise PasswordResetError("Administrator access required", 403)
    target = User.objects.select_for_update().get(pk=target.pk)
    if target.user_role == "admin":
        raise PasswordResetError("Administrator passwords use the account settings flow", 403)
    if target.user_status != "active" or not target.is_active:
        raise PasswordResetError("Restore the account before issuing a password reset", 409)

    PasswordResetGrant.objects.filter(user=target, used_at__isnull=True).update(used_at=timezone.now())
    token = secrets.token_urlsafe(32)
    grant = PasswordResetGrant.objects.create(
        user=target,
        issued_by=actor,
        token_hash=_digest(token),
        expires_at=timezone.now() + timedelta(hours=1),
    )
    AdminAuditEvent.objects.create(actor=actor, target=target, action="password_reset_issued")
    return grant, token


def preview_password_reset(token: str) -> PasswordResetGrant:
    grant = PasswordResetGrant.objects.select_related("user").filter(token_hash=_digest(token)).first()
    if grant is None or grant.used_at is not None or grant.expires_at <= timezone.now():
        raise PasswordResetError("Reset link is invalid or expired", 404)
    if grant.user.user_status != "active" or not grant.user.is_active:
        raise PasswordResetError("Account is not active", 409)
    return grant


@transaction.atomic
def complete_password_reset(token: str, password: str) -> User:
    grant = (
        PasswordResetGrant.objects.select_for_update().select_related("user").filter(token_hash=_digest(token)).first()
    )
    if grant is None or grant.used_at is not None or grant.expires_at <= timezone.now():
        raise PasswordResetError("Reset link is invalid or expired", 404)
    user = User.objects.select_for_update().get(pk=grant.user_id)
    if user.user_status != "active" or not user.is_active:
        raise PasswordResetError("Account is not active", 409)
    try:
        validate_password(password, user)
    except ValidationError as exc:
        raise PasswordResetError("; ".join(exc.messages)) from exc
    user.set_password(password)
    user.auth_version += 1
    user.save(update_fields=["password", "auth_version"])
    from core.models import AuthSession

    AuthSession.objects.filter(user=user, revoked_at__isnull=True).update(revoked_at=timezone.now())
    grant.used_at = timezone.now()
    grant.save(update_fields=["used_at"])
    AdminAuditEvent.objects.create(actor=user, target=user, action="password_reset_completed")
    return user
