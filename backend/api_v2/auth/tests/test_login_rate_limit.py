from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier

import pytest
from django.db import close_old_connections
from django.test import Client
from django.utils import timezone

from core import login_rate_limit
from core.login_rate_limit import ACCOUNT_MAX_FAILURES, MAX_FAILURES, LoginClient, login_client, record_login_failure
from core.models import LoginRateLimit, User

# Django's test client reports REMOTE_ADDR 127.0.0.1 without X-Forwarded-For,
# i.e. a trusted proxy that did not identify its client.
PROXY_CLIENT = LoginClient("127.0.0.1", unidentified_proxy_client=True)


def _login(client: Client, path: str, email: str, password: str, **extra):
    return client.post(path, {"email": email, "password": password}, content_type="application/json", **extra)


def _login_from(ip: str, email: str, password: str):
    """Sign in as a client reaching Django directly from ``ip``."""
    return _login(Client(REMOTE_ADDR=ip), "/api/v2/auth/login/", email, password)


def _failure_counts() -> set[int]:
    return set(LoginRateLimit.objects.values_list("failure_count", flat=True))


@pytest.mark.django_db
def test_login_endpoints_share_a_per_account_failure_limit():
    user = User.objects.create_user(user_email="limit@example.com", password="TestPass123!")
    client = Client()
    paths = ["/api/v2/auth/login/", "/api/v2/auth/login-with-jwt/"]

    responses = [_login(client, paths[index % 2], user.user_email, "wrong-password") for index in range(MAX_FAILURES)]

    assert [response.status_code for response in responses[:-1]] == [401] * (MAX_FAILURES - 1)
    assert responses[-1].status_code == 429
    assert _login(client, paths[0], user.user_email, "TestPass123!").status_code == 429
    states = list(LoginRateLimit.objects.all())
    # Account+client and account-wide rows; an unidentified proxy client gets no client-wide row.
    assert len(states) == 2
    assert {state.failure_count for state in states} == {MAX_FAILURES}
    assert all(user.user_email not in state.account_hash for state in states)


@pytest.mark.django_db
def test_successful_login_resets_prior_failures_for_both_login_endpoints():
    user = User.objects.create_user(user_email="reset@example.com", password="TestPass123!")
    client = Client()

    assert _login(client, "/api/v2/auth/login/", user.user_email, "wrong-password").status_code == 401
    assert _login(client, "/api/v2/auth/login-with-jwt/", user.user_email, "wrong-password").status_code == 401
    assert _failure_counts() == {2}

    assert _login(client, "/api/v2/auth/login/", user.user_email, "TestPass123!").status_code == 200
    assert not LoginRateLimit.objects.exists()
    assert _login(client, "/api/v2/auth/login-with-jwt/", user.user_email, "wrong-password").status_code == 401
    assert _failure_counts() == {1}


@pytest.mark.django_db
def test_expired_lock_allows_login_and_accounts_do_not_affect_each_other():
    first = User.objects.create_user(user_email="first@example.com", password="TestPass123!")
    second = User.objects.create_user(user_email="second@example.com", password="TestPass123!")
    client = Client()

    for _ in range(MAX_FAILURES):
        _login(client, "/api/v2/auth/login/", first.user_email, "wrong-password")
    LoginRateLimit.objects.update(locked_until=timezone.now() - timedelta(seconds=1))

    assert _login(client, "/api/v2/auth/login-with-jwt/", second.user_email, "wrong-password").status_code == 401
    assert _login(client, "/api/v2/auth/login/", first.user_email, "TestPass123!").status_code == 200
    assert LoginRateLimit.objects.count() == 2
    assert _failure_counts() == {1}


@pytest.mark.django_db(transaction=True)
def test_concurrent_failures_cannot_bypass_the_database_lock():
    barrier = Barrier(MAX_FAILURES + 3)
    email = "parallel@example.com"

    def record_once() -> bool:
        close_old_connections()
        try:
            barrier.wait(timeout=10)
            return record_login_failure(email, PROXY_CLIENT)
        finally:
            close_old_connections()

    with ThreadPoolExecutor(max_workers=MAX_FAILURES + 3) as executor:
        locked_results = list(executor.map(lambda _: record_once(), range(MAX_FAILURES + 3)))

    # The account+client row stops counting once locked; the account-wide row
    # keeps counting toward its higher ceiling. Neither loses an update.
    assert _failure_counts() == {MAX_FAILURES, MAX_FAILURES + 3}
    assert sum(locked_results) == 4


@pytest.mark.django_db
def test_lockout_from_one_client_does_not_lock_the_account_for_another_client():
    user = User.objects.create_user(user_email="victim@example.com", password="TestPass123!")

    responses = [_login_from("203.0.113.10", user.user_email, "wrong-password") for _ in range(MAX_FAILURES)]

    assert responses[-1].status_code == 429
    assert _login_from("203.0.113.10", user.user_email, "TestPass123!").status_code == 429
    assert _login_from("198.51.100.20", user.user_email, "TestPass123!").status_code == 200


