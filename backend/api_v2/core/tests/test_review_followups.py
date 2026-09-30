"""Regression tests for code-review findings on the private-product branch.

Covers: lecturer-only assessment review, whole-course assignment updates,
session revocation on generic status changes, and the AI worker heartbeat.

Run with: uv run pytest api_v2/core/tests/test_review_followups.py -v
"""

from datetime import timedelta

import pytest
from django.core.management import call_command
from django.test import Client
from django.utils import timezone

from api_v2.core.tests.test_assessment_release import assessment  # noqa: F401  (pytest fixture)
from api_v2.utils.jwt_auth import create_jwt_pair
from core.assessment import record_ai_proposal, review_assessment
from core.models import AuthSession, CourseLeadAssignment, Task, User, WorkerHeartbeat


def _client(user: User) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


# --- assessment review is a lecturer stage ----------------------------------


def _ai_draft(assessment):  # noqa: F811
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    record_ai_proposal(
        feedback.pk,
        [{"rubric_item_id": criterion.pk, "score": 7, "comment": "Clear claim"}],
        model="test-model",
        run_id="run-1",
    )
    feedback.refresh_from_db()
    body = {
        "expected_version": feedback.version,
        "items": [{"rubric_item_id": criterion.pk, "score": 8, "comment": "Improved"}],
    }
    return teacher, submission, feedback, body


@pytest.mark.django_db
def test_admin_cannot_review_an_assessment(assessment):  # noqa: F811
    teacher, submission, feedback, body = _ai_draft(assessment)
    admin = User.objects.create_user(user_email="review-admin@example.com", password="pw-12345678", user_role="admin")
    path = f"/api/v2/core/assessments/{submission.pk}/review/"

    denied = _client(admin).post(path, body, content_type="application/json")

    assert denied.status_code == 403
    feedback.refresh_from_db()
    assert feedback.status == "ai_draft" and feedback.reviewed_by_id is None
    assert _client(admin).get(f"/api/v2/core/assessments/{submission.pk}/").status_code == 200  # admins may still read

    allowed = _client(teacher).post(path, body, content_type="application/json")
    assert allowed.status_code == 200, allowed.content
    assert allowed.json()["status"] == "lecturer_reviewed"


@pytest.mark.django_db
def test_review_function_itself_refuses_non_lecturers(assessment):  # noqa: F811
    teacher, submission, feedback, body = _ai_draft(assessment)
    admin = User.objects.create_user(user_email="review-admin2@example.com", password="pw-12345678", user_role="admin")

    with pytest.raises(PermissionError):
        review_assessment(feedback.pk, admin, body["items"], expected_version=body["expected_version"])

    feedback.refresh_from_db()
    assert feedback.status == "ai_draft"


# --- updating an assignment can make it whole-course --------------------------


def _task_payload(task: Task, **overrides):
    payload = {
        "unit_id_unit": task.unit_id_unit_id,
        "rubric_id_marking_rubric": task.rubric_id_marking_rubric_id,
        "task_due_datetime": (timezone.now() + timedelta(days=5)).isoformat(),
        "task_title": "Essay",
        "task_desc": "",
        "task_instructions": "Write clearly.",
        "task_status": "draft",
    }
    return {**payload, **overrides}


@pytest.mark.django_db
def test_updating_without_a_class_makes_the_assignment_whole_course(assessment):  # noqa: F811
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    task = submission.task_id_task
    assert task.class_id_class_id is not None
    path = f"/api/v2/core/tasks/{task.pk}/"

    # Teaching one class is not enough to manage a course-wide assignment.
    denied = _client(teacher).put(path, _task_payload(task), content_type="application/json")
    assert denied.status_code == 403
    task.refresh_from_db()
    assert task.class_id_class_id is not None

    CourseLeadAssignment.objects.create(user_id_user=teacher, unit_id_unit=unit, assigned_by=teacher)
    cleared = _client(teacher).put(path, _task_payload(task, class_id_class=None), content_type="application/json")
    assert cleared.status_code == 200, cleared.content
    task.refresh_from_db()
    assert task.class_id_class_id is None


@pytest.mark.django_db
def test_updating_with_a_class_keeps_the_assignment_class_scoped(assessment):  # noqa: F811
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    task = submission.task_id_task
    class_id = task.class_id_class_id

    response = _client(teacher).put(
        f"/api/v2/core/tasks/{task.pk}/",
        _task_payload(task, class_id_class=class_id, task_title="Renamed"),
        content_type="application/json",
    )

    assert response.status_code == 200, response.content
    task.refresh_from_db()
    assert task.class_id_class_id == class_id and task.task_title == "Renamed"


# --- generic status changes revoke sessions -----------------------------------


@pytest.mark.django_db
def test_suspending_then_reenabling_through_the_generic_update_does_not_revive_old_tokens():
    admin = User.objects.create_user(user_email="status-admin@example.com", password="pw-12345678", user_role="admin")
    student = User.objects.create_user(user_email="status-student@example.com", password="pw-12345678")
    old_token = create_jwt_pair(student).access
    old_client = Client()
    old_client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {old_token}"
    assert old_client.get("/api/v2/core/users/me/").status_code == 200
    version = student.auth_version
    path = f"/api/v2/core/users/{student.pk}/"

    admin_client = _client(admin)
    suspend = {"user_status": "suspended", "is_active": False}
    enable = {"user_status": "active", "is_active": True}
    assert admin_client.put(path, suspend, content_type="application/json").status_code == 200
    assert admin_client.put(path, enable, content_type="application/json").status_code == 200

    student.refresh_from_db()
    assert student.auth_version > version
    assert not AuthSession.objects.filter(user=student, revoked_at__isnull=True).exists()
    assert old_client.get("/api/v2/core/users/me/").status_code == 401  # the pre-suspension token stays dead
    assert _client(student).get("/api/v2/core/users/me/").status_code == 200  # a fresh sign-in works


