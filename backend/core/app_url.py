"""The browser-facing origin used in links that EssayCoach emails to people."""

from __future__ import annotations

import os

# `localhost`, not `127.0.0.1`: the local setup guide has people browse at this host so that the
# session cookie and the links in email share one cookie domain.
DEFAULT_APP_URL = "http://localhost:5100"


def app_base_url() -> str:
    return (os.environ.get("ESSAYCOACH_APP_URL") or DEFAULT_APP_URL).rstrip("/")
