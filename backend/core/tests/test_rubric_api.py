"""Integration tests for Rubric API endpoints."""

from unittest.mock import MagicMock, patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from core.models import MarkingRubric, RubricItem, RubricLevelDesc, User


@pytest.fixture
def api_client():
    """Fixture for authenticated API client."""
    client = APIClient()
    user = User.objects.create_user(
        user_email="lecturer@example.com", password="password123", user_role="lecturer"
    )
    client.force_authenticate(user=user)
    return client, user


@pytest.fixture
def sample_rubric(db, api_client):
    """Fixture for a pre-existing rubric with items and levels."""
    _, user = api_client
    rubric = MarkingRubric.objects.create(
        user_id_user=user, rubric_desc="Existing Rubric"
    )
    item = RubricItem.objects.create(
        rubric_id_marking_rubric=rubric,
        rubric_item_name="Content",
        rubric_item_weight=100.0,
    )
    RubricLevelDesc.objects.create(
        rubric_item_id_rubric_item=item,
        level_min_score=0,
        level_max_score=100,
        level_desc="Level 1",
    )
    return rubric


@pytest.mark.django_db
class TestRubricAPI:
    """Test suite for MarkingRubric API endpoints."""

    @patch("core.views.RubricManager")
    def test_import_rubric_pdf_success(self, mock_manager_class, api_client):
        """Test successful rubric import via PDF upload."""
        client, _ = api_client
        mock_manager = MagicMock()
        mock_manager_class.return_value = mock_manager
        mock_manager.import_rubric_with_ai.return_value = {
            "success": True,
            "rubric_id": 123,
            "rubric_name": "AI Parsed Rubric",
            "items_count": 3,
            "levels_count": 9,
            "ai_parsed": True,
        }

        url = reverse("rubric-import-from-pdf-with-ai")
        pdf_file = SimpleUploadedFile(
            "rubric.pdf", b"pdf content", content_type="application/pdf"
        )

        response = client.post(url, {"file": pdf_file}, format="multipart")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert response.data["rubric_id"] == 123
        mock_manager.import_rubric_with_ai.assert_called_once()

    @patch("core.views.RubricManager")
    def test_import_rubric_pdf_name_override(self, mock_manager_class, api_client):
        """Test rubric import with a custom name override."""
        client, user = api_client
        mock_manager = MagicMock()
        mock_manager_class.return_value = mock_manager
        mock_manager.import_rubric_with_ai.return_value = {
            "success": True,
            "rubric_id": 1,
            "detection": {"is_rubric": True},
        }

        url = reverse("rubric-import-from-pdf-with-ai")
        pdf_file = SimpleUploadedFile(
            "rubric.pdf", b"pdf content", content_type="application/pdf"
        )

        response = client.post(
            url,
            {"file": pdf_file, "rubric_name": "My Custom Rubric"},
            format="multipart",
        )

        assert response.status_code == status.HTTP_201_CREATED
        # Verify manager was called with the custom name
        args, kwargs = mock_manager.import_rubric_with_ai.call_args
        assert kwargs["rubric_name"] == "My Custom Rubric"
        assert args[1] == user

    @patch("core.views.RubricManager")
    def test_import_rubric_pdf_not_a_rubric(self, mock_manager_class, api_client):
        """Test rubric import when AI determines document is not a rubric."""
        client, _ = api_client
        mock_manager = MagicMock()
        mock_manager_class.return_value = mock_manager
        mock_manager.import_rubric_with_ai.return_value = {
            "success": False,
            "detection": {"is_rubric": False, "reason": "Not a rubric"},
            "ai_parsed": True,
        }

        url = reverse("rubric-import-from-pdf-with-ai")
        pdf_file = SimpleUploadedFile(
            "essay.pdf", b"essay content", content_type="application/pdf"
        )

        response = client.post(url, {"file": pdf_file}, format="multipart")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False
        assert response.data["detection"]["is_rubric"] is False

    def test_import_rubric_pdf_missing_file(self, api_client):
        """Test rubric import fails when no file is provided."""
        client, _ = api_client
        url = reverse("rubric-import-from-pdf-with-ai")

        response = client.post(url, {}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_import_rubric_pdf_invalid_type(self, api_client):
        """Test rubric import fails when a non-PDF file is uploaded."""
        client, _ = api_client
        url = reverse("rubric-import-from-pdf-with-ai")
        # In this project, we might rely on the serializer or the parser to fail.
        # But we expect a bad request if it's not a valid upload for this endpoint.
        txt_file = SimpleUploadedFile(
            "rubric.txt", b"text content", content_type="text/plain"
        )

        response = client.post(url, {"file": txt_file}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_rubric_detail(self, api_client, sample_rubric):
        """Test retrieving detailed rubric information."""
        client, _ = api_client
        url = reverse(
            "rubric-detail-with-items", kwargs={"pk": sample_rubric.rubric_id}
        )

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["rubric_desc"] == "Existing Rubric"
        assert "rubric_items" in response.data
        assert len(response.data["rubric_items"]) == 1
        assert "level_descriptions" in response.data["rubric_items"][0]

    def test_get_rubric_detail_not_found(self, api_client):
        """Test retrieving a non-existent rubric."""
        client, _ = api_client
        url = reverse("rubric-detail-with-items", kwargs={"pk": 9999})

        response = client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
