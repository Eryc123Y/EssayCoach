"""
Test Django Ninja API v2.
Run with: uv run pytest api_v2/tests/test_ninja_api.py -v
"""

import pytest
from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import MagicMock, patch


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

    user = User.objects.create_user(
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
