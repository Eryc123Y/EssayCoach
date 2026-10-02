"""Persistent per-account login limiting shared by every Django worker."""

from __future__ import annotations

import math
from datetime import timedelta

from django.core.signing import salted_hmac
from django.db import IntegrityError, transaction
from django.utils import timezone

from core.models import LoginRateLimit

MAX_FAILURES = 5
FAILURE_WINDOW = timedelta(minutes=15)


class LoginRateLimitError(Exception):
    """Raised before password verification while the account remains locked."""

    def __init__(self, retry_after_seconds: int):
        self.retry_after_seconds = retry_after_seconds
        super().__init__("Too many login attempts. Please try again later.")


def _account_hash(email: str) -> str:
    normalized = email.strip().casefold()
    return salted_hmac("essaycoach.login-rate-limit", normalized).hexdigest()


def _locked_state(account_hash: str):
    """Return the row with a PostgreSQL row lock, creating it safely if needed."""
    state = LoginRateLimit.objects.select_for_update().filter(account_hash=account_hash).first()
    if state is not None:
        return state
    try:
        # A savepoint keeps the surrounding transaction usable when another
        # worker inserts the same account hash first.
        with transaction.atomic():
            return LoginRateLimit.objects.create(
                account_hash=account_hash,
                window_started_at=timezone.now(),
            )
    except IntegrityError:
        return LoginRateLimit.objects.select_for_update().get(account_hash=account_hash)


def _expire_if_needed(state: LoginRateLimit, now) -> bool:
    """Delete an expired lock or inactive failure window and report expiry."""
    expires_at = state.locked_until or state.window_started_at + FAILURE_WINDOW
    if expires_at > now:
        return False
    state.delete()
    return True


def assert_login_allowed(email: str, *, now=None) -> None:
    """Reject a currently locked account before running an expensive password hash."""
    now = now or timezone.now()
    with transaction.atomic():
        state = LoginRateLimit.objects.select_for_update().filter(account_hash=_account_hash(email)).first()
        if state is None or _expire_if_needed(state, now):
            return
        if state.locked_until and state.locked_until > now:
            seconds = max(1, math.ceil((state.locked_until - now).total_seconds()))
            raise LoginRateLimitError(seconds)


def record_login_failure(email: str, *, now=None) -> bool:
    """Persist one failed password check and return whether the account is locked."""
    now = now or timezone.now()
    account_hash = _account_hash(email)
    with transaction.atomic():
        state = _locked_state(account_hash)
        if _expire_if_needed(state, now):
            state = _locked_state(account_hash)
            state.window_started_at = now
        if state.locked_until and state.locked_until > now:
            return True
        if state.window_started_at + FAILURE_WINDOW <= now:
            state.failure_count = 0
            state.window_started_at = now
        state.failure_count += 1
        if state.failure_count >= MAX_FAILURES:
            state.locked_until = now + FAILURE_WINDOW
        state.save(update_fields=["failure_count", "window_started_at", "locked_until"])
        return state.locked_until is not None


def clear_login_failures(email: str) -> None:
    """Remove a prior failure window after successful interactive authentication."""
    with transaction.atomic():
        LoginRateLimit.objects.select_for_update().filter(account_hash=_account_hash(email)).delete()
