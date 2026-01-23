"""AI-powered rubric parser using SiliconFlow DeepSeek API."""

from __future__ import annotations

import json
import logging
import os
import time
from typing import TYPE_CHECKING, Any

import PyPDF2
import requests
from django.conf import settings

if TYPE_CHECKING:
    from django.core.files.uploadedfile import UploadedFile

logger = logging.getLogger(__name__)


def _agent_debug_log(
    hypothesis_id: str,
    location: str,
    message: str,
    data: dict[str, Any],
) -> None:
    payload = {
        "hypothesis_id": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    logger.info("[AI_DEBUG] %s", json.dumps(payload, ensure_ascii=False))


class RubricParseError(Exception):
    """Raised when rubric parsing fails."""

    pass


class SiliconFlowRubricParser:
    """Parse rubric PDFs using SiliconFlow DeepSeek v3.2 AI model.

    This class extracts text from PDF files and uses AI to detect whether
    the PDF contains a rubric, then parses its structure into a standardized format.
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.SILICONFLOW_API_KEY
        self.api_url = settings.SILICONFLOW_API_URL
        self.model = settings.SILICONFLOW_MODEL

        # region agent log
        _agent_debug_log(
            "H1",
            "rubric_parser.py:__init__",
            "SiliconFlow config loaded",
            {
                "api_url": self.api_url,
                "model": self.model,
                "has_api_key": bool(self.api_key),
                "https_proxy_set": bool(os.environ.get("HTTPS_PROXY")),
                "http_proxy_set": bool(os.environ.get("HTTP_PROXY")),
                "no_proxy_set": bool(os.environ.get("NO_PROXY")),
            },
        )
        # endregion

        if not self.api_key:
            raise ValueError("SILICONFLOW_API_KEY is required")

        if "your-siliconflow-api-key" in self.api_key:
            raise ValueError(
                "SILICONFLOW_API_KEY is not configured (contains placeholder)"
            )

    def extract_text_from_pdf(self, pdf_file: UploadedFile) -> str:
        """Extract text content from uploaded PDF file.

        Args:
            pdf_file: Django UploadedFile object containing PDF data

        Returns:
            Extracted text from all pages concatenated

        Raises:
            RubricParseError: If PDF reading fails
        """
        try:
            # region agent log
            _agent_debug_log(
                "H7",
                "rubric_parser.py:extract_text_from_pdf:entry",
                "Starting PDF text extraction",
                {
                    "filename": getattr(pdf_file, "name", None),
                    "content_type": getattr(pdf_file, "content_type", None),
                    "size": getattr(pdf_file, "size", None),
                },
            )
            # endregion
            logger.info(f"Extracting text from PDF: {pdf_file.name}")
            pdf_reader = PyPDF2.PdfReader(pdf_file)

            text_parts = []
            for page_num, page in enumerate(pdf_reader.pages):
                text = page.extract_text()
                if text:
                    text_parts.append(text)
                    logger.debug(
                        f"Extracted {len(text)} chars from page {page_num + 1}"
                    )

            full_text = "\n\n".join(text_parts)
            logger.info(
                f"Total extracted text: {len(full_text)} characters from {len(text_parts)} pages"
            )

            # region agent log
            _agent_debug_log(
                "H7",
                "rubric_parser.py:extract_text_from_pdf:success",
                "PDF text extraction complete",
                {"text_length": len(full_text), "pages": len(text_parts)},
            )
            # endregion
            return full_text

        except Exception as e:
            # region agent log
            _agent_debug_log(
                "H8",
                "rubric_parser.py:extract_text_from_pdf:exception",
                "PDF text extraction failed",
                {"error_type": type(e).__name__, "error_message": str(e)},
            )
            # endregion
            logger.error(f"Failed to extract text from PDF: {e}")
            raise RubricParseError(f"PDF text extraction failed: {e}") from e

    def parse_pdf_text(self, text: str) -> dict[str, Any]:
        """Parse rubric structure from extracted PDF text using AI.

        Args:
            text: Extracted PDF text content

        Returns:
            Dictionary with structure:
            {
              "is_rubric": bool,
              "confidence": float,
              "rubric_name": str,
              "dimensions": [
                {
                  "name": str,
                  "weight": float,
                  "levels": [
                    {"name": str, "score_min": int, "score_max": int, "description": str},
                    ...
                  ]
                },
                ...
              ],
              "reason": str (if is_rubric=false)
            }

        Raises:
            RubricParseError: If API call fails or returns invalid data
        """
        # region agent log
        _agent_debug_log(
            "H10",
            "rubric_parser.py:parse_pdf_text:entry",
            "Entered parse_pdf_text",
            {"text_length": len(text)},
        )
        # endregion
        system_prompt = (
            """You are a rubric analysis expert. Analyze the following PDF text """
            """and determine if it's a marking rubric.

If it IS a rubric, extract its structure in this EXACT JSON format:
{
  "is_rubric": true,
  "confidence": 0.95,
  "rubric_name": "Essay Writing Rubric",
  "dimensions": [
    {
      "name": "Content & Analysis",
      "weight": 40.0,
      "levels": [
        {
          "name": "Excellent",
          "score_min": 36,
          "score_max": 40,
          "description": "Demonstrates exceptional understanding..."
        }
      ]
    }
  ]
}

If it is NOT a rubric (e.g., essay, article, report):
{
  "is_rubric": false,
  "confidence": 0.90,
  "reason": "This appears to be an essay/article/etc., not a rubric"
}

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no explanations outside JSON
2. Ensure weights are numbers (not strings), scores are integers
3. Ensure all JSON is complete (no truncation)
4. Weights should sum to approximately 100 (allow 99-101 for rounding)
5. Score ranges must be non-overlapping and contiguous
6. IMPORTANT: score_min must be STRICTLY LESS THAN score_max (e.g., 36-40 is valid, 0-0 is INVALID)
7. If document structure is unclear, set is_rubric=false"""
        )

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"PDF Text:\n\n{text}"},
            ],
            "temperature": 0.1,
            "max_tokens": 4096,
            "enable_thinking": False,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Configure retry strategy
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry

        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST"],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session = requests.Session()
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        session.trust_env = False
        proxies: dict[str, str] = {}

        # region agent log
        _agent_debug_log(
            "H20",
            "rubric_parser.py:parse_pdf_text:ssl_config",
            "SSL configuration",
            {
                "trust_env": session.trust_env,
                "session_verify": session.verify
                if hasattr(session, "verify")
                else None,
                "proxies_configured": False,
                "proxies": {},
            },
        )
        # endregion

        try:
            # region agent log
            _agent_debug_log(
                "H5",
                "rubric_parser.py:parse_pdf_text:tls_context",
                "Requests version",
                {"requests_version": requests.__version__},
            )
            # endregion
            # region agent log
            _agent_debug_log(
                "H6",
                "rubric_parser.py:parse_pdf_text:dns_lookup",
                "Skipping DNS lookup (proxy disabled)",
                {"host": "api.siliconflow.cn"},
            )
            # endregion
            # region agent log
            _agent_debug_log(
                "H2",
                "rubric_parser.py:parse_pdf_text:pre_request",
                "Preparing SiliconFlow request",
                {
                    "api_url": self.api_url,
                    "model": self.model,
                    "text_length": len(text),
                    "timeout_seconds": 180,
                },
            )
            # endregion
            logger.info(f"Calling SiliconFlow API with {len(text)} chars of text")

            # region agent log
            _agent_debug_log(
                "H12",
                "rubric_parser.py:parse_pdf_text:pre_post",
                "About to make POST request",
                {
                    "url": self.api_url,
                    "proxies": session.proxies if hasattr(session, "proxies") else {},
                    "headers_keys": list(headers.keys()),
                    "payload_size": len(json.dumps(payload)),
                },
            )
            # endregion

            try:
                # region agent log
                _agent_debug_log(
                    "H17",
                    "rubric_parser.py:parse_pdf_text:pre_post_call",
                    "About to call session.post",
                    {
                        "url": self.api_url,
                        "has_proxies": bool(session.proxies),
                        "proxies": dict(session.proxies)
                        if hasattr(session, "proxies")
                        else {},
                        "session_verify": session.verify
                        if hasattr(session, "verify")
                        else None,
                        "env_https_proxy": os.environ.get("HTTPS_PROXY"),
                        "env_http_proxy": os.environ.get("HTTP_PROXY"),
                        "env_socks_proxy": os.environ.get("SOCKS_PROXY"),
                    },
                )
                # endregion
                # CRITICAL FIX: Ensure HTTPS_PROXY uses http:// protocol, not https://
                # When using HTTP proxy for HTTPS connections, the entry protocol (client->proxy)
                # must be HTTP, not HTTPS. The proxy handles the CONNECT method for HTTPS tunneling.
                # If HTTPS_PROXY is set to https://, requests will try to establish TLS
                # with the proxy, which most proxies (including Clash) don't support,
                # causing SSLEOFError.
                response = session.post(
                    self.api_url, headers=headers, json=payload, timeout=180
                )
                # region agent log
                _agent_debug_log(
                    "H13",
                    "rubric_parser.py:parse_pdf_text:post_success",
                    "POST request completed",
                    {
                        "status_code": response.status_code,
                        "response_size": len(response.content)
                        if hasattr(response, "content")
                        else 0,
                    },
                )
                # endregion
            except requests.exceptions.SSLError as ssl_err:
                # region agent log
                _agent_debug_log(
                    "H14",
                    "rubric_parser.py:parse_pdf_text:ssl_error_detail",
                    "SSL error details",
                    {
                        "error_type": type(ssl_err).__name__,
                        "error_message": str(ssl_err),
                        "error_args": ssl_err.args if hasattr(ssl_err, "args") else [],
                        "proxies_used": session.proxies
                        if hasattr(session, "proxies")
                        else {},
                        "ssl_error_class": str(type(ssl_err)),
                        "ssl_error_repr": repr(ssl_err),
                    },
                )
                # endregion
                raise
            except requests.exceptions.ConnectionError as conn_err:
                # region agent log
                _agent_debug_log(
                    "H19",
                    "rubric_parser.py:parse_pdf_text:connection_error_detail",
                    "Connection error details",
                    {
                        "error_type": type(conn_err).__name__,
                        "error_message": str(conn_err),
                        "error_class": str(type(conn_err)),
                        "error_repr": repr(conn_err),
                        "proxies_used": {},
                    },
                )
                # endregion
                raise
            except Exception as unexpected_err:
                # region agent log
                _agent_debug_log(
                    "H18",
                    "rubric_parser.py:parse_pdf_text:unexpected_exception",
                    "Unexpected exception during POST request",
                    {
                        "error_type": type(unexpected_err).__name__,
                        "error_message": str(unexpected_err),
                        "error_class": str(type(unexpected_err)),
                        "error_repr": repr(unexpected_err),
                        "is_request_exception": isinstance(
                            unexpected_err, requests.exceptions.RequestException
                        ),
                        "is_ssl_error": isinstance(
                            unexpected_err, requests.exceptions.SSLError
                        ),
                        "is_proxy_error": isinstance(
                            unexpected_err, requests.exceptions.ProxyError
                        ),
                    },
                )
                # endregion
                raise

            response.raise_for_status()

            # region agent log
            _agent_debug_log(
                "H3",
                "rubric_parser.py:parse_pdf_text:post_request",
                "SiliconFlow response received",
                {
                    "status_code": response.status_code,
                    "content_type": response.headers.get("content-type"),
                },
            )
            # endregion
            result = response.json()
            logger.debug(f"API response: {json.dumps(result, indent=2)[:500]}")

            if "choices" not in result or len(result["choices"]) == 0:
                raise RubricParseError("API returned no choices")

            content = result["choices"][0]["message"]["content"]

            if not content or content.strip() == "":
                raise RubricParseError("API returned empty content")

            parsed_data = json.loads(content)
            logger.info(
                f"Successfully parsed rubric structure: is_rubric={parsed_data.get('is_rubric')}"
            )

            return parsed_data

        except requests.exceptions.RequestException as e:
            # region agent log
            _agent_debug_log(
                "H4",
                "rubric_parser.py:parse_pdf_text:request_exception",
                "SiliconFlow request exception",
                {
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "error_class": str(type(e)),
                    "error_repr": repr(e),
                    "proxies_configured": bool(proxies),
                    "proxies_dict": dict(proxies) if proxies else {},
                    "is_ssl_error": isinstance(e, requests.exceptions.SSLError),
                    "is_proxy_error": isinstance(e, requests.exceptions.ProxyError),
                    "is_connection_error": isinstance(
                        e, requests.exceptions.ConnectionError
                    ),
                },
            )
            # endregion
            logger.error(f"SiliconFlow API request failed: {e}")

            # Provide helpful error message based on error type
            error_msg = f"AI API call failed: {e}"
            if isinstance(e, requests.exceptions.SSLError):
                error_msg += (
                    "\n\nThis may be caused by network/proxy issues. "
                    "If you're using a proxy (e.g., Clash), ensure HTTPS_PROXY or HTTP_PROXY "
                    "environment variables are set correctly, or configure your proxy to allow "
                    "connections to api.siliconflow.ai"
                )
            elif isinstance(e, requests.exceptions.ConnectionError):
                error_msg += (
                    "\n\nConnection failed. Please check your network connection and DNS settings. "
                    "If you're behind a proxy, ensure proxy environment variables are configured."
                )

            raise RubricParseError(error_msg) from e
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            raise RubricParseError(f"AI returned invalid JSON: {e}") from e
        except KeyError as e:
            logger.error(f"Unexpected API response structure: {e}")
            raise RubricParseError(f"Unexpected API response: {e}") from e

    def parse_pdf(self, pdf_file: UploadedFile) -> dict[str, Any]:
        """Main entry point: extract text and parse rubric structure.

        Args:
            pdf_file: Django UploadedFile object

        Returns:
            Parsed rubric structure (see parse_pdf_text for format)

        Raises:
            RubricParseError: If extraction or parsing fails
        """
        # region agent log
        _agent_debug_log(
            "H9",
            "rubric_parser.py:parse_pdf:entry",
            "Begin parse_pdf pipeline",
            {
                "filename": getattr(pdf_file, "name", None),
                "size": getattr(pdf_file, "size", None),
            },
        )
        # endregion
        text = self.extract_text_from_pdf(pdf_file)

        if not text or len(text.strip()) < 50:
            # region agent log
            _agent_debug_log(
                "H9",
                "rubric_parser.py:parse_pdf:short_text",
                "PDF text too short for parsing",
                {"text_length": len(text or ""), "min_required": 50},
            )
            # endregion
            raise RubricParseError(
                "PDF contains insufficient text (less than 50 characters)"
            )

        # region agent log
        _agent_debug_log(
            "H9",
            "rubric_parser.py:parse_pdf:calling_parse_pdf_text",
            "Calling parse_pdf_text",
            {"text_length": len(text)},
        )
        # endregion
        try:
            return self.parse_pdf_text(text)
        except Exception as e:
            # region agent log
            _agent_debug_log(
                "H11",
                "rubric_parser.py:parse_pdf:parse_pdf_text_exception",
                "parse_pdf_text raised exception",
                {
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "error_class": str(type(e)),
                    "error_repr": repr(e),
                    "is_request_exception": isinstance(
                        e, requests.exceptions.RequestException
                    ),
                    "is_rubric_parse_error": isinstance(e, RubricParseError),
                },
            )
            # endregion
            raise
