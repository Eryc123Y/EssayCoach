"""Staff review and course-lead release of formal assessment."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from django.http import HttpRequest
from ninja import Router, Schema
from ninja.errors import HttpError

from api_v2.utils.auth import JWTAuth
from api_v2.utils.course_scope import require_manage_task
from core.assessment import AssessmentError, publish_assessment, review_assessment
from core.models import CourseLeadAssignment, Feedback, Submission, User

router = Router(tags=["Assessments"], auth=JWTAuth())


class CriterionScoreIn(Schema):
    rubric_item_id: int
    score: int
    comment: str = ""


class ReviewIn(Schema):
    expected_version: int
    items: list[CriterionScoreIn]


class PublishIn(Schema):
    expected_version: int


class CriterionScoreOut(Schema):
    rubric_item_id: int
    score: int
    comment: str
    source: str


class AssessmentOut(Schema):
    submission_id: int
    status: str
    version: int
    final_score: Decimal | None
    items: list[CriterionScoreOut]
    ai_proposal: dict | None
    rubric_snapshot: list[dict] | None
    reviewed_by: int | None
    reviewed_at: datetime | None
    published_by: int | None
    published_at: datetime | None
    can_publish: bool


class AssessmentAuditOut(Schema):
    action: str
    actor_id: int | None
    created_at: datetime
    details: dict


def _visible_feedback(request: HttpRequest, submission_id: int) -> Feedback:
    submission = Submission.objects.select_related("task_id_task").filter(pk=submission_id).first()
    if submission is None:
        raise HttpError(404, "Submission not found")
    actor = request.auth
    if actor.user_role == "student":
        if submission.user_id_user_id != actor.pk:
            raise HttpError(403, "Submission is outside your scope")
        feedback = Feedback.objects.filter(submission_id_submission=submission, status="published").first()
        if feedback is None:
            raise HttpError(404, "Assessment is not published")
        return feedback
    require_manage_task(actor, submission.task_id_task)
    feedback = Feedback.objects.filter(submission_id_submission=submission).first()
    if feedback is None:
        raise HttpError(404, "Assessment not found")
    return feedback


def _serialize(feedback: Feedback, *, actor: User) -> AssessmentOut:
    student = actor.user_role == "student"
    items = [
        CriterionScoreOut(
            rubric_item_id=item.rubric_item_id_rubric_item_id,
            score=item.feedback_item_score,
            comment=item.feedback_item_comment or "",
            source=item.feedback_item_source,
        )
        for item in feedback.feedbackitem_set.all().order_by("rubric_item_id_rubric_item_id")
    ]
    return AssessmentOut(
        submission_id=feedback.submission_id_submission_id,
        status=feedback.status,
        version=feedback.version,
        final_score=feedback.final_score,
        items=items,
        ai_proposal=None if student else feedback.ai_proposal,
        rubric_snapshot=feedback.rubric_snapshot,
        reviewed_by=feedback.reviewed_by_id,
        reviewed_at=feedback.reviewed_at,
        published_by=feedback.published_by_id,
        published_at=feedback.published_at,
        can_publish=not student and CourseLeadAssignment.objects.filter(
            user_id_user=actor,
            unit_id_unit_id=feedback.submission_id_submission.task_id_task.unit_id_unit_id,
        ).exists(),
    )


@router.get("/assessments/{submission_id}/", response=AssessmentOut)
def get_assessment(request: HttpRequest, submission_id: int):
    return _serialize(_visible_feedback(request, submission_id), actor=request.auth)


@router.post("/assessments/{submission_id}/review/", response=AssessmentOut)
def review(request: HttpRequest, submission_id: int, data: ReviewIn):
    feedback = _visible_feedback(request, submission_id)
    if request.auth.user_role == "student":
        raise HttpError(403, "Only teaching staff may review")
    try:
        updated = review_assessment(
            feedback.pk,
            request.auth,
            [item.model_dump() for item in data.items],
            expected_version=data.expected_version,
        )
    except AssessmentError as exc:
        raise HttpError(409, str(exc)) from exc
    return _serialize(updated, actor=request.auth)


@router.post("/assessments/{submission_id}/publish/", response=AssessmentOut)
def publish(request: HttpRequest, submission_id: int, data: PublishIn):
    feedback = _visible_feedback(request, submission_id)
    if request.auth.user_role == "student":
        raise HttpError(403, "Only a course lead may publish")
    try:
        updated = publish_assessment(feedback.pk, request.auth, expected_version=data.expected_version)
    except PermissionError as exc:
        raise HttpError(403, str(exc)) from exc
    except AssessmentError as exc:
        raise HttpError(409, str(exc)) from exc
    return _serialize(updated, actor=request.auth)


@router.get("/assessments/{submission_id}/audit/", response=list[AssessmentAuditOut])
def get_assessment_audit(request: HttpRequest, submission_id: int):
    if request.auth.user_role == "student":
        raise HttpError(403, "Assessment audit is staff-only")
    feedback = _visible_feedback(request, submission_id)
    return [
        AssessmentAuditOut(
            action=event.action,
            actor_id=event.actor_id,
            created_at=event.created_at,
            details=event.details,
        )
        for event in feedback.audit_events.order_by("created_at", "event_id")
    ]
