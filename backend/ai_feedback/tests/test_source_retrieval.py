"""Model-discovered source URLs must never reach a private network, even via DNS rebinding."""

from __future__ import annotations

import socket

import pytest

from ai_feedback.source_retrieval import PublicWebSourceFetcher, SourceRetrievalError

PUBLIC = "93.184.216.34"
PRIVATE = "127.0.0.1"


def _answer(*addresses: str):
    return [
        (socket.AF_INET6 if ":" in address else socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, 443))
        for address in addresses
    ]


@pytest.fixture(autouse=True)
def _no_proxy(monkeypatch):
    # A configured proxy resolves the host itself and bypasses the pinned connection under test.
    for name in ("HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy", "ALL_PROXY", "all_proxy"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("NO_PROXY", "")


@pytest.fixture
def connections(monkeypatch):
    """Record every socket the HTTP client tries to open, and refuse to open any."""
    attempts: list[tuple] = []

    def refuse(address, *args, **kwargs):
        attempts.append(address)
        raise OSError("connection refused for the test")

    monkeypatch.setattr("urllib3.util.connection.create_connection", refuse)
    return attempts


def test_a_hostname_that_rebinds_to_a_private_address_is_never_connected(monkeypatch, connections):
    lookups = []

    def rebinding(host, port, *args, **kwargs):
        lookups.append(host)
        return _answer(PUBLIC if len(lookups) == 1 else PRIVATE)  # public for the check, private afterwards

    monkeypatch.setattr(socket, "getaddrinfo", rebinding)

    with pytest.raises(SourceRetrievalError):
        PublicWebSourceFetcher().fetch("https://rebind.example/page", query="anything")

    assert len(lookups) >= 2  # the check and the connection each resolved the name
    assert connections == []  # and nothing was ever connected to the private address


def test_the_socket_is_opened_to_the_verified_address_not_to_the_hostname(monkeypatch, connections):
    monkeypatch.setattr(socket, "getaddrinfo", lambda host, port, *a, **k: _answer(PUBLIC))

    with pytest.raises(SourceRetrievalError):
        PublicWebSourceFetcher().fetch("https://example.org/page", query="anything")

    assert connections == [(PUBLIC, 443)]


@pytest.mark.parametrize(
    "answers",
    [
        [PUBLIC, PRIVATE],  # one private answer taints the whole lookup
        ["10.0.0.5"],
        ["169.254.169.254"],  # cloud metadata
        ["::1"],
        ["::ffff:127.0.0.1"],
        ["fd00::1"],
    ],
)
def test_any_non_public_answer_blocks_the_connection(monkeypatch, connections, answers):
    calls = []

    def first_public_then(host, port, *args, **kwargs):
        calls.append(host)
        return _answer(PUBLIC) if len(calls) == 1 else _answer(*answers)

    monkeypatch.setattr(socket, "getaddrinfo", first_public_then)

    with pytest.raises(SourceRetrievalError):
        PublicWebSourceFetcher().fetch("https://example.org/page", query="anything")

    assert connections == []


@pytest.mark.parametrize(
    "url",
    [
        "http://example.org/page",  # not HTTPS
        "https://user:secret@example.org/page",  # embedded credentials
        "https://localhost/page",
        "https://printer.local/page",
        "https://service.internal/page",
        "https://127.0.0.1/page",  # a literal private address
        "https://[::1]/page",
    ],
)
def test_urls_that_are_not_public_https_are_rejected_before_any_lookup(monkeypatch, connections, url):
    monkeypatch.setattr(socket, "getaddrinfo", lambda *a, **k: _answer(PUBLIC))

    with pytest.raises(SourceRetrievalError):
        PublicWebSourceFetcher().fetch(url, query="anything")

    assert connections == []
