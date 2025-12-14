"""
Comprehensive tests for AI Feedback Dify workflow endpoints.
"""
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

User = get_user_model()


class DifyWorkflowAPITestCase(TestCase):
    """Base test case for Dify workflow endpoints."""

    def setUp(self) -> None:
        """Set up test client, user, and base URL."""
        self.client = APIClient()
        self.base_url = "/api/v1/ai-feedback/agent/workflows/"

        # Create test user and authenticate
        self.user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_fname="Test",
            user_lname="User",
            user_role="student",
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        # Sample essay data provided by user
        self.sample_essay_question = (
            "Here is a sample Essay Task and a Student Submission generated based on the uploaded ESAC IWA Descriptors.\n\n"
            "I have designed this submission to meet the criteria for a Band 8 (Strong/Effective). This level represents a high-quality student essay that answers the question well, demonstrates strong referencing skills, and maintains a good academic register, though it may have very minor occasional slips (as allowed by the Band 8 descriptor).\n\n"
            "1. Essay Task (作文题目)\nModule: English for Specific Academic Contexts (ESAC) Assessment: Integrated Writing Assessment (IWA) Word Limit: 1500 words (+/- 10%) Task Instructions:\n\n"
            '"The integration of Generative Artificial Intelligence (GenAI) in higher education has sparked intense debate regarding academic integrity and pedagogical innovation.\n\n'
            "Discuss the primary challenges GenAI poses to traditional assessment methods and evaluate the potential benefits it offers for student learning. To what extent should universities embrace this technology in their curriculum?\n\n"
            "In your essay, you must:\n\n"
            "Draw on a minimum of 7 sources (Refer to your specific ESACa/b guidelines for the split between Reading List and self-selected sources).\n\n"
            "Follow the specific referencing conventions taught in your module.\n\n"
            'Paraphrase source information; do not rely on direct quotes."'
        )

        self.sample_essay_content = (
            "Title: Beyond Prohibition: Integrating Generative AI into Higher Education Assessment and Learning\n\n"
            "Introduction The rapid emergence of Generative Artificial Intelligence (GenAI) tools, such as ChatGPT and Claude, has fundamentally disrupted the landscape of higher education. While digital tools have long aided academic study, GenAI's ability to synthesise complex information and generate human-like text presents unprecedented challenges to established educational norms. A prevailing concern among educators is the threat these tools pose to academic integrity, particularly regarding traditional assessment methods. However, focusing solely on these risks risks overlooking the transformative potential of AI to enhance personalised learning. This essay will argue that while GenAI undermines the validity of traditional essay-based assessments, its benefits for student engagement and skill development are significant. Consequently, universities should move beyond prohibition and adopt a policy of critical integration, redesigning assessments to co-exist with these evolving technologies. This essay will first examine the threat to academic integrity, then analyse the benefits for personalised learning, and finally discuss the necessity of assessment reform.\n\n"
            "Body Paragraph 1: Challenges to Academic Integrity The most immediate challenge presented by GenAI is the erosion of academic integrity in standard written assessments. Traditional coursework, which often relies on summarising knowledge or writing standard essays, is particularly vulnerable to AI-generated plagiarism. According to Baron (2023), current plagiarism detection software is increasingly unable to distinguish between human and AI-generated text, leading to a \"crisis of trust\" in university grading systems. This difficulty arises because GenAI does not merely copy text from a database but predicts coherent sequences of words, creating unique outputs that bypass standard similarity checks (Zhang & Li, 2024). Consequently, if students can produce high-quality papers with minimal cognitive effort, the validity of a university degree is compromised. While some institutions have responded with strict bans, enforcing such prohibition is practically impossible outside of invigilated exam conditions. Therefore, the continued reliance on take-home essays as a primary measure of student understanding is becoming untenable.\n\n"
            "Body Paragraph 2: Enhancing Student Learning Despite these risks, GenAI offers substantial opportunities to enhance student learning through personalisation and immediate feedback. Unlike a human tutor who may have limited availability, AI tools can function as \"always-on\" learning companions. For instance, Chen et al. (2024) found that when used as a Socratic tutor—prompting students with questions rather than giving answers—AI significantly improved students' critical thinking skills in STEM subjects. This suggests that the technology can scaffold learning by breaking down complex concepts into digestible explanations tailored to the individual learner's proficiency level. Furthermore, formatting and grammar assistance provided by these tools allows students, particularly those writing in a second language, to focus more on higher-order argumentation rather than surface-level mechanics (EduTech Future, 2023). Thus, rather than replacing learning, GenAI can serve as a powerful auxiliary tool that democratises access to academic support.\n\n"
            "Body Paragraph 3: The Need for Assessment Reform Given the dual reality of integrity risks and learning benefits, the most sustainable path forward is the reform of assessment strategies. Universities must transition from assessing what a student knows to how they apply knowledge in collaboration with technology. A rigid prohibition mindset ignores the professional reality that graduates will enter a workforce where AI proficiency is expected (World Economic Forum, 2024). Assessments should therefore evolve to include viva voces, reflective portfolios, or tasks that specifically require the critique of AI-generated content. As noted by the University of Manchester Teaching Framework (2023), assessment design must prioritize \"process over product,\" evaluating the student's journey of inquiry and their ability to verify information. By integrating AI into the curriculum—for example, by asking students to critique a flawed AI essay—universities can foster the critical digital literacy essential for the modern era.\n\n"
            "Conclusion In conclusion, the integration of GenAI in higher education presents a complex paradox: it threatens the integrity of traditional assessments while simultaneously offering powerful tools for personalised learning. As this essay has argued, attempting to ban these technologies is a futile strategy that fails to prepare students for a digital future. Instead, universities should embrace a hybrid approach that integrates AI literacy into the curriculum while rigorously redesigning assessments to test critical thinking and authentic application rather than mere recall. Ultimately, the rise of AI does not signal the end of higher education, but rather a necessary evolution towards more resilient and relevant pedagogical models."
        )

        # Mock Dify response structure
        self.mock_dify_response = {
            "workflow_run_id": "test-run-id-12345",
            "task_id": "test-task-id-67890",
            "data": {
                "id": "test-run-id-12345",
                "workflow_id": "test-workflow-id",
                "status": "succeeded",
                "outputs": {"text": "Mock feedback output"},
                "error": None,
                "elapsed_time": 2.5,
                "total_tokens": 1500,
                "total_steps": 3,
                "created_at": 1705407629,
                "finished_at": 1705407631,
            },
        }

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

    @patch("ai_feedback.views.DifyClient")
    def test_run_workflow_success(self, mock_client_class):
        """Test successful workflow run with valid payload."""
        # Setup mock
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.default_workflow_id = "default-workflow-id"
        mock_client.get_rubric_upload_id.return_value = "uploaded-rubric-id"
        mock_client.build_rubric_file_input.return_value = [
            {"transfer_method": "local_file", "upload_file_id": "uploaded-rubric-id", "type": "document"}
        ]
        mock_client.run_workflow.return_value = self.mock_dify_response

        # Make request
        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("workflow_run_id", response.data)
        self.assertIn("task_id", response.data)
        self.assertEqual(response.data["workflow_run_id"], "test-run-id-12345")
        self.assertEqual(response.data["task_id"], "test-task-id-67890")

        # Verify DifyClient was called correctly
        mock_client.get_rubric_upload_id.assert_called_once()
        mock_client.run_workflow.assert_called_once()
        call_kwargs = mock_client.run_workflow.call_args[1]
        self.assertIn("essay_question", call_kwargs["inputs"])
        self.assertIn("essay_content", call_kwargs["inputs"])
        self.assertIn("essay_rubric", call_kwargs["inputs"])

    @patch("ai_feedback.views.DifyClient")
    def test_run_workflow_with_defaults(self, mock_client_class):
        """Test that default values are applied correctly."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.default_workflow_id = "default-workflow-id"
        mock_client.get_rubric_upload_id.return_value = "uploaded-rubric-id"
        mock_client.build_rubric_file_input.return_value = [
            {"transfer_method": "local_file", "upload_file_id": "uploaded-rubric-id", "type": "document"}
        ]
        mock_client.run_workflow.return_value = self.mock_dify_response

        # Request without optional fields
        url = f"{self.base_url}run/"
        payload = {
            "essay_question": self.sample_essay_question,
            "essay_content": self.sample_essay_content,
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        call_kwargs = mock_client.run_workflow.call_args[1]
        self.assertEqual(call_kwargs["inputs"]["language"], "English")
        self.assertEqual(call_kwargs["response_mode"], "blocking")

    @patch("ai_feedback.views.DifyClient")
    def test_run_workflow_with_custom_language(self, mock_client_class):
        """Test workflow run with custom language parameter."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.default_workflow_id = "default-workflow-id"
        mock_client.get_rubric_upload_id.return_value = "uploaded-rubric-id"
        mock_client.build_rubric_file_input.return_value = [
            {"transfer_method": "local_file", "upload_file_id": "uploaded-rubric-id", "type": "document"}
        ]
        mock_client.run_workflow.return_value = self.mock_dify_response

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload(language="Chinese")
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        call_kwargs = mock_client.run_workflow.call_args[1]
        self.assertEqual(call_kwargs["inputs"]["language"], "Chinese")

    @patch("ai_feedback.views.DifyClient")
    def test_run_workflow_streaming_mode(self, mock_client_class):
        """Test workflow run with streaming response mode."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.default_workflow_id = "default-workflow-id"
        mock_client.get_rubric_upload_id.return_value = "uploaded-rubric-id"
        mock_client.build_rubric_file_input.return_value = [
            {"transfer_method": "local_file", "upload_file_id": "uploaded-rubric-id", "type": "document"}
        ]
        mock_client.run_workflow.return_value = self.mock_dify_response

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload(response_mode="streaming")
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        call_kwargs = mock_client.run_workflow.call_args[1]
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
        self.client.credentials()  # Remove auth
        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")
        # DRF returns 403 Forbidden for unauthenticated requests with IsAuthenticated permission
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("ai_feedback.views.DifyClient")
    def test_run_workflow_dify_error(self, mock_client_class):
        """Test handling of Dify API errors."""
        from ai_feedback.client import DifyClientError

        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.default_workflow_id = "default-workflow-id"
        mock_client.get_rubric_upload_id.return_value = "uploaded-rubric-id"
        mock_client.build_rubric_file_input.return_value = [
            {"transfer_method": "local_file", "upload_file_id": "uploaded-rubric-id", "type": "document"}
        ]
        mock_client.run_workflow.side_effect = DifyClientError("Dify API error")

        url = f"{self.base_url}run/"
        payload = self._get_valid_payload()
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("error", response.data)

    @patch("ai_feedback.views.DifyClient")
    def test_run_workflow_missing_workflow_id(self, mock_client_class):
        """Test error when DIFY_WORKFLOW_ID is not configured."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.default_workflow_id = None

        # Mock settings to also return None
        with patch("ai_feedback.views.settings.DIFY_DEFAULT_WORKFLOW_ID", None):
            url = f"{self.base_url}run/"
            payload = self._get_valid_payload()
            response = self.client.post(url, payload, format="json")

            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("detail", response.data)


