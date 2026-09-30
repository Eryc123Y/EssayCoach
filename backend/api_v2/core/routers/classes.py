from __future__ import annotations

from datetime import datetime

from django.db import transaction
from django.http import HttpRequest
from django.utils import timezone
from ninja import Query, Router, Schema
from ninja.errors import HttpError

from api_v2.schemas.base import PaginationParams, SuccessResponse
from api_v2.types.enums import UserRole
from api_v2.types.ids import (
    ClassId,
    EnrollmentId,
    UserId,
)
from api_v2.utils.auth import JWTAuth
from api_v2.utils.course_scope import (
    can_create_class,
    require_manage_class,
    require_visible_class,
    visible_classes,
)
from api_v2.utils.permissions import IsAdminOrLecturer, has_role
from core.models import (
    Class,
    ClassLeaveRequest,
    CourseLeadAssignment,
    Enrollment,
    Task,
    TeachingAssn,
    Unit,
    User,
)

from ..schemas import (
    BatchEnrollIn,
    BatchEnrollResultOut,
    ClassDetailOut,
    ClassFilterParams,
    ClassIn,
    ClassOut,
    EnrollmentFilterParams,
    EnrollmentIn,
    EnrollmentOut,
    InviteLecturerIn,
    InviteLecturerOut,
    TeachingAssnIn,
    TeachingAssnOut,
    UnitOut,
    UserOut,
)


def paginate(queryset, params: PaginationParams):
    if isinstance(queryset, list):
        # Already a list (from .values())
        total = len(queryset)
        start = (params.page - 1) * params.page_size
        end = start + params.page_size
        return {"count": total, "results": queryset[start:end]}
    else:
        # QuerySet
        total = queryset.count()
        start = (params.page - 1) * params.page_size
        end = start + params.page_size
        return {"count": total, "results": list(queryset[start:end])}


router = Router(tags=["Classes"], auth=JWTAuth())


class ClassDuplicateIn(Schema):
    class_name: str | None = None


class ClassLeaveRequestIn(Schema):
    reason: str = ""


class ClassLeaveDecisionIn(Schema):
    approve: bool


class ClassLeaveRequestOut(Schema):
    id: int
    student_id: int
    student_name: str
    status: str
    reason: str
    requested_at: datetime
    decided_at: datetime | None


def _leave_request_out(item: ClassLeaveRequest) -> ClassLeaveRequestOut:
    student = item.student
    return ClassLeaveRequestOut(
        id=item.pk,
        student_id=student.pk,
        student_name=f"{student.user_fname or ''} {student.user_lname or ''}".strip() or student.user_email,
        status=item.status,
        reason=item.reason,
        requested_at=item.requested_at,
        decided_at=item.decided_at,
    )


def _check_admin_or_lecturer(request: HttpRequest) -> None:
    IsAdminOrLecturer().check(request)


def _check_student(request: HttpRequest) -> None:
    user = request.auth
    if not has_role(user, [UserRole.STUDENT]):
        raise HttpError(403, "Only students can perform this action")


# =============================================================================
# Classes
# =============================================================================


@router.get("/classes/create-options/", response=list[UnitOut])
def class_create_options(request: HttpRequest):
    """Courses in which the current user may create a class."""
    if request.auth.user_role == "admin":
        return Unit.objects.all().order_by("unit_id")
    if request.auth.user_role == "lecturer":
        unit_ids = CourseLeadAssignment.objects.filter(user_id_user=request.auth).values_list(
            "unit_id_unit_id", flat=True
        )
        return Unit.objects.filter(unit_id__in=unit_ids).order_by("unit_id")
    return Unit.objects.none()


@router.get("/classes/", response=list[ClassOut])
def list_classes(
    request: HttpRequest,
    filters: ClassFilterParams = Query(...),
    pagination: PaginationParams = Query(...),
):
    qs = filters.filter(visible_classes(request.auth))
    return paginate(qs, pagination)["results"]


@router.post("/classes/", response=ClassOut)
def create_class(request: HttpRequest, data: ClassIn):
    _check_admin_or_lecturer(request)
    try:
        unit = Unit.objects.get(unit_id=data.unit_id_unit)
    except Unit.DoesNotExist:
        raise HttpError(400, "Unit not found")
    if not can_create_class(request.auth, unit.unit_id):
        raise HttpError(403, "Only an admin or this course's lead can create a class")

    class_obj = Class.objects.create(
        unit_id_unit=unit,
        class_size=0,
        class_name=data.class_name,
        class_desc=data.class_desc,
        class_join_code=data.class_join_code,
        class_term=data.class_term,
        class_year=data.class_year or timezone.now().year,
    )
    return class_obj


