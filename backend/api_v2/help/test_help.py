"""Help content and support tickets follow the signed-in user's scope."""

import pytest
from django.test import Client

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import SupportTicket, User


def _client(user: User) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


@pytest.mark.django_db
def test_help_articles_are_bilingual_searchable_and_role_scoped():
    student = User.objects.create_user(user_email="help-student@example.com", password="TestPass123!")
    teacher = User.objects.create_user(
        user_email="help-teacher@example.com", password="TestPass123!", user_role="lecturer"
    )
    student_client = _client(student)
    articles = student_client.get("/api/v2/help/articles/?language=zh").json()
    assert any(item["slug"] == "practice-and-sources" and item["language"] == "zh" for item in articles)
    assert not any(item["slug"] == "set-up-a-course" for item in articles)
    assert _client(teacher).get("/api/v2/help/articles/set-up-a-course/?language=zh").status_code == 200
    assert student_client.get("/api/v2/help/articles/set-up-a-course/").status_code == 404
    result = student_client.get("/api/v2/help/articles/?query=grade&language=en").json()
    assert any(item["slug"] == "submit-an-assignment" for item in result)
    assert student_client.get("/api/v2/help/articles/?language=fr").status_code == 422
    feedback_url = "/api/v2/help/articles/practice-and-sources/feedback/"
    assert student_client.get(feedback_url).json()["helpful"] is None
    first_vote = student_client.post(feedback_url, {"helpful": True}, content_type="application/json")
    assert first_vote.status_code == 200
    assert first_vote.json()["helpful_count"] == 1
    changed_vote = student_client.post(feedback_url, {"helpful": False}, content_type="application/json")
    assert changed_vote.json()["helpful_count"] == 0
    assert changed_vote.json()["unhelpful_count"] == 1
    assert student_client.post(
        "/api/v2/help/articles/set-up-a-course/feedback/", {"helpful": True}, content_type="application/json"
    ).status_code == 404


@pytest.mark.django_db
def test_ticket_is_private_and_admin_can_resolve_it():
    student = User.objects.create_user(user_email="ticket-student@example.com", password="TestPass123!")
    other = User.objects.create_user(user_email="ticket-other@example.com", password="TestPass123!")
    admin = User.objects.create_user(
        user_email="ticket-admin@example.com", password="TestPass123!", user_role="admin"
    )
    student_client = _client(student)
    payload = {"subject": "Missing class", "description": "I cannot find my writing class.", "priority": "normal"}
    response = student_client.post("/api/v2/help/tickets/", payload, content_type="application/json")
    assert response.status_code == 200
    ticket_id = response.json()["id"]
    assert response.json()["status"] == "open"
    assert len(student_client.get("/api/v2/help/tickets/me/").json()) == 1
    assert _client(other).get("/api/v2/help/tickets/me/").json() == []
    assert _client(other).get("/api/v2/help/admin/tickets/").status_code == 403
    assert len(_client(admin).get("/api/v2/help/admin/tickets/").json()) == 1
    resolution = _client(admin).patch(
        f"/api/v2/help/admin/tickets/{ticket_id}/",
        {"status": "resolved", "staff_reply": "Enrollment has been checked."},
        content_type="application/json",
    )
    assert resolution.status_code == 200
    assert student_client.get("/api/v2/help/tickets/me/").json()[0]["staff_reply"] == "Enrollment has been checked."
    assert SupportTicket.objects.get(pk=ticket_id).handled_by_id == admin.pk
