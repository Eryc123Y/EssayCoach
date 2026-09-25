"""Practice draft revisions and durable AI analysis jobs."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Protocol

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from ai_feedback.practice_provider import CodexPracticeProvider, PracticeAnalysisResult
from core.models import PracticeEssay, PracticeEvidence, PracticeRevision, PracticeRun, RubricItem
from core.notifications import notify_practice_complete

logger = logging.getLogger(__name__)
LEASE_DURATION = timedelta(minutes=15)
MAX_ATTEMPTS = 3


class PracticeError(ValueError):
    pass


class PracticeProvider(Protocol):
    def analyze(self, revision: PracticeRevision) -> PracticeAnalysisResult: ...


def rubric_snapshot(rubric) -> list[dict] | None:
    if rubric is None:
        return None
    items = RubricItem.objects.filter(rubric_id_marking_rubric=rubric).prefetch_related("level_descriptions")
    result = []
    for item in items:
        levels = list(item.level_descriptions.all())
        if not levels:
            raise PracticeError("The selected rubric has a criterion without a score range")
        result.append({
            "id": item.pk, "name": item.rubric_item_name, "weight": str(item.rubric_item_weight),
            "exemplar_text": item.exemplar_text,
            "max_score": max(level.level_max_score for level in levels),
            "levels": [
                {"min": level.level_min_score, "max": level.level_max_score, "description": level.level_desc}
                for level in levels
            ],
        })
    if not result:
        raise PracticeError("The selected rubric has no criteria")
    return result


def start_analysis(essay_id, student_id: int, *, expected_version: int) -> PracticeRun:
    with transaction.atomic():
        essay = PracticeEssay.objects.select_for_update().filter(pk=essay_id, student_id=student_id).first()
        if essay is None:
            raise PracticeError("Practice essay not found")
        if essay.version != expected_version:
            raise PracticeError("Draft changed; reload before analysis")
        if not essay.goal.strip() or not essay.content.strip():
            raise PracticeError("A writing goal and essay are required")
        if len(essay.content) > 50000:
            raise PracticeError("Essay exceeds the 50,000 character limit")
        latest = essay.revisions.order_by("-number").first()
        if latest and (
            latest.content == essay.content and latest.goal == essay.goal
            and latest.language == essay.language and latest.audience == essay.audience
            and latest.tone == essay.tone and latest.run.status in {"pending", "running"}
        ):
            return latest.run
        revision = PracticeRevision.objects.create(
            essay=essay, number=(latest.number + 1 if latest else 1),
            goal=essay.goal, content=essay.content, language=essay.language,
            audience=essay.audience, tone=essay.tone,
            rubric_snapshot=rubric_snapshot(essay.rubric),
        )
        return PracticeRun.objects.create(revision=revision)


def claim_next_run() -> PracticeRun | None:
    now = timezone.now()
    with transaction.atomic():
        PracticeRun.objects.filter(status="running", lease_expires_at__lt=now, attempts__gte=MAX_ATTEMPTS).update(
            status="failed", error_category="lease_exhausted",
            error_message="The AI worker stopped before this analysis completed",
            finished_at=now, lease_expires_at=None,
        )
        run = (
            PracticeRun.objects.select_for_update(skip_locked=True)
            .filter(attempts__lt=MAX_ATTEMPTS)
            .filter(Q(status="pending") | Q(status="running", lease_expires_at__lt=now))
            .order_by("created_at")
            .first()
        )
        if run is None:
            return None
        run.status = "running"
        run.attempts += 1
        run.started_at = now
        run.finished_at = None
        run.lease_expires_at = now + LEASE_DURATION
        run.error_category = ""
        run.error_message = ""
        run.save(update_fields=[
            "status", "attempts", "started_at", "finished_at", "lease_expires_at",
            "error_category", "error_message",
        ])
        return run


def process_next_run(provider: PracticeProvider | None = None) -> PracticeRun | None:
    run = claim_next_run()
    if run is None:
        return None
    logger.info("Practice run claimed run_id=%s attempt=%s", run.pk, run.attempts)
    try:
        revision = PracticeRevision.objects.get(pk=run.revision_id)
        analyzer = provider or CodexPracticeProvider(model=run.model)
        result = analyzer.analyze(revision)
        with transaction.atomic():
            locked = PracticeRun.objects.select_for_update().get(pk=run.pk)
            if locked.status != "running" or locked.attempts != run.attempts:
                logger.warning("Discarded stale practice result run_id=%s", run.pk)
                return run
            locked.status = "succeeded"
            locked.report = result.report
            locked.usage = result.usage
            locked.provider_thread_id = result.provider_thread_id
            locked.finished_at = timezone.now()
            locked.lease_expires_at = None
            locked.save(update_fields=[
                "status", "report", "usage", "provider_thread_id", "finished_at", "lease_expires_at",
            ])
            PracticeEvidence.objects.bulk_create([PracticeEvidence(run=locked, **item) for item in result.evidence])
            notify_practice_complete(locked)
        logger.info("Practice run succeeded run_id=%s evidence_count=%s", run.pk, len(result.evidence))
    except Exception as exc:
        logger.warning("Practice run failed run_id=%s error_type=%s", run.pk, type(exc).__name__)
        with transaction.atomic():
            locked = PracticeRun.objects.select_for_update().get(pk=run.pk)
            if locked.status == "running" and locked.attempts == run.attempts:
                locked.status = "failed"
                locked.error_category = "provider"
                locked.error_message = "Practice analysis failed; check the local AI worker logs"
                locked.finished_at = timezone.now()
                locked.lease_expires_at = None
                locked.save(update_fields=[
                    "status", "error_category", "error_message", "finished_at", "lease_expires_at",
                ])
    return run


def retry_run(run_id, student_id: int) -> PracticeRun:
    with transaction.atomic():
        run = PracticeRun.objects.select_for_update().filter(pk=run_id, revision__essay__student_id=student_id).first()
        if run is None:
            raise PracticeError("Practice run not found")
        if run.status != "failed" or run.attempts >= MAX_ATTEMPTS:
            raise PracticeError("This practice run cannot be retried")
        run.status = "pending"
        run.error_category = ""
        run.error_message = ""
        run.finished_at = None
        run.save(update_fields=["status", "error_category", "error_message", "finished_at"])
        return run
