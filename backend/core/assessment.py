"""Formal assessment transitions and immutable audit history."""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.utils import timezone

from core.models import (
    AssessmentAuditEvent,
    CourseLeadAssignment,
    Feedback,
    FeedbackItem,
    MarkingRubric,
    RubricItem,
    User,
)
from core.notifications import notify_grade_published


class AssessmentError(ValueError):
    pass


def rubric_snapshot_for_rubric(rubric: MarkingRubric) -> list[dict]:
    items = RubricItem.objects.filter(rubric_id_marking_rubric=rubric).prefetch_related("level_descriptions")
    snapshot = []
    for item in items:
        levels = list(item.level_descriptions.all())
        if not levels:
            raise AssessmentError(f"Rubric item {item.pk} has no score range")
        snapshot.append(
            {
                "id": item.pk,
                "name": item.rubric_item_name,
                "weight": str(item.rubric_item_weight),
                "exemplar_text": item.exemplar_text,
                "max_score": max(level.level_max_score for level in levels),
                "levels": [
                    {"min": level.level_min_score, "max": level.level_max_score, "description": level.level_desc}
                    for level in levels
                ],
            }
        )
    if not snapshot:
        raise AssessmentError("Rubric has no criteria")
    return snapshot


def task_rubric_snapshot(rubric: MarkingRubric) -> dict:
    """The frozen rubric stored on a task; `GET /tasks/{id}/rubric/` returns exactly this shape."""
    return {
        "rubric_id": rubric.pk,
        "description": rubric.rubric_desc or "",
        "items": rubric_snapshot_for_rubric(rubric),
    }


def rubric_snapshot_for_feedback(feedback: Feedback) -> list[dict]:
    task = feedback.submission_id_submission.task_id_task
    if task.rubric_snapshot:
        return task.rubric_snapshot["items"]
    return rubric_snapshot_for_rubric(task.rubric_id_marking_rubric)


def _validate_items(items: list[dict], snapshot: list[dict]) -> list[dict]:
    maxima = {item["id"]: item["max_score"] for item in snapshot}
    if len(items) != len(maxima) or {item.get("rubric_item_id") for item in items} != set(maxima):
        raise AssessmentError("Scores must cover every rubric criterion exactly once")
    normalized = []
    for item in items:
        item_id = item["rubric_item_id"]
        score = item.get("score")
        if isinstance(score, bool) or not isinstance(score, int) or not 0 <= score <= maxima[item_id]:
            raise AssessmentError(f"Score for rubric item {item_id} is outside its range")
        comment = item.get("comment")
        if comment is not None and not isinstance(comment, str):
            raise AssessmentError("Criterion comments must be text")
        normalized.append({"rubric_item_id": item_id, "score": score, "comment": comment or ""})
    return normalized


