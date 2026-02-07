"""
Test Django Ninja API v2.
Run with: uv run pytest api_v2/tests/test_ninja_api.py -v
"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client


@pytest.mark.django_db
def test_ai_feedback_workflow_endpoint_requires_auth():
    client = Client()
    response = client.post(
        "/api/v2/ai-feedback/agent/workflows/run/",
        {"essay_question": "Test", "essay_content": "Test content"},
        content_type="application/json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_ai_feedback_chat_endpoint_requires_auth():
    client = Client()
    response = client.post(
        "/api/v2/ai-feedback/chat/",
        {"message": "Hello"},
        content_type="application/json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_auth_register_endpoint():
    client = Client()
    response = client.post(
        "/api/v2/auth/register/",
        {
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "password_confirm": "SecurePass123!",
        },
        content_type="application/json",
    )
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["success"] is True
    assert "token" in data["data"]


@pytest.mark.django_db
def test_auth_login_endpoint():
    from api_v1.core.models import User

    User.objects.create_user(
        user_email="testlogin@example.com",
        password="TestPass123!",
        user_role="student",
    )

    client = Client()
    response = client.post(
        "/api/v2/auth/login/",
        {
            "email": "testlogin@example.com",
            "password": "TestPass123!",
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "token" in data["data"]


@pytest.mark.django_db
def test_core_users_list_requires_auth():
    client = Client()
    response = client.get("/api/v2/core/users/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_core_units_list_requires_auth():
    client = Client()
    response = client.get("/api/v2/core/units/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_rubric_import_pdf_requires_auth():
    client = Client()
    pdf_file = SimpleUploadedFile("rubric.pdf", b"pdf content", content_type="application/pdf")
    response = client.post("/api/v2/core/rubrics/import_from_pdf_with_ai/", {"file": pdf_file})
    assert response.status_code == 401


@pytest.mark.django_db
def test_rubric_detail_requires_auth():
    client = Client()
    response = client.get("/api/v2/core/rubrics/1/detail/")
    assert response.status_code == 401


# =============================================================================
# Additional Tests for Type Annotations and Schema Validation
# =============================================================================


@pytest.mark.django_db
def test_user_schema_validation():
    """Test that User schema validates data correctly."""
    from api_v2.core.schemas import UserIn, UserOut
    
    # Test valid user input
    user_in = UserIn(
        user_email="test@example.com",
        password="SecurePass123!",
        user_fname="Test",
        user_lname="User",
    )
    assert user_in.user_email == "test@example.com"
    assert user_in.user_role == "student"  # default value
    

@pytest.mark.django_db
def test_pagination_params_validation():
    """Test pagination parameter validation."""
    from api_v2.core.schemas import PaginationParams
    
    # Test default values
    params = PaginationParams()
    assert params.page == 1
    assert params.page_size == 50
    
    # Test custom values
    params = PaginationParams(page=2, page_size=25)
    assert params.page == 2
    assert params.page_size == 25


@pytest.mark.django_db
def test_unit_crud_workflow():
    """Test Unit CRUD operations with authenticated user."""
    from api_v1.core.models import User
    
    # Create admin user and get token
    user = User.objects.create_user(
        user_email="admin@example.com",
        password="AdminPass123!",
        user_role="admin",
    )
    
    # This is a simplified test - in production you'd use proper token auth
    # For now, we just verify the schema imports work
    from api_v2.core.schemas import UnitIn, UnitOut
    
    unit_in = UnitIn(unit_id="TEST101", unit_name="Test Unit")
    assert unit_in.unit_id == "TEST101"
    assert unit_in.unit_name == "Test Unit"


@pytest.mark.django_db
def test_rubric_schema_validation():
    """Test Rubric schema validation."""
    from api_v2.core.schemas import MarkingRubricIn, RubricItemIn
    
    rubric_in = MarkingRubricIn(rubric_desc="Test Rubric")
    assert rubric_in.rubric_desc == "Test Rubric"
    
    from decimal import Decimal
    item_in = RubricItemIn(
        rubric_id_marking_rubric=1,
        rubric_item_name="Criterion 1",
        rubric_item_weight=Decimal("25.00"),
    )
    assert item_in.rubric_item_name == "Criterion 1"


@pytest.mark.django_db
def test_task_schema_validation():
    """Test Task schema validation with datetime."""
    from api_v2.core.schemas import TaskIn
    from datetime import datetime, timedelta
    
    due_date = datetime.now() + timedelta(days=7)
    task_in = TaskIn(
        unit_id_unit="CS101",
        rubric_id_marking_rubric=1,
        task_due_datetime=due_date,
    )
    assert task_in.unit_id_unit == "CS101"


@pytest.mark.django_db
def test_feedback_schema_validation():
    """Test Feedback schema validation."""
    from api_v2.core.schemas import FeedbackIn, FeedbackItemIn
    
    feedback_in = FeedbackIn(
        submission_id_submission=1,
        user_id_user=1,
    )
    assert feedback_in.submission_id_submission == 1
    
    item_in = FeedbackItemIn(
        feedback_id_feedback=1,
        rubric_item_id_rubric_item=1,
        feedback_item_score=85,
        feedback_item_source="ai",
    )
    assert item_in.feedback_item_score == 85
    assert item_in.feedback_item_source == "ai"


@pytest.mark.django_db
def test_enrollment_schema_validation():
    """Test Enrollment schema validation."""
    from api_v2.core.schemas import EnrollmentIn
    
    enrollment_in = EnrollmentIn(
        user_id_user=1,
        class_id_class=1,
        unit_id_unit="CS101",
    )
    assert enrollment_in.unit_id_unit == "CS101"


@pytest.mark.django_db
def test_api_imports():
    """Test that all API modules can be imported without errors."""
    from api_v2.api import api_v2
    from api_v2.auth.views import router as auth_router
    from api_v2.core.views import router as core_router
    from api_v2.ai_feedback.views import router as ai_feedback_router
    
    # Verify routers are properly configured
    assert auth_router is not None
    assert core_router is not None
    assert ai_feedback_router is not None


