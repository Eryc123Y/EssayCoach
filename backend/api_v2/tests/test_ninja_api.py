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
    from core.models import User

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
    from api_v2.core.schemas import UserIn

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
    from core.models import User

    _ = User.objects.create_user(
        user_email="admin@example.com",
        password="AdminPass123!",
        user_role="admin",
    )

    # This is a simplified test - in production you'd use proper token auth
    # For now, we just verify the schema imports work
    from api_v2.core.schemas import UnitIn

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
    from datetime import datetime, timedelta

    from api_v2.core.schemas import TaskIn

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
    from api_v2.ai_feedback.views import router as ai_feedback_router
    from api_v2.auth.views import router as auth_router
    from api_v2.core.views import router as core_router

    # Verify routers are properly configured
    assert auth_router is not None
    assert core_router is not None
    assert ai_feedback_router is not None


# =============================================================================
# RBAC Permission Tests for Users CRUD
# =============================================================================


@pytest.mark.django_db
def test_users_list_student_can_only_view_self():
    """Test that students can only view their own user record."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    # Create student user
    student = User.objects.create_user(
        user_email="student@example.com",
        password="StudentPass123!",
        user_role="student",
    )
    student_token = Token.objects.create(user=student)

    # Create another user
    User.objects.create_user(
        user_email="other@example.com",
        password="OtherPass123!",
        user_role="student",
    )

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {student_token.key}"

    # Student listing users should only see themselves
    response = client.get("/api/v2/core/users/", {"user_role": "student"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["user_id"] == student.user_id


@pytest.mark.django_db
def test_users_list_lecturer_can_view_all():
    """Test that lecturers can view all users."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    # Create lecturer user
    lecturer = User.objects.create_user(
        user_email="lecturer@example.com",
        password="LecturerPass123!",
        user_role="lecturer",
    )
    lecturer_token = Token.objects.create(user=lecturer)

    # Create some students
    User.objects.create_user(
        user_email="student1@example.com",
        password="StudentPass123!",
        user_role="student",
    )
    User.objects.create_user(
        user_email="student2@example.com",
        password="StudentPass123!",
        user_role="student",
    )

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {lecturer_token.key}"

    response = client.get("/api/v2/core/users/", {"user_role": "student"})
    assert response.status_code == 200
    data = response.json()
    # Should see all users (lecturer + 2 students)
    assert len(data) >= 2


