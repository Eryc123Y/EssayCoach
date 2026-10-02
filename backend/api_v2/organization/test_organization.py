"""Single-institution branding and persisted JWT session contracts."""

import pytest
from django.test import Client

from api_v2.utils.jwt_auth import create_jwt_pair, refresh_jwt_token
from core.models import AuthSession, OrganizationSettings, User


def _client(user: User, access: str | None = None) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {access or create_jwt_pair(user).access}"
    return client


@pytest.mark.django_db
def test_only_admin_can_change_single_institution_branding():
    admin = User.objects.create_user(user_email="org-admin@example.com", password="TestPass123!", user_role="admin")
    student = User.objects.create_user(user_email="org-student@example.com", password="TestPass123!")
    path = "/api/v2/admin/organization/"
    data = {"name": "School of Writing", "logo_url": "https://example.edu/logo.png", "primary_color": "#AABBCC"}
    assert _client(student).get(path).status_code == 403
    assert _client(student).put(path, data, content_type="application/json").status_code == 403
    assert (
        _client(admin).put(path, {**data, "primary_color": "red"}, content_type="application/json").status_code == 400
    )
    response = _client(admin).put(path, data, content_type="application/json")
    assert response.status_code == 200
    assert response.json()["invite_only"] is True
    assert response.json()["primary_color"] == "#aabbcc"
    assert OrganizationSettings.objects.count() == 1
    assert _client(admin).get(path).json()["name"] == "School of Writing"


@pytest.mark.django_db
def test_branding_is_public_but_exposes_only_the_display_fields():
    OrganizationSettings.objects.update_or_create(
        pk=1,
        defaults={"name": "School of Writing", "logo_url": "https://example.edu/logo.png", "primary_color": "#aabbcc"},
    )

    response = Client().get("/api/v2/organization/branding/")  # no token: shown on sign-in and the landing page

    assert response.status_code == 200
    assert response.json() == {
        "name": "School of Writing",
        "logo_url": "https://example.edu/logo.png",
        "primary_color": "#aabbcc",
    }


@pytest.mark.django_db
def test_public_branding_never_returns_an_unsafe_logo_or_colour():
    OrganizationSettings.objects.update_or_create(
        pk=1,
        defaults={"name": "School", "logo_url": "javascript:alert(1)", "primary_color": "#1;}a{b"},
    )

    body = Client().get("/api/v2/organization/branding/").json()

    assert body["logo_url"] == ""
    assert body["primary_color"] == "#0f766e"


@pytest.mark.django_db
def test_jwt_sessions_revoke_other_device_and_persist_refresh_rotation():
    user = User.objects.create_user(user_email="session-user@example.com", password="TestPass123!")
    first = create_jwt_pair(user)
    second = create_jwt_pair(user)
    first_client = _client(user, first.access)
    second_client = _client(user, second.access)
    path = "/api/v2/auth/settings/sessions/"
    sessions = first_client.get(path)
    assert sessions.status_code == 200
    assert len(sessions.json()["data"]) == 2
    assert sum(row["is_current"] for row in sessions.json()["data"]) == 1
    other_id = next(row["session_key"] for row in sessions.json()["data"] if not row["is_current"])
    assert first_client.delete(f"{path}{other_id}/").status_code == 200
    assert second_client.get("/api/v2/auth/me/").status_code == 401
    assert refresh_jwt_token(second.refresh) is None
    assert first_client.get("/api/v2/auth/me/").status_code == 200
    rotated = refresh_jwt_token(first.refresh)
    assert rotated is not None
    assert refresh_jwt_token(first.refresh) is None
    assert AuthSession.objects.filter(user=user, revoked_at__isnull=True).count() == 1
    assert _client(user, rotated.access).get("/api/v2/auth/me/").status_code == 200
