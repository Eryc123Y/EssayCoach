from __future__ import annotations

from django.db import transaction
from django.db.models import Q
from django.http import HttpRequest
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from api_v2.schemas.base import PaginationParams, SuccessResponse
from api_v2.types.enums import UserRole
from api_v2.types.ids import (
    FeedbackId,
    FeedbackItemId,
    SubmissionId,
)
from api_v2.utils.auth import JWTAuth
from api_v2.utils.course_scope import visible_classes
from api_v2.utils.permissions import IsAdminOrLecturer, has_role
from core.achievements import award_submission_milestones
from core.assessment import AssessmentError, rubric_snapshot_for_feedback
from core.models import (
    AIJob,
    CourseLeadAssignment,
    DeadlineExtension,
    Enrollment,
    Feedback,
    FeedbackItem,
    RubricItem,
    Submission,
    Task,
    User,
)
from core.notifications import notify_submission
from core.observability import bind_ai_job, reset_ai_job

from ..schemas import (
    FeedbackFilterParams,
    FeedbackIn,
    FeedbackItemFilterParams,
    FeedbackItemIn,
    FeedbackItemOut,
    FeedbackOut,
    SubmissionFilterParams,
    SubmissionIn,
    SubmissionOut,
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


router = Router(tags=["Submissions"], auth=JWTAuth())

# Matches the limit the writing forms and the practice workflow already enforce.
MAX_ESSAY_CHARACTERS = 50000


def _check_admin_or_lecturer(request: HttpRequest) -> None:
    IsAdminOrLecturer().check(request)


def _visible_submissions(user: User):
    if user.user_role == "admin":
        return Submission.objects.all()
    if user.user_role == "student":
        return Submission.objects.filter(user_id_user=user)
    if user.user_role == "lecturer":
        class_ids = visible_classes(user).values_list("class_id", flat=True)
        lead_units = CourseLeadAssignment.objects.filter(user_id_user=user).values_list(
            "unit_id_unit_id", flat=True
        )
        return Submission.objects.filter(
            Q(task_id_task__class_id_class_id__in=class_ids)
            | Q(task_id_task__class_id_class__isnull=True, task_id_task__unit_id_unit_id__in=lead_units)
        )
    return Submission.objects.none()


def _require_visible_submission(user: User, submission: Submission) -> None:
    if not _visible_submissions(user).filter(pk=submission.pk).exists():
        raise HttpError(403, "Submission is outside your course scope")


def _require_staff_feedback_read(request: HttpRequest, feedback: Feedback) -> None:
    if request.auth.user_role == "student":
        if feedback.submission_id_submission.user_id_user_id != request.auth.pk:
            raise HttpError(403, "Feedback is outside your scope")
        if feedback.status != "published":
            raise HttpError(403, "Formal feedback is unavailable before publication")
        return
    _require_visible_submission(request.auth, feedback.submission_id_submission)


def _check_feedback_write_permission(request: HttpRequest, feedback: Feedback) -> None:
    if feedback.status != "ai_pending":
        raise HttpError(409, "AI drafts and reviewed assessments can be changed only through the review workflow")
    user = request.auth
    if has_role(user, [UserRole.ADMIN]):
        return
    if has_role(user, [UserRole.LECTURER]) and feedback.user_id_user_id == user.user_id:
        _require_visible_submission(user, feedback.submission_id_submission)
        return
    raise HttpError(403, "You do not have permission to modify this feedback")


# =============================================================================
# Submissions
# =============================================================================


@router.get("/submissions/", response=list[SubmissionOut])
def list_submissions(request: HttpRequest, filters: SubmissionFilterParams = SubmissionFilterParams()):
    qs = filters.filter(_visible_submissions(request.auth))
    return paginate(qs, PaginationParams())["results"]


@router.post("/submissions/", response=SubmissionOut)
def create_submission(request: HttpRequest, data: SubmissionIn):
    request_user = request.auth
    if request_user.user_role != "student" or request_user.user_id != data.user_id_user:
        raise HttpError(403, "Students can submit only their own work")
    # A formal submission is immutable and counts against the attempt limit, so
    # reject unusable text before anything is stored or queued for the model.
    if not data.submission_txt.strip():
        raise HttpError(400, "The essay text cannot be empty")
    if len(data.submission_txt) > MAX_ESSAY_CHARACTERS:
        raise HttpError(400, f"The essay text cannot exceed {MAX_ESSAY_CHARACTERS:,} characters")

    with transaction.atomic():
        try:
            task = Task.objects.select_for_update().get(task_id=data.task_id_task)
        except Task.DoesNotExist:
            raise HttpError(400, "Task not found")

        if task.task_status != "published":
            raise HttpError(403, "This assignment is not open for submission")
        extension = DeadlineExtension.objects.filter(task_id_task=task, user_id_user=request_user).first()
        effective_deadline = max(
            task.task_due_datetime,
            extension.extended_deadline if extension else task.task_due_datetime,
        )
        if effective_deadline < timezone.now() and not task.task_allow_late_submission:
            raise HttpError(403, "The submission deadline has passed")
        enrollment = Enrollment.objects.filter(user_id_user=request_user, unit_id_unit=task.unit_id_unit)
        if task.class_id_class is not None:
            enrollment = enrollment.filter(class_id_class=task.class_id_class)
        if not enrollment.exists():
            raise HttpError(403, "You are not enrolled in this assignment's class")
        existing_count = Submission.objects.filter(task_id_task=task, user_id_user=request_user).count()
        if existing_count >= (2 if task.task_allow_resubmission else 1):
            raise HttpError(409, "No further submissions are allowed for this assignment")

        submission = Submission.objects.create(
            task_id_task=task,
            user_id_user=request_user,
            submission_txt=data.submission_txt,
        )
        feedback = Feedback.objects.create(submission_id_submission=submission)
        try:
            feedback.rubric_snapshot = rubric_snapshot_for_feedback(feedback)
            feedback.save(update_fields=["rubric_snapshot"])
        except AssessmentError:
            # Legacy tasks may lack a usable rubric. The durable job records a
            # validation failure instead of fabricating a score.
            pass
        job = AIJob.objects.create(submission=submission)
        trace_token = bind_ai_job("formal", job.pk)
        reset_ai_job(trace_token)
        award_submission_milestones(request_user)
        notify_submission(submission)
        return submission


@router.get("/submissions/{submission_id}/", response=SubmissionOut)
def get_submission(request: HttpRequest, submission_id: SubmissionId):
    try:
        submission = Submission.objects.get(submission_id=submission_id)
        _require_visible_submission(request.auth, submission)
        return submission
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


@router.put("/submissions/{submission_id}/", response=SubmissionOut)
def update_submission(request: HttpRequest, submission_id: SubmissionId, data: SubmissionIn):
    submission = Submission.objects.filter(pk=submission_id).first()
    if submission is None:
        raise HttpError(404, "Submission not found")
    _require_visible_submission(request.auth, submission)
    raise HttpError(410, "Formal submissions are immutable; use a draft or revision workflow")


@router.delete("/submissions/{submission_id}/", response=SuccessResponse)
def delete_submission(request: HttpRequest, submission_id: SubmissionId) -> SuccessResponse:
    submission = Submission.objects.filter(pk=submission_id).first()
    if submission is None:
        raise HttpError(404, "Submission not found")
    _require_visible_submission(request.auth, submission)
    raise HttpError(410, "Formal submissions are retained for assessment audit")


# =============================================================================
# Feedbacks
# =============================================================================


@router.get("/feedbacks/", response=list[FeedbackOut])
def list_feedbacks(request: HttpRequest, filters: FeedbackFilterParams = FeedbackFilterParams()):
    if request.auth.user_role == "student":
        qs = filters.filter(Feedback.objects.filter(
            submission_id_submission__user_id_user=request.auth,
            status="published",
        ))
        return paginate(qs, PaginationParams())["results"]
    qs = filters.filter(Feedback.objects.filter(submission_id_submission__in=_visible_submissions(request.auth)))
    return paginate(qs, PaginationParams())["results"]


@router.post("/feedbacks/", response=FeedbackOut)
def create_feedback(request: HttpRequest, data: FeedbackIn):
    _check_admin_or_lecturer(request)
    raise HttpError(410, "Formal assessment is created automatically when an essay is submitted")


@router.get("/feedbacks/{feedback_id}/", response=FeedbackOut)
def get_feedback(request: HttpRequest, feedback_id: FeedbackId):
    try:
        feedback = Feedback.objects.get(feedback_id=feedback_id)
        _require_staff_feedback_read(request, feedback)
        return feedback
    except Feedback.DoesNotExist:
        raise HttpError(404, "Feedback not found")


@router.delete("/feedbacks/{feedback_id}/", response=SuccessResponse)
def delete_feedback(request: HttpRequest, feedback_id: FeedbackId) -> SuccessResponse:
    try:
        feedback = Feedback.objects.get(feedback_id=feedback_id)
        _check_feedback_write_permission(request, feedback)
        feedback.delete()
        return SuccessResponse(success=True)
    except Feedback.DoesNotExist:
        raise HttpError(404, "Feedback not found")


# =============================================================================
# FeedbackItems
# =============================================================================


@router.get("/feedback-items/", response=list[FeedbackItemOut])
def list_feedback_items(request: HttpRequest, filters: FeedbackItemFilterParams = FeedbackItemFilterParams()):
    if request.auth.user_role == "student":
        qs = filters.filter(FeedbackItem.objects.filter(
            feedback_id_feedback__submission_id_submission__user_id_user=request.auth,
            feedback_id_feedback__status="published",
        ))
        return paginate(qs, PaginationParams())["results"]
    qs = filters.filter(FeedbackItem.objects.filter(
        feedback_id_feedback__submission_id_submission__in=_visible_submissions(request.auth)
    ))
    return paginate(qs, PaginationParams())["results"]


@router.post("/feedback-items/", response=FeedbackItemOut)
def create_feedback_item(request: HttpRequest, data: FeedbackItemIn):
    _check_admin_or_lecturer(request)
    try:
        feedback = Feedback.objects.get(feedback_id=data.feedback_id_feedback)
    except Feedback.DoesNotExist:
        raise HttpError(400, "Feedback not found")

    _check_feedback_write_permission(request, feedback)
    try:
        rubric_item = RubricItem.objects.get(rubric_item_id=data.rubric_item_id_rubric_item)
    except RubricItem.DoesNotExist:
        raise HttpError(400, "Rubric item not found")

    item = FeedbackItem.objects.create(
        feedback_id_feedback=feedback,
        rubric_item_id_rubric_item=rubric_item,
        feedback_item_score=data.feedback_item_score,
        feedback_item_comment=data.feedback_item_comment,
        feedback_item_source=data.feedback_item_source,
    )
    return item


@router.get("/feedback-items/{item_id}/", response=FeedbackItemOut)
def get_feedback_item(request: HttpRequest, item_id: FeedbackItemId):
    try:
        item = FeedbackItem.objects.get(feedback_item_id=item_id)
        _require_staff_feedback_read(request, item.feedback_id_feedback)
        return item
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


@router.put("/feedback-items/{item_id}/", response=FeedbackItemOut)
def update_feedback_item(request: HttpRequest, item_id: FeedbackItemId, data: FeedbackItemIn):
    try:
        item = FeedbackItem.objects.get(feedback_item_id=item_id)
        _check_feedback_write_permission(request, item.feedback_id_feedback)
        item.feedback_item_score = data.feedback_item_score
        item.feedback_item_comment = data.feedback_item_comment
        item.feedback_item_source = data.feedback_item_source
        item.save()
        return item
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


@router.delete("/feedback-items/{item_id}/", response=SuccessResponse)
def delete_feedback_item(request: HttpRequest, item_id: FeedbackItemId) -> SuccessResponse:
    try:
        item = FeedbackItem.objects.get(feedback_item_id=item_id)
        _check_feedback_write_permission(request, item.feedback_id_feedback)
        item.delete()
        return SuccessResponse(success=True)
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")