@pytest.mark.django_db
def test_users_list_admin_can_view_all():
    """Test that admins can view all users."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    # Create admin user
    admin = User.objects.create_user(
        user_email="admin@example.com",
        password="AdminPass123!",
        user_role="admin",
    )
    admin_token = Token.objects.create(user=admin)

    # Create some users
    User.objects.create_user(
        user_email="lecturer@example.com",
        password="LecturerPass123!",
        user_role="lecturer",
    )
    User.objects.create_user(
        user_email="student@example.com",
        password="StudentPass123!",
        user_role="student",
    )

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {admin_token.key}"

    response = client.get("/api/v2/core/users/", {"user_role": "student"})
    assert response.status_code == 200
    data = response.json()
    # Should see all users
    assert len(data) >= 2


@pytest.mark.django_db
def test_user_create_student_forbidden():
    """Test that students cannot create new users."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    student = User.objects.create_user(
        user_email="student@example.com",
        password="StudentPass123!",
        user_role="student",
    )
    student_token = Token.objects.create(user=student)

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {student_token.key}"

    response = client.post(
        "/api/v2/core/users/",
        {
            "user_email": "newuser@example.com",
            "password": "NewPass123!",
            "user_fname": "New",
            "user_lname": "User",
        },
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_user_create_lecturer_allowed():
    """Test that lecturers can create new users."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    lecturer = User.objects.create_user(
        user_email="lecturer@example.com",
        password="LecturerPass123!",
        user_role="lecturer",
    )
    lecturer_token = Token.objects.create(user=lecturer)

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {lecturer_token.key}"

    response = client.post(
        "/api/v2/core/users/",
        {
            "user_email": "newuser@example.com",
            "password": "NewPass123!",
            "user_fname": "New",
            "user_lname": "User",
            "user_role": "student",
        },
        content_type="application/json",
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_email"] == "newuser@example.com"


@pytest.mark.django_db
def test_user_create_admin_allowed():
    """Test that admins can create new users."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    admin = User.objects.create_user(
        user_email="admin@example.com",
        password="AdminPass123!",
        user_role="admin",
    )
    admin_token = Token.objects.create(user=admin)

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {admin_token.key}"

    response = client.post(
        "/api/v2/core/users/",
        {
            "user_email": "newuser@example.com",
            "password": "NewPass123!",
            "user_fname": "New",
            "user_lname": "User",
            "user_role": "student",
        },
        content_type="application/json",
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_email"] == "newuser@example.com"


@pytest.mark.django_db
def test_user_get_student_can_only_view_self():
    """Test that students can only view their own profile."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    student = User.objects.create_user(
        user_email="student@example.com",
        password="StudentPass123!",
        user_role="student",
    )
    student_token = Token.objects.create(user=student)

    other_user = User.objects.create_user(
        user_email="other@example.com",
        password="OtherPass123!",
        user_role="student",
    )

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {student_token.key}"

    # Student trying to view another user - should fail
    response = client.get(f"/api/v2/core/users/{other_user.user_id}/")
    assert response.status_code == 403

    # Student viewing themselves - should succeed
    response = client.get(f"/api/v2/core/users/{student.user_id}/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_user_update_student_can_only_update_self():
    """Test that students can only update their own profile."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    student = User.objects.create_user(
        user_email="student@example.com",
        password="StudentPass123!",
        user_role="student",
    )
    student_token = Token.objects.create(user=student)

    other_user = User.objects.create_user(
        user_email="other@example.com",
        password="OtherPass123!",
        user_role="student",
    )

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {student_token.key}"

    # Student trying to update another user - should fail
    response = client.put(
        f"/api/v2/core/users/{other_user.user_id}/",
        {"user_fname": "Updated"},
        content_type="application/json",
    )
    assert response.status_code == 403

    # Student updating themselves - should succeed
    response = client.put(
        f"/api/v2/core/users/{student.user_id}/",
        {"user_fname": "Updated"},
        content_type="application/json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_user_update_lecturer_cannot_update_admin():
    """Test that lecturers cannot update admin accounts."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    lecturer = User.objects.create_user(
        user_email="lecturer@example.com",
        password="LecturerPass123!",
        user_role="lecturer",
    )
    lecturer_token = Token.objects.create(user=lecturer)

    admin = User.objects.create_user(
        user_email="admin@example.com",
        password="AdminPass123!",
        user_role="admin",
    )

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {lecturer_token.key}"

    # Lecturer trying to update admin - should fail
    response = client.put(
        f"/api/v2/core/users/{admin.user_id}/",
        {"user_fname": "Updated"},
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_user_delete_only_admin_can_delete():
    """Test that only admins can delete users."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    # Create users with different roles
    student = User.objects.create_user(
        user_email="student@example.com",
        password="StudentPass123!",
        user_role="student",
    )
    student_token = Token.objects.create(user=student)

    lecturer = User.objects.create_user(
        user_email="lecturer@example.com",
        password="LecturerPass123!",
        user_role="lecturer",
    )
    lecturer_token = Token.objects.create(user=lecturer)

    admin = User.objects.create_user(
        user_email="admin@example.com",
        password="AdminPass123!",
        user_role="admin",
    )
    admin_token = Token.objects.create(user=admin)

    # Create a target user to delete
    target_user = User.objects.create_user(
        user_email="target@example.com",
        password="TargetPass123!",
        user_role="student",
    )
    target_user_id = target_user.user_id

    # Student trying to delete - should fail
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {student_token.key}"
    response = client.delete(f"/api/v2/core/users/{target_user_id}/")
    assert response.status_code == 403

    # Lecturer trying to delete - should fail
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {lecturer_token.key}"
    response = client.delete(f"/api/v2/core/users/{target_user_id}/")
    assert response.status_code == 403

    # Admin deleting - should succeed
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {admin_token.key}"
    response = client.delete(f"/api/v2/core/users/{target_user_id}/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_user_delete_admin_cannot_delete_other_admin():
    """Test that admins cannot delete other admin accounts."""
    from core.models import User
    from rest_framework.authtoken.models import Token

    admin1 = User.objects.create_user(
        user_email="admin1@example.com",
        password="AdminPass123!",
        user_role="admin",
    )
    admin1_token = Token.objects.create(user=admin1)

    admin2 = User.objects.create_user(
        user_email="admin2@example.com",
        password="AdminPass123!",
        user_role="admin",
    )

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {admin1_token.key}"

    # Admin trying to delete another admin - should fail
    response = client.delete(f"/api/v2/core/users/{admin2.user_id}/")
    assert response.status_code == 403


# =============================================================================
# JWT Authentication Tests
# =============================================================================


@pytest.mark.django_db
def test_login_with_jwt_returns_tokens():
    """Test that JWT login returns access and refresh tokens."""
    from core.models import User

    User.objects.create_user(
        user_email="jwtuser@example.com",
        password="JwtPass123!",
        user_role="student",
    )

    client = Client()
    response = client.post(
        "/api/v2/auth/login-with-jwt/",
        {
            "email": "jwtuser@example.com",
            "password": "JwtPass123!",
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "token" in data["data"]  # access token
    assert "refresh" in data["data"]
    assert "expires_at" in data["data"]
    assert "user" in data["data"]
    assert data["data"]["user"]["email"] == "jwtuser@example.com"


@pytest.mark.django_db
def test_refresh_token_returns_new_tokens():
    """Test that refresh token endpoint returns new access and refresh tokens."""
    from core.models import User

    User.objects.create_user(
        user_email="refreshuser@example.com",
        password="RefreshPass123!",
        user_role="student",
    )

    client = Client()

    # First, login to get tokens
    login_response = client.post(
        "/api/v2/auth/login-with-jwt/",
        {
            "email": "refreshuser@example.com",
            "password": "RefreshPass123!",
        },
        content_type="application/json",
    )

    assert login_response.status_code == 200
    login_data = login_response.json()
    refresh_token = login_data["data"]["refresh"]

    # Now use refresh token to get new tokens
    refresh_response = client.post(
        "/api/v2/auth/refresh/",
        {"refresh": refresh_token},
        content_type="application/json",
    )

    assert refresh_response.status_code == 200
    refresh_data = refresh_response.json()
    assert "access" in refresh_data
    assert "refresh" in refresh_data
    assert "expires_at" in refresh_data

    # Verify new access token is different from original
    assert refresh_data["access"] != login_data["data"]["token"]

    # Verify new refresh token is different from original (token rotation)
    assert refresh_data["refresh"] != refresh_token


@pytest.mark.django_db
def test_refresh_token_invalid_token():
    """Test that invalid refresh token returns 401."""
    client = Client()

    response = client.post(
        "/api/v2/auth/refresh/",
        {"refresh": "invalid_token_here"},
        content_type="application/json",
    )

    assert response.status_code == 401
    data = response.json()
    assert "Invalid or expired refresh token" in str(data)


@pytest.mark.django_db
def test_refresh_token_rotation():
    """Test that refresh token rotation works - old token is invalidated."""
    from core.models import User

    User.objects.create_user(
        user_email="rotationuser@example.com",
        password="RotationPass123!",
        user_role="student",
    )

    client = Client()

    # Login to get tokens
    login_response = client.post(
        "/api/v2/auth/login-with-jwt/",
        {
            "email": "rotationuser@example.com",
            "password": "RotationPass123!",
        },
        content_type="application/json",
    )

    login_data = login_response.json()
    original_refresh = login_data["data"]["refresh"]

    # First refresh
    refresh1_response = client.post(
        "/api/v2/auth/refresh/",
        {"refresh": original_refresh},
        content_type="application/json",
    )

    assert refresh1_response.status_code == 200
    refresh1_data = refresh1_response.json()
    new_refresh = refresh1_data["refresh"]

    # Try to use the old refresh token again - should fail
    refresh2_response = client.post(
        "/api/v2/auth/refresh/",
        {"refresh": original_refresh},
        content_type="application/json",
    )

    # Should fail because token rotation blacklists the old token
    assert refresh2_response.status_code == 401

    # But the new refresh token should work
    refresh3_response = client.post(
        "/api/v2/auth/refresh/",
        {"refresh": new_refresh},
        content_type="application/json",
    )

    assert refresh3_response.status_code == 200


@pytest.mark.django_db
def test_access_protected_resource_with_jwt():
    """Test accessing protected resource with JWT access token."""
    from core.models import User

    User.objects.create_user(
        user_email="protecteduser@example.com",
        password="ProtectedPass123!",
        user_role="student",
    )

    client = Client()

    # Login to get JWT tokens
    login_response = client.post(
        "/api/v2/auth/login-with-jwt/",
        {
            "email": "protecteduser@example.com",
            "password": "ProtectedPass123!",
        },
        content_type="application/json",
    )

    login_data = login_response.json()
    access_token = login_data["data"]["token"]

    # Access protected endpoint with JWT token
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {access_token}"
    response = client.get("/api/v2/auth/me/jwt/")

    assert response.status_code == 200
    data = response.json()
    assert data["data"]["email"] == "protecteduser@example.com"
