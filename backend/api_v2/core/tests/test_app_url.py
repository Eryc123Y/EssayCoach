"""Every emailed link uses one browser-facing origin, so links share the session's cookie host.

Run with: uv run pytest api_v2/core/tests/test_app_url.py -v
"""

import pytest
from django.core import mail

from core.app_url import DEFAULT_APP_URL, app_base_url
from core.email_change import issue_email_change
from core.models import User
from core.notifications import _send_email


def test_the_default_origin_is_the_documented_cookie_host(monkeypatch):
    monkeypatch.delenv("ESSAYCOACH_APP_URL", raising=False)

    assert app_base_url() == DEFAULT_APP_URL == "http://localhost:5100"


def test_a_configured_origin_wins_and_loses_its_trailing_slash(monkeypatch):
    monkeypatch.setenv("ESSAYCOACH_APP_URL", "https://essays.school.example/")

    assert app_base_url() == "https://essays.school.example"


def test_an_empty_setting_falls_back_to_the_default(monkeypatch):
    monkeypatch.setenv("ESSAYCOACH_APP_URL", "")

    assert app_base_url() == DEFAULT_APP_URL


@pytest.mark.django_db
def test_email_change_and_notification_links_share_the_origin(monkeypatch):
    monkeypatch.delenv("ESSAYCOACH_APP_URL", raising=False)
    user = User.objects.create_user(user_email="links@example.com", password="TestPass123!")

    issue_email_change(user, "links-new@example.com", "TestPass123!")
    _send_email(user, "Title", "Body", "/dashboard/tasks")

    verification, notice = mail.outbox[0].body, mail.outbox[1].body
    assert "http://localhost:5100/auth/verify-email#token=" in verification
    assert "http://localhost:5100/dashboard/tasks" in notice
    assert "127.0.0.1" not in verification + notice
