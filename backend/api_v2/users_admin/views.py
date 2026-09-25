"""Administration of invited accounts and a scoped activity record."""

from __future__ import annotations

from django.db import transaction
from django.db.models import Q
from django.http import HttpRequest
from django.utils import timezone
from ninja import Query, Router
from ninja.errors import HttpError

from api_v2.schemas.base import SuccessResponse
from api_v2.types.enums import AdminAction, UserRole, UserStatus
from api_v2.types.ids import UserId
from api_v2.utils.auth import JWTAuth
from api_v2.utils.permissions import IsAdmin
from core.models import AdminAuditEvent, Class, CourseLeadAssignment, Enrollment, Submission, TeachingAssn, User
from core.password_reset import PasswordResetError, issue_password_reset

from .schemas import (
    ActivityLogOut,
    ActivityLogQueryIn,
    AdminActionIn,
    DirectoryDetailOut,
    DirectoryNameUpdateIn,
    DirectoryUserOut,
    PasswordResetIssueOut,
)

router = Router(tags=["Users Admin"], auth=JWTAuth())


def _directory_user(user: User) -> dict:
    return {
        "user_id": user.pk,
        "user_email": user.user_email,
        "user_fname": user.user_fname,
        "user_lname": user.user_lname,
        "user_role": user.user_role,
        "user_status": user.user_status,
        "date_joined": user.date_joined,
    }


@router.get("/", response=list[DirectoryUserOut])
def list_directory(
    request: HttpRequest,
    search: str = "",
    role: UserRole | None = None,
    status: UserStatus | None = None,
    page: int = 1,
):
    IsAdmin().check(request)
    if page < 1:
        raise HttpError(400, "Page must be positive")
    queryset = User.objects.all().order_by("user_id")
    if search.strip():
        needle = search.strip()[:100]
        queryset = queryset.filter(
            Q(user_email__icontains=needle) | Q(user_fname__icontains=needle) | Q(user_lname__icontains=needle)
        )
    if role:
        queryset = queryset.filter(user_role=role)
    if status:
        queryset = queryset.filter(user_status=status)
    return [_directory_user(user) for user in queryset[(page - 1) * 100 : page * 100]]


@router.get("/{user_id}/", response=DirectoryDetailOut)
def get_directory_user(request: HttpRequest, user_id: UserId):
    IsAdmin().check(request)
    user = User.objects.filter(pk=user_id).first()
    if user is None:
        raise HttpError(404, "User not found")
    classes = [
        {
            "class_id": row.class_id_class_id,
            "class_name": row.class_id_class.class_name,
            "unit_id": row.unit_id_unit_id,
            "relationship": "student",
        }
        for row in Enrollment.objects.filter(user_id_user=user).select_related("class_id_class")
    ]
    classes.extend(
        {
            "class_id": row.class_id_class_id,
            "class_name": row.class_id_class.class_name,
            "unit_id": row.class_id_class.unit_id_unit_id,
            "relationship": "teacher",
        }
        for row in TeachingAssn.objects.filter(user_id_user=user).select_related("class_id_class")
    )
    listed_class_ids = {row["class_id"] for row in classes}
    lead_units = CourseLeadAssignment.objects.filter(user_id_user=user).values_list("unit_id_unit_id", flat=True)
    for course_class in Class.objects.filter(unit_id_unit_id__in=lead_units):
        if course_class.pk not in listed_class_ids:
            classes.append(
                {
                    "class_id": course_class.pk,
                    "class_name": course_class.class_name,
                    "unit_id": course_class.unit_id_unit_id,
                    "relationship": "course_lead",
                }
            )
    return {
        **_directory_user(user),
        "classes": classes,
        "submissions_count": Submission.objects.filter(user_id_user=user).count(),
    }


@router.patch("/{user_id}/", response=DirectoryUserOut)
def update_directory_name(request: HttpRequest, user_id: UserId, data: DirectoryNameUpdateIn):
    IsAdmin().check(request)
    with transaction.atomic():
        user = User.objects.select_for_update().filter(pk=user_id).first()
        if user is None:
            raise HttpError(404, "User not found")
        first = data.user_fname.strip()
        last = data.user_lname.strip()
        if not first and not last:
            raise HttpError(400, "At least one name field is required")
        user.user_fname = first
        user.user_lname = last
        user.save(update_fields=["user_fname", "user_lname"])
        AdminAuditEvent.objects.create(
            actor=request.auth, target=user, action="profile_edit", reason="Administrator updated account name"
        )
    return _directory_user(user)


@router.post("/{user_id}/action/", response=SuccessResponse)
def perform_admin_action(request: HttpRequest, user_id: UserId, data: AdminActionIn):
    IsAdmin().check(request)
    with transaction.atomic():
        target = User.objects.select_for_update().filter(pk=user_id).first()
        if target is None:
            raise HttpError(404, "User not found")
        if data.action == AdminAction.RESET_PASSWORD:
            raise HttpError(409, "Use the dedicated password reset flow")
        if data.action == AdminAction.DISABLE_USER:
            if target.user_role == UserRole.ADMIN:
                raise HttpError(409, "Admin accounts cannot be disabled through the directory")
            target.user_status = UserStatus.SUSPENDED
            target.is_active = False
        elif data.action == AdminAction.ENABLE_USER:
            if target.user_status != UserStatus.SUSPENDED:
                raise HttpError(409, "Only suspended accounts can be enabled")
            target.user_status = UserStatus.ACTIVE
            target.is_active = True
        elif data.action != AdminAction.FORCE_LOGOUT:
            raise HttpError(400, "Unsupported admin action")
        target.auth_version += 1
        target.save(update_fields=["user_status", "is_active", "auth_version"])
        from core.models import AuthSession

        AuthSession.objects.filter(user=target, revoked_at__isnull=True).update(revoked_at=timezone.now())
        AdminAuditEvent.objects.create(
            actor=request.auth,
            target=target,
            action=data.action,
            reason=(data.reason or "").strip(),
        )
    return SuccessResponse(success=True)


@router.post("/{user_id}/password-reset/", response=PasswordResetIssueOut)
def create_password_reset(request: HttpRequest, user_id: UserId):
    IsAdmin().check(request)
    target = User.objects.filter(pk=user_id).first()
    if target is None:
        raise HttpError(404, "User not found")
    try:
        grant, token = issue_password_reset(request.auth, target)
    except PasswordResetError as exc:
        raise HttpError(exc.status, str(exc)) from exc
    return PasswordResetIssueOut(token=token, email=target.user_email, expires_at=grant.expires_at)


@router.get("/{user_id}/activity/", response=list[ActivityLogOut])
def get_user_activity(request: HttpRequest, user_id: UserId, filters: ActivityLogQueryIn = Query(...)):
    IsAdmin().check(request)
    if not User.objects.filter(pk=user_id).exists():
        raise HttpError(404, "User not found")
    queryset = AdminAuditEvent.objects.filter(target_id=user_id)
    if filters.start_date:
        queryset = queryset.filter(created_at__gte=filters.start_date)
    if filters.end_date:
        queryset = queryset.filter(created_at__lte=filters.end_date)
    if filters.action_type:
        queryset = queryset.filter(action=filters.action_type)
    return [
        {
            "id": event.pk,
            "user_id": user_id,
            "action": event.action,
            "details": {"actor_id": event.actor_id, "reason": event.reason},
            "ip_address": None,
            "created_at": event.created_at,
            "updated_at": None,
        }
        for event in queryset[:100]
    ]