def _weighted_score(items: list[dict], snapshot: list[dict]) -> Decimal:
    by_id = {item["rubric_item_id"]: item["score"] for item in items}
    total_weight = sum(Decimal(item["weight"]) for item in snapshot)
    if total_weight <= 0 or any(item["max_score"] <= 0 for item in snapshot):
        raise AssessmentError("Rubric weights and score maxima must be positive")
    weighted = sum(
        Decimal(by_id[item["id"]]) / Decimal(item["max_score"]) * Decimal(item["weight"])
        for item in snapshot
    )
    return (weighted / total_weight * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def record_ai_proposal(feedback_id: int, items: list[dict], *, model: str, run_id: str) -> Feedback:
    """Called by the durable AI worker after validating a model result."""
    with transaction.atomic():
        feedback = (
            Feedback.objects.select_for_update()
            .select_related("submission_id_submission__task_id_task")
            .get(pk=feedback_id)
        )
        if feedback.status != "ai_pending":
            raise AssessmentError("AI proposal was already recorded")
        if FeedbackItem.objects.filter(feedback_id_feedback=feedback).exists():
            raise AssessmentError("Pending legacy feedback items must be resolved before AI grading")
        snapshot = feedback.rubric_snapshot or rubric_snapshot_for_feedback(feedback)
        proposal = _validate_items(items, snapshot)
        feedback.rubric_snapshot = snapshot
        feedback.ai_proposal = {"model": model, "run_id": run_id, "items": proposal}
        feedback.status = "ai_draft"
        feedback.version += 1
        feedback.save(update_fields=["rubric_snapshot", "ai_proposal", "status", "version"])
        FeedbackItem.objects.bulk_create(
            [
                FeedbackItem(
                    feedback_id_feedback=feedback,
                    rubric_item_id_rubric_item_id=item["rubric_item_id"],
                    feedback_item_score=item["score"],
                    feedback_item_comment=item["comment"],
                    feedback_item_source="ai",
                )
                for item in proposal
            ]
        )
        AssessmentAuditEvent.objects.create(
            feedback=feedback,
            action="ai_proposal_recorded",
            details={"model": model, "run_id": run_id, "version": feedback.version, "items": proposal},
        )
        return feedback


def review_assessment(feedback_id: int, actor: User, items: list[dict], *, expected_version: int) -> Feedback:
    # The audit trail records this stage as a lecturer review, so only a lecturer may perform it.
    if actor.user_role != "lecturer":
        raise PermissionError("Only a lecturer can review an assessment")
    with transaction.atomic():
        feedback = Feedback.objects.select_for_update().get(pk=feedback_id)
        if feedback.status not in ("ai_draft", "lecturer_reviewed"):
            raise AssessmentError("Assessment is not ready for lecturer review")
        if feedback.version != expected_version:
            raise AssessmentError("Assessment changed; reload before reviewing")
        snapshot = feedback.rubric_snapshot or []
        normalized = _validate_items(items, snapshot)
        previous = list(
            FeedbackItem.objects.filter(feedback_id_feedback=feedback)
            .order_by("rubric_item_id_rubric_item_id")
            .values("rubric_item_id_rubric_item_id", "feedback_item_score", "feedback_item_comment")
        )
        proposal_by_id = {item["rubric_item_id"]: item for item in (feedback.ai_proposal or {}).get("items", [])}
        for item in normalized:
            original = proposal_by_id.get(item["rubric_item_id"])
            source = (
                "ai"
                if original and item["score"] == original["score"] and item["comment"] == original["comment"]
                else "revised"
            )
            FeedbackItem.objects.update_or_create(
                feedback_id_feedback=feedback,
                rubric_item_id_rubric_item_id=item["rubric_item_id"],
                defaults={
                    "feedback_item_score": item["score"],
                    "feedback_item_comment": item["comment"],
                    "feedback_item_source": source,
                },
            )
        feedback.status = "lecturer_reviewed"
        feedback.user_id_user = actor
        feedback.reviewed_by = actor
        feedback.reviewed_at = timezone.now()
        feedback.version += 1
        feedback.save(update_fields=["status", "user_id_user", "reviewed_by", "reviewed_at", "version"])
        AssessmentAuditEvent.objects.create(
            feedback=feedback,
            actor=actor,
            action="lecturer_reviewed",
            details={"before": previous, "after": normalized, "version": feedback.version},
        )
        return feedback


def publish_assessment(feedback_id: int, actor: User, *, expected_version: int) -> Feedback:
    with transaction.atomic():
        feedback = (
            Feedback.objects.select_for_update()
            .select_related("submission_id_submission__task_id_task")
            .get(pk=feedback_id)
        )
        unit_id = feedback.submission_id_submission.task_id_task.unit_id_unit_id
        if actor.user_role != "lecturer" or not CourseLeadAssignment.objects.filter(
            user_id_user=actor, unit_id_unit_id=unit_id
        ).exists():
            raise PermissionError("Only this course's lead can publish grades")
        if feedback.status != "lecturer_reviewed":
            raise AssessmentError("A lecturer must review this assessment before publication")
        if feedback.version != expected_version:
            raise AssessmentError("Assessment changed; reload before publishing")
        items = list(
            FeedbackItem.objects.filter(feedback_id_feedback=feedback).values(
                "rubric_item_id_rubric_item_id", "feedback_item_score", "feedback_item_comment"
            )
        )
        normalized = _validate_items(
            [
                {
                    "rubric_item_id": item["rubric_item_id_rubric_item_id"],
                    "score": item["feedback_item_score"],
                    "comment": item["feedback_item_comment"],
                }
                for item in items
            ],
            feedback.rubric_snapshot or [],
        )
        final_score = _weighted_score(normalized, feedback.rubric_snapshot or [])
        AssessmentAuditEvent.objects.create(
            feedback=feedback,
            actor=actor,
            action="lead_confirmed",
            details={"version": feedback.version},
        )
        feedback.status = "published"
        feedback.published_by = actor
        feedback.published_at = timezone.now()
        feedback.final_score = final_score
        feedback.version += 1
        feedback.save(update_fields=["status", "published_by", "published_at", "final_score", "version"])
        AssessmentAuditEvent.objects.create(
            feedback=feedback,
            actor=actor,
            action="published",
            details={"version": feedback.version, "items": items, "final_score": str(final_score)},
        )
        notify_grade_published(feedback)
        return feedback
