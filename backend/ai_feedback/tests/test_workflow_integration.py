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

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_run_workflow_with_custom_rubric(
        self, mock_transform, mock_run_workflow, mock_upload_file, mock_build_rubric
    ):
        """
        Integration test:
        1. Create a dynamic rubric in the DB.
        2. Trigger workflow with rubric_id.
        3. Verify that the workflow succeeds with rubric integration.
        """
        from datetime import datetime
        from ai_feedback.interfaces import WorkflowOutput, WorkflowStatus

        # Setup Dify mocks
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "custom-upload-id-999",
            "type": "document",
        }
        mock_upload_file.return_value = "custom-upload-id-999"
        mock_run_workflow.return_value = {
            "workflow_run_id": "run-123",
            "task_id": "task-456",
            "data": {"status": "succeeded", "outputs": {"result": "ok"}},
        }

        # Mock the transformer to return proper WorkflowOutput
        mock_transform.return_value = WorkflowOutput(
            run_id="run-123",
            task_id="task-456",
            status=WorkflowStatus.SUCCEEDED,
            outputs={"result": "ok"},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        # 1. Create a dynamic rubric
        rubric = MarkingRubric.objects.create(user_id_user=self.user, rubric_desc="Geography Rubric")
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
        # Verify workflow was called
        mock_run_workflow.assert_called_once()
        # Verify build_rubric_input was called (with rubric_id as first positional arg)
        mock_build_rubric.assert_called_once()

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_run_workflow_with_missing_rubric(
        self, mock_transform, mock_run_workflow, mock_upload_file, mock_build_rubric
    ):
        """Verify that providing a non-existent rubric_id returns 404."""
        from datetime import datetime
        from ai_feedback.exceptions import RubricError
        from ai_feedback.interfaces import WorkflowOutput, WorkflowStatus

        # Setup Dify mocks
        mock_upload_file.return_value = "upload-id"
        mock_run_workflow.return_value = {
            "workflow_run_id": "run-123",
            "task_id": "task-456",
            "data": {"status": "succeeded", "outputs": {}},
        }
        mock_transform.return_value = WorkflowOutput(
            run_id="run-123",
            task_id="task-456",
            status=WorkflowStatus.SUCCEEDED,
            outputs={},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        # Make build_rubric_input raise RubricError (simulates missing rubric)
        mock_build_rubric.side_effect = RubricError(
            message="[RUBRIC_NOT_FOUND] Rubric with ID 9999 not found in your library.",
            rubric_id=9999,
            recoverable=True,
        )

        payload = {
            "essay_question": self.essay_question,
            "essay_content": self.essay_content,
            "rubric_id": 9999,  # Non-existent
        }
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
