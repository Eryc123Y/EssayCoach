from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from core.models import MarkingRubric, RubricItem, RubricLevelDesc

User = get_user_model()


class TestWorkflowIntegration(TestCase):
    """
    Integration tests for the WorkflowRunView, focusing on Phase 3 (Integration).
    Verifies that providing a rubric_id correctly triggers rubric text generation,
    uploading to Dify, and running the workflow with the custom rubric.
    """

    def setUp(self) -> None:
        self.client = APIClient()
        self.user = User.objects.create_user(
            user_email="student@example.com",
            password="password123",
            user_fname="Student",
            user_lname="Test",
            user_role="student",
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        # Basic sample data
        self.essay_question = "What is the capital of France?"
        self.essay_content = "Paris is the capital of France."
        self.url = "/api/v1/ai-feedback/agent/workflows/run/"

    @patch("ai_feedback.views.DifyClient")
    def test_run_workflow_with_custom_rubric(self, mock_client_class):
        """
        Integration test:
        1. Create a dynamic rubric in the DB.
        2. Trigger workflow with rubric_id.
        3. Verify that:
           - MarkingRubric is fetched.
           - RubricManager.generate_rubric_text is called.
           - DifyClient.upload_rubric_content is called with generated text.
           - DifyClient.run_workflow is called with the custom upload ID.
        """
        # Setup Dify mock
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.upload_rubric_content.return_value = "custom-upload-id-999"
        mock_client.build_rubric_file_input.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "custom-upload-id-999",
            "type": "document",
        }
        mock_client.run_workflow.return_value = {
            "workflow_run_id": "run-123",
            "task_id": "task-456",
            "data": {"status": "succeeded", "outputs": {"result": "ok"}},
        }

        # 1. Create a dynamic rubric
        rubric = MarkingRubric.objects.create(
            user_id_user=self.user, rubric_desc="Geography Rubric"
        )
        item = RubricItem.objects.create(
            rubric_id_marking_rubric=rubric,
            rubric_item_name="Accuracy",
            rubric_item_weight=99.9,
        )
        RubricLevelDesc.objects.create(
            rubric_item_id_rubric_item=item,
            level_min_score=0,
            level_max_score=10,
            level_desc="Perfect accuracy",
        )

        # 2. Trigger workflow with rubric_id
        payload = {
            "essay_question": self.essay_question,
            "essay_content": self.essay_content,
            "rubric_id": rubric.rubric_id,
        }
        response = self.client.post(self.url, payload, format="json")

        # 3. Verify
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that upload_rubric_content was called with formatted text
        mock_client.upload_rubric_content.assert_called_once()
        args, kwargs = mock_client.upload_rubric_content.call_args
        rubric_text = args[0]
        self.assertIn("Geography Rubric", rubric_text)
        self.assertIn("Accuracy", rubric_text)
        self.assertIn("Perfect accuracy", rubric_text)

        # Check that workflow was run with the custom upload_id
        mock_client.run_workflow.assert_called_once()
        run_kwargs = mock_client.run_workflow.call_args[1]
        self.assertEqual(
            run_kwargs["inputs"]["essay_rubric"],
            {
                "transfer_method": "local_file",
                "upload_file_id": "custom-upload-id-999",
                "type": "document",
            },
        )

    @patch("ai_feedback.views.DifyClient")
    def test_run_workflow_with_missing_rubric(self, mock_client_class):
        """Verify that providing a non-existent rubric_id returns 404."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        payload = {
            "essay_question": self.essay_question,
            "essay_content": self.essay_content,
            "rubric_id": 9999,  # Non-existent
        }
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Rubric not found")
        mock_client.run_workflow.assert_not_called()
