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
    assert SocialInteraction.objects.get(pk=comment.json()["id"]).status == "removed"
    assert owner_client.get(f"{base}{submission.pk}/interactions/").json() == []
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


BASE = "/api/v2/social/"


def _shared_with_response(social):
    """Share the owner's essay and post one peer feedback response."""
    student, peer, teacher, outsider, class_obj, submission, feedback = social
    feedback.status = "published"
    feedback.save(update_fields=["status"])
    owner_client, peer_client, teacher_client = _client(student), _client(peer), _client(teacher)
    shared = owner_client.post(
        f"{BASE}share/", {"submission_id": submission.pk, "visibility": "class"}, content_type="application/json"
    )
    assert shared.status_code == 200
    response = peer_client.post(
        f"{BASE}{submission.pk}/interact/",
        {"interaction_type": "feedback", "content": "This paragraph is rude."},
        content_type="application/json",
    )
    assert response.status_code == 200
    return response.json()["id"], owner_client, peer_client, teacher_client


def _report(client: Client, interaction_id: int) -> int:
    report = client.post(
        f"{BASE}report/", {"interaction_id": interaction_id, "reason": "offensive"}, content_type="application/json"
    )
    assert report.status_code == 200
    return report.json()["id"]


def _resolve(client: Client, report_id: int, decision: str):
    return client.post(
        f"{BASE}moderation/reports/{report_id}/resolve/", {"decision": decision}, content_type="application/json"
    )


@pytest.mark.django_db
def test_hide_on_response_report_hides_only_that_response(social):
    student, peer, teacher, outsider, class_obj, submission, feedback = social
    interaction_id, owner_client, peer_client, teacher_client = _shared_with_response(social)
    third = User.objects.create_user(user_email="social-third@example.com", password="TestPass123!")
    Enrollment.objects.create(user_id_user=third, class_id_class=class_obj, unit_id_unit=class_obj.unit_id_unit)
    third_client = _client(third)

    report_id = _report(owner_client, interaction_id)
    resolved = _resolve(teacher_client, report_id, "hide")
    assert resolved.status_code == 200
    assert resolved.json()["target_type"] == "feedback"
    assert resolved.json()["target_status"] == "hidden"

    assert SharedEssay.objects.get(submission=submission).status == "visible"
    assert SocialInteraction.objects.get(pk=interaction_id).status == "hidden"
    feed = third_client.get(f"{BASE}feed/").json()
    assert [row["submission_id"] for row in feed] == [submission.pk]
    assert feed[0]["comments_count"] == 0
    assert third_client.get(f"{BASE}{submission.pk}/interactions/").json() == []
    assert owner_client.get(f"{BASE}{submission.pk}/interactions/").json() == []
    # The response's author and the class's teaching staff still see it, flagged as hidden.
    assert [row["status"] for row in peer_client.get(f"{BASE}{submission.pk}/interactions/").json()] == ["hidden"]
    assert [row["status"] for row in teacher_client.get(f"{BASE}{submission.pk}/interactions/").json()] == ["hidden"]
    # Nobody else can report a response they cannot see.
    third_report = third_client.post(
        f"{BASE}report/", {"interaction_id": interaction_id, "reason": "spam"}, content_type="application/json"
    )
    assert third_report.status_code == 404

    assert peer_client.post(f"{BASE}moderation/interactions/{interaction_id}/restore/").status_code == 403
    restored = teacher_client.post(f"{BASE}moderation/interactions/{interaction_id}/restore/")
    assert restored.status_code == 200
    assert restored.json()["status"] == "visible"
    assert len(third_client.get(f"{BASE}{submission.pk}/interactions/").json()) == 1
    assert teacher_client.post(f"{BASE}moderation/interactions/{interaction_id}/restore/").status_code == 409


