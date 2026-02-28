from __future__ import annotations

from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from api_v2.schemas.base import PaginationParams, SuccessResponse
from api_v2.types.ids import (
    FeedbackId,
    RubricItemId,
    SubmissionId,
)
from core.models import (
    Feedback,
    FeedbackItem,
    RubricItem,
    Submission,
    Task,
    User,
)

from api_v2.utils.auth import JWTAuth
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

# =============================================================================
# Submissions
# =============================================================================


@router.get("/submissions/", response=list[SubmissionOut])
def list_submissions(request: HttpRequest, filters: SubmissionFilterParams = SubmissionFilterParams()):
    qs = filters.filter(Submission.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/submissions/", response=SubmissionOut)
def create_submission(request: HttpRequest, data: SubmissionIn):
    task = Task.objects.get(task_id=data.task_id_task)
    user = User.objects.get(user_id=data.user_id_user)
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
        submission.submission_txt = data.submission_txt
        submission.save()
        return submission
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


@router.delete("/submissions/{submission_id}/", response=SuccessResponse)
def delete_submission(request: HttpRequest, submission_id: SubmissionId) -> SuccessResponse:
    try:
        submission = Submission.objects.get(submission_id=submission_id)
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
    submission = Submission.objects.get(submission_id=data.submission_id_submission)
    user = User.objects.get(user_id=data.user_id_user)
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
    feedback = Feedback.objects.get(feedback_id=data.feedback_id_feedback)
    rubric_item = RubricItem.objects.get(rubric_item_id=data.rubric_item_id_rubric_item)
    item = FeedbackItem.objects.create(
        feedback_id_feedback=feedback,
        rubric_item_id_rubric_item=rubric_item,
        feedback_item_score=data.feedback_item_score,
        feedback_item_comment=data.feedback_item_comment,
        feedback_item_source=data.feedback_item_source,
    )
    return item


@router.get("/feedback-items/{item_id}/", response=FeedbackItemOut)
def get_feedback_item(request: HttpRequest, item_id: RubricItemId):
    try:
        return FeedbackItem.objects.get(feedback_item_id=item_id)
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


@router.put("/feedback-items/{item_id}/", response=FeedbackItemOut)
def update_feedback_item(request: HttpRequest, item_id: RubricItemId, data: FeedbackItemIn):
    try:
        item = FeedbackItem.objects.get(feedback_item_id=item_id)
        item.feedback_item_score = data.feedback_item_score
        item.feedback_item_comment = data.feedback_item_comment
        item.feedback_item_source = data.feedback_item_source
        item.save()
        return item
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


@router.delete("/feedback-items/{item_id}/", response=SuccessResponse)
def delete_feedback_item(request: HttpRequest, item_id: RubricItemId) -> SuccessResponse:
    try:
        item = FeedbackItem.objects.get(feedback_item_id=item_id)
        item.delete()
        return SuccessResponse(success=True)
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


