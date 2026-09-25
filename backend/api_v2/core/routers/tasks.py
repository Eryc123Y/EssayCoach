from __future__ import annotations

import csv
from io import BytesIO, StringIO
from zipfile import ZIP_DEFLATED, ZipFile

from django.http import HttpRequest, HttpResponse
from ninja import Query, Router, Schema
from ninja.errors import HttpError

from api_v2.schemas.base import PaginationParams, SuccessResponse
from api_v2.types.enums import UserRole
from api_v2.types.ids import (
    TaskId,
)
from api_v2.utils.auth import JWTAuth
from api_v2.utils.course_scope import (
    can_create_class,
    require_manage_class,
    require_manage_task,
    require_visible_task,
    visible_tasks,
)
from api_v2.utils.permissions import IsAdminOrLecturer, has_role
from core.assessment import AssessmentError, rubric_snapshot_for_rubric
from core.models import (
    Class,
    DeadlineExtension,
    Enrollment,
    MarkingRubric,
    RubricItem,
    Submission,
    Task,
    Unit,
    User,
)
from core.notifications import notify_assignment_published, notify_deadline_extended
from core.services import TaskService

from ..schemas import (
    SubmissionOut,
    TaskDuplicateIn,
    TaskExtendIn,
    TaskExtendOut,
    TaskFilterParams,
    TaskIn,
    TaskOut,
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


router = Router(tags=["Tasks"], auth=JWTAuth())


class TaskRubricCriterionOut(Schema):
    id: int
    name: str
    weight: str
    max_score: int
    exemplar_text: str = ""
    levels: list[dict]


class TaskRubricOut(Schema):
    rubric_id: int
    description: str
    version: int
    items: list[TaskRubricCriterionOut]


class EligibleStudentOut(Schema):
    user_id: int
    user_email: str
    display_name: str


class StudentDeadlineOut(Schema):
    task_id: int
    global_deadline: str
    effective_deadline: str
    is_extended: bool
    submission_count: int


class TaskSubmissionSummaryOut(Schema):
    task_id: int
    eligible_students: int
    submitted_students: int
    submission_versions: int


def _check_admin_or_lecturer(request: HttpRequest) -> None:
    IsAdminOrLecturer().check(request)


def _require_assignable_rubric(user: User, rubric: MarkingRubric) -> None:
    if rubric.user_id_user.user_role == "student":
        raise HttpError(403, "Student study rubrics cannot grade assignments")
    if rubric.visibility == "private" and rubric.user_id_user_id != user.pk and user.user_role != "admin":
        raise HttpError(403, "This private rubric belongs to another author")


def _freeze_rubric(task: Task) -> None:
    try:
        items = rubric_snapshot_for_rubric(task.rubric_id_marking_rubric)
    except AssessmentError as exc:
        raise HttpError(400, str(exc)) from exc
    task.rubric_version += 1
    task.rubric_snapshot = {
        "rubric_id": task.rubric_id_marking_rubric_id,
        "description": task.rubric_id_marking_rubric.rubric_desc or "",
        "items": items,
    }


# =============================================================================
# Tasks
# =============================================================================


@router.get("/tasks/", response=list[TaskOut])
def list_tasks(
    request: HttpRequest,
    filters: TaskFilterParams = Query(...),
    pagination: PaginationParams = Query(...),
):
    qs = filters.filter(visible_tasks(request.auth))
    return paginate(qs, pagination)["results"]


@router.post("/tasks/", response=TaskOut)
def create_task(request: HttpRequest, data: TaskIn):
    _check_admin_or_lecturer(request)

    try:
        unit = Unit.objects.get(unit_id=data.unit_id_unit)
    except Unit.DoesNotExist:
        raise HttpError(400, "Unit not found")

    try:
        rubric = MarkingRubric.objects.select_related("user_id_user").get(rubric_id=data.rubric_id_marking_rubric)
    except MarkingRubric.DoesNotExist:
        raise HttpError(400, "Rubric not found")
    _require_assignable_rubric(request.auth, rubric)

    class_obj = None
    if data.class_id_class is not None:
        try:
            class_obj = Class.objects.get(class_id=data.class_id_class)
        except Class.DoesNotExist:
            raise HttpError(400, "Class not found")
        if class_obj.unit_id_unit_id != unit.unit_id:
            raise HttpError(400, "Assignment course must match its class")
        require_manage_class(request.auth, class_obj)
    elif not can_create_class(request.auth, unit.unit_id):
        raise HttpError(403, "Only this course's lead can create a course-wide assignment")

    task = Task(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=data.task_due_datetime,
        task_title=data.task_title,
        task_desc=data.task_desc,
        task_instructions=data.task_instructions or "",
        class_id_class=class_obj,
        task_status=data.task_status,
        task_allow_late_submission=data.task_allow_late_submission,
        task_allow_resubmission=data.task_allow_resubmission,
    )
    if task.task_status == "published":
        _freeze_rubric(task)
    task.save()
    if task.task_status == "published":
        notify_assignment_published(task)
    return task


@router.get("/tasks/{task_id}/", response=TaskOut)
def get_task(request: HttpRequest, task_id: TaskId):
    try:
        task = Task.objects.get(task_id=task_id)
        require_visible_task(request.auth, task)
        return task
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.get("/tasks/{task_id}/eligible-students/", response=list[EligibleStudentOut])
def get_task_eligible_students(request: HttpRequest, task_id: TaskId):
    task = Task.objects.filter(pk=task_id).first()
    if task is None:
        raise HttpError(404, "Task not found")
    require_manage_task(request.auth, task)
    enrollments = _eligible_enrollments(task)
    students = User.objects.filter(
        pk__in=enrollments.values_list("user_id_user_id", flat=True)
    ).distinct().order_by("user_email")
    return [
        {
            "user_id": student.pk,
            "user_email": student.user_email,
            "display_name": f"{student.user_fname or ''} {student.user_lname or ''}".strip()
            or student.user_email,
        }
        for student in students
    ]


@router.get("/tasks/{task_id}/my-deadline/", response=StudentDeadlineOut)
def get_my_task_deadline(request: HttpRequest, task_id: TaskId):
    if request.auth.user_role != "student":
        raise HttpError(403, "Only students have an individual deadline")
    task = Task.objects.filter(pk=task_id).first()
    if task is None:
        raise HttpError(404, "Task not found")
    require_visible_task(request.auth, task)
    extension = DeadlineExtension.objects.filter(task_id_task=task, user_id_user=request.auth).first()
    effective_deadline = (
        max(task.task_due_datetime, extension.extended_deadline)
        if extension else task.task_due_datetime
    )
    return {
        "task_id": task.pk,
        "global_deadline": task.task_due_datetime.isoformat(),
        "effective_deadline": effective_deadline.isoformat(),
        "is_extended": bool(extension and effective_deadline > task.task_due_datetime),
        "submission_count": Submission.objects.filter(task_id_task=task, user_id_user=request.auth).count(),
    }


@router.get("/tasks/{task_id}/rubric/", response=TaskRubricOut)
def get_task_rubric(request: HttpRequest, task_id: TaskId):
    task = Task.objects.select_related("rubric_id_marking_rubric").filter(pk=task_id).first()
    if task is None:
        raise HttpError(404, "Task not found")
    require_visible_task(request.auth, task)
    rubric = task.rubric_id_marking_rubric
    if task.rubric_snapshot:
        return TaskRubricOut(**task.rubric_snapshot, version=task.rubric_version)
    items = RubricItem.objects.filter(rubric_id_marking_rubric=rubric).prefetch_related("level_descriptions")
    return TaskRubricOut(
        rubric_id=rubric.pk,
        description=rubric.rubric_desc or "",
        version=0,
        items=[TaskRubricCriterionOut(
            id=item.pk,
            name=item.rubric_item_name,
            weight=str(item.rubric_item_weight),
            max_score=max((level.level_max_score for level in item.level_descriptions.all()), default=0),
            exemplar_text=item.exemplar_text,
            levels=[{
                "min": level.level_min_score,
                "max": level.level_max_score,
                "description": level.level_desc,
            } for level in item.level_descriptions.all()],
        ) for item in items],
    )


@router.put("/tasks/{task_id}/", response=TaskOut)
def update_task(request: HttpRequest, task_id: TaskId, data: TaskIn):
    _check_admin_or_lecturer(request)
    try:
        task = Task.objects.get(task_id=task_id)
        require_manage_task(request.auth, task)
        previous_status = task.task_status
        previous_rubric_id = task.rubric_id_marking_rubric_id
        target_unit_id = data.unit_id_unit or task.unit_id_unit_id
        target_class = task.class_id_class
        if data.class_id_class is not None:
            target_class = Class.objects.filter(class_id=data.class_id_class).first()
            if target_class is None:
                raise HttpError(400, "Class not found")
        if target_class is not None:
            require_manage_class(request.auth, target_class)
            if target_class.unit_id_unit_id != target_unit_id:
                raise HttpError(400, "Assignment course must match its class")
        elif not can_create_class(request.auth, target_unit_id):
            raise HttpError(403, "Only this course's lead can manage a course-wide assignment")
        if data.unit_id_unit:
            try:
                task.unit_id_unit = Unit.objects.get(unit_id=data.unit_id_unit)
            except Unit.DoesNotExist:
                raise HttpError(400, "Unit not found")
        if data.rubric_id_marking_rubric:
            try:
                task.rubric_id_marking_rubric = MarkingRubric.objects.select_related("user_id_user").get(
                    rubric_id=data.rubric_id_marking_rubric
                )
            except MarkingRubric.DoesNotExist:
                raise HttpError(400, "Rubric not found")
        _require_assignable_rubric(request.auth, task.rubric_id_marking_rubric)
        task.task_due_datetime = data.task_due_datetime
        task.task_title = data.task_title
        task.task_desc = data.task_desc
        task.task_instructions = data.task_instructions
        if data.class_id_class is not None:
            try:
                task.class_id_class = Class.objects.get(class_id=data.class_id_class)
            except Class.DoesNotExist:
                raise HttpError(400, "Class not found")
        task.task_status = data.task_status
        task.task_allow_late_submission = data.task_allow_late_submission
        task.task_allow_resubmission = data.task_allow_resubmission
        if task.task_status == "published" and (
            previous_status != "published"
            or previous_rubric_id != task.rubric_id_marking_rubric_id
            or not task.rubric_snapshot
        ):
            _freeze_rubric(task)
        task.save()
        if previous_status != "published" and task.task_status == "published":
            notify_assignment_published(task)
        return task
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.delete("/tasks/{task_id}/", response=SuccessResponse)
def delete_task(request: HttpRequest, task_id: TaskId) -> SuccessResponse:
    _check_admin_or_lecturer(request)
    try:
        task = Task.objects.get(task_id=task_id)
        require_manage_task(request.auth, task)
        if Submission.objects.filter(task_id_task=task).exists():
            raise HttpError(409, "Assignments with submissions must be archived, not deleted")
        task.delete()
        return SuccessResponse(success=True)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


# =============================================================================
# Task Actions
# =============================================================================


@router.post("/tasks/{task_id}/publish/", response=TaskOut)
def publish_task(request: HttpRequest, task_id: TaskId):
    """Publish a task (lecturer/admin only)."""
    _check_admin_or_lecturer(request)
    try:
        task = Task.objects.get(task_id=task_id)
        require_manage_task(request.auth, task)
        _require_assignable_rubric(request.auth, task.rubric_id_marking_rubric)
        if task.task_status != "published" or not task.rubric_snapshot:
            _freeze_rubric(task)
        task.task_status = "published"
        task.save()
        notify_assignment_published(task)
        return task
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.post("/tasks/{task_id}/unpublish/", response=TaskOut)
def unpublish_task(request: HttpRequest, task_id: TaskId):
    """Unpublish a task (lecturer/admin only)."""
    _check_admin_or_lecturer(request)
    try:
        task = Task.objects.get(task_id=task_id)
        require_manage_task(request.auth, task)
        task.task_status = "unpublished"
        task.save()
        return task
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.get("/tasks/{task_id}/submissions/", response=list[SubmissionOut])
def get_task_submissions(request: HttpRequest, task_id: TaskId):
    """Get all submissions for a task."""
    user = request.auth
    try:
        task = Task.objects.get(task_id=task_id)
        # Students can only see their own submissions
        if user.user_role == "student":
            require_visible_task(user, task)
            return Submission.objects.filter(task_id_task=task, user_id_user=user)
        require_manage_task(user, task)
        return Submission.objects.filter(task_id_task=task)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


def _eligible_enrollments(task: Task):
    enrollments = Enrollment.objects.filter(unit_id_unit=task.unit_id_unit, user_id_user__user_role="student")
    if task.class_id_class_id:
        enrollments = enrollments.filter(class_id_class=task.class_id_class)
    return enrollments


@router.get("/tasks/{task_id}/submission-summary/", response=TaskSubmissionSummaryOut)
def get_task_submission_summary(request: HttpRequest, task_id: TaskId):
    task = Task.objects.filter(pk=task_id).first()
    if task is None:
        raise HttpError(404, "Task not found")
    require_manage_task(request.auth, task)
    eligible_ids = _eligible_enrollments(task).values_list("user_id_user_id", flat=True)
    submissions = Submission.objects.filter(task_id_task=task, user_id_user_id__in=eligible_ids)
    return {
        "task_id": task.pk,
        "eligible_students": eligible_ids.distinct().count(),
        "submitted_students": submissions.values("user_id_user_id").distinct().count(),
        "submission_versions": submissions.count(),
    }


@router.get("/tasks/{task_id}/submissions-export/")
def export_task_submissions(request: HttpRequest, task_id: TaskId):
    task = Task.objects.filter(pk=task_id).first()
    if task is None:
        raise HttpError(404, "Task not found")
    require_manage_task(request.auth, task)
    submissions = list(
        Submission.objects.filter(task_id_task=task)
        .select_related("user_id_user").order_by("user_id_user_id", "submission_time", "submission_id")[:501]
    )
    if len(submissions) > 500:
        raise HttpError(413, "Export limit is 500 submission versions")
    manifest = StringIO()
    writer = csv.writer(manifest)
    writer.writerow(["submission_id", "student_id", "student_email", "submitted_at", "file"])
    archive = BytesIO()
    with ZipFile(archive, "w", compression=ZIP_DEFLATED) as bundle:
        for submission in submissions:
            name = f"submission-{submission.pk}.txt"
            bundle.writestr(name, submission.submission_txt)
            writer.writerow([
                submission.pk, submission.user_id_user_id, submission.user_id_user.user_email,
                submission.submission_time.isoformat(), name,
            ])
        bundle.writestr("manifest.csv", manifest.getvalue())
    response = HttpResponse(archive.getvalue(), content_type="application/zip")
    response["Content-Disposition"] = f'attachment; filename="assignment-{task.pk}-submissions.zip"'
    return response


# --- Task Actions (PRD-09) ---
@router.post("/tasks/{task_id}/duplicate/", response=TaskOut)
def duplicate_task(request: HttpRequest, task_id: TaskId, data: TaskDuplicateIn):
    """Duplicate an existing task. Admins and lecturers only."""
    user = request.auth
    if not has_role(user, [UserRole.ADMIN, UserRole.LECTURER]):
        raise HttpError(403, "Only admins or lecturers can duplicate tasks")
    try:
        source_task = Task.objects.get(task_id=task_id)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")
    require_manage_task(user, source_task)

    if data.class_id_class:
        target_class = Class.objects.filter(class_id=data.class_id_class).first()
        if target_class is None:
            raise HttpError(400, "Target class does not exist")
        require_manage_class(user, target_class)
        if target_class.unit_id_unit_id != source_task.unit_id_unit_id:
            raise HttpError(400, "Target class must belong to the assignment's course")

    new_task = TaskService.duplicate_task(source_task, user, data.class_id_class, data.task_title, data.task_deadline)
    return new_task


@router.post("/tasks/{task_id}/extend/", response=TaskExtendOut)
def extend_task_deadline(request: HttpRequest, task_id: TaskId, data: TaskExtendIn):
    """Extend the deadline for a specific task. Admins and lecturers only."""
    user = request.auth
    if not has_role(user, [UserRole.ADMIN, UserRole.LECTURER]):
        raise HttpError(403, "Only admins or lecturers can extend tasks")
    try:
        task = Task.objects.get(task_id=task_id)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")
    require_manage_task(user, task)

    if data.student_id:
        try:
            student = User.objects.get(user_id=data.student_id, user_role="student")
        except User.DoesNotExist:
            raise HttpError(404, "Student not found")
        enrollment = Enrollment.objects.filter(user_id_user=student, unit_id_unit=task.unit_id_unit)
        if task.class_id_class is not None:
            enrollment = enrollment.filter(class_id_class=task.class_id_class)
        if not enrollment.exists():
            raise HttpError(403, "Student is not enrolled in this assignment")

        extension = TaskService.extend_deadline_per_student(task, student, data.new_deadline, data.reason, user)
        notify_deadline_extended(task, student, extension.extended_deadline)
        return {"task": task, "extension": {
            "extension_id": extension.pk,
            "task_id": task.pk,
            "user_id": student.pk,
            "original_deadline": extension.original_deadline,
            "extended_deadline": extension.extended_deadline,
            "reason": extension.reason,
            "granted_by": user.pk,
            "created_at": extension.created_at,
        }}
    else:
        task = TaskService.extend_deadline_global(task, data.new_deadline)
        return {"task": task, "extension": None}
