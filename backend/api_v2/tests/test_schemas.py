"""
Unit tests for Django Ninja API v2 - no database required.
These tests verify API structure and schema validation.
"""

import pytest
from pydantic import ValidationError

from api_v2.ai_feedback.schemas import WorkflowRunIn, WorkflowRunOut
from api_v2.auth.schemas import UserRegistrationIn, UserLoginIn
from api_v2.core.schemas import UserIn, UnitIn, ClassIn


class TestAIFeedbackSchemas:
    def test_workflow_run_in_valid(self):
        data = WorkflowRunIn(
            essay_question="What is AI?",
            essay_content="AI is artificial intelligence...",
        )
        assert data.essay_question == "What is AI?"
        assert data.response_mode == "blocking"

    def test_workflow_run_in_invalid_response_mode(self):
        with pytest.raises(ValidationError):
            WorkflowRunIn(
                essay_question="Test",
                essay_content="Test content",
                response_mode="invalid_mode",
            )

    def test_workflow_run_in_required_fields(self):
        with pytest.raises(ValidationError):
            WorkflowRunIn(essay_question="", essay_content="")


class TestAuthSchemas:
    def test_user_registration_valid(self):
        data = UserRegistrationIn(
            email="test@example.com",
            password="SecurePass123!",
            password_confirm="SecurePass123!",
        )
        assert data.email == "test@example.com"
        assert data.role is None

    def test_user_registration_invalid_role(self):
        with pytest.raises(ValidationError):
            UserRegistrationIn(
                email="test@example.com",
                password="SecurePass123!",
                password_confirm="SecurePass123!",
                role="invalid_role",
            )

    def test_user_login_valid(self):
        data = UserLoginIn(
            email="test@example.com",
            password="password123",
        )
        assert data.email == "test@example.com"


class TestCoreSchemas:
    def test_user_in_valid(self):
        data = UserIn(
            user_email="test@example.com",
            password="password123",
            user_role="student",
        )
        assert data.user_email == "test@example.com"
        assert data.user_role == "student"

    def test_unit_in_valid(self):
        data = UnitIn(
            unit_id="CS101",
            unit_name="Computer Science 101",
        )
        assert data.unit_id == "CS101"
        assert data.unit_desc is None

    def test_class_in_valid(self):
        data = ClassIn(
            unit_id_unit="CS101",
            class_size=30,
        )
        assert data.unit_id_unit == "CS101"
        assert data.class_size == 30


class TestAPIStructure:
    def test_api_instance_created(self):
        from api_v2.api import api_v2

        assert api_v2.title == "EssayCoach API v2"
        assert api_v2.version == "2.0.0"

    def test_openapi_schema_generation(self):
        from api_v2.api import api_v2
        from ninja.openapi.schema import get_schema

        schema = get_schema(api_v2)
        assert schema["info"]["title"] == "EssayCoach API v2"
        assert schema["info"]["version"] == "2.0.0"
        assert len(schema["paths"]) > 0

    def test_auth_endpoints_registered(self):
        from api_v2.api import api_v2
        from ninja.openapi.schema import get_schema

        schema = get_schema(api_v2)
        auth_paths = [p for p in schema["paths"].keys() if p.startswith("/auth/")]
        assert len(auth_paths) == 6

    def test_ai_feedback_endpoints_registered(self):
        from api_v2.api import api_v2
        from ninja.openapi.schema import get_schema

        schema = get_schema(api_v2)
        ai_paths = [p for p in schema["paths"].keys() if p.startswith("/ai-feedback/")]
        assert len(ai_paths) == 3

    def test_core_endpoints_registered(self):
        from api_v2.api import api_v2
        from ninja.openapi.schema import get_schema

        schema = get_schema(api_v2)
        core_paths = [p for p in schema["paths"].keys() if p.startswith("/core/")]
        assert len(core_paths) == 28

    def test_advanced_endpoints_registered(self):
        from api_v2.api import api_v2
        from ninja.openapi.schema import get_schema

        schema = get_schema(api_v2)
        advanced_paths = [p for p in schema["paths"].keys() if p.startswith("/advanced/")]
        assert len(advanced_paths) == 4
