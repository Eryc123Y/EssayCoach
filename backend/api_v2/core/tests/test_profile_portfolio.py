"""Profile privacy and released-grade boundaries."""

from datetime import timedelta
from pathlib import Path

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.achievements import award_submission_milestones
from core.models import Class, Enrollment, Feedback, MarkingRubric, Submission, Task, Unit, User, UserBadge


def _client(user: User) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


@pytest.mark.django_db
def test_profile_visibility_and_score_controls(monkeypatch, tmp_path):
    from django.conf import settings as django_settings

    monkeypatch.setattr(django_settings, "MEDIA_ROOT", Path(tmp_path))
    owner = User.objects.create_user(user_email="profile-owner@example.com", password="TestPass123!")
    peer = User.objects.create_user(user_email="profile-peer@example.com", password="TestPass123!")
    outsider = User.objects.create_user(user_email="profile-outside@example.com", password="TestPass123!")
    admin = User.objects.create_user(user_email="profile-admin@example.com", password="TestPass123!", user_role="admin")
    unit = Unit.objects.create(unit_id="PRF101", unit_name="Profile Writing")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="A")
    for user in (owner, peer):
        Enrollment.objects.create(user_id_user=user, class_id_class=class_obj, unit_id_unit=unit)
    rubric = MarkingRubric.objects.create(user_id_user=admin, rubric_desc="Profile rubric")
    task = Task.objects.create(
        unit_id_unit=unit, class_id_class=class_obj, rubric_id_marking_rubric=rubric,
        task_due_datetime=timezone.now() + timedelta(days=7), task_title="Portfolio Essay", task_instructions="Write",
    )
    submission = Submission.objects.create(task_id_task=task, user_id_user=owner, submission_txt="private essay")
    Feedback.objects.create(submission_id_submission=submission, status="published", final_score=88)
    path = f"/api/v2/core/profiles/{owner.pk}/"

    assert _client(peer).get(path).status_code == 200
    assert _client(peer).get(path).json()["history"] == []
    assert _client(outsider).get(path).status_code == 403
    assert _client(admin).get(path).status_code == 200

    settings = {"bio": "I write to learn.", "visibility": "private", "show_essays": True, "show_scores": False}
    assert _client(owner).put("/api/v2/core/profiles/me/", settings, content_type="application/json").status_code == 200
    assert _client(peer).get(path).status_code == 403
    owner.refresh_from_db()
    assert owner.bio == "I write to learn."

    settings["visibility"] = "classmates"
    assert _client(owner).put("/api/v2/core/profiles/me/", settings, content_type="application/json").status_code == 200
    visible = _client(peer).get(path).json()
    assert visible["history"][0]["title"] == "Portfolio Essay"
    assert visible["history"][0]["score"] is None
    assert "private essay" not in str(visible)
    settings["show_scores"] = True
    assert _client(owner).put("/api/v2/core/profiles/me/", settings, content_type="application/json").status_code == 200
    assert _client(peer).get(path).json()["history"][0]["score"] == 88

    upload = SimpleUploadedFile("portrait.png", b"\x89PNG\r\n\x1a\n", content_type="image/png")
    uploaded = _client(owner).post("/api/v2/auth/settings/avatar/", {"avatar": upload})
    assert uploaded.status_code == 200
    avatar_url = uploaded.json()["avatar_url"]
    assert _client(owner).get(avatar_url).status_code == 200
    assert _client(outsider).get(avatar_url).status_code == 403
    owner.refresh_from_db()
    assert _client(outsider).get(owner.avatar_url).status_code == 404

    award_submission_milestones(owner)
    award_submission_milestones(owner)
    assert UserBadge.objects.filter(user_id_user=owner).count() == 1
    assert _client(owner).get(path).json()["badges"][0]["name"] == "First Essay"
