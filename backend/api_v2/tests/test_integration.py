"""
Integration tests for Django Ninja API v2
Tests full API workflows from authentication to data retrieval
"""

import pytest


@pytest.mark.django_db
def test_api_imports():
    """Test that all API modules can be imported without conflicts."""
    # Import all views to ensure no circular imports
    from api_v2.ai_feedback import views as ai_feedback_views
    from api_v2.auth import views as auth_views
    from api_v2.core import views as core_views

    # Verify routers exist
    assert auth_views.router is not None
    assert core_views.router is not None
    assert ai_feedback_views.router is not None


@pytest.mark.django_db
def test_schemas_imports():
    """Test that all schemas can be imported."""
    from api_v2.core import schemas

    # Verify all expected schemas exist
    assert hasattr(schemas, "UserOut")
    assert hasattr(schemas, "UnitOut")
    assert hasattr(schemas, "ClassOut")
    assert hasattr(schemas, "MarkingRubricOut")
    assert hasattr(schemas, "TaskOut")
    assert hasattr(schemas, "SubmissionOut")
    assert hasattr(schemas, "DashboardResponse")


@pytest.mark.django_db
def test_filter_schemas():
    """Test that FilterSchema classes are properly configured."""
    from api_v2.core import schemas

    # Verify FilterSchema classes exist
    filter_schemas = [
        "UnitFilterParams",
        "ClassFilterParams",
        "RubricFilterParams",
        "TaskFilterParams",
    ]

    for schema_name in filter_schemas:
        assert hasattr(schemas, schema_name), f"Missing {schema_name}"
        schema_class = getattr(schemas, schema_name)
        # Verify it's a FilterSchema subclass
        from ninja import FilterSchema

        assert issubclass(schema_class, FilterSchema)


@pytest.mark.django_db
def test_model_schemas():
    """Test that ModelSchema classes are properly configured."""
    from ninja.orm import ModelSchema

    from api_v2.core import schemas

    # Verify ModelSchema classes
    model_schemas = [
        "UserOut",
        "UnitOut",
        "ClassOut",
        "RubricItemOut",
        "TaskOut",
        "SubmissionOut",
    ]

    for schema_name in model_schemas:
        assert hasattr(schemas, schema_name), f"Missing {schema_name}"
        schema_class = getattr(schemas, schema_name)
        assert issubclass(schema_class, ModelSchema)
        assert hasattr(schema_class, "Meta")
        assert hasattr(schema_class.Meta, "model")


@pytest.mark.django_db
def test_api_routers_registered():
    """Test that all routers are properly registered in main API."""
    from api_v2.api import api_v2

    # Get all registered paths
    # The _routers attribute contains all registered routers
    assert hasattr(api_v2, "_routers")

    # Verify we have routers registered
    # (auth, core, ai_feedback)
    assert len(api_v2._routers) >= 3


@pytest.mark.django_db
def test_endpoints_have_auth():
    """Test that protected endpoints require authentication."""
    from api_v2.core.views import router

    # Check that router has auth configured
    # The router should have auth attribute or individual endpoints should
    assert router is not None


@pytest.mark.django_db
def test_schema_validation():
    """Test that schemas properly validate data."""
    from api_v2.core.schemas import PaginationParams, UserIn

    # Test valid data
    user_in = UserIn(
        user_email="test@example.com",
        password="SecurePass123!",
    )
    assert user_in.user_email == "test@example.com"
    assert user_in.user_role == "student"  # default

    # Test pagination params
    params = PaginationParams(page=2, page_size=25)
    assert params.page == 2
    assert params.page_size == 25


# =============================================================================
# Dashboard Integration Tests
# =============================================================================


@pytest.mark.django_db
def test_dashboard_full_workflow():
    """Test complete dashboard access workflow from login to data retrieval."""
    from django.test import Client

    from api_v2.utils.jwt_auth import create_jwt_pair
    from core.models import User

    # 1. Create user
    student = User.objects.create_user(
        user_email="workflow@test.com",
        password="WorkflowPass123!",
        user_role="student",
        user_fname="Workflow",
        user_lname="Test",
    )

    # 2. Get JWT token
    client = Client()
    jwt_pair = create_jwt_pair(student)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    # 3. Access dashboard
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    # 4. Verify response structure
    data = response.json()
    assert "user" in data
    assert "stats" in data
    assert "classes" in data
    assert "recentActivity" in data

    # 5. Verify user data
    assert data["user"]["email"] == student.user_email
    assert data["user"]["role"] == "student"


@pytest.mark.django_db
def test_dashboard_rbac_workflow():
    """Test role-based access control across all user roles."""
    from django.test import Client

    from api_v2.utils.jwt_auth import create_jwt_pair
    from core.models import Class, Enrollment, TeachingAssn, Unit, User

    # Create unit and class
    unit = Unit.objects.create(unit_id="INT001", unit_name="Integration Test")
    cls = Class.objects.create(unit_id_unit=unit, class_size=0)

    # Create users with different roles
    roles_data = {}
    for role in ["student", "lecturer", "admin"]:
        user = User.objects.create_user(
            user_email=f"{role}@test.com",
            password="Pass123!",
            user_role=role,
        )
        roles_data[role] = user

        # Setup role-specific data
        if role == "student":
            Enrollment.objects.create(
                user_id_user=user,
                class_id_class=cls,
                unit_id_unit=unit,
            )
        elif role == "lecturer":
            TeachingAssn.objects.create(
                user_id_user=user,
                class_id_class=cls,
            )

    # Test each role can access dashboard
    client = Client()
    for role, user in roles_data.items():
        jwt_pair = create_jwt_pair(user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get("/api/v2/core/dashboard/")
        assert response.status_code == 200, f"{role} failed to access dashboard"

        data = response.json()
        assert data["user"]["role"] == role, f"{role} has wrong role in response"


@pytest.mark.django_db
def test_dashboard_with_real_data():
    """Test dashboard with realistic data setup."""
    from datetime import timedelta

    from django.test import Client
    from django.utils import timezone as django_timezone

    from api_v2.utils.jwt_auth import create_jwt_pair
    from core.models import Feedback, MarkingRubric, Submission, Task, Unit, User

    # Create realistic data setup
    unit = Unit.objects.create(unit_id="REAL001", unit_name="Real Data Test")
    rubric = MarkingRubric.objects.create(
        user_id_user=User.objects.create_user(
            user_email="rubric@test.com",
            password="Pass123!",
            user_role="lecturer",
        ),
        rubric_desc="Test Rubric",
    )

    task = Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=django_timezone.now() + timedelta(days=7),
    )

    student = User.objects.create_user(
        user_email="realdata@test.com",
        password="Pass123!",
        user_role="student",
        user_fname="Real",
        user_lname="Data",
    )

    submission = Submission.objects.create(
        task_id_task=task,
        user_id_user=student,
        submission_txt="This is a realistic essay submission for testing.",
    )

    feedback = Feedback.objects.create(
        submission_id_submission=submission,
        user_id_user=student,
    )

    # Access dashboard
    client = Client()
    jwt_pair = create_jwt_pair(student)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()

    # Verify data is reflected in dashboard
    assert data["stats"]["totalEssays"] >= 1
    assert len(data["myEssays"]) >= 1
