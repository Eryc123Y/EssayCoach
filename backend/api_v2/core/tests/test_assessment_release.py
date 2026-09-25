"""Formal grades stay private until a course lead releases a reviewed result."""

from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from ai_feedback.codex_provider import ScoringResult
from api_v2.utils.jwt_auth import create_jwt_pair
from core.ai_jobs import process_next_job
from core.assessment import AssessmentError, record_ai_proposal
from core.models import (
    AIJob,
    AssessmentAuditEvent,
    Class,
    CourseLeadAssignment,
    Enrollment,
    Feedback,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Submission,
    Task,
    TeachingAssn,
    Unit,
    User,
)


def _client(user: User) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


@pytest.fixture
def assessment(db):
    teacher = User.objects.create_user(
        user_email="grade-teacher@example.com", password="TeacherPass123!", user_role="lecturer"
    )
    student = User.objects.create_user(user_email="grade-student@example.com", password="StudentPass123!")
    outsider = User.objects.create_user(
        user_email="grade-outsider@example.com", password="TeacherPass123!", user_role="lecturer"
    )
    unit = Unit.objects.create(unit_id="GRA101", unit_name="Writing")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="Writing A")
    TeachingAssn.objects.create(user_id_user=teacher, class_id_class=class_obj)
    Enrollment.objects.create(user_id_user=student, class_id_class=class_obj, unit_id_unit=unit)
    rubric = MarkingRubric.objects.create(user_id_user=teacher, rubric_desc="Argument rubric")
    criterion = RubricItem.objects.create(
        rubric_id_marking_rubric=rubric, rubric_item_name="Argument", rubric_item_weight=100
    )
    RubricLevelDesc.objects.create(
        rubric_item_id_rubric_item=criterion, level_min_score=0, level_max_score=10, level_desc="Argument quality"
    )
    task = Task.objects.create(
        unit_id_unit=unit,
        class_id_class=class_obj,
        rubric_id_marking_rubric=rubric,
        task_title="Essay",
        task_due_datetime=timezone.now() + timedelta(days=1),
        task_status="published",
    )
    submission = Submission.objects.create(task_id_task=task, user_id_user=student, submission_txt="My essay")
    feedback = Feedback.objects.create(submission_id_submission=submission, user_id_user=teacher)
    return teacher, student, outsider, unit, criterion, submission, feedback