@router.post("/classes/join/", response=ClassOut)
def join_class_by_code(request: HttpRequest, join_code: str):
    """Student joins a class using join code."""
    _check_student(request)
    user = request.auth
    try:
        class_obj = Class.objects.get(class_join_code=join_code.upper(), class_status="active")

        # Check if already enrolled
        if Enrollment.objects.filter(user_id_user=user, class_id_class=class_obj).exists():
            raise HttpError(400, "Already enrolled in this class")

        # Create enrollment
        Enrollment.objects.create(
            user_id_user=user,
            class_id_class=class_obj,
            unit_id_unit=class_obj.unit_id_unit,
        )

        # Update class size
        class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
        class_obj.save()

        return class_obj
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found with this join code")


@router.get("/classes/{class_id}/", response=ClassDetailOut)
def get_class(request: HttpRequest, class_id: ClassId):
    try:
        class_obj = Class.objects.get(class_id=class_id)
        require_visible_class(request.auth, class_obj)
        return ClassDetailOut(
            class_id=class_obj.class_id,
            unit_id_unit=class_obj.unit_id_unit_id,
            unit_name=class_obj.unit_id_unit.unit_name,
            class_name=class_obj.class_name,
            class_desc=class_obj.class_desc,
            class_join_code=class_obj.class_join_code,
            class_term=class_obj.class_term,
            class_year=class_obj.class_year,
            class_status=class_obj.class_status,
            class_size=class_obj.class_size,
            class_archived_at=class_obj.class_archived_at,
        )
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.put("/classes/{class_id}/", response=ClassOut)
def update_class(request: HttpRequest, class_id: ClassId, data: ClassIn):
    try:
        class_obj = Class.objects.get(class_id=class_id)
        require_manage_class(request.auth, class_obj)
        if data.unit_id_unit != class_obj.unit_id_unit_id:
            raise HttpError(400, "Moving a class between courses is not supported")
        if data.class_name:
            class_obj.class_name = data.class_name
        if data.class_desc is not None:
            class_obj.class_desc = data.class_desc
        if data.class_join_code is not None:
            class_obj.class_join_code = data.class_join_code
        if data.class_term:
            class_obj.class_term = data.class_term
        if data.class_year is not None:
            class_obj.class_year = data.class_year
        class_obj.save()
        return class_obj
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.delete("/classes/{class_id}/", response=SuccessResponse)
def delete_class(request: HttpRequest, class_id: ClassId) -> SuccessResponse:
    try:
        class_obj = Class.objects.get(class_id=class_id)
        require_manage_class(request.auth, class_obj)
        if Enrollment.objects.filter(class_id_class=class_obj).exists() or Task.objects.filter(
            class_id_class=class_obj
        ).exists() or ClassLeaveRequest.objects.filter(class_obj=class_obj).exists():
            raise HttpError(409, "Archive classes that contain students, assignments, or leave history")
        class_obj.delete()
        return SuccessResponse(success=True)
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.post("/classes/{class_id}/duplicate/", response=ClassOut)
def duplicate_class(request: HttpRequest, class_id: ClassId, data: ClassDuplicateIn):
    """Copy class settings into a new empty class with a fresh join code."""
    source = Class.objects.filter(pk=class_id).first()
    if source is None:
        raise HttpError(404, "Class not found")
    require_visible_class(request.auth, source)
    if not can_create_class(request.auth, source.unit_id_unit_id):
        raise HttpError(403, "Only an admin or this course's lead can create a class")
    name = (data.class_name or f"{source.class_name} (copy)").strip()
    if not name or len(name) > 100:
        raise HttpError(400, "Class name must be between 1 and 100 characters")
    return Class.objects.create(
        unit_id_unit=source.unit_id_unit,
        class_name=name,
        class_desc=source.class_desc,
        class_term=source.class_term,
        class_year=source.class_year,
        class_size=0,
    )


# =============================================================================
# Enrollments
# =============================================================================


@router.get("/enrollments/", response=list[EnrollmentOut])
def list_enrollments(request: HttpRequest, filters: EnrollmentFilterParams = EnrollmentFilterParams()):
    qs = Enrollment.objects.filter(class_id_class__in=visible_classes(request.auth))
    if request.auth.user_role == "student":
        qs = qs.filter(user_id_user=request.auth)
    qs = filters.filter(qs)
    return paginate(qs, PaginationParams())["results"]


