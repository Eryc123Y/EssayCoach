"""Peer sharing preserves released-grade and class visibility boundaries."""

from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import (
    Class,
    ContentReport,
    Enrollment,
    Feedback,
    MarkingRubric,
    Notification,
    SharedEssay,
    SocialInteraction,
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
def social(db):
    student = User.objects.create_user(user_email="social-owner@example.com", password="TestPass123!")
    peer = User.objects.create_user(user_email="social-peer@example.com", password="TestPass123!")
    teacher = User.objects.create_user(
        user_email="social-teacher@example.com", password="TestPass123!", user_role="lecturer"
    )
    outsider = User.objects.create_user(user_email="social-outsider@example.com", password="TestPass123!")
    unit = Unit.objects.create(unit_id="SOC101", unit_name="Writing")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="Seminar")
    TeachingAssn.objects.create(user_id_user=teacher, class_id_class=class_obj)
    for user in (student, peer):
        Enrollment.objects.create(user_id_user=user, class_id_class=class_obj, unit_id_unit=unit)
    rubric = MarkingRubric.objects.create(user_id_user=teacher)
    task = Task.objects.create(
        unit_id_unit=unit,
        class_id_class=class_obj,
        rubric_id_marking_rubric=rubric,
        task_title="Argument essay",
        task_due_datetime=timezone.now() + timedelta(days=1),
        task_status="published",
    )
    submission = Submission.objects.create(task_id_task=task, user_id_user=student, submission_txt="A thoughtful essay")
    feedback = Feedback.objects.create(submission_id_submission=submission, user_id_user=teacher, status="ai_draft")
    return student, peer, teacher, outsider, class_obj, submission, feedback


@pytest.mark.django_db
def test_share_visibility_interactions_and_moderation(social):
    student, peer, teacher, outsider, class_obj, submission, feedback = social
    owner_client = _client(student)
    peer_client = _client(peer)
    teacher_client = _client(teacher)
    outsider_client = _client(outsider)
    base = "/api/v2/social/"
    data = {"submission_id": submission.pk, "visibility": "class", "caption": "Please review", "tags": ["argument"]}
    assert owner_client.post(f"{base}share/", data, content_type="application/json").status_code == 409
    feedback.status = "published"
    feedback.published_at = timezone.now()
    feedback.final_score = 80
    feedback.save(update_fields=["status", "published_at", "final_score"])
    assert peer_client.post(f"{base}share/", data, content_type="application/json").status_code == 403
    share = owner_client.post(f"{base}share/", data, content_type="application/json")
    assert share.status_code == 200
    assert share.json()["essay_text"] == "A thoughtful essay"
    assert len(peer_client.get(f"{base}feed/").json()) == 1
    assert outsider_client.get(f"{base}feed/").json() == []
    assert outsider_client.get(f"{base}feed/{submission.pk}/").status_code == 404
    assert peer_client.get(f"{base}feed/?search=Argument").json()[0]["submission_id"] == submission.pk

    like = peer_client.post(
        f"{base}{submission.pk}/interact/", {"interaction_type": "like"}, content_type="application/json"
    )
    assert like.status_code == 200
    assert Notification.objects.filter(user=student, kind="social").count() == 1
    assert (
        peer_client.post(
            f"{base}{submission.pk}/interact/", {"interaction_type": "like"}, content_type="application/json"
        ).json()["id"]
        == like.json()["id"]
    )
    comment = peer_client.post(
        f"{base}{submission.pk}/interact/",
        {"interaction_type": "feedback", "content": "Try a more specific example."},
        content_type="application/json",
    )
    assert comment.status_code == 200
    assert Notification.objects.filter(user=student, kind="social").count() == 2
    assert len(owner_client.get(f"{base}{submission.pk}/interactions/").json()) == 1
    report = owner_client.post(
        f"{base}report/",
        {"interaction_id": comment.json()["id"], "reason": "inappropriate", "description": "Needs review"},
        content_type="application/json",
    )
    assert report.status_code == 200
    assert report.json()["target_type"] == "feedback"
    assert report.json()["target_content"] == "Try a more specific example."
    assert peer_client.get(f"{base}moderation/reports/").status_code == 403
    moderation_row = teacher_client.get(f"{base}moderation/reports/").json()[0]
    assert moderation_row["id"] == report.json()["id"]
    assert moderation_row["target_content"] == "Try a more specific example."
    assert peer_client.delete(f"{base}interactions/{comment.json()['id']}/").status_code == 409
    resolution = teacher_client.post(
        f"{base}moderation/reports/{report.json()['id']}/resolve/",
        {"decision": "remove"},
        content_type="application/json",
    )
    assert resolution.status_code == 200
    assert ContentReport.objects.get(pk=report.json()["id"]).status == "resolved"
    assert not SocialInteraction.objects.filter(pk=comment.json()["id"]).exists()
    assert len(peer_client.get(f"{base}feed/").json()) == 1

    updated = owner_client.put(
        f"{base}shares/{submission.pk}/",
        {"visibility": "anonymous", "caption": "", "tags": []},
        content_type="application/json",
    )
    assert updated.status_code == 200
    assert peer_client.get(f"{base}feed/").json() == []
    assert teacher_client.get(f"{base}feed/").json()[0]["user_id"] == student.pk
    assert outsider_client.get(f"{base}feed/?search=social-owner").json() == []
    assert owner_client.delete(f"{base}shares/{submission.pk}/").status_code == 200
    assert SharedEssay.objects.get(submission=submission).status == "removed"


@pytest.mark.django_db
def test_class_scoped_posting_ban(social):
    student, peer, teacher, outsider, class_obj, submission, feedback = social
    feedback.status = "published"
    feedback.save(update_fields=["status"])
    base = "/api/v2/social/"
    ban = _client(teacher).post(
        f"{base}moderation/users/{student.pk}/ban/",
        {"class_id": class_obj.pk, "days": 2, "reason": "Repeated spam"},
        content_type="application/json",
    )
    assert ban.status_code == 200
    share = _client(student).post(
        f"{base}share/", {"submission_id": submission.pk, "visibility": "class"}, content_type="application/json"
    )
    assert share.status_code == 403
