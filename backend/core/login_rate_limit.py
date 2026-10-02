"""Persistent login limiting shared by every Django worker.

Three independent failure counters share the ``LoginRateLimit`` table, each
stored under a salted HMAC so no email or address is kept in clear text:

* account + client: ``MAX_FAILURES`` failures lock that email for that client
  only, so a remote attacker cannot lock a user out of their own network.
* client: ``CLIENT_MAX_FAILURES`` failures across any emails block the client,
  which throttles password spraying. The ceiling is well above the account
  limit because campuses often share one NAT address.
* account: ``ACCOUNT_MAX_FAILURES`` failures from any clients lock the email.
  It bounds distributed guessing against one account (PRD 02 §3.4); locking a
  user out this way needs at least ``ACCOUNT_MAX_FAILURES / MAX_FAILURES``
  distinct clients.

Browser sign-ins reach Django through the Next.js route handler over loopback.
Unless that proxy sends X-Forwarded-For, they all share its address: the
account + client counter then acts as a plain per-account lock and the
client-wide counter is skipped (see ``LoginClient``).
"""

from __future__ import annotations

import ipaddress
import math
from dataclasses import dataclass
from datetime import timedelta

from django.conf import settings
from django.core.signing import salted_hmac
from django.db import IntegrityError, transaction
from django.http import HttpRequest
from django.utils import timezone

from core.models import LoginRateLimit

MAX_FAILURES = 5
CLIENT_MAX_FAILURES = 50
# PRD 02 §3.4: lock the account after 10 failed attempts within 15 minutes.
ACCOUNT_MAX_FAILURES = 10
FAILURE_WINDOW = timedelta(minutes=15)

# Requests from these peers may name the original client in X-Forwarded-For.
# The Next.js route handlers run beside Django and call it over loopback; they
# build their own header set, so a browser cannot inject this header through them.
DEFAULT_TRUSTED_PROXIES = ("127.0.0.1", "::1")
_HMAC_SALT = "essaycoach.login-rate-limit"


class LoginRateLimitError(Exception):
    """Raised before password verification while the account or client is locked."""

    def __init__(self, retry_after_seconds: int):
        self.retry_after_seconds = retry_after_seconds
        super().__init__("Too many login attempts. Please try again later.")


@dataclass(frozen=True)
class LoginClient:
    """The network identity login failures are attributed to."""

    address: str
    # True when a trusted proxy did not say who its client was. The address is
    # then the proxy's own and is shared by every user behind it, so the
    # client-wide spraying limit is skipped rather than blocking all sign-ins.
    unidentified_proxy_client: bool = False


def _parse_ip(raw: str) -> ipaddress.IPv4Address | ipaddress.IPv6Address | None:
    try:
        address = ipaddress.ip_address(raw.strip())
    except ValueError:
        return None
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped is not None:
        return address.ipv4_mapped
    return address


def _client_bucket(address: ipaddress.IPv4Address | ipaddress.IPv6Address) -> str:
    """Group IPv6 clients by /64, the usual single-subscriber allocation."""
    if isinstance(address, ipaddress.IPv6Address):
        return str(ipaddress.IPv6Network(f"{address}/64", strict=False))
    return str(address)


