"""Tests for SiliconFlowRubricParser."""

import json
from unittest.mock import MagicMock, patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from ai_feedback.rubric_parser import RubricParseError, SiliconFlowRubricParser


@pytest.fixture
def parser():
    """Fixture for SiliconFlowRubricParser."""
    return SiliconFlowRubricParser(api_key="test-key")


@pytest.fixture
def valid_pdf():
    """Fixture for a valid PDF file mock."""
    return SimpleUploadedFile(
        "rubric.pdf", b"dummy pdf content", content_type="application/pdf"
    )


@pytest.fixture
def sample_rubric_json():
    """Fixture for valid rubric JSON response from AI."""
    return {
        "is_rubric": True,
        "confidence": 0.95,
        "rubric_name": "Test Rubric",
        "dimensions": [
            {
                "name": "Criterion 1",
                "weight": 100.0,
                "levels": [
                    {
                        "name": "Level 1",
                        "score_min": 0,
                        "score_max": 10,
                        "description": "Desc 1",
                    }
                ],
            }
        ],
    }


class TestRubricParser:
    """Test suite for SiliconFlowRubricParser."""

    @patch("PyPDF2.PdfReader")
    def test_extract_text_from_pdf_success(self, mock_pdf_reader, parser, valid_pdf):
        """Test successful text extraction from PDF."""
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Extracted text content"
        mock_pdf_reader.return_value.pages = [mock_page]

        text = parser.extract_text_from_pdf(valid_pdf)
        assert text == "Extracted text content"
        mock_page.extract_text.assert_called_once()

    @patch("PyPDF2.PdfReader")
    def test_extract_text_from_pdf_empty(self, mock_pdf_reader, parser, valid_pdf):
        """Test extraction from empty PDF."""
        mock_page = MagicMock()
        mock_page.extract_text.return_value = ""
        mock_pdf_reader.return_value.pages = [mock_page]

        text = parser.extract_text_from_pdf(valid_pdf)
        assert text == ""

    @patch("PyPDF2.PdfReader")
    def test_extract_text_from_pdf_malformed(self, mock_pdf_reader, parser, valid_pdf):
        """Test extraction from malformed PDF."""
        mock_pdf_reader.side_effect = Exception("Invalid PDF")

        with pytest.raises(RubricParseError) as excinfo:
            parser.extract_text_from_pdf(valid_pdf)
        assert "PDF text extraction failed" in str(excinfo.value)

    @patch("requests.post")
    def test_parse_pdf_text_valid_rubric(self, mock_post, parser, sample_rubric_json):
        """Test AI parsing with valid rubric response."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": json.dumps(sample_rubric_json)}}]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        result = parser.parse_pdf_text("Some rubric text")
        assert result["is_rubric"] is True
        assert result["rubric_name"] == "Test Rubric"
        assert len(result["dimensions"]) == 1

    @patch("requests.post")
    def test_parse_pdf_text_non_rubric(self, mock_post, parser):
        """Test AI parsing when document is not a rubric."""
        non_rubric_response = {
            "is_rubric": False,
            "confidence": 0.99,
            "reason": "This is an essay",
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": json.dumps(non_rubric_response)}}]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        result = parser.parse_pdf_text("This is my essay about cats.")
        assert result["is_rubric"] is False
        assert result["reason"] == "This is an essay"

    @patch("requests.post")
    def test_parse_pdf_text_empty_json(self, mock_post, parser):
        """Test handling of empty JSON response from API."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"choices": [{"message": {"content": ""}}]}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        with pytest.raises(RubricParseError) as excinfo:
            parser.parse_pdf_text("Text")
        assert "API returned empty content" in str(excinfo.value)

    @patch("requests.post")
    def test_parse_pdf_text_api_failure(self, mock_post, parser):
        """Test handling of API call failure."""
        import requests

        mock_post.side_effect = requests.exceptions.RequestException("Network error")

        with pytest.raises(RubricParseError) as excinfo:
            parser.parse_pdf_text("Text")
        assert "AI API call failed" in str(excinfo.value)

    @patch("requests.post")
    def test_parse_pdf_text_malformed_json(self, mock_post, parser):
        """Test handling of malformed JSON from API."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "{invalid-json"}}]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        with pytest.raises(RubricParseError) as excinfo:
            parser.parse_pdf_text("Text")
        assert "AI returned invalid JSON" in str(excinfo.value)

    @patch.object(SiliconFlowRubricParser, "extract_text_from_pdf")
    @patch.object(SiliconFlowRubricParser, "parse_pdf_text")
    def test_parse_pdf_workflow(
        self, mock_parse_text, mock_extract_text, parser, valid_pdf, sample_rubric_json
    ):
        """Test the complete parse_pdf workflow with mocked extraction and parsing."""
        mock_extract_text.return_value = "Long enough text for parsing" * 5
        mock_parse_text.return_value = sample_rubric_json

        result = parser.parse_pdf(valid_pdf)
        assert result == sample_rubric_json
        mock_extract_text.assert_called_once_with(valid_pdf)
        mock_parse_text.assert_called_once()

    def test_parse_pdf_insufficient_text(self, parser, valid_pdf):
        """Test that parse_pdf raises error if extracted text is too short."""
        with patch.object(
            SiliconFlowRubricParser, "extract_text_from_pdf", return_value="Too short"
        ):
            with pytest.raises(RubricParseError) as excinfo:
                parser.parse_pdf(valid_pdf)
            assert "insufficient text" in str(excinfo.value)
