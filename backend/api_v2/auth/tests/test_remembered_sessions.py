"""Remember-me sign-ins keep the extended refresh window across rotation."""

from datetime import timedelta

import jwt
import pytest
from django.test import Client
from django.utils import timezone

from core.models import AuthSession, User


def _refresh_lifetime(token: str) -> timedelta:
    payload = jwt.decode(token, options={"verify_signature": False})
    return timedelta(seconds=payload["exp"] - payload["iat"])


def _login(client: Client, email: str, **extra):
    response = client.post(
        "/api/v2/auth/login-with-jwt/",
        {"email": email, "password": "TestPass123!", **extra},
        content_type="application/json",
    )
    assert response.status_code == 200
    return response.json()["data"]


@pytest.mark.django_db
def test_remembered_login_gets_thirty_day_refresh_window_that_survives_rotation():
    user = User.objects.create_user(user_email="remember@example.com", password="TestPass123!")
    client = Client()

    data = _login(client, user.user_email, remember=True)
    assert _refresh_lifetime(data["refresh"]) == timedelta(days=30)
    session = AuthSession.objects.get(user=user)
    assert session.expires_at > timezone.now() + timedelta(days=29)

    rotated = client.post("/api/v2/auth/refresh/", {"refresh": data["refresh"]}, content_type="application/json")
    assert rotated.status_code == 200
    assert _refresh_lifetime(rotated.json()["refresh"]) == timedelta(days=30)


@pytest.mark.django_db
def test_login_without_remember_keeps_the_standard_refresh_window():
    user = User.objects.create_user(user_email="session@example.com", password="TestPass123!")
    client = Client()

    data = _login(client, user.user_email)
    assert _refresh_lifetime(data["refresh"]) == timedelta(days=7)
    assert AuthSession.objects.get(user=user).expires_at < timezone.now() + timedelta(days=8)

    rotated = client.post("/api/v2/auth/refresh/", {"refresh": data["refresh"]}, content_type="application/json")
    assert rotated.status_code == 200
    assert _refresh_lifetime(rotated.json()["refresh"]) == timedelta(days=7)
