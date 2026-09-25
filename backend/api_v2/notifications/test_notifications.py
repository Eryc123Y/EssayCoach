"""Notification delivery respects preferences and account boundaries."""

from datetime import timedelta

import pytest
from django.core import mail
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import (
    Class,
    Enrollment,
    Feedback,
    MarkingRubric,
    Notification,
    Submission,
    Task,
    TeachingAssn,
    Unit,
    User,
)
from core.notifications import notify_grade_published, notify_submission


def _client(user: User) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


@pytest.mark.django_db
def test_grading_and_result_notices_are_private_and_preference_aware(django_capture_on_commit_callbacks):
    teacher = User.objects.create_user(
        user_email="notice-teacher@example.com", password="TestPass123!", user_role="lecturer",
        preferences={
            "grading_alerts": True, "email_notifications": True,
            "in_app_notifications": True, "language": "zh",
        },
    )
    student = User.objects.create_user(user_email="notice-student@example.com", password="TestPass123!")
    unit = Unit.objects.create(unit_id="NTF101", unit_name="Writing Notices")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="A")
    Enrollment.objects.create(user_id_user=student, class_id_class=class_obj, unit_id_unit=unit)
    TeachingAssn.objects.create(user_id_user=teacher, class_id_class=class_obj)
    rubric = MarkingRubric.objects.create(user_id_user=teacher, rubric_desc="Writing")
    task = Task.objects.create(
        unit_id_unit=unit, class_id_class=class_obj, rubric_id_marking_rubric=rubric,
        task_title="Notice essay", task_instructions="Write", task_due_datetime=timezone.now() + timedelta(days=7),
    )
    submission = Submission.objects.create(task_id_task=task, user_id_user=student, submission_txt="essay")
    with django_capture_on_commit_callbacks(execute=True):
        notify_submission(submission)
        notify_submission(submission)
    assert Notification.objects.filter(user=teacher).count() == 1
    assert len(mail.outbox) == 1
    assert mail.outbox[0].subject == "有新作文待复核"

    teacher_client = _client(teacher)
    student_client = _client(student)
    payload = teacher_client.get("/api/v2/notifications/").json()
    assert payload["unread_count"] == 1
    notice_id = payload["items"][0]["id"]
    assert student_client.post(f"/api/v2/notifications/{notice_id}/read/").status_code == 404
    assert teacher_client.post(f"/api/v2/notifications/{notice_id}/read/").status_code == 200
    assert teacher_client.get("/api/v2/notifications/").json()["unread_count"] == 0

    student.preferences = {**student.preferences, "submission_alerts": False}
    student.save(update_fields=["preferences"])
    feedback = Feedback.objects.create(submission_id_submission=submission, status="published", final_score=84)
    notify_grade_published(feedback)
    assert Notification.objects.filter(user=student).count() == 0
    student.preferences = {**student.preferences, "submission_alerts": True, "email_notifications": False}
    student.save(update_fields=["preferences"])
    notify_grade_published(feedback)
    assert student_client.get("/api/v2/notifications/").json()["unread_count"] == 1
    assert len(mail.outbox) == 1