@pytest.mark.django_db
def test_same_teacher_can_review_and_publish_with_separate_audit_events(assessment):
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    student_client = _client(student)
    teacher_client = _client(teacher)
    path = f"/api/v2/core/assessments/{submission.pk}/"

    rubric_path = f"/api/v2/core/tasks/{submission.task_id_task_id}/rubric/"
    task_rubric = student_client.get(rubric_path)
    assert task_rubric.status_code == 200
    assert task_rubric.json()["items"][0]["name"] == "Argument"
    assert _client(outsider).get(rubric_path).status_code == 403
    assert teacher_client.delete(f"/api/v2/core/tasks/{submission.task_id_task_id}/").status_code == 409
    assert Submission.objects.filter(pk=submission.pk).exists()

    assert student_client.get(path).status_code == 404
    assert student_client.get("/api/v2/core/feedbacks/").json() == []

    record_ai_proposal(
        feedback.pk,
        [{"rubric_item_id": criterion.pk, "score": 7, "comment": "Good structure"}],
        model="gpt-6-luna",
        run_id="run-test-1",
    )
    assert teacher_client.get(path).json()["can_publish"] is False
    assert student_client.get(path).status_code == 404
    assert student_client.get("/api/v2/core/dashboard/student/").json()["stats"]["averageScore"] is None
    assert student_client.get(f"/api/v2/core/users/{student.pk}/stats/").json()["average_score"] is None
    assert student_client.get("/api/v2/core/feedback-items/").json() == []
    legacy_update = teacher_client.put(
        f"/api/v2/core/feedback-items/{feedback.feedbackitem_set.first().pk}/",
        {
            "feedback_id_feedback": feedback.pk,
            "rubric_item_id_rubric_item": criterion.pk,
            "feedback_item_score": 9,
            "feedback_item_source": "human",
        },
        content_type="application/json",
    )
    assert legacy_update.status_code == 409
    assert (
        teacher_client.post(f"{path}publish/", {"expected_version": 1}, content_type="application/json").status_code
        == 403
    )

    review = teacher_client.post(
        f"{path}review/",
        {"expected_version": 1, "items": [{"rubric_item_id": criterion.pk, "score": 8, "comment": "Improved"}]},
        content_type="application/json",
    )
    assert review.status_code == 200
    assert review.json()["status"] == "lecturer_reviewed"
    assert student_client.get(path).status_code == 404
    assert student_client.get("/api/v2/core/feedbacks/").json() == []
    assert (
        teacher_client.post(f"{path}publish/", {"expected_version": 1}, content_type="application/json").status_code
        == 403
    )

    CourseLeadAssignment.objects.create(user_id_user=teacher, unit_id_unit=unit, assigned_by=teacher)
    assert teacher_client.get(path).json()["can_publish"] is True
    assert (
        teacher_client.post(f"{path}publish/", {"expected_version": 1}, content_type="application/json").status_code
        == 409
    )
    published = teacher_client.post(f"{path}publish/", {"expected_version": 2}, content_type="application/json")
    assert published.status_code == 200
    assert published.json()["status"] == "published"
    assert student_client.get(path).json()["items"][0]["score"] == 8
    assert student_client.get(path).json()["final_score"] == "80.00"
    assert student_client.get(path).json()["ai_proposal"] is None
    assert student_client.get("/api/v2/core/dashboard/student/").json()["stats"]["averageScore"] == 80
    assert student_client.get(f"/api/v2/core/users/{student.pk}/stats/").json()["average_score"] == 80
    assert len(student_client.get("/api/v2/core/feedbacks/").json()) == 1
    assert len(student_client.get("/api/v2/core/feedback-items/").json()) == 1
    assert student_client.get(f"{path}audit/").status_code == 403
    assert _client(outsider).get(path).status_code == 403

    actions = list(AssessmentAuditEvent.objects.filter(feedback=feedback).values_list("action", flat=True))
    assert actions == ["ai_proposal_recorded", "lecturer_reviewed", "lead_confirmed", "published"]
    assert (
        teacher_client.post(f"{path}publish/", {"expected_version": 3}, content_type="application/json").status_code
        == 409
    )


@pytest.mark.django_db
def test_invalid_ai_score_does_not_advance_assessment(assessment):
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    with pytest.raises(AssessmentError, match="outside its range"):
        record_ai_proposal(
            feedback.pk,
            [{"rubric_item_id": criterion.pk, "score": 11, "comment": "Too high"}],
            model="gpt-6-luna",
            run_id="run-test-invalid",
        )
    feedback.refresh_from_db()
    assert feedback.status == "ai_pending"
    assert not feedback.audit_events.exists()


