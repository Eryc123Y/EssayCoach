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


@pytest.mark.django_db(transaction=True)
def test_concurrent_refreshes_with_one_token_rotate_once(monkeypatch):
    import threading
    import time

    from django.db import connection

    from api_v2.utils import jwt_auth

    user = User.objects.create_user(user_email="race@example.com", password="TestPass123!")
    refresh = jwt_auth.create_jwt_pair(user, persistent=True).refresh

    original = jwt_auth.create_jwt_pair

    def slow_create_jwt_pair(*args, **kwargs):
        # Widen the window between reading the session and writing its new JTI.
        time.sleep(0.3)
        return original(*args, **kwargs)

    monkeypatch.setattr(jwt_auth, "create_jwt_pair", slow_create_jwt_pair)
    start = threading.Barrier(2)
    results = []

    def worker():
        start.wait()
        try:
            results.append(jwt_auth.refresh_jwt_token(refresh))
        finally:
            connection.close()

    threads = [threading.Thread(target=worker) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    winners = [pair for pair in results if pair is not None]
    assert len(winners) == 1
    session = AuthSession.objects.get(user=user)
    assert session.refresh_jti == jwt.decode(winners[0].refresh, options={"verify_signature": False})["jti"]