@pytest.mark.django_db
def test_client_wide_limit_throttles_password_spraying(monkeypatch):
    monkeypatch.setattr(login_rate_limit, "CLIENT_MAX_FAILURES", 6)
    user = User.objects.create_user(user_email="sprayed@example.com", password="TestPass123!")

    statuses = [
        _login_from("203.0.113.30", f"target{index}@example.com", "Spring2026!").status_code for index in range(6)
    ]

    assert statuses == [401] * 5 + [429]
    assert _login_from("203.0.113.30", user.user_email, "TestPass123!").status_code == 429
    assert _login_from("198.51.100.30", user.user_email, "TestPass123!").status_code == 200


@pytest.mark.django_db
def test_successful_login_does_not_reset_the_client_wide_counter(monkeypatch):
    monkeypatch.setattr(login_rate_limit, "CLIENT_MAX_FAILURES", 4)
    own = User.objects.create_user(user_email="own@example.com", password="TestPass123!")

    for index in range(3):
        assert _login_from("203.0.113.40", f"other{index}@example.com", "guess").status_code == 401
    assert _login_from("203.0.113.40", own.user_email, "TestPass123!").status_code == 200

    assert _login_from("203.0.113.40", "other9@example.com", "guess").status_code == 429


@pytest.mark.django_db
def test_account_wide_ceiling_spans_clients():
    user = User.objects.create_user(user_email="distributed@example.com", password="TestPass123!")

    for index in range(ACCOUNT_MAX_FAILURES // MAX_FAILURES):
        for _ in range(MAX_FAILURES):
            _login_from(f"203.0.113.{100 + index}", user.user_email, "wrong-password")

    assert _login_from("198.51.100.50", user.user_email, "TestPass123!").status_code == 429


@pytest.mark.django_db
def test_unidentified_proxy_clients_are_not_blocked_by_the_client_wide_limit(monkeypatch):
    monkeypatch.setattr(login_rate_limit, "CLIENT_MAX_FAILURES", 3)
    user = User.objects.create_user(user_email="proxied@example.com", password="TestPass123!")
    proxy = Client(REMOTE_ADDR="127.0.0.1")

    for index in range(4):
        assert _login(proxy, "/api/v2/auth/login/", f"someone{index}@example.com", "guess").status_code == 401
    assert _login(proxy, "/api/v2/auth/login/", user.user_email, "TestPass123!").status_code == 200


@pytest.mark.django_db
def test_forwarded_client_is_trusted_only_from_a_loopback_proxy():
    user = User.objects.create_user(user_email="forwarded@example.com", password="TestPass123!")
    proxy = Client(REMOTE_ADDR="127.0.0.1")
    direct = Client(REMOTE_ADDR="203.0.113.60")
    path = "/api/v2/auth/login/"

    # Behind the loopback proxy only the right-most forwarded entry identifies the client.
    for _ in range(MAX_FAILURES):
        _login(proxy, path, user.user_email, "wrong", HTTP_X_FORWARDED_FOR="203.0.113.62, 203.0.113.61")
    assert _login(proxy, path, user.user_email, "TestPass123!", HTTP_X_FORWARDED_FOR="203.0.113.61").status_code == 429
    assert _login(proxy, path, user.user_email, "TestPass123!", HTTP_X_FORWARDED_FOR="203.0.113.62").status_code == 200

    # A direct client cannot rotate its identity with a forged header.
    for index in range(MAX_FAILURES):
        _login(direct, path, user.user_email, "wrong", HTTP_X_FORWARDED_FOR=f"198.51.100.{index}")
    spoofed = _login(direct, path, user.user_email, "TestPass123!", HTTP_X_FORWARDED_FOR="198.51.100.99")
    assert spoofed.status_code == 429


def test_login_client_groups_ipv6_by_prefix_and_unwraps_mapped_ipv4(rf):
    first = login_client(rf.post("/", REMOTE_ADDR="2001:db8:1:2::10"))
    second = login_client(rf.post("/", REMOTE_ADDR="2001:db8:1:2:ffff::1"))
    mapped = login_client(rf.post("/", REMOTE_ADDR="::ffff:203.0.113.7"))
    proxied = login_client(rf.post("/", REMOTE_ADDR="::1"))
    forged = login_client(rf.post("/", REMOTE_ADDR="::1", HTTP_X_FORWARDED_FOR="not-an-ip"))

    assert first == second == LoginClient("2001:db8:1:2::/64")
    assert mapped == LoginClient("203.0.113.7")
    assert proxied.unidentified_proxy_client
    assert forged.unidentified_proxy_client


@pytest.mark.django_db
@pytest.mark.parametrize("deactivation", ["is_active", "suspended"])
def test_inactive_accounts_answer_like_a_wrong_password(deactivation):
    user = User.objects.create_user(user_email="inactive@example.com", password="TestPass123!")
    if deactivation == "is_active":
        user.is_active = False
    else:
        user.user_status = "suspended"
    user.save()
    client = Client(REMOTE_ADDR="203.0.113.70")
    path = "/api/v2/auth/login/"

    right = _login(client, path, user.user_email, "TestPass123!")
    wrong = _login(client, path, user.user_email, "wrong-password")
    unknown = _login(client, path, "nobody@example.com", "TestPass123!")

    assert right.status_code == wrong.status_code == unknown.status_code == 401
    assert right.json() == wrong.json() == unknown.json()

    # A correct password still counts as a failure, so lockout timing reveals nothing either.
    statuses = [_login(client, path, user.user_email, "TestPass123!").status_code for _ in range(MAX_FAILURES - 2)]
    assert statuses == [401] * (MAX_FAILURES - 3) + [429]