class WorkflowRunStatusViewTests(DifyWorkflowAPITestCase):
    """Tests for GET /api/v1/ai-feedback/agent/workflows/run/{workflow_run_id}/status/"""

    @patch("ai_feedback.views.DifyClient")
    def test_get_workflow_status_success(self, mock_client_class):
        """Test successful retrieval of workflow run status."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_status_response = {
            "id": "test-run-id-12345",
            "workflow_id": "test-workflow-id",
            "status": "succeeded",
            "outputs": {"text": "Final feedback output"},
            "total_steps": 3,
            "total_tokens": 1500,
            "created_at": 1705407629,
            "finished_at": 1705407631,
            "elapsed_time": 2.5,
        }
        mock_client.get_workflow_run.return_value = mock_status_response

        url = f"{self.base_url}run/test-run-id-12345/status/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], "test-run-id-12345")
        self.assertEqual(response.data["status"], "succeeded")
        mock_client.get_workflow_run.assert_called_once_with("test-run-id-12345")

    @patch("ai_feedback.views.DifyClient")
    def test_get_workflow_status_dify_error(self, mock_client_class):
        """Test handling of Dify API errors when fetching status."""
        from ai_feedback.client import DifyClientError

        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.get_workflow_run.side_effect = DifyClientError("Dify API error")

        url = f"{self.base_url}run/test-run-id-12345/status/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("error", response.data)

    def test_get_workflow_status_unauthorized(self):
        """Test that unauthenticated requests are rejected."""
        self.client.credentials()  # Remove auth
        url = f"{self.base_url}run/test-run-id-12345/status/"
        response = self.client.get(url)
        # DRF returns 403 Forbidden for unauthenticated requests with IsAuthenticated permission
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


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

    def test_serializer_invalid_response_mode(self):
        """Test serializer rejects invalid response_mode."""
        from ai_feedback.serializers import DifyWorkflowRunSerializer

        data = {
            "essay_question": "Test question",
            "essay_content": "Test content",
            "response_mode": "invalid_mode",
        }
        serializer = DifyWorkflowRunSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("response_mode", serializer.errors)
