"""Independent, bounded source retrieval for practice fact checks."""

from __future__ import annotations

import socket
from dataclasses import dataclass
from datetime import UTC, datetime
from html import unescape
from html.parser import HTMLParser
from ipaddress import ip_address
from urllib.parse import quote, urljoin, urlparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.connection import HTTPSConnection
from urllib3.connectionpool import HTTPSConnectionPool
from urllib3.exceptions import NameResolutionError, NewConnectionError
from urllib3.util import connection as urllib3_connection


class SourceRetrievalError(RuntimeError):
    pass


class _PublicOnlyHTTPSConnection(HTTPSConnection):
    """Open the socket only to addresses this connection resolved and verified as public.

    Validating a hostname and then letting the HTTP client resolve it again leaves a gap: a
    hostname that answers with a public address for the check and a private one for the
    connection (DNS rebinding) would reach the local network. Here the name is resolved once,
    every answer must be a global address, and the socket is opened to that literal address.
    TLS still verifies the certificate against the original hostname.
    """

    def _new_conn(self):
        try:
            answers = socket.getaddrinfo(self._dns_host, self.port, type=socket.SOCK_STREAM)
        except socket.gaierror as exc:
            raise NameResolutionError(self.host, self, exc) from exc
        addresses = [item[4][0] for item in answers]
        if not addresses or any(not ip_address(address.split("%")[0]).is_global for address in addresses):
            raise NewConnectionError(self, "Source host does not resolve to public IP addresses")
        failure: OSError | None = None
        for address in addresses:
            try:
                return urllib3_connection.create_connection(
                    (address, self.port),
                    self.timeout,
                    source_address=self.source_address,
                    socket_options=self.socket_options,
                )
            except OSError as exc:
                failure = exc
        raise NewConnectionError(self, f"Failed to establish a new connection: {failure}")


class _PublicOnlyHTTPSConnectionPool(HTTPSConnectionPool):
    # urllib3's own HTTPSConnection does not satisfy its BaseHTTPSConnection protocol, so any subclass is flagged.
    ConnectionCls = _PublicOnlyHTTPSConnection  # pyright: ignore[reportAssignmentType]


class _PublicOnlyAdapter(HTTPAdapter):
    """Direct HTTPS requests use the address-pinning connection. A configured proxy resolves the
    host itself, so requests sent through one keep the earlier hostname check only."""

    def init_poolmanager(self, *args, **kwargs):
        super().init_poolmanager(*args, **kwargs)
        self.poolmanager.pool_classes_by_scheme = {
            **self.poolmanager.pool_classes_by_scheme,
            "https": _PublicOnlyHTTPSConnectionPool,
        }


@dataclass(frozen=True)
class RetrievedSource:
    title: str
    url: str
    excerpt: str
    retrieved_at: datetime
    query: str


