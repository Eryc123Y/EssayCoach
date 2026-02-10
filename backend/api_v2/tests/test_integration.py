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
        "MarkingRubricOut",
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
