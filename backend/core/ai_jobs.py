"""Durable local scoring queue with database claims and restart recovery."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Protocol

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from ai_feedback.codex_provider import CodexScoringProvider, ScoringResult
from core.assessment import AssessmentError, record_ai_proposal, rubric_snapshot_for_feedback
from core.models import AIJob, Feedback, Submission
from core.observability import bind_ai_job, classify_ai_error, reset_ai_job, safe_ai_error_message

logger = logging.getLogger(__name__)
LEASE_DURATION = timedelta(minutes=15)
MAX_ATTEMPTS = 3


class ScoringProvider(Protocol):
    def score(self, submission: Submission, rubric_snapshot: list[dict]) -> ScoringResult: ...


def claim_next_job() -> AIJob | None:
    now = timezone.now()
    with transaction.atomic():
        AIJob.objects.filter(
            status="running", lease_expires_at__lt=now, attempts__gte=MAX_ATTEMPTS
        ).update(
            status="failed",
            error_category="lease_exhausted",
            error_message="The AI worker stopped before this job completed",
            finished_at=now,
            lease_expires_at=None,
        )
        job = (
            AIJob.objects.select_for_update(skip_locked=True)
            .filter(attempts__lt=MAX_ATTEMPTS)
            .filter(Q(status="pending") | Q(status="running", lease_expires_at__lt=now))
            .order_by("created_at")
            .first()
        )
        if job is None:
            return None
        job.status = "running"
        job.attempts += 1
        job.started_at = now
        job.lease_expires_at = now + LEASE_DURATION
        job.finished_at = None
        job.error_category = ""
        job.error_message = ""
        job.save(
            update_fields=[
                "status", "attempts", "started_at", "lease_expires_at", "finished_at",
                "error_category", "error_message",
            ]
        )
        return job


def _finish_existing_proposal(job: AIJob, feedback: Feedback) -> bool:
    if feedback.status != "ai_draft" or (feedback.ai_proposal or {}).get("run_id") != str(job.pk):
        return False
    with transaction.atomic():
        locked = AIJob.objects.select_for_update().get(pk=job.pk)
        if locked.status != "running" or locked.attempts != job.attempts:
            return True
        locked.status = "succeeded"
        locked.result = {"items": feedback.ai_proposal["items"]}
        locked.finished_at = timezone.now()
        locked.lease_expires_at = None
        locked.save(update_fields=["status", "result", "finished_at", "lease_expires_at"])
    return True


def process_next_job(provider: ScoringProvider | None = None) -> AIJob | None:
    job = claim_next_job()
    if job is None:
        return None
    trace_token = bind_ai_job("formal", job.pk)
    logger.info("AI job claimed job_id=%s attempt=%s", job.pk, job.attempts)
    try:
        submission = Submission.objects.select_related("task_id_task").get(pk=job.submission_id)
        feedback = Feedback.objects.select_related("submission_id_submission__task_id_task").get(
            submission_id_submission=submission
        )
        if _finish_existing_proposal(job, feedback):
            return job
        if feedback.status != "ai_pending":
            raise AssessmentError("Assessment is no longer awaiting an AI proposal")
        snapshot = feedback.rubric_snapshot or rubric_snapshot_for_feedback(feedback)
        scorer = provider or CodexScoringProvider(model=job.model)
        result = scorer.score(submission, snapshot)
        with transaction.atomic():
            locked = AIJob.objects.select_for_update().get(pk=job.pk)
            if locked.status != "running" or locked.attempts != job.attempts:
                logger.warning("Discarded stale AI result job_id=%s", job.pk)
                return job
            record_ai_proposal(feedback.pk, result.items, model=result.model, run_id=str(job.pk))
            locked.status = "succeeded"
            locked.result = {"items": result.items}
            locked.usage = result.usage
            locked.provider_thread_id = result.provider_thread_id
            locked.finished_at = timezone.now()
            locked.lease_expires_at = None
            locked.save(
                update_fields=[
                    "status", "result", "usage", "provider_thread_id", "finished_at", "lease_expires_at"
                ]
            )
        logger.info("AI job succeeded job_id=%s", job.pk)
    except Exception as exc:
        category = "validation" if isinstance(exc, AssessmentError) else classify_ai_error(exc)
        logger.warning("AI job failed job_id=%s category=%s error_type=%s", job.pk, category, type(exc).__name__)
        with transaction.atomic():
            locked = AIJob.objects.select_for_update().get(pk=job.pk)
            if locked.status == "running" and locked.attempts == job.attempts:
                locked.status = "failed"
                locked.error_category = category
                locked.error_message = safe_ai_error_message(category, workflow="Formal scoring")
                locked.finished_at = timezone.now()
                locked.lease_expires_at = None
                locked.save(
                    update_fields=["status", "error_category", "error_message", "finished_at", "lease_expires_at"]
                )
    finally:
        reset_ai_job(trace_token)
    return job


def retry_failed_job(job_id) -> AIJob:
    with transaction.atomic():
        job = AIJob.objects.select_for_update().get(pk=job_id)
        if job.status != "failed" or job.attempts >= MAX_ATTEMPTS:
            raise AssessmentError("This AI job is not eligible for retry")
        job.status = "pending"
        job.error_category = ""
        job.error_message = ""
        job.finished_at = None
        job.save(update_fields=["status", "error_category", "error_message", "finished_at"])
        return job
