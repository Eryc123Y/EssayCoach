from __future__ import annotations

from django.http import HttpRequest
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
from api_v2.utils.permissions import IsAdminOrLecturer, has_role
from core.models import (
    Feedback,
    FeedbackItem,
    RubricItem,
    Submission,
    Task,
    User,
)

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


def _check_admin_or_lecturer(request: HttpRequest) -> None:
    IsAdminOrLecturer().check(request)


def _check_submission_write_permission(request: HttpRequest, submission: Submission) -> None:
    user = request.auth
    if has_role(user, [UserRole.ADMIN, UserRole.LECTURER]):
        return
    if has_role(user, [UserRole.STUDENT]) and submission.user_id_user_id == user.user_id:
        return
    raise HttpError(403, "You do not have permission to modify this submission")


def _check_feedback_write_permission(request: HttpRequest, feedback: Feedback) -> None:
    user = request.auth
    if has_role(user, [UserRole.ADMIN]):
        return
    if has_role(user, [UserRole.LECTURER]) and feedback.user_id_user_id == user.user_id:
        return
    raise HttpError(403, "You do not have permission to modify this feedback")


# =============================================================================
# Submissions
# =============================================================================


@router.get("/submissions/", response=list[SubmissionOut])
def list_submissions(request: HttpRequest, filters: SubmissionFilterParams = SubmissionFilterParams()):
    qs = filters.filter(Submission.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/submissions/", response=SubmissionOut)
def create_submission(request: HttpRequest, data: SubmissionIn):
    request_user = request.auth
    if has_role(request_user, [UserRole.STUDENT]) and request_user.user_id != data.user_id_user:
        raise HttpError(403, "Students can only create submissions for themselves")

    try:
        task = Task.objects.get(task_id=data.task_id_task)
    except Task.DoesNotExist:
        raise HttpError(400, "Task not found")

    try:
        user = User.objects.get(user_id=data.user_id_user)
    except User.DoesNotExist:
        raise HttpError(400, "User not found")

    submission = Submission.objects.create(
        task_id_task=task,
        user_id_user=user,
        submission_txt=data.submission_txt,
    )
    return submission


@router.get("/submissions/{submission_id}/", response=SubmissionOut)
def get_submission(request: HttpRequest, submission_id: SubmissionId):
    try:
        return Submission.objects.get(submission_id=submission_id)
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


@router.put("/submissions/{submission_id}/", response=SubmissionOut)
def update_submission(request: HttpRequest, submission_id: SubmissionId, data: SubmissionIn):
    try:
        submission = Submission.objects.get(submission_id=submission_id)
        _check_submission_write_permission(request, submission)
        submission.submission_txt = data.submission_txt
        submission.save()
        return submission
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


@router.delete("/submissions/{submission_id}/", response=SuccessResponse)
def delete_submission(request: HttpRequest, submission_id: SubmissionId) -> SuccessResponse:
    try:
        submission = Submission.objects.get(submission_id=submission_id)
        _check_submission_write_permission(request, submission)
        submission.delete()
        return SuccessResponse(success=True)
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


# =============================================================================
# Feedbacks
# =============================================================================


@router.get("/feedbacks/", response=list[FeedbackOut])
def list_feedbacks(request: HttpRequest, filters: FeedbackFilterParams = FeedbackFilterParams()):
    qs = filters.filter(Feedback.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/feedbacks/", response=FeedbackOut)
def create_feedback(request: HttpRequest, data: FeedbackIn):
    _check_admin_or_lecturer(request)
    request_user = request.auth
    if has_role(request_user, [UserRole.LECTURER]) and request_user.user_id != data.user_id_user:
        raise HttpError(403, "Lecturers can only create feedback as themselves")

    try:
        submission = Submission.objects.get(submission_id=data.submission_id_submission)
    except Submission.DoesNotExist:
        raise HttpError(400, "Submission not found")

    try:
        user = User.objects.get(user_id=data.user_id_user)
    except User.DoesNotExist:
        raise HttpError(400, "User not found")

    feedback = Feedback.objects.create(
        submission_id_submission=submission,
        user_id_user=user,
    )
    return feedback


@router.get("/feedbacks/{feedback_id}/", response=FeedbackOut)
def get_feedback(request: HttpRequest, feedback_id: FeedbackId):
    try:
        return Feedback.objects.get(feedback_id=feedback_id)
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
    qs = filters.filter(FeedbackItem.objects.all())
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
        return FeedbackItem.objects.get(feedback_item_id=item_id)
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