@pytest.mark.django_db
def test_durable_scoring_job_preserves_staff_only_proposal_and_failure(assessment):
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    job = AIJob.objects.create(submission=submission)

    class FakeProvider:
        def score(self, submission, rubric_snapshot):
            assert rubric_snapshot[0]["id"] == criterion.pk
            return ScoringResult(
                items=[{"rubric_item_id": criterion.pk, "score": 6, "comment": "Clear claim"}],
                model="test-model",
                provider_thread_id="test-thread",
                usage={"tokens": 10},
            )

    process_next_job(FakeProvider())
    job.refresh_from_db()
    feedback.refresh_from_db()
    assert job.status == "succeeded"
    assert feedback.status == "ai_draft"
    assert job.attempts == 1
    assert _client(student).get(f"/api/v2/ai-feedback/jobs/{job.pk}/").json()["result"] is None
    by_submission = f"/api/v2/ai-feedback/jobs/submission/{submission.pk}/"
    assert _client(student).get(by_submission).json()["result"] is None
    assert _client(teacher).get(by_submission).json()["job_id"] == str(job.pk)
    assert _client(outsider).get(by_submission).status_code == 403
    assert _client(teacher).get(f"/api/v2/ai-feedback/jobs/{job.pk}/").json()["result"]["items"][0]["score"] == 6
    assert _client(outsider).get(f"/api/v2/ai-feedback/jobs/{job.pk}/").status_code == 403
    assert _client(student).post(f"/api/v2/ai-feedback/jobs/{job.pk}/retry/").status_code == 403


@pytest.mark.django_db
def test_failed_scoring_job_can_be_retried_by_teaching_staff(assessment):
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    job = AIJob.objects.create(submission=submission)

    class FailingProvider:
        def score(self, submission, rubric_snapshot):
            raise RuntimeError("provider unavailable")

    process_next_job(FailingProvider())
    job.refresh_from_db()
    assert job.status == "failed"
    assert job.error_category == "provider"
    assert "provider unavailable" not in job.error_message
    assert _client(student).post(f"/api/v2/ai-feedback/jobs/{job.pk}/retry/").status_code == 403
    assert _client(outsider).post(f"/api/v2/ai-feedback/jobs/{job.pk}/retry/").status_code == 403
    assert _client(teacher).post(f"/api/v2/ai-feedback/jobs/{job.pk}/retry/").status_code == 200
    job.refresh_from_db()
    assert job.status == "pending"


@pytest.mark.django_db
def test_worker_reclaims_expired_lease_without_exposing_a_grade(assessment):
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    job = AIJob.objects.create(
        submission=submission,
        status="running",
        attempts=1,
        lease_expires_at=timezone.now() - timedelta(seconds=1),
    )

    class FakeProvider:
        def score(self, submission, rubric_snapshot):
            return ScoringResult(
                items=[{"rubric_item_id": criterion.pk, "score": 0, "comment": "Needs a claim"}],
                model="test-model",
                provider_thread_id="recovered-thread",
                usage=None,
            )

    process_next_job(FakeProvider())
    job.refresh_from_db()
    assert job.status == "succeeded"
    assert job.attempts == 2
    assert _client(student).get(f"/api/v2/core/assessments/{submission.pk}/").status_code == 404


@pytest.mark.django_db
def test_submission_freezes_rubric_before_worker_runs(assessment):
    teacher, student, outsider, unit, criterion, submission, feedback = assessment
    task = submission.task_id_task
    feedback.delete()
    submission.delete()
    response = _client(student).post(
        "/api/v2/core/submissions/",
        {"task_id_task": task.pk, "user_id_user": student.pk, "submission_txt": "A short argument."},
        content_type="application/json",
    )
    assert response.status_code == 200
    submission_id = response.json()["submission_id"]
    feedback = Feedback.objects.get(submission_id_submission_id=submission_id)
    assert feedback.rubric_snapshot[0]["max_score"] == 10
    level = RubricLevelDesc.objects.get(rubric_item_id_rubric_item=criterion)
    level.level_max_score = 20
    level.save(update_fields=["level_max_score"])

    class FakeProvider:
        def score(self, submission, rubric_snapshot):
            assert rubric_snapshot[0]["max_score"] == 10
            return ScoringResult(
                items=[{"rubric_item_id": criterion.pk, "score": 9, "comment": "Clear claim"}],
                model="test-model",
                provider_thread_id="frozen-rubric-thread",
                usage=None,
            )

    process_next_job(FakeProvider())
    feedback.refresh_from_db()
    assert feedback.status == "ai_draft"
    assert feedback.rubric_snapshot[0]["max_score"] == 10