def _is_trusted_proxy(address: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    configured = getattr(settings, "LOGIN_RATE_LIMIT_TRUSTED_PROXIES", DEFAULT_TRUSTED_PROXIES)
    return any(address in ipaddress.ip_network(entry, strict=False) for entry in configured)


def login_client(request: HttpRequest) -> LoginClient:
    """Derive the client from REMOTE_ADDR, honoring X-Forwarded-For only from a trusted proxy."""
    peer = _parse_ip(request.META.get("REMOTE_ADDR", ""))
    if peer is None:
        return LoginClient("unknown")
    if not _is_trusted_proxy(peer):
        return LoginClient(_client_bucket(peer))
    # Only the right-most entry was written by the trusted hop; anything to its
    # left came from further away and may be forged.
    forwarded = _parse_ip(request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[-1])
    if forwarded is None:
        return LoginClient(_client_bucket(peer), unidentified_proxy_client=True)
    return LoginClient(_client_bucket(forwarded))


def _normalize_email(email: str) -> str:
    return email.strip().casefold()


def _limits(email: str, client: LoginClient) -> list[tuple[str, str, int]]:
    """Return (scope, row key, failure limit) in a fixed order so row locks cannot deadlock."""
    normalized = _normalize_email(email)
    limits = [
        (
            "account-client",
            salted_hmac(_HMAC_SALT, f"account-client\0{normalized}\0{client.address}").hexdigest(),
            MAX_FAILURES,
        ),
    ]
    if not client.unidentified_proxy_client:
        limits.append(("client", salted_hmac(_HMAC_SALT, f"client\0{client.address}").hexdigest(), CLIENT_MAX_FAILURES))
    # The account-wide key keeps the original per-email format so rows written
    # before client-aware limiting continue to count instead of being orphaned.
    limits.append(("account", salted_hmac(_HMAC_SALT, normalized).hexdigest(), ACCOUNT_MAX_FAILURES))
    return limits


def _locked_state(key: str) -> LoginRateLimit:
    """Return the row with a PostgreSQL row lock, creating it safely if needed."""
    state = LoginRateLimit.objects.select_for_update().filter(account_hash=key).first()
    if state is not None:
        return state
    try:
        # A savepoint keeps the surrounding transaction usable when another
        # worker inserts the same key first.
        with transaction.atomic():
            return LoginRateLimit.objects.create(account_hash=key, window_started_at=timezone.now())
    except IntegrityError:
        return LoginRateLimit.objects.select_for_update().get(account_hash=key)


def _expire_if_needed(state: LoginRateLimit, now) -> bool:
    """Delete an expired lock or inactive failure window and report expiry."""
    expires_at = state.locked_until or state.window_started_at + FAILURE_WINDOW
    if expires_at > now:
        return False
    state.delete()
    return True


def _record_failure(key: str, limit: int, now) -> bool:
    state = _locked_state(key)
    if _expire_if_needed(state, now):
        state = _locked_state(key)
        state.window_started_at = now
    if state.locked_until and state.locked_until > now:
        return True
    if state.window_started_at + FAILURE_WINDOW <= now:
        state.failure_count = 0
        state.window_started_at = now
    state.failure_count += 1
    if state.failure_count >= limit:
        state.locked_until = now + FAILURE_WINDOW
    state.save(update_fields=["failure_count", "window_started_at", "locked_until"])
    return state.locked_until is not None


def assert_login_allowed(email: str, client: LoginClient, *, now=None) -> None:
    """Reject a locked account/client pair, client or account before hashing a password."""
    now = now or timezone.now()
    retry_after = 0
    with transaction.atomic():
        for _scope, key, _limit in _limits(email, client):
            state = LoginRateLimit.objects.select_for_update().filter(account_hash=key).first()
            if state is None or _expire_if_needed(state, now):
                continue
            if state.locked_until and state.locked_until > now:
                retry_after = max(retry_after, math.ceil((state.locked_until - now).total_seconds()))
    if retry_after:
        raise LoginRateLimitError(max(1, retry_after))


def record_login_failure(email: str, client: LoginClient, *, now=None) -> bool:
    """Persist one failed sign-in on every counter and return whether any is now locked."""
    now = now or timezone.now()
    with transaction.atomic():
        locked = [_record_failure(key, limit, now) for _scope, key, limit in _limits(email, client)]
    return any(locked)


def clear_login_failures(email: str, client: LoginClient) -> None:
    """Reset the account counters after a successful interactive sign-in.

    The client-wide counter is deliberately kept: otherwise a sprayer could
    reset it by signing in to an account of their own between guesses.
    """
    with transaction.atomic():
        # Delete one row at a time in _limits order, matching the lock order
        # used by record_login_failure.
        for scope, key, _limit in _limits(email, client):
            if scope != "client":
                LoginRateLimit.objects.select_for_update().filter(account_hash=key).delete()
