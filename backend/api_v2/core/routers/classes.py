from __future__ import annotations

from django.http import HttpRequest
from django.utils import timezone
from ninja import Query, Router
from ninja.errors import HttpError

from api_v2.schemas.base import PaginationParams, SuccessResponse
from api_v2.types.enums import UserRole
from api_v2.types.ids import (
    ClassId,
    EnrollmentId,
    UserId,
)
from api_v2.utils.auth import JWTAuth
from api_v2.utils.permissions import IsAdminOrLecturer, has_role
from api_v2.utils.types import paginate
from core.models import (
    Class,
    Enrollment,
    TeachingAssn,
    Unit,
    User,
)
from core.services import EnrollmentService

from ..schemas import (
    BatchEnrollIn,
    BatchEnrollResultOut,
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
    UserOut,
)

router = Router(tags=["Classes"], auth=JWTAuth())


def _check_admin_or_lecturer(request: HttpRequest) -> None:
    IsAdminOrLecturer().check(request)


def _check_student(request: HttpRequest) -> None:
    user = request.auth
    if not has_role(user, [UserRole.STUDENT]):
        raise HttpError(403, "Only students can perform this action")


# =============================================================================
# Classes
# =============================================================================


@router.get("/classes/", response=list[ClassOut])
def list_classes(
    request: HttpRequest,
    filters: ClassFilterParams = Query(...),
    pagination: PaginationParams = Query(...),
):
    qs = filters.filter(Class.objects.all())
    return paginate(qs, pagination)["results"]


@router.post("/classes/", response=ClassOut)
def create_class(request: HttpRequest, data: ClassIn):
    IsAdminOrLecturer().check(request)
    try:
        unit = Unit.objects.get(unit_id=data.unit_id_unit)
    except Unit.DoesNotExist:
        raise HttpError(400, "Unit not found")

    class_obj = Class.objects.create(
        unit_id_unit=unit,
        class_size=data.class_size,
        class_name=data.class_name,
        class_desc=data.class_desc,
        class_join_code=data.class_join_code,
        class_term=data.class_term,
        class_year=data.class_year,
    )
    return class_obj


@router.post("/classes/join/", response=ClassOut)
def join_class_by_code(request: HttpRequest, join_code: str):
    """Student joins a class using join code."""
    _check_student(request)
    user = request.auth
    try:
        class_obj = Class.objects.get(class_join_code=join_code.upper())

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


@router.get("/classes/{class_id}/", response=ClassOut)
def get_class(request: HttpRequest, class_id: ClassId):
    try:
        return Class.objects.get(class_id=class_id)
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.put("/classes/{class_id}/", response=ClassOut)
def update_class(request: HttpRequest, class_id: ClassId, data: ClassIn):
    _check_admin_or_lecturer(request)
    try:
        class_obj = Class.objects.get(class_id=class_id)
        if data.unit_id_unit:
            class_obj.unit_id_unit = Unit.objects.get(unit_id=data.unit_id_unit)
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
        class_obj.class_size = data.class_size
        class_obj.save()
        return class_obj
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.delete("/classes/{class_id}/", response=SuccessResponse)
def delete_class(request: HttpRequest, class_id: ClassId) -> SuccessResponse:
    _check_admin_or_lecturer(request)
    try:
        class_obj = Class.objects.get(class_id=class_id)
        class_obj.delete()
        return SuccessResponse(success=True)
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


# =============================================================================
# Enrollments
# =============================================================================


