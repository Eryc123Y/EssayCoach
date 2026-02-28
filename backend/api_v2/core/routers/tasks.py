from __future__ import annotations

from django.http import HttpRequest
from ninja import Query, Router
from ninja.errors import HttpError

from api_v2.schemas.base import PaginationParams, SuccessResponse
from api_v2.types.ids import (
    TaskId,
)
from core.models import (
    Class,
    MarkingRubric,
    Submission,
    Task,
    Unit,
)

from api_v2.utils.auth import JWTAuth
from api_v2.utils.permissions import IsAdminOrLecturer
from ..schemas import (
    SubmissionOut,
    TaskDuplicateIn,
    TaskExtendIn,
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

# =============================================================================
# Tasks
# =============================================================================


@router.get("/tasks/", response=list[TaskOut])
def list_tasks(
    request: HttpRequest,
    filters: TaskFilterParams = Query(...),
    pagination: PaginationParams = Query(...),
):
    qs = filters.filter(Task.objects.all())
    return paginate(qs, pagination)["results"]


@router.post("/tasks/", response=TaskOut)
def create_task(request: HttpRequest, data: TaskIn):
    IsAdminOrLecturer().check(request)

    try:
        unit = Unit.objects.get(unit_id=data.unit_id_unit)
    except Unit.DoesNotExist:
        raise HttpError(400, "Unit not found")

    try:
        rubric = MarkingRubric.objects.get(rubric_id=data.rubric_id_marking_rubric)
    except MarkingRubric.DoesNotExist:
        raise HttpError(400, "Rubric not found")

    class_obj = None
    if data.class_id_class is not None:
        try:
            class_obj = Class.objects.get(class_id=data.class_id_class)
        except Class.DoesNotExist:
            raise HttpError(400, "Class not found")

    task = Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=data.task_due_datetime,
        task_title=data.task_title,
        task_desc=data.task_desc,
        task_instructions=data.task_instructions or "",
        class_id_class=class_obj,
        task_status=data.task_status,
        task_allow_late_submission=data.task_allow_late_submission,
    )
    return task


@router.get("/tasks/{task_id}/", response=TaskOut)
def get_task(request: HttpRequest, task_id: TaskId):
    try:
        return Task.objects.get(task_id=task_id)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.put("/tasks/{task_id}/", response=TaskOut)
def update_task(request: HttpRequest, task_id: TaskId, data: TaskIn):
    try:
        task = Task.objects.get(task_id=task_id)
        if data.unit_id_unit:
            task.unit_id_unit = Unit.objects.get(unit_id=data.unit_id_unit)
        if data.rubric_id_marking_rubric:
            task.rubric_id_marking_rubric = MarkingRubric.objects.get(rubric_id=data.rubric_id_marking_rubric)
        task.task_due_datetime = data.task_due_datetime
        task.task_title = data.task_title
        task.task_desc = data.task_desc
        task.task_instructions = data.task_instructions
        if data.class_id_class is not None:
            task.class_id_class_id = data.class_id_class
        task.task_status = data.task_status
        task.task_allow_late_submission = data.task_allow_late_submission
        task.save()
        return task
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.delete("/tasks/{task_id}/", response=SuccessResponse)
def delete_task(request: HttpRequest, task_id: TaskId) -> SuccessResponse:
    try:
        task = Task.objects.get(task_id=task_id)
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
    user = request.auth
    if user.user_role not in ["lecturer", "admin"]:
        raise HttpError(403, "Only lecturers or admins can publish tasks")
    try:
        task = Task.objects.get(task_id=task_id)
        task.task_status = "published"
        task.save()
        return task
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.post("/tasks/{task_id}/unpublish/", response=TaskOut)
def unpublish_task(request: HttpRequest, task_id: TaskId):
    """Unpublish a task (lecturer/admin only)."""
    user = request.auth
    if user.user_role not in ["lecturer", "admin"]:
        raise HttpError(403, "Only lecturers or admins can unpublish tasks")
    try:
        task = Task.objects.get(task_id=task_id)
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
            return Submission.objects.filter(task_id_task=task, user_id_user=user)
        # Lecturers/admins can see all submissions
        return Submission.objects.filter(task_id_task=task)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")



# --- Task Actions (PRD-09) ---
@router.post("/tasks/{task_id}/duplicate/", response=TaskOut)
def duplicate_task(request: HttpRequest, task_id: TaskId, data: TaskDuplicateIn):
    """Duplicate a task, optionally to a different class."""
    if request.auth.user_role not in ["admin", "lecturer"]:
        raise HttpError(403, "Only admins or lecturers can duplicate tasks")
    try:
        task = Task.objects.get(task_id=task_id)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")
    raise HttpError(501, "Not implemented")


@router.post("/tasks/{task_id}/extend/", response=TaskOut)
def extend_task_deadline(request: HttpRequest, task_id: TaskId, data: TaskExtendIn):
    """Extend the deadline for a specific task."""
    if request.auth.user_role not in ["admin", "lecturer"]:
        raise HttpError(403, "Only admins or lecturers can extend tasks")
    try:
        task = Task.objects.get(task_id=task_id)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")
    raise HttpError(501, "Not implemented")