@pytest.mark.django_db
def test_removing_a_twice_reported_response_never_removes_the_essay(social):
    student, peer, teacher, outsider, class_obj, submission, feedback = social
    interaction_id, owner_client, peer_client, teacher_client = _shared_with_response(social)
    first = _report(owner_client, interaction_id)
    second = _report(teacher_client, interaction_id)

    assert _resolve(teacher_client, first, "remove").status_code == 200
    assert SocialInteraction.objects.get(pk=interaction_id).status == "removed"
    sibling = ContentReport.objects.get(pk=second)
    assert (sibling.status, sibling.decision, sibling.interaction_id) == ("resolved", "remove", interaction_id)
    assert teacher_client.get(f"{BASE}moderation/reports/").json() == []
    assert _resolve(teacher_client, second, "remove").status_code == 409
    assert SharedEssay.objects.get(submission=submission).status == "visible"

    # A response report whose response no longer exists at all also leaves the essay alone.
    other = SocialInteraction.objects.create(
        share=SharedEssay.objects.get(submission=submission), user=peer, interaction_type="comment", content="Hmm."
    )
    orphan = _report(owner_client, other.pk)
    other.delete()
    assert ContentReport.objects.get(pk=orphan).interaction_id is None
    resolved = _resolve(teacher_client, orphan, "remove")
    assert resolved.status_code == 200
    assert resolved.json()["target_type"] == "comment"
    assert SharedEssay.objects.get(submission=submission).status == "visible"
    assert len(peer_client.get(f"{BASE}feed/").json()) == 1


@pytest.mark.django_db
def test_report_on_removed_response_still_describes_the_response(social):
    student, peer, teacher, outsider, class_obj, submission, feedback = social
    interaction_id, owner_client, peer_client, teacher_client = _shared_with_response(social)
    removed_report = _report(owner_client, interaction_id)
    assert _resolve(teacher_client, removed_report, "remove").status_code == 200

    # A second response is deleted outright by its author after its report was closed.
    deleted = peer_client.post(
        f"{BASE}{submission.pk}/interact/",
        {"interaction_type": "comment", "content": "Second thoughts."},
        content_type="application/json",
    ).json()["id"]
    deleted_report = _report(owner_client, deleted)
    assert _resolve(teacher_client, deleted_report, "keep").status_code == 200
    assert peer_client.delete(f"{BASE}interactions/{deleted}/").status_code == 200
    assert ContentReport.objects.get(pk=deleted_report).interaction_id is None

    expected = {
        removed_report: ("feedback", "This paragraph is rude.", "removed"),
        deleted_report: ("comment", "Second thoughts.", "removed"),
    }
    for rows in (
        owner_client.get(f"{BASE}reports/me/").json(),
        teacher_client.get(f"{BASE}moderation/reports/?status=all").json(),
    ):
        by_id = {row["id"]: row for row in rows}
        assert set(by_id) == set(expected)
        for report_id, (target_type, content, status) in expected.items():
            row = by_id[report_id]
            assert (row["target_type"], row["target_content"], row["target_status"]) == (target_type, content, status)
            assert row["target_author"] == peer.user_email


@pytest.mark.django_db
def test_migration_backfills_report_targets(social):
    import importlib

    from django.apps import apps

    student, peer, teacher, outsider, class_obj, submission, feedback = social
    share = SharedEssay.objects.create(submission=submission, owner=student, class_obj=class_obj, visibility="class")
    response = SocialInteraction.objects.create(share=share, user=peer, interaction_type="feedback", content="Note")
    on_response = ContentReport.objects.create(share=share, interaction=response, reporter=student, reason="spam")
    on_essay = ContentReport.objects.create(share=share, reporter=peer, reason="spam", target_type="comment")
    # The old resolver deleted a removed response and cleared the link, leaving the essay visible.
    removed_response = ContentReport.objects.create(
        share=share, reporter=teacher, reason="spam", status="resolved", decision="remove", target_type="essay"
    )
    migration = importlib.import_module("core.migrations.0037_social_report_target_interaction_status")
    migration.backfill_report_targets(apps, None)
    on_response.refresh_from_db()
    on_essay.refresh_from_db()
    removed_response.refresh_from_db()
    assert (on_response.target_type, on_response.target_content, on_response.target_author) == (
        "feedback",
        "Note",
        peer.user_email,
    )
    assert on_essay.target_type == "essay"
    assert removed_response.target_type == "comment"

    # An essay "remove" set the essay itself to removed; that history stays an essay report.
    share.status = "removed"
    share.save(update_fields=["status"])
    removed_essay = ContentReport.objects.create(
        share=share, reporter=teacher, reason="spam", status="resolved", decision="remove", target_type="comment"
    )
    migration.backfill_report_targets(apps, None)
    removed_essay.refresh_from_db()
    assert removed_essay.target_type == "essay"
