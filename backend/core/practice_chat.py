"""Persisted, student-scoped follow-up coaching turns."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Protocol

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from ai_feedback.practice_provider import CodexPracticeChatProvider, PracticeChatResult
from core.models import PracticeChatTurn, PracticeRun

logger = logging.getLogger(__name__)
LEASE_DURATION = timedelta(minutes=15)
MAX_ATTEMPTS = 3


class PracticeChatError(ValueError):
    pass


class ChatProvider(Protocol):
    def reply(self, run: PracticeRun, question: str, history: list[dict]) -> PracticeChatResult: ...


def create_chat_turn(run_id, student_id: int, question: str) -> PracticeChatTurn:
    question = question.strip()
    if not question or len(question) > 2000:
        raise PracticeChatError("Question must be between 1 and 2,000 characters")
    with transaction.atomic():
        run = PracticeRun.objects.select_for_update().filter(
            pk=run_id, revision__essay__student_id=student_id
        ).first()
        if run is None:
            raise PracticeChatError("Practice report not found")
        if run.status != "succeeded":
            raise PracticeChatError("Practice feedback is not ready for chat")
        if PracticeChatTurn.objects.filter(run=run, status__in=["pending", "running"]).exists():
            raise PracticeChatError("Wait for the current coach reply before asking another question")
        return PracticeChatTurn.objects.create(run=run, question=question)


def claim_next_turn() -> PracticeChatTurn | None:
    now = timezone.now()
    with transaction.atomic():
        PracticeChatTurn.objects.filter(
            status="running", lease_expires_at__lt=now, attempts__gte=MAX_ATTEMPTS
        ).update(
            status="failed", error_category="lease_exhausted",
            error_message="The AI worker stopped before this coach reply completed",
            finished_at=now, lease_expires_at=None,
        )
        turn = (
            PracticeChatTurn.objects.select_for_update(skip_locked=True)
            .filter(attempts__lt=MAX_ATTEMPTS)
            .filter(Q(status="pending") | Q(status="running", lease_expires_at__lt=now))
            .order_by("created_at")
            .first()
        )
        if turn is None:
            return None
        turn.status = "running"
        turn.attempts += 1
        turn.started_at = now
        turn.finished_at = None
        turn.lease_expires_at = now + LEASE_DURATION
        turn.error_category = ""
        turn.error_message = ""
        turn.save(update_fields=[
            "status", "attempts", "started_at", "finished_at", "lease_expires_at",
            "error_category", "error_message",
        ])
        return turn


def process_next_turn(provider: ChatProvider | None = None) -> PracticeChatTurn | None:
    turn = claim_next_turn()
    if turn is None:
        return None
    logger.info("Practice chat claimed turn_id=%s attempt=%s", turn.pk, turn.attempts)
    try:
        run = PracticeRun.objects.select_related("revision").get(pk=turn.run_id)
        history = list(reversed(list(
            PracticeChatTurn.objects.filter(run=run, status="succeeded", created_at__lt=turn.created_at)
            .order_by("-created_at")
            .values("question", "answer")[:12]
        )))
        coach = provider or CodexPracticeChatProvider(model=turn.model)
        result = coach.reply(run, turn.question, history)
        with transaction.atomic():
            locked = PracticeChatTurn.objects.select_for_update().get(pk=turn.pk)
            if locked.status != "running" or locked.attempts != turn.attempts:
                logger.warning("Discarded stale practice chat result turn_id=%s", turn.pk)
                return turn
            locked.status = "succeeded"
            locked.answer = result.answer
            locked.usage = result.usage
            locked.provider_thread_id = result.provider_thread_id
            locked.finished_at = timezone.now()
            locked.lease_expires_at = None
            locked.save(update_fields=[
                "status", "answer", "usage", "provider_thread_id", "finished_at", "lease_expires_at",
            ])
        logger.info("Practice chat succeeded turn_id=%s", turn.pk)
    except Exception as exc:
        logger.warning("Practice chat failed turn_id=%s error_type=%s", turn.pk, type(exc).__name__)
        with transaction.atomic():
            locked = PracticeChatTurn.objects.select_for_update().get(pk=turn.pk)
            if locked.status == "running" and locked.attempts == turn.attempts:
                locked.status = "failed"
                locked.error_category = "provider"
                locked.error_message = "Coach reply failed; check the local AI worker logs"
                locked.finished_at = timezone.now()
                locked.lease_expires_at = None
                locked.save(update_fields=[
                    "status", "error_category", "error_message", "finished_at", "lease_expires_at",
                ])
    return turn


def retry_chat_turn(turn_id, student_id: int) -> PracticeChatTurn:
    with transaction.atomic():
        turn = PracticeChatTurn.objects.select_for_update().filter(
            pk=turn_id, run__revision__essay__student_id=student_id
        ).first()
        if turn is None:
            raise PracticeChatError("Coach turn not found")
        if turn.status != "failed" or turn.attempts >= MAX_ATTEMPTS:
            raise PracticeChatError("This coach reply cannot be retried")
        turn.status = "pending"
        turn.error_category = ""
        turn.error_message = ""
        turn.finished_at = None
        turn.save(update_fields=["status", "error_category", "error_message", "finished_at"])
        return turn
