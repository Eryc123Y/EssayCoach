"""AI-powered rubric parser using SiliconFlow DeepSeek API."""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any

import PyPDF2
import requests
from django.conf import settings

if TYPE_CHECKING:
    from django.core.files.uploadedfile import UploadedFile

logger = logging.getLogger(__name__)


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

        if not self.api_key:
            raise ValueError("SILICONFLOW_API_KEY is required")

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

            return full_text

        except Exception as e:
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
        system_prompt = """You are a rubric analysis expert. Analyze the following PDF text and determine if it's a marking rubric.

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
6. If document structure is unclear, set is_rubric=false"""

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"PDF Text:\n\n{text}"},
            ],
            "temperature": 0.1,
            "max_tokens": 4096,
            "response_format": {"type": "json_object"},
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            logger.info(f"Calling SiliconFlow API with {len(text)} chars of text")
            response = requests.post(
                self.api_url, headers=headers, json=payload, timeout=60
            )
            response.raise_for_status()

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
            logger.error(f"SiliconFlow API request failed: {e}")
            raise RubricParseError(f"AI API call failed: {e}") from e
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
        text = self.extract_text_from_pdf(pdf_file)

        if not text or len(text.strip()) < 50:
            raise RubricParseError(
                "PDF contains insufficient text (less than 50 characters)"
            )

        return self.parse_pdf_text(text)