@router.get("/enrollments/", response=list[EnrollmentOut])
def list_enrollments(request: HttpRequest, filters: EnrollmentFilterParams = EnrollmentFilterParams()):
    qs = filters.filter(Enrollment.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/enrollments/", response=EnrollmentOut)
def create_enrollment(request: HttpRequest, data: EnrollmentIn):
    _check_admin_or_lecturer(request)
    enrollment = Enrollment.objects.create(**data.dict())
    return enrollment


@router.get("/enrollments/{enrollment_id}/", response=EnrollmentOut)
def get_enrollment(request: HttpRequest, enrollment_id: EnrollmentId):
    try:
        return Enrollment.objects.get(enrollment_id=enrollment_id)
    except Enrollment.DoesNotExist:
        raise HttpError(404, "Enrollment not found")


@router.delete("/enrollments/{enrollment_id}/", response=SuccessResponse)
def delete_enrollment(request: HttpRequest, enrollment_id: EnrollmentId) -> SuccessResponse:
    _check_admin_or_lecturer(request)
    try:
        enrollment = Enrollment.objects.get(enrollment_id=enrollment_id)
        enrollment.delete()
        return SuccessResponse(success=True)
    except Enrollment.DoesNotExist:
        raise HttpError(404, "Enrollment not found")


# =============================================================================
# TeachingAssignments
# =============================================================================


@router.get("/teaching-assignments/", response=list[TeachingAssnOut])
def list_teaching_assignments(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = TeachingAssn.objects.all()
    return paginate(qs, params)["results"]


@router.post("/teaching-assignments/", response=TeachingAssnOut)
def create_teaching_assignment(request: HttpRequest, data: TeachingAssnIn):
    _check_admin_or_lecturer(request)
    user = User.objects.get(user_id=data.user_id_user)
    class_obj = Class.objects.get(class_id=data.class_id_class)
    assignment = TeachingAssn.objects.create(
        user_id_user=user,
        class_id_class=class_obj,
    )
    return assignment


@router.get("/teaching-assignments/{assignment_id}/", response=TeachingAssnOut)
def get_teaching_assignment(request: HttpRequest, assignment_id: int):
    try:
        return TeachingAssn.objects.get(teaching_assn_id=assignment_id)
    except TeachingAssn.DoesNotExist:
        raise HttpError(404, "Teaching assignment not found")


@router.delete("/teaching-assignments/{assignment_id}/", response=SuccessResponse)
def delete_teaching_assignment(request: HttpRequest, assignment_id: int) -> SuccessResponse:
    _check_admin_or_lecturer(request)
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
        student_ids = Enrollment.objects.filter(class_id_class=class_obj).values_list("user_id_user", flat=True)
        return User.objects.filter(user_id__in=student_ids)
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.post("/classes/{class_id}/students/", response=UserOut)
def add_student_to_class(request: HttpRequest, class_id: ClassId, user_id: UserId):
    """Add a student to a class (admin/lecturer only)."""
    _check_admin_or_lecturer(request)
    try:
        class_obj = Class.objects.get(class_id=class_id)
        student = User.objects.get(user_id=user_id)

        if Enrollment.objects.filter(user_id_user=student, class_id_class=class_obj).exists():
            raise HttpError(400, "Student already enrolled")

        Enrollment.objects.create(
            user_id_user=student,
            class_id_class=class_obj,
            unit_id_unit=class_obj.unit_id_unit,
        )

        class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
        class_obj.save()

        return student
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")
    except User.DoesNotExist:
        raise HttpError(404, "Student not found")


@router.delete("/classes/{class_id}/students/{user_id}/", response=SuccessResponse)
def remove_student_from_class(request: HttpRequest, class_id: ClassId, user_id: UserId) -> SuccessResponse:
    """Remove a student from a class (admin/lecturer only)."""
    _check_admin_or_lecturer(request)
    try:
        class_obj = Class.objects.get(class_id=class_id)
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
    _check_admin_or_lecturer(request)
    try:
        class_obj = Class.objects.get(class_id=class_id)
        class_obj.class_status = "archived"
        class_obj.class_archived_at = timezone.now()
        class_obj.save()
        return class_obj
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.delete("/classes/{class_id}/leave/", response=SuccessResponse)
def leave_class(request: HttpRequest, class_id: ClassId) -> SuccessResponse:
    """Student leaves a class."""
    _check_student(request)
    user = request.auth

    try:
        class_obj = Class.objects.get(class_id=class_id)

        # Check if enrolled
        enrollment = Enrollment.objects.filter(user_id_user=user, class_id_class=class_obj).first()
        if not enrollment:
            raise HttpError(400, "Not enrolled in this class")

        # Delete enrollment
        enrollment.delete()

        # Update class size
        class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
        class_obj.save()

        return SuccessResponse(success=True, message="Successfully left the class")
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


# --- Class Actions (PRD-10) ---
@router.post("/admin/classes/batch-enroll/", response=BatchEnrollResultOut)
def batch_enroll_students(request: HttpRequest, data: BatchEnrollIn):
    """
    Batch enroll students via email. Creates 'unregistered' users if they don't exist.
    Admin only.
    """
    user = request.auth
    if not has_role(user, [UserRole.ADMIN]):
        raise HttpError(403, "Only admins can batch enroll students")

    try:
        class_obj = Class.objects.get(class_id=data.class_id)
    except Class.DoesNotExist:
        raise HttpError(400, "Class not found")

    if not data.student_emails:
        raise HttpError(400, "Email list cannot be empty")

    result = EnrollmentService.batch_enroll(class_obj, data.student_emails)
    return result


@router.post("/admin/users/invite-lecturer/", response=InviteLecturerOut)
def invite_lecturer(request: HttpRequest, data: InviteLecturerIn):
    """
    Invite a new lecturer via email. Creates an 'unregistered' lecturer account.
    Admin only.
    """
    user = request.auth
    if not has_role(user, [UserRole.ADMIN]):
        raise HttpError(403, "Only admins can invite lecturers")

    result = EnrollmentService.invite_lecturer(data.email, data.first_name, data.last_name)

    return {
        "success": True,
        "message": "Lecturer invited successfully",
        "user_id": result["user"].user_id,
        "email": result["user"].user_email,
        "status": result["status"],
    }
