"""Invitation issuance and activation for the single-institution product."""

from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta
from typing import Literal

from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone

from core.models import Class, CourseLeadAssignment, Enrollment, Invitation, TeachingAssn, Unit, User

InviteRole = Literal["student", "lecturer"]


class InvitationError(Exception):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


def _digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _active_invitation(token: str, *, lock: bool = False) -> Invitation:
    query = Invitation.objects.all()
    if lock:
        query = query.select_for_update()
    else:
        query = query.select_related("class_id_class", "lead_unit")
    invitation = query.filter(token_hash=_digest(token)).first()
    if (
        invitation is None
        or invitation.accepted_at is not None
        or invitation.revoked_at is not None
        or invitation.expires_at <= timezone.now()
    ):
        raise InvitationError("Invitation is invalid or expired", 404)
    return invitation


def preview_invitation(token: str) -> Invitation:
    return _active_invitation(token)


@transaction.atomic
def issue_invitation(
    *,
    actor: User,
    email: str,
    role: InviteRole,
    class_obj: Class | None = None,
    lead_unit: Unit | None = None,
) -> tuple[Invitation, str]:
    """Issue one copyable token after checking role and teaching scope."""
    if not actor.is_active or actor.user_status != "active":
        raise InvitationError("Active account required", 403)
    if role == "student":
        if class_obj is None or lead_unit is not None:
            raise InvitationError("Student invitations require one class")
        if class_obj.class_status != "active":
            raise InvitationError("Cannot invite students to an archived class")
        if actor.user_role != "admin" and not (
            actor.user_role == "lecturer"
            and (
                TeachingAssn.objects.filter(user_id_user=actor, class_id_class=class_obj).exists()
                or CourseLeadAssignment.objects.filter(
                    user_id_user=actor, unit_id_unit=class_obj.unit_id_unit
                ).exists()
            )
        ):
            raise InvitationError("Only class teaching staff can invite students", 403)
    elif role == "lecturer":
        if actor.user_role != "admin":
            raise InvitationError("Only admins can invite teaching staff", 403)
        if class_obj is not None:
            raise InvitationError("Staff invitations cannot include a class")
    else:
        raise InvitationError("Unsupported invitation role")

    normalized_email = email.strip().lower()
    existing = User.objects.filter(user_email__iexact=normalized_email).first()
    if existing and existing.user_role != role:
        raise InvitationError("An account with another role already uses this email", 409)
    if existing and (not existing.is_active or existing.user_status == "suspended"):
        raise InvitationError("This account cannot be invited", 409)
    if role == "student" and existing and Enrollment.objects.filter(
        user_id_user=existing, class_id_class=class_obj
    ).exists():
        raise InvitationError("Student is already enrolled in this class", 409)

    Invitation.objects.filter(
        email=normalized_email,
        role=role,
        class_id_class=class_obj,
        lead_unit=lead_unit,
        accepted_at__isnull=True,
        revoked_at__isnull=True,
    ).update(revoked_at=timezone.now())

    token = secrets.token_urlsafe(32)
    invitation = Invitation.objects.create(
        token_hash=_digest(token),
        email=normalized_email,
        role=role,
        class_id_class=class_obj,
        lead_unit=lead_unit,
        invited_by=actor,
        expires_at=timezone.now() + timedelta(days=7),
    )
    return invitation, token


@transaction.atomic
def accept_invitation(
    *, token: str, password: str, first_name: str | None = None, last_name: str | None = None
) -> User:
    """Activate a new account or add a class/lead assignment to an existing account."""
    invitation = _active_invitation(token, lock=True)
    user = User.objects.select_for_update().filter(user_email__iexact=invitation.email).first()
    if user is not None:
        if user.user_role != invitation.role or not user.is_active or user.user_status == "suspended":
            raise InvitationError("This invitation cannot be used with the existing account", 409)
        if user.user_status == "active":
            if not user.check_password(password):
                raise InvitationError("Invalid account password", 401)
        else:
            validate_password(password, user)
            user.set_password(password)
            user.user_status = "active"
            user.user_fname = first_name or user.user_fname
            user.user_lname = last_name or user.user_lname
            user.save(update_fields=["password", "user_status", "user_fname", "user_lname"])
    else:
        validate_password(password)
        user = User.objects.create_user(
            user_email=invitation.email,
            password=password,
            user_fname=first_name or "",
            user_lname=last_name or "",
            user_role=invitation.role,
            user_status="active",
        )

    if invitation.class_id_class is not None:
        class_obj = invitation.class_id_class
        Enrollment.objects.get_or_create(
            user_id_user=user, class_id_class=class_obj, unit_id_unit=class_obj.unit_id_unit
        )
        class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
        class_obj.save(update_fields=["class_size"])
    if invitation.lead_unit is not None:
        CourseLeadAssignment.objects.get_or_create(
            user_id_user=user,
            unit_id_unit=invitation.lead_unit,
            defaults={"assigned_by": invitation.invited_by},
        )

    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["accepted_at"])
    return user