@router.post("/enrollments/", response=EnrollmentOut)
def create_enrollment(request: HttpRequest, data: EnrollmentIn):
    raise HttpError(410, "Use a student invitation or a class join code")


@router.get("/enrollments/{enrollment_id}/", response=EnrollmentOut)
def get_enrollment(request: HttpRequest, enrollment_id: EnrollmentId):
    try:
        enrollment = Enrollment.objects.get(enrollment_id=enrollment_id)
        if request.auth.user_role == "student" and enrollment.user_id_user_id != request.auth.user_id:
            raise HttpError(403, "Enrollment is outside your account")
        require_visible_class(request.auth, enrollment.class_id_class)
        return enrollment
    except Enrollment.DoesNotExist:
        raise HttpError(404, "Enrollment not found")


@router.delete("/enrollments/{enrollment_id}/", response=SuccessResponse)
def delete_enrollment(request: HttpRequest, enrollment_id: EnrollmentId) -> SuccessResponse:
    try:
        enrollment = Enrollment.objects.get(enrollment_id=enrollment_id)
        require_manage_class(request.auth, enrollment.class_id_class)
        class_obj = enrollment.class_id_class
        enrollment.delete()
        class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
        class_obj.save(update_fields=["class_size"])
        return SuccessResponse(success=True)
    except Enrollment.DoesNotExist:
        raise HttpError(404, "Enrollment not found")


# =============================================================================
# TeachingAssignments
# =============================================================================


