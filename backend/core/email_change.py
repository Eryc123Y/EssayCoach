"""Password-confirmed change of address with proof of access to the new inbox."""

from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from core.app_url import app_base_url
from core.models import AdminAuditEvent, AuthSession, EmailChangeGrant, User


class EmailChangeError(ValueError):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


def _digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@transaction.atomic
def issue_email_change(user: User, new_email: str, current_password: str) -> tuple[EmailChangeGrant, str]:
    user = User.objects.select_for_update().get(pk=user.pk)
    if user.user_status != "active" or not user.is_active:
        raise EmailChangeError("Account is not active", 403)
    if not user.check_password(current_password):
        raise EmailChangeError("Current password is incorrect", 403)
    normalized = new_email.strip().lower()
    if normalized == user.user_email.lower():
        raise EmailChangeError("This is already your email address")
    if User.objects.filter(user_email__iexact=normalized).exclude(pk=user.pk).exists():
        raise EmailChangeError("That email address is already in use", 409)
    now = timezone.now()
    if EmailChangeGrant.objects.filter(user=user, created_at__gte=now - timedelta(hours=1)).count() >= 3:
        raise EmailChangeError("Too many requests; try again later", 429)
    EmailChangeGrant.objects.filter(user=user, used_at__isnull=True).update(used_at=now)
    token = secrets.token_urlsafe(32)
    grant = EmailChangeGrant.objects.create(
        user=user, old_email=user.user_email, new_email=normalized,
        token_hash=_digest(token), expires_at=now + timedelta(hours=1),
    )
    link = f"{app_base_url()}/auth/verify-email#token={token}"
    send_mail(
        "Confirm your EssayCoach email address",
        (
            "You requested a change of your EssayCoach email address. "
            f"Confirm it within one hour:\n\n{link}\n\n"
            "If this wasn't you, ignore this message."
        ),
        settings.DEFAULT_FROM_EMAIL, [normalized],
    )
    return grant, token


def preview_email_change(token: str) -> EmailChangeGrant:
    grant = EmailChangeGrant.objects.select_related("user").filter(token_hash=_digest(token)).first()
    if grant is None or grant.used_at is not None or grant.expires_at <= timezone.now():
        raise EmailChangeError("Verification link is invalid or expired", 404)
    if grant.user.user_email != grant.old_email or grant.user.user_status != "active":
        raise EmailChangeError("Account has changed; request a new verification link", 409)
    return grant


@transaction.atomic
def complete_email_change(token: str) -> User:
    grant = EmailChangeGrant.objects.select_for_update().filter(token_hash=_digest(token)).first()
    if grant is None or grant.used_at is not None or grant.expires_at <= timezone.now():
        raise EmailChangeError("Verification link is invalid or expired", 404)
    user = User.objects.select_for_update().get(pk=grant.user_id)
    if user.user_email != grant.old_email or user.user_status != "active" or not user.is_active:
        raise EmailChangeError("Account has changed; request a new verification link", 409)
    if User.objects.filter(user_email__iexact=grant.new_email).exclude(pk=user.pk).exists():
        raise EmailChangeError("That email address is already in use", 409)
    user.user_email = grant.new_email
    user.auth_version += 1
    user.save(update_fields=["user_email", "auth_version"])
    AuthSession.objects.filter(user=user, revoked_at__isnull=True).update(revoked_at=timezone.now())
    grant.used_at = timezone.now()
    grant.save(update_fields=["used_at"])
    EmailChangeGrant.objects.filter(user=user, used_at__isnull=True).exclude(pk=grant.pk).update(used_at=timezone.now())
    AdminAuditEvent.objects.create(actor=user, target=user, action="email_changed")
    return user
