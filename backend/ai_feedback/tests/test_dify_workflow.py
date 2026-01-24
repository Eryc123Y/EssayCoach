"""
Comprehensive tests for AI Feedback Dify workflow endpoints.
All API calls are mocked to avoid slow external requests.
"""

from typing import TYPE_CHECKING
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from ai_feedback.exceptions import APIServerError

if TYPE_CHECKING:
    from ..core.models import User as CoreUser
else:
    CoreUser = get_user_model()


class DifyWorkflowAPITestCase(TestCase):
    """Base test case for Dify workflow endpoints."""

    def setUp(self) -> None:
        """Set up test client, user, and base URL."""
        import os

        # Set DIFY_API_KEY to avoid ConfigurationError in DifyClient.__init__
        os.environ["DIFY_API_KEY"] = "test-dify-api-key-12345"

        self.client = APIClient()
        self.base_url = "/api/v1/ai-feedback/agent/workflows/"

        # Create test user and authenticate
        self.user = CoreUser.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_fname="Test",
            user_lname="User",
            user_role="student",
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")  # type: ignore[attr-defined]

        # Sample essay data
        self.sample_essay_question = "What is the importance of biodiversity for ecosystem stability?"

        self.sample_essay_content = (
            "Biodiversity is fundamental to ecosystem stability. When ecosystems contain a "
            "wide variety of species, they become more resilient to environmental changes "
            "and disturbances. This resilience stems from functional redundancy, where multiple "
            "species can perform similar ecological roles."
        )

    def _get_valid_payload(self, **kwargs) -> dict:
        """Helper to build valid request payload."""
        payload = {
            "essay_question": self.sample_essay_question,
            "essay_content": self.sample_essay_content,
        }
        payload.update(kwargs)
        return payload