@pytest.mark.django_db
def test_profile_edits_do_not_revoke_sessions():
    admin = User.objects.create_user(user_email="edit-admin@example.com", password="pw-12345678", user_role="admin")
    student = User.objects.create_user(user_email="edit-student@example.com", password="pw-12345678")
    token_client = Client()
    token_client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(student).access}"
    version = student.auth_version

    response = _client(admin).put(
        f"/api/v2/core/users/{student.pk}/", {"user_fname": "Renamed"}, content_type="application/json"
    )

    assert response.status_code == 200, response.content
    student.refresh_from_db()
    assert student.user_fname == "Renamed" and student.auth_version == version
    assert token_client.get("/api/v2/core/users/me/").status_code == 200


# --- the worker heartbeat keeps beating during a long AI call ---------------


@pytest.mark.django_db(transaction=True)
def test_worker_heartbeat_advances_while_a_job_is_running(monkeypatch):
    from core.management.commands import run_ai_worker

    monkeypatch.setattr(run_ai_worker, "HEARTBEAT_SECONDS", 0.1)
    observed = {}

    def slow_formal_job():
        import time

        observed["before"] = WorkerHeartbeat.objects.get(pk=1).last_seen_at
        time.sleep(0.6)  # a model call far longer than the heartbeat interval
        observed["after"] = WorkerHeartbeat.objects.get(pk=1).last_seen_at
        return None

    monkeypatch.setattr(run_ai_worker, "process_next_job", slow_formal_job)
    monkeypatch.setattr(run_ai_worker, "process_next_run", lambda: None)
    monkeypatch.setattr(run_ai_worker, "process_next_turn", lambda: None)

    call_command("run_ai_worker", once=True)

    assert observed["after"] - observed["before"] >= timedelta(milliseconds=300)


@pytest.mark.django_db(transaction=True)
def test_worker_counts_processed_jobs_without_losing_updates(monkeypatch):
    from types import SimpleNamespace

    from core.management.commands import run_ai_worker

    item = SimpleNamespace(
        pk="job-1", status="succeeded", attempts=1, error_category="", model="test-model", refresh_from_db=lambda: None
    )
    monkeypatch.setattr(run_ai_worker, "process_next_job", lambda: item)
    monkeypatch.setattr(run_ai_worker, "process_next_run", lambda: None)
    monkeypatch.setattr(run_ai_worker, "process_next_turn", lambda: None)

    call_command("run_ai_worker", once=True)
    call_command("run_ai_worker", once=True)

    assert WorkerHeartbeat.objects.get(pk=1).processed_jobs == 2


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize(
    ("busy_queue", "expected_calls"),
    [
        ("formal", ["formal"]),
        ("practice", ["formal", "practice"]),
        ("chat", ["formal", "practice", "chat"]),
        (None, ["formal", "practice", "chat"]),
    ],
)
def test_once_mode_stops_after_the_first_queue_with_work(monkeypatch, busy_queue, expected_calls):
    from types import SimpleNamespace

    from core.management.commands import run_ai_worker

    calls = []

    def queue(name):
        def process():
            calls.append(name)
            if name != busy_queue:
                return None
            return SimpleNamespace(
                pk=name, status="succeeded", attempts=1, error_category="", model="m", refresh_from_db=lambda: None
            )

        return process

    monkeypatch.setattr(run_ai_worker, "process_next_job", queue("formal"))
    monkeypatch.setattr(run_ai_worker, "process_next_run", queue("practice"))
    monkeypatch.setattr(run_ai_worker, "process_next_turn", queue("chat"))

    call_command("run_ai_worker", once=True)

    assert calls == expected_calls


# --- deleting an account with protected records is a conflict, not a server error ---------


@pytest.mark.django_db
def test_deleting_an_account_that_owns_a_shared_essay_returns_409(assessment):  # noqa: F811
    from core.models import SharedEssay

    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    admin = User.objects.create_user(user_email="delete-admin@example.com", password="pw-12345678", user_role="admin")
    SharedEssay.objects.create(
        submission=submission, owner=student, class_obj=submission.task_id_task.class_id_class, visibility="class"
    )
    admin_client = _client(admin)
    admin_client.raise_request_exception = False  # an unhandled error must show up as a 500, not an exception

    response = admin_client.delete(f"/api/v2/core/users/{student.pk}/")

    assert response.status_code == 409, response.content
    assert "disabled" in response.json()["detail"]
    assert User.objects.filter(pk=student.pk).exists()


@pytest.mark.django_db
def test_an_account_with_no_records_can_still_be_deleted():
    admin = User.objects.create_user(user_email="delete-admin2@example.com", password="pw-12345678", user_role="admin")
    lonely = User.objects.create_user(user_email="delete-lonely@example.com", password="pw-12345678")

    response = _client(admin).delete(f"/api/v2/core/users/{lonely.pk}/")

    assert response.status_code == 200, response.content
    assert not User.objects.filter(pk=lonely.pk).exists()
