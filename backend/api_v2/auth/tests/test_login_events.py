"""Only successful interactive authentication is counted as a login."""

import pytest
from django.test import Client

from core.models import LoginEvent, User


@pytest.mark.django_db
def test_successful_login_endpoints_record_events_but_failure_and_refresh_do_not():
    user = User.objects.create_user(user_email="events@example.com", password="TestPass123!")
    client = Client()

    failed = client.post(
        "/api/v2/auth/login-with-jwt/",
        {"email": user.user_email, "password": "wrong-password"},
        content_type="application/json",
    )
    assert failed.status_code == 401
    assert LoginEvent.objects.count() == 0

    login = client.post(
        "/api/v2/auth/login/",
        {"email": user.user_email, "password": "TestPass123!"},
        content_type="application/json",
    )
    assert login.status_code == 200
    assert LoginEvent.objects.filter(user=user).count() == 1

    jwt_login = client.post(
        "/api/v2/auth/login-with-jwt/",
        {"email": user.user_email, "password": "TestPass123!"},
        content_type="application/json",
    )
    assert jwt_login.status_code == 200
    assert LoginEvent.objects.filter(user=user).count() == 2

    refreshed = client.post(
        "/api/v2/auth/refresh/",
        {"refresh": jwt_login.json()["data"]["refresh"]},
        content_type="application/json",
    )
    assert refreshed.status_code == 200
    assert LoginEvent.objects.filter(user=user).count() == 2