class WikimediaSourceSearch:
    """Search Wikipedia and fetch article text separately from the model."""

    USER_AGENT = "EssayCoachLocal/0.1 (private educational prototype)"

    def __init__(self, *, timeout_seconds: float = 10.0) -> None:
        self.timeout_seconds = timeout_seconds

    def search(self, query: str, *, language: str = "en", limit: int = 2) -> list[RetrievedSource]:
        if language not in {"en", "zh"}:
            language = "en"
        query = query.strip()[:200]
        if not query:
            return []
        limit = max(1, min(limit, 3))
        endpoint = f"https://{language}.wikipedia.org/w/api.php"
        try:
            search = requests.get(
                endpoint,
                params={
                    "action": "query", "list": "search", "srsearch": query,
                    "srlimit": limit, "format": "json",
                },
                headers={"User-Agent": self.USER_AGENT},
                timeout=self.timeout_seconds,
            )
            search.raise_for_status()
            hits = search.json().get("query", {}).get("search", [])[:limit]
            sources = []
            for hit in hits:
                hit_title = hit.get("title")
                if not isinstance(hit_title, str):
                    continue
                article_path = quote(hit_title.replace(" ", "_"))
                summary_url = f"https://{language}.wikipedia.org/api/rest_v1/page/summary/{article_path}"
                page = requests.get(
                    summary_url,
                    headers={"User-Agent": self.USER_AGENT},
                    timeout=self.timeout_seconds,
                )
                page.raise_for_status()
                article = page.json()
                title = article.get("title")
                excerpt = article.get("extract")
                if not isinstance(title, str) or not isinstance(excerpt, str) or not excerpt.strip():
                    continue
                sources.append(
                    RetrievedSource(
                        title=title,
                        url=f"https://{language}.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}",
                        excerpt=excerpt.strip()[:4000],
                        retrieved_at=datetime.now(UTC),
                        query=query,
                    )
                )
            return sources
        except (requests.RequestException, ValueError, KeyError, TypeError) as exc:
            raise SourceRetrievalError("Source search or retrieval failed") from exc


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hidden_depth = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript", "nav", "footer", "header"}:
            self.hidden_depth += 1
        if tag in {"p", "div", "section", "article", "h1", "h2", "h3", "li", "br"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript", "nav", "footer", "header"} and self.hidden_depth:
            self.hidden_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self.hidden_depth:
            self.parts.append(data)


class PublicWebSourceFetcher:
    """Fetch a model-discovered public HTTPS page before it can count as evidence."""

    USER_AGENT = "EssayCoachLocal/0.1 (private educational prototype)"

    def __init__(self, *, timeout_seconds: float = 10.0) -> None:
        self.timeout_seconds = timeout_seconds

    @staticmethod
    def _public_url(url: str) -> str:
        parsed = urlparse(url)
        hostname = parsed.hostname
        if parsed.scheme != "https" or not hostname or parsed.username or parsed.password:
            raise SourceRetrievalError("Only public HTTPS sources can be fetched")
        if hostname == "localhost" or hostname.endswith((".local", ".internal")):
            raise SourceRetrievalError("Local source URLs are not allowed")
        try:
            addresses = [ip_address(hostname)]
        except ValueError:
            try:
                addresses = [ip_address(item[4][0]) for item in socket.getaddrinfo(hostname, None)]
            except OSError as exc:
                raise SourceRetrievalError("Source hostname could not be resolved") from exc
        if not addresses or any(not address.is_global for address in addresses):
            raise SourceRetrievalError("Source URL does not resolve to public IP addresses")
        return url

    def fetch(self, url: str, *, query: str) -> RetrievedSource:
        current = self._public_url(url)
        session = requests.Session()
        session.mount("https://", _PublicOnlyAdapter())
        try:
            for _ in range(3):
                response = session.get(
                    current, headers={"User-Agent": self.USER_AGENT}, timeout=self.timeout_seconds,
                    stream=True, allow_redirects=False,
                )
                if response.status_code in {301, 302, 303, 307, 308}:
                    target = response.headers.get("Location")
                    response.close()
                    if not target:
                        raise SourceRetrievalError("Source redirect had no target")
                    current = self._public_url(urljoin(current, target))
                    continue
                response.raise_for_status()
                content_type = response.headers.get("Content-Type", "").lower()
                if not any(kind in content_type for kind in ("text/html", "text/plain")):
                    raise SourceRetrievalError("Source is not an HTML or text page")
                chunks = []
                byte_count = 0
                for chunk in response.iter_content(16384):
                    byte_count += len(chunk)
                    if byte_count > 512000:
                        break
                    chunks.append(chunk)
                response.close()
                raw = b"".join(chunks).decode(response.encoding or "utf-8", errors="replace")
                if "text/html" in content_type:
                    parser = _TextExtractor()
                    parser.feed(raw)
                    raw = " ".join(" ".join(parser.parts).split())
                else:
                    raw = " ".join(unescape(raw).split())
                if len(raw) < 80:
                    raise SourceRetrievalError("Source page had no useful text")
                words = [word.lower() for word in query.split() if len(word) > 3]
                windows = []
                lowered = raw.lower()
                for word in words[:8]:
                    index = lowered.find(word)
                    if index >= 0:
                        windows.append(raw[max(0, index - 600):index + 1300])
                excerpt = " ... ".join(dict.fromkeys(windows))[:8000] if windows else raw[:8000]
                return RetrievedSource(
                    title=urlparse(current).hostname or "Public source", url=current,
                    excerpt=excerpt, retrieved_at=datetime.now(UTC), query=query,
                )
            raise SourceRetrievalError("Source redirected too many times")
        except requests.RequestException as exc:
            raise SourceRetrievalError("Source page could not be fetched") from exc
        finally:
            session.close()