@router.get("/teaching-assignments/", response=list[TeachingAssnOut])
def list_teaching_assignments(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = TeachingAssn.objects.all() if request.auth.user_role == "admin" else TeachingAssn.objects.filter(
        user_id_user=request.auth
    )
    return paginate(qs, params)["results"]


@router.post("/teaching-assignments/", response=TeachingAssnOut)
def create_teaching_assignment(request: HttpRequest, data: TeachingAssnIn):
    if request.auth.user_role != "admin":
        raise HttpError(403, "Only admins can assign teaching staff")
    user = User.objects.filter(user_id=data.user_id_user, user_role="lecturer", user_status="active").first()
    if user is None:
        raise HttpError(400, "An active lecturer is required")
    class_obj = Class.objects.filter(class_id=data.class_id_class).first()
    if class_obj is None:
        raise HttpError(404, "Class not found")
    assignment = TeachingAssn.objects.create(
        user_id_user=user,
        class_id_class=class_obj,
    )
    return assignment


@router.get("/teaching-assignments/{assignment_id}/", response=TeachingAssnOut)
def get_teaching_assignment(request: HttpRequest, assignment_id: int):
    try:
        assignment = TeachingAssn.objects.get(teaching_assn_id=assignment_id)
        if request.auth.user_role != "admin" and assignment.user_id_user_id != request.auth.user_id:
            raise HttpError(403, "Teaching assignment is outside your account")
        return assignment
    except TeachingAssn.DoesNotExist:
        raise HttpError(404, "Teaching assignment not found")


@router.delete("/teaching-assignments/{assignment_id}/", response=SuccessResponse)
def delete_teaching_assignment(request: HttpRequest, assignment_id: int) -> SuccessResponse:
    if request.auth.user_role != "admin":
        raise HttpError(403, "Only admins can change teaching assignments")
    try:
        assignment = TeachingAssn.objects.get(teaching_assn_id=assignment_id)
        assignment.delete()
        return SuccessResponse(success=True)
    except TeachingAssn.DoesNotExist:
        raise HttpError(404, "Teaching assignment not found")


# =============================================================================
# Class Actions
# =============================================================================


@router.get("/classes/{class_id}/students/", response=list[UserOut])
def get_class_students(request: HttpRequest, class_id: ClassId):
    """Get all students in a class."""
    try:
        class_obj = Class.objects.get(class_id=class_id)
        require_manage_class(request.auth, class_obj)
        student_ids = Enrollment.objects.filter(class_id_class=class_obj).values_list("user_id_user", flat=True)
        return User.objects.filter(user_id__in=student_ids)
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.post("/classes/{class_id}/students/", response=UserOut)
def add_student_to_class(request: HttpRequest, class_id: ClassId, user_id: UserId):
    """Retired: new class membership requires an invitation or join code."""
    raise HttpError(410, "Use a student invitation or a class join code")


@router.delete("/classes/{class_id}/students/{user_id}/", response=SuccessResponse)
def remove_student_from_class(request: HttpRequest, class_id: ClassId, user_id: UserId) -> SuccessResponse:
    """Remove a student from a class (admin/lecturer only)."""
    try:
        class_obj = Class.objects.get(class_id=class_id)
        require_manage_class(request.auth, class_obj)
        enrollment = Enrollment.objects.get(user_id_user_id=user_id, class_id_class=class_obj)
        enrollment.delete()

        class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
        class_obj.save()

        return SuccessResponse(success=True)
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")
    except Enrollment.DoesNotExist:
        raise HttpError(404, "Student not enrolled in this class")


@router.post("/classes/{class_id}/archive/", response=ClassOut)
def archive_class(request: HttpRequest, class_id: ClassId):
    """Archive a class."""
    try:
        class_obj = Class.objects.get(class_id=class_id)
        require_manage_class(request.auth, class_obj)
        class_obj.class_status = "archived"
        class_obj.class_archived_at = timezone.now()
        class_obj.save()
        return class_obj
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.delete("/classes/{class_id}/leave/", response=SuccessResponse)
def leave_class(request: HttpRequest, class_id: ClassId) -> SuccessResponse:
    """Retired: withdrawals now require a teaching staff decision."""
    raise HttpError(410, "Use a class leave request")


@router.get("/classes/{class_id}/leave-requests/", response=list[ClassLeaveRequestOut])
def list_class_leave_requests(request: HttpRequest, class_id: ClassId):
    class_obj = Class.objects.filter(pk=class_id).first()
    if class_obj is None:
        raise HttpError(404, "Class not found")
    require_visible_class(request.auth, class_obj)
    qs = ClassLeaveRequest.objects.filter(class_obj=class_obj).select_related("student").order_by("-requested_at")
    if request.auth.user_role == "student":
        qs = qs.filter(student=request.auth)
    return [_leave_request_out(item) for item in qs[:100]]


@router.post("/classes/{class_id}/leave-requests/", response=ClassLeaveRequestOut)
def request_class_leave(request: HttpRequest, class_id: ClassId, data: ClassLeaveRequestIn):
    _check_student(request)
    class_obj = Class.objects.filter(pk=class_id).first()
    if class_obj is None:
        raise HttpError(404, "Class not found")
    if not Enrollment.objects.filter(class_id_class=class_obj, user_id_user=request.auth).exists():
        raise HttpError(403, "You are not enrolled in this class")
    reason = data.reason.strip()
    if len(reason) > 1000:
        raise HttpError(400, "Reason must be 1000 characters or fewer")
    pending = ClassLeaveRequest.objects.filter(
        class_obj=class_obj, student=request.auth, status="pending"
    ).select_related("student").first()
    if pending is not None:
        return _leave_request_out(pending)
    item = ClassLeaveRequest.objects.create(class_obj=class_obj, student=request.auth, reason=reason)
    return _leave_request_out(item)


@router.post("/classes/{class_id}/leave-requests/{request_id}/decision/", response=ClassLeaveRequestOut)
def decide_class_leave(request: HttpRequest, class_id: ClassId, request_id: int, data: ClassLeaveDecisionIn):
    with transaction.atomic():
        class_obj = Class.objects.select_for_update().filter(pk=class_id).first()
        if class_obj is None:
            raise HttpError(404, "Class not found")
        require_manage_class(request.auth, class_obj)
        item = ClassLeaveRequest.objects.select_for_update().select_related("student").filter(
            pk=request_id, class_obj=class_obj
        ).first()
        if item is None:
            raise HttpError(404, "Leave request not found")
        if item.status != "pending":
            raise HttpError(409, "Leave request has already been decided")
        if data.approve:
            deleted, _ = Enrollment.objects.filter(class_id_class=class_obj, user_id_user=item.student).delete()
            if not deleted:
                raise HttpError(409, "Student is no longer enrolled")
            class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
            class_obj.save(update_fields=["class_size"])
        item.status = "approved" if data.approve else "declined"
        item.decided_at = timezone.now()
        item.decided_by = request.auth
        item.save(update_fields=["status", "decided_at", "decided_by"])
        return _leave_request_out(item)


# --- Class Actions (PRD-10) ---
@router.post("/admin/classes/batch-enroll/", response=BatchEnrollResultOut)
def batch_enroll_students(request: HttpRequest, data: BatchEnrollIn):
    """Retired: students must accept a scoped invitation before enrollment."""
    raise HttpError(410, "Use /api/v2/auth/invitations/batch/ to invite students")


@router.post("/admin/users/invite-lecturer/", response=InviteLecturerOut)
def invite_lecturer(request: HttpRequest, data: InviteLecturerIn):
    """Retired: staff invitations now return one-time activation links."""
    raise HttpError(410, "Use /api/v2/auth/invitations/ to invite staff")
