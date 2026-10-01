from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier

import pytest
from django.db import close_old_connections
from django.test import Client
from django.utils import timezone

from core.login_rate_limit import MAX_FAILURES, record_login_failure
from core.models import LoginRateLimit, User


def _login(client: Client, path: str, email: str, password: str):
    return client.post(path, {"email": email, "password": password}, content_type="application/json")


@pytest.mark.django_db
def test_login_endpoints_share_a_per_account_failure_limit():
    user = User.objects.create_user(user_email="limit@example.com", password="TestPass123!")
    client = Client()
    paths = ["/api/v2/auth/login/", "/api/v2/auth/login-with-jwt/"]

    responses = [_login(client, paths[index % 2], user.user_email, "wrong-password") for index in range(MAX_FAILURES)]

    assert [response.status_code for response in responses[:-1]] == [401] * (MAX_FAILURES - 1)
    assert responses[-1].status_code == 429
    assert _login(client, paths[0], user.user_email, "TestPass123!").status_code == 429
    state = LoginRateLimit.objects.get()
    assert state.failure_count == MAX_FAILURES
    assert state.account_hash != user.user_email


@pytest.mark.django_db
def test_successful_login_resets_prior_failures_for_both_login_endpoints():
    user = User.objects.create_user(user_email="reset@example.com", password="TestPass123!")
    client = Client()

    assert _login(client, "/api/v2/auth/login/", user.user_email, "wrong-password").status_code == 401
    assert _login(client, "/api/v2/auth/login-with-jwt/", user.user_email, "wrong-password").status_code == 401
    assert LoginRateLimit.objects.get().failure_count == 2

    assert _login(client, "/api/v2/auth/login/", user.user_email, "TestPass123!").status_code == 200
    assert not LoginRateLimit.objects.exists()
    assert _login(client, "/api/v2/auth/login-with-jwt/", user.user_email, "wrong-password").status_code == 401
    assert LoginRateLimit.objects.get().failure_count == 1


@pytest.mark.django_db
def test_expired_lock_allows_login_and_accounts_do_not_affect_each_other():
    first = User.objects.create_user(user_email="first@example.com", password="TestPass123!")
    second = User.objects.create_user(user_email="second@example.com", password="TestPass123!")
    client = Client()

    for _ in range(MAX_FAILURES):
        _login(client, "/api/v2/auth/login/", first.user_email, "wrong-password")
    locked = LoginRateLimit.objects.get()
    locked.locked_until = timezone.now() - timedelta(seconds=1)
    locked.save(update_fields=["locked_until"])

    assert _login(client, "/api/v2/auth/login-with-jwt/", second.user_email, "wrong-password").status_code == 401
    assert _login(client, "/api/v2/auth/login/", first.user_email, "TestPass123!").status_code == 200
    assert LoginRateLimit.objects.filter().count() == 1
    assert LoginRateLimit.objects.get().failure_count == 1


@pytest.mark.django_db(transaction=True)
def test_concurrent_failures_cannot_bypass_the_database_lock():
    barrier = Barrier(MAX_FAILURES + 3)
    email = "parallel@example.com"

    def record_once() -> bool:
        close_old_connections()
        try:
            barrier.wait(timeout=10)
            return record_login_failure(email)
        finally:
            close_old_connections()

    with ThreadPoolExecutor(max_workers=MAX_FAILURES + 3) as executor:
        locked_results = list(executor.map(lambda _: record_once(), range(MAX_FAILURES + 3)))

    state = LoginRateLimit.objects.get()
    assert state.failure_count == MAX_FAILURES
    assert sum(locked_results) == 4