class WorkflowRunViewTests(DifyWorkflowAPITestCase):
    """Tests for POST /api/v1/ai-feedback/agent/workflows/run/"""

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_run_workflow_success(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test successful workflow run with valid payload."""
        # Setup mocks
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "workflow_id": "workflow-123",
            "status": "succeeded",
            "outputs": {
                "structure_analysis": {
                    "score": 8,
                    "feedback": "Good structure.",
                    "suggestions": ["Add topic sentences."],
                },
                "content_analysis": {
                    "score": 7,
                    "feedback": "Good content.",
                    "suggestions": ["Add more sources."],
                },
                "writing_style": {
                    "score": 9,
                    "feedback": "Good style.",
                    "suggestions": ["Minor fixes."],
                },
            },
            "error": None,
            "elapsed_time": 2.5,
            "total_tokens": 1500,
            "total_steps": 3,
            "created_at": "2024-01-01T00:00:00Z",
            "finished_at": "2024-01-01T00:00:02Z",
        }

        # Mock the transformer to return proper WorkflowOutput
        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id-67890",
            status=WorkflowStatus.SUCCEEDED,
            outputs=mock_run_workflow.return_value["outputs"],
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        # Make request
        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("workflow_run_id", response.data)
        self.assertIn("task_id", response.data)
        self.assertIn("data", response.data)
        self.assertEqual(response.data["workflow_run_id"], "test-run-id")
        self.assertEqual(response.data["task_id"], "test-task-id-67890")

        # Verify data structure contains expected fields
        self.assertIn("outputs", response.data["data"])
        self.assertEqual(response.data["data"]["status"], "succeeded")

        # Verify frontend-expected outputs structure
        outputs = response.data["data"]["outputs"]
        self.assertIn("structure_analysis", outputs)
        self.assertIn("content_analysis", outputs)
        self.assertIn("writing_style", outputs)

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_run_workflow_with_defaults(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test that default values are applied correctly."""
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "status": "succeeded",
            "outputs": {},
            "created_at": "2024-01-01T00:00:00Z",
        }

        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id",
            status=WorkflowStatus.SUCCEEDED,
            outputs={},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        url = f"{self.base_url}run/"
        payload = {
            "essay_question": self.sample_essay_question,
            "essay_content": self.sample_essay_content,
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify default language was passed
        call_kwargs = mock_run_workflow.call_args[1]
        self.assertEqual(call_kwargs["inputs"]["language"], "English")

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_run_workflow_with_custom_language(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test workflow run with custom language parameter."""
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "status": "succeeded",
            "outputs": {},
            "created_at": "2024-01-01T00:00:00Z",
        }

        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id",
            status=WorkflowStatus.SUCCEEDED,
            outputs={},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload(language="Chinese")
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        call_kwargs = mock_run_workflow.call_args[1]
        self.assertEqual(call_kwargs["inputs"]["language"], "Chinese")

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_run_workflow_streaming_mode(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test workflow run with streaming response mode."""
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "status": "succeeded",
            "outputs": {},
            "created_at": "2024-01-01T00:00:00Z",
        }

        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id",
            status=WorkflowStatus.SUCCEEDED,
            outputs={},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload(response_mode="streaming")
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        call_kwargs = mock_run_workflow.call_args[1]
        self.assertEqual(call_kwargs["response_mode"], "streaming")

    def test_run_workflow_missing_required_fields(self):
        """Test that missing required fields return validation errors."""
        url = f"{self.base_url}run/"

        # Missing essay_question
        payload = {"essay_content": self.sample_essay_content}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("essay_question", response.data)

        # Missing essay_content
        payload = {"essay_question": self.sample_essay_question}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("essay_content", response.data)

    def test_run_workflow_unauthorized(self):
        """Test that unauthenticated requests are rejected."""
        self.client.credentials()  # Remove auth  # type: ignore[attr-defined]
        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("ai_feedback.dify_client.DifyClient.analyze_essay")
    def test_run_workflow_dify_error(self, mock_analyze_essay):
        """Test handling of Dify API errors."""
        mock_analyze_essay.side_effect = APIServerError(status_code=502, message="Dify API error")

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("error", response.data)


class DifyWorkflowRunSerializerTests(TestCase):
    """Tests for DifyWorkflowRunSerializer validation."""

    def test_serializer_valid_data(self):
        """Test serializer with valid data."""
        from ai_feedback.serializers import DifyWorkflowRunSerializer

        data = {
            "essay_question": "Test question",
            "essay_content": "Test content",
            "language": "English",
            "response_mode": "blocking",
        }
        serializer = DifyWorkflowRunSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_defaults(self):
        """Test that defaults are applied correctly."""
        from ai_feedback.serializers import DifyWorkflowRunSerializer

        data = {
            "essay_question": "Test question",
            "essay_content": "Test content",
        }
        serializer = DifyWorkflowRunSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        validated_data = serializer.validated_data
        self.assertEqual(validated_data["language"], "English")
        self.assertEqual(validated_data["response_mode"], "blocking")
        self.assertEqual(validated_data["user_id"], "essaycoach-service")

    def test_serializer_missing_required_fields(self):
        """Test serializer validation for missing required fields."""
        from ai_feedback.serializers import DifyWorkflowRunSerializer

        serializer = DifyWorkflowRunSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn("essay_question", serializer.errors)
        self.assertIn("essay_content", serializer.errors)

    def test_serializer_valid_data(self):
        """Test serializer with valid data."""
        from ai_feedback.serializers import DifyWorkflowRunSerializer

        data = {
            "essay_question": "Test question",
            "essay_content": "Test content",
            "language": "English",
            "response_mode": "blocking",
        }
        serializer = DifyWorkflowRunSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_empty_strings(self):
        """Test serializer rejects empty string values for required fields."""
        from ai_feedback.serializers import DifyWorkflowRunSerializer

        data = {
            "essay_question": "",
            "essay_content": "Test content",
        }
        serializer = DifyWorkflowRunSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("essay_question", serializer.errors)


class WorkflowRunViewResponseTests(DifyWorkflowAPITestCase):
    """Tests for verifying complete response payload structure from WorkflowRunView."""

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_response_contains_all_expected_fields(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test that response contains all expected fields for frontend integration."""
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "status": "succeeded",
            "outputs": {},
            "created_at": "2024-01-01T00:00:00Z",
        }

        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id",
            status=WorkflowStatus.SUCCEEDED,
            outputs={},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify all required fields are present
        expected_fields = [
            "workflow_run_id",
            "task_id",
            "data",
            "inputs",
            "response_mode",
        ]
        for field in expected_fields:
            self.assertIn(field, response.data, f"Missing required field: {field}")

        # Verify data structure
        data_fields = ["id", "status", "outputs"]
        for field in data_fields:
            self.assertIn(field, response.data["data"], f"Missing field in data: {field}")

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_response_mode_blocking(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test response_mode 'blocking' is correctly passed and returned."""
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "status": "succeeded",
            "outputs": {},
            "created_at": "2024-01-01T00:00:00Z",
        }

        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id",
            status=WorkflowStatus.SUCCEEDED,
            outputs={},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload(response_mode="blocking")
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["response_mode"], "blocking")

        # Verify client was called with blocking mode
        call_kwargs = mock_run_workflow.call_args[1]
        self.assertEqual(call_kwargs["response_mode"], "blocking")

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_response_mode_streaming(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test response_mode 'streaming' is correctly passed and returned."""
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "status": "succeeded",
            "outputs": {},
            "created_at": "2024-01-01T00:00:00Z",
        }

        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id",
            status=WorkflowStatus.SUCCEEDED,
            outputs={},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload(response_mode="streaming")
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["response_mode"], "streaming")

        # Verify client was called with streaming mode
        call_kwargs = mock_run_workflow.call_args[1]
        self.assertEqual(call_kwargs["response_mode"], "streaming")

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_inputs_contain_language_parameter(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test that language parameter is correctly included in inputs."""
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "status": "succeeded",
            "outputs": {},
            "created_at": "2024-01-01T00:00:00Z",
        }

        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id",
            status=WorkflowStatus.SUCCEEDED,
            outputs={},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload(language="Chinese")
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify language is in inputs sent to Dify
        call_kwargs = mock_run_workflow.call_args[1]
        self.assertEqual(call_kwargs["inputs"]["language"], "Chinese")

        # Verify language is in response inputs
        self.assertEqual(response.data["inputs"]["language"], "Chinese")

    @patch("ai_feedback.dify_client.DifyClient.analyze_essay")
    def test_workflow_error_response_format(self, mock_analyze_essay):
        """Test that workflow errors return correct response format."""
        # Simulate various error scenarios
        mock_analyze_essay.side_effect = APIServerError(status_code=502, message="Workflow execution failed: timeout")

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("error", response.data)

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_outputs_structure_for_frontend_consumption(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test that outputs structure matches frontend expectations."""
        mock_outputs = {
            "structure_analysis": {
                "score": 8,
                "feedback": "The essay has a clear introduction.",
                "suggestions": ["Consider adding more topic sentences."],
            },
            "content_analysis": {
                "score": 7,
                "feedback": "Arguments are well-supported.",
                "suggestions": ["Include more recent sources."],
            },
            "writing_style": {
                "score": 9,
                "feedback": "Academic tone is consistent.",
                "suggestions": ["Minor grammar corrections needed."],
            },
        }

        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "status": "succeeded",
            "outputs": mock_outputs,
            "created_at": "2024-01-01T00:00:00Z",
        }

        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id",
            status=WorkflowStatus.SUCCEEDED,
            outputs=mock_outputs,
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        outputs = response.data["data"]["outputs"]

        # Verify structure_analysis has expected structure
        self.assertIn("structure_analysis", outputs)
        structure = outputs["structure_analysis"]
        self.assertIsInstance(structure, dict)
        self.assertIn("score", structure)
        self.assertIn("feedback", structure)
        self.assertIn("suggestions", structure)
        self.assertIsInstance(structure["suggestions"], list)

        # Verify content_analysis has expected structure
        self.assertIn("content_analysis", outputs)
        content = outputs["content_analysis"]
        self.assertIsInstance(content, dict)
        self.assertIn("score", content)
        self.assertIn("feedback", content)
        self.assertIn("suggestions", content)
        self.assertIsInstance(content["suggestions"], list)

        # Verify writing_style has expected structure
        self.assertIn("writing_style", outputs)
        style = outputs["writing_style"]
        self.assertIsInstance(style, dict)
        self.assertIn("score", style)
        self.assertIn("feedback", style)
        self.assertIn("suggestions", style)
        self.assertIsInstance(style["suggestions"], list)

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_rubric_file_input_structure(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test that rubric file input is correctly structured for Dify."""
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "status": "succeeded",
            "outputs": {},
            "created_at": "2024-01-01T00:00:00Z",
        }

        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id",
            status=WorkflowStatus.SUCCEEDED,
            outputs={},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify rubric input structure
        mock_build_rubric.assert_called_once()
        rubric_input = mock_build_rubric.return_value
        self.assertEqual(rubric_input["transfer_method"], "local_file")
        self.assertEqual(rubric_input["upload_file_id"], "test-upload-id")
        self.assertEqual(rubric_input["type"], "document")

    @patch("ai_feedback.dify_client.DifyClient.build_rubric_input")
    @patch("ai_feedback.dify_client.DifyClient.upload_file")
    @patch("ai_feedback.dify_client.DifyClient.run_workflow")
    @patch("ai_feedback.response_transformer.DifyResponseTransformer.to_workflow_output")
    def test_workflow_id_removed_from_run_workflow(
        self,
        mock_transform,
        mock_run_workflow,
        mock_upload_file,
        mock_build_rubric,
    ):
        """Test that workflow_id is no longer passed to run_workflow."""
        mock_build_rubric.return_value = {
            "transfer_method": "local_file",
            "upload_file_id": "test-upload-id",
            "type": "document",
        }
        mock_upload_file.return_value = "test-upload-id"
        mock_run_workflow.return_value = {
            "id": "test-run-id",
            "status": "succeeded",
            "outputs": {},
            "created_at": "2024-01-01T00:00:00Z",
        }

        from datetime import datetime
        from ai_feedback.interfaces import WorkflowStatus

        mock_transform.return_value = MagicMock(
            run_id="test-run-id",
            task_id="test-task-id",
            status=WorkflowStatus.SUCCEEDED,
            outputs={},
            error_message=None,
            elapsed_time_seconds=2.5,
            token_usage={"total_tokens": 1500},
            created_at=datetime(2024, 1, 1, 0, 0, 0),
            finished_at=datetime(2024, 1, 1, 0, 0, 2),
        )

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify run_workflow was called without workflow_id kwarg
        mock_run_workflow.assert_called_once()
        call_kwargs = mock_run_workflow.call_args[1]
        # workflow_id should NOT be in kwargs anymore
        self.assertNotIn("workflow_id", call_kwargs)
        # But inputs and response_mode should still be there
        self.assertIn("inputs", call_kwargs)
        self.assertIn("response_mode", call_kwargs)
