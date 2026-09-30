"""Verified email updates require a password, inbox proof, and session rotation."""

import re

import pytest
from django.core import mail
from django.test import Client

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import EmailChangeGrant, User


@pytest.mark.django_db
def test_email_change_is_one_time_and_revokes_old_sessions():
    user = User.objects.create_user(user_email="old-email@example.com", password="TestPass123!")
    client = Client(HTTP_AUTHORIZATION=f"Bearer {create_jwt_pair(user).access}")
    path = "/api/v2/auth/email-change/request/"
    payload = {"new_email": "new-email@example.com", "current_password": "wrong"}
    assert client.post(path, payload, content_type="application/json").status_code == 403
    assert len(mail.outbox) == 0

    payload["current_password"] = "TestPass123!"
    response = client.post(path, payload, content_type="application/json")
    assert response.status_code == 200
    assert "token" not in str(response.json())
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ["new-email@example.com"]
    token = re.search(r"token=([\w-]+)", mail.outbox[0].body).group(1)
    assert EmailChangeGrant.objects.filter(token_hash=token).count() == 0
    assert Client().post(
        "/api/v2/auth/email-change/preview/", {"token": token}, content_type="application/json",
    ).json()["new_email"] == "new-email@example.com"

    complete = Client().post("/api/v2/auth/email-change/complete/", {"token": token}, content_type="application/json")
    assert complete.status_code == 200
    user.refresh_from_db()
    assert user.user_email == "new-email@example.com"
    assert client.get("/api/v2/auth/me/").status_code == 401
    assert Client().post(
        "/api/v2/auth/email-change/complete/", {"token": token}, content_type="application/json",
    ).status_code == 404
    assert Client().post(
        "/api/v2/auth/login-with-jwt/", {"email": "new-email@example.com", "password": "TestPass123!"},
        content_type="application/json",
    ).status_code == 200
