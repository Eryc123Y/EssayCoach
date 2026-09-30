"""Durable AI queues survive worker crashes, stale workers, and concurrent claims.

The three queues (formal scoring, practice analysis, coach chat) share one
claim contract: a job is leased, an expired lease may be reclaimed, and a job
that keeps losing its worker fails visibly instead of looping forever.

Run with: uv run pytest api_v2/core/tests/test_ai_queue_recovery.py -v
"""

from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier

import pytest
from django.db import connection
from django.test import Client
from django.utils import timezone

from ai_feedback.codex_provider import ScoringResult
from api_v2.core.tests.test_assessment_release import assessment  # noqa: F401  (pytest fixture)
from api_v2.utils.jwt_auth import create_jwt_pair
from core.ai_jobs import MAX_ATTEMPTS, claim_next_job, process_next_job, retry_failed_job
from core.assessment import AssessmentError
from core.models import AIJob, PracticeChatTurn, PracticeRun, User
from core.practice import claim_next_run
from core.practice_chat import claim_next_turn

PAST = timedelta(seconds=-1)
FUTURE = timedelta(minutes=10)


def _score_for(criterion, score=5):
    return ScoringResult(
        items=[{"rubric_item_id": criterion.pk, "score": score, "comment": "ok"}],
        model="test-model",
        provider_thread_id="thread",
        usage=None,
    )


# --- formal scoring queue ---------------------------------------------------


@pytest.mark.django_db
def test_job_that_keeps_losing_its_worker_fails_visibly_and_hides_the_grade(assessment):  # noqa: F811
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    job = AIJob.objects.create(
        submission=submission,
        status="running",
        attempts=MAX_ATTEMPTS,
        lease_expires_at=timezone.now() + PAST,
    )

    assert claim_next_job() is None

    job.refresh_from_db()
    assert job.status == "failed"
    assert job.error_category == "lease_exhausted"
    assert job.lease_expires_at is None
    assert job.finished_at is not None
    feedback.refresh_from_db()
    assert feedback.status == "ai_pending"
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(student).access}"
    assert client.get(f"/api/v2/core/assessments/{submission.pk}/").status_code == 404
    with pytest.raises(AssessmentError):
        retry_failed_job(job.pk)


@pytest.mark.django_db
def test_live_lease_blocks_a_second_worker(assessment):  # noqa: F811
    *_, submission, _feedback = assessment
    AIJob.objects.create(
        submission=submission, status="running", attempts=1, lease_expires_at=timezone.now() + FUTURE
    )
    calls = []

    class Provider:
        def score(self, *args):
            calls.append(args)

    assert process_next_job(Provider()) is None
    assert calls == []


@pytest.mark.django_db
def test_result_from_a_superseded_attempt_is_discarded(assessment):  # noqa: F811
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    job = AIJob.objects.create(submission=submission)
    reclaimed = []

    class SlowProvider:
        """Takes so long that its lease expires and a second worker reclaims the job."""

        def score(self, *args):
            AIJob.objects.filter(pk=job.pk).update(lease_expires_at=timezone.now() + PAST)
            reclaimed.append(claim_next_job())
            return _score_for(criterion, score=9)

    process_next_job(SlowProvider())

    assert reclaimed[0] is not None and reclaimed[0].attempts == 2
    job.refresh_from_db()
    assert (job.status, job.attempts) == ("running", 2)
    assert job.result is None
    feedback.refresh_from_db()
    assert feedback.status == "ai_pending"
    assert not feedback.feedbackitem_set.exists()


@pytest.mark.django_db
def test_retry_respects_the_attempt_limit_and_job_state(assessment):  # noqa: F811
    *_, submission, _feedback = assessment
    job = AIJob.objects.create(submission=submission)
    with pytest.raises(AssessmentError):
        retry_failed_job(job.pk)  # pending jobs are not retryable

    class Failing:
        def score(self, *args):
            raise RuntimeError("down")

    for attempt in range(1, MAX_ATTEMPTS + 1):
        process_next_job(Failing())
        job.refresh_from_db()
        assert (job.status, job.attempts) == ("failed", attempt)
        if attempt < MAX_ATTEMPTS:
            assert retry_failed_job(job.pk).status == "pending"

    with pytest.raises(AssessmentError):
        retry_failed_job(job.pk)
    assert claim_next_job() is None


@pytest.mark.django_db
def test_pending_job_at_the_attempt_limit_is_never_claimed(assessment):  # noqa: F811
    *_, submission, _feedback = assessment
    job = AIJob.objects.create(submission=submission, status="pending", attempts=MAX_ATTEMPTS)
    calls = []

    class Provider:
        def score(self, *args):
            calls.append(args)

    assert process_next_job(Provider()) is None
    assert calls == []
    job.refresh_from_db()
    assert (job.status, job.attempts) == ("pending", MAX_ATTEMPTS)


@pytest.mark.django_db(transaction=True)
def test_concurrent_workers_never_claim_the_same_job(assessment):  # noqa: F811
    *_, submission, _feedback = assessment
    job = AIJob.objects.create(submission=submission)
    workers = 4
    start = Barrier(workers)

    def claim():
        try:
            start.wait(timeout=10)
            claimed = claim_next_job()
            return claimed.pk if claimed else None
        finally:
            connection.close()

    with ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(lambda _: claim(), range(workers)))

    assert results.count(job.pk) == 1
    assert results.count(None) == workers - 1
    job.refresh_from_db()
    assert (job.status, job.attempts) == ("running", 1)


# --- practice analysis and coach chat queues --------------------------------


@pytest.fixture
def practice_run(db):
    student = User.objects.create_user(user_email="queue-student@example.com", password="StudentPass123!")
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(student).access}"
    essay = client.post(
        "/api/v2/practice/essays/",
        {"goal": "Explain a fact", "content": "The Earth is round.", "language": "en"},
        content_type="application/json",
    ).json()
    run_id = client.post(
        f"/api/v2/practice/essays/{essay['essay_id']}/analyze/",
        {"expected_version": 1},
        content_type="application/json",
    ).json()["run_id"]
    return PracticeRun.objects.get(pk=run_id)


@pytest.fixture
def chat_turn(practice_run):
    practice_run.status = "succeeded"
    practice_run.report = {"overall_score": 70, "headline": "Add evidence"}
    practice_run.save(update_fields=["status", "report"])
    return PracticeChatTurn.objects.create(run=practice_run, question="How can I improve?")


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("fixture_name", "claim"),
    [("practice_run", claim_next_run), ("chat_turn", claim_next_turn)],
    ids=["practice-analysis", "coach-chat"],
)
def test_practice_queues_share_the_lease_contract(request, fixture_name, claim):
    item = request.getfixturevalue(fixture_name)
    type(item).objects.filter(pk=item.pk).update(
        status="running", attempts=1, lease_expires_at=timezone.now() + FUTURE
    )
    assert claim() is None  # a live lease blocks a second worker

    type(item).objects.filter(pk=item.pk).update(lease_expires_at=timezone.now() + PAST)
    reclaimed = claim()
    assert reclaimed is not None and reclaimed.pk == item.pk and reclaimed.attempts == 2

    type(item).objects.filter(pk=item.pk).update(
        status="running", attempts=MAX_ATTEMPTS, lease_expires_at=timezone.now() + PAST
    )
    assert claim() is None
    item.refresh_from_db()
    assert item.status == "failed"
    assert item.error_category == "lease_exhausted"
    assert item.lease_expires_at is None
