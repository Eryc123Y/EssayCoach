"""Analytics never releases provisional scores or cross-course student data."""

from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import (
    Class,
    Enrollment,
    Feedback,
    FeedbackItem,
    MarkingRubric,
    RubricItem,
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


@pytest.mark.django_db
def test_published_only_role_scoped_reports_and_export():
    admin = User.objects.create_user(
        user_email="analytics-admin@example.com", password="TestPass123!", user_role="admin"
    )
    teacher = User.objects.create_user(
        user_email="analytics-teacher@example.com", password="TestPass123!", user_role="lecturer"
    )
    outsider = User.objects.create_user(
        user_email="analytics-outsider@example.com", password="TestPass123!", user_role="lecturer"
    )
    student = User.objects.create_user(user_email="analytics-student@example.com", password="TestPass123!")
    other = User.objects.create_user(user_email="analytics-other@example.com", password="TestPass123!")
    unit = Unit.objects.create(unit_id="ANL101", unit_name="Writing")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="Seminar")
    TeachingAssn.objects.create(user_id_user=teacher, class_id_class=class_obj)
    Enrollment.objects.create(user_id_user=student, class_id_class=class_obj, unit_id_unit=unit)
    rubric = MarkingRubric.objects.create(user_id_user=teacher)
    criterion = RubricItem.objects.create(
        rubric_id_marking_rubric=rubric, rubric_item_name="Argument", rubric_item_weight=100
    )
    task = Task.objects.create(
        unit_id_unit=unit,
        class_id_class=class_obj,
        rubric_id_marking_rubric=rubric,
        task_title="Essay",
        task_due_datetime=timezone.now() + timedelta(days=1),
        task_status="published",
    )
    submission = Submission.objects.create(task_id_task=task, user_id_user=student, submission_txt="Essay")
    feedback = Feedback.objects.create(
        submission_id_submission=submission,
        user_id_user=teacher,
        status="ai_draft",
        final_score=80,
        rubric_snapshot=[{"id": criterion.pk, "name": "Argument", "max_score": 10}],
    )
    FeedbackItem.objects.create(
        feedback_id_feedback=feedback,
        rubric_item_id_rubric_item=criterion,
        feedback_item_score=8,
        feedback_item_source="ai",
    )
    base = "/api/v2/analytics/"
    student_client = _client(student)
    teacher_client = _client(teacher)
    admin_client = _client(admin)
    before = student_client.get(f"{base}student/{student.pk}/")
    assert before.status_code == 200
    assert before.json()["score_history"] == []
    assert before.json()["average_score"] is None
    assert teacher_client.get(f"{base}classes/{class_obj.pk}/").json()["published_count"] == 0
    assert student_client.get(f"{base}classes/{class_obj.pk}/").status_code == 403
    assert _client(outsider).get(f"{base}classes/{class_obj.pk}/").status_code == 403
    assert student_client.get(f"{base}student/{other.pk}/").status_code == 403
    assert teacher_client.get(f"{base}institution/").status_code == 403
    assert admin_client.get(f"{base}institution/").json()["published_count"] == 0

    feedback.status = "published"
    feedback.published_at = timezone.now()
    feedback.save(update_fields=["status", "published_at"])
    own = student_client.get(f"{base}student/{student.pk}/").json()
    assert own["average_score"] == 80
    assert own["criteria"][0]["average_percent"] == 80
    assert own["recommendations"][0]["criterion"] == "Argument"
    class_data = teacher_client.get(f"{base}classes/{class_obj.pk}/").json()
    assert class_data["average_score"] == 80
    assert class_data["completion_rate"] == 100
    assert admin_client.get(f"{base}institution/").json()["published_count"] == 1
    assert student_client.get(f"{base}export/?scope=class&class_id={class_obj.pk}").status_code == 403
    exported = teacher_client.get(f"{base}export/?scope=class&class_id={class_obj.pk}")
    assert exported.status_code == 200
    assert b"analytics-student@example.com" in exported.content
    assert student_client.get(f"{base}trends/?scope=student&user_id={student.pk}").json()["trend"][0]["count"] == 1
    assert (
        student_client.get(f"{base}student/{student.pk}/?start_date=2027-01-02&end_date=2027-01-01").status_code == 400
    )


@pytest.mark.django_db
def test_export_escapes_spreadsheet_formulas():
    from api_v2.analytics.views import _safe_csv

    assert _safe_csv("=SUM(1,1)") == "'=SUM(1,1)"
    assert _safe_csv(" @SUM(1,1)") == "' @SUM(1,1)"
