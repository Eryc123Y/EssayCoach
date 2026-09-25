"""The PDF import route uses the subscription adapter and staff permissions."""

import os
from unittest.mock import patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import MarkingRubric, RubricItem, User


def _client(role: str) -> Client:
    user = User.objects.create_user(
        user_email=f"{role}@example.com", password="TestPass123!", user_role=role,
    )
    return Client(HTTP_AUTHORIZATION=f"Bearer {create_jwt_pair(user).access}")


def _upload(client: Client):
    return client.post(
        "/api/v2/core/rubrics/import_from_pdf_with_ai/",
        {
            "file": SimpleUploadedFile("rubric.pdf", b"%PDF", content_type="application/pdf"),
            "rubric_name": "Custom title",
        },
    )


@pytest.mark.django_db
def test_students_cannot_invoke_pdf_rubric_import():
    with patch("ai_feedback.codex_rubric_parser.CodexRubricParser.parse_pdf") as parse:
        assert _upload(_client("student")).status_code == 403
        parse.assert_not_called()


@pytest.mark.django_db
def test_lecturer_can_import_rubric_through_codex_adapter():
    structured = {
        "is_rubric": True, "confidence": 0.98, "rubric_name": "Argument writing",
        "reason": "", "dimensions": [{
            "name": "Reasoning", "weight": 100.0,
            "levels": [
                {"name": "Developing", "score_min": 0, "score_max": 4, "description": "Limited support"},
                {"name": "Strong", "score_min": 5, "score_max": 10, "description": "Clear support"},
            ],
        }],
    }
    with patch.dict(os.environ, {"CODEX_BIN": "/bin/true"}), patch(
        "ai_feedback.codex_rubric_parser.CodexRubricParser.parse_pdf", return_value=structured,
    ):
        response = _upload(_client("lecturer"))
    assert response.status_code == 201, response.content
    assert response.json()["ai_model"] == "gpt-6-luna"
    assert MarkingRubric.objects.filter(rubric_desc="Custom title").exists()
    assert RubricItem.objects.filter(rubric_item_name="Reasoning").exists()


@pytest.mark.django_db
def test_student_can_duplicate_public_rubric_as_private_study_rubric():
    lecturer = User.objects.create_user(
        user_email="rubric-owner@example.com", password="TestPass123!", user_role="lecturer",
    )
    rubric = MarkingRubric.objects.create(user_id_user=lecturer, rubric_desc="Public sample", visibility="public")
    response = _client("student").post(
        f"/api/v2/core/rubrics/{rubric.pk}/duplicate/", {}, content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json()["visibility"] == "private"
