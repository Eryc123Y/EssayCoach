"""Tests for RubricManager."""

from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from api_v1.ai_feedback.rubric_parser import SiliconFlowRubricParser
from api_v1.core.models import MarkingRubric, RubricItem, RubricLevelDesc, User
from api_v1.core.rubric_manager import RubricImportError, RubricManager


@pytest.fixture
def teacher(db):
    """Fixture for a teacher user."""
    return User.objects.create_user(
        user_email="teacher@example.com", password="password123", user_role="lecturer"
    )


@pytest.fixture
def valid_rubric_data():
    """Fixture for valid rubric data returned by parser."""
    return {
        "is_rubric": True,
        "confidence": 0.95,
        "rubric_name": "Essay Rubric",
        "dimensions": [
            {
                "name": "Argumentation",
                "weight": 60.0,
                "levels": [
                    {
                        "name": "Poor",
                        "score_min": 0,
                        "score_max": 30,
                        "description": "Lacks arguments",
                    },
                    {
                        "name": "Excellent",
                        "score_min": 31,
                        "score_max": 60,
                        "description": "Strong arguments",
                    },
                ],
            },
            {
                "name": "Style",
                "weight": 40.0,
                "levels": [
                    {
                        "name": "Good",
                        "score_min": 0,
                        "score_max": 40,
                        "description": "Appropriate tone",
                    }
                ],
            },
        ],
    }


@pytest.fixture
def manager():
    """Fixture for RubricManager with a mocked parser."""
    mock_parser = MagicMock(spec=SiliconFlowRubricParser)
    mock_parser.model = "test-model"
    return RubricManager(parser=mock_parser)


@pytest.mark.django_db
class TestRubricManager:
    """Test suite for RubricManager."""

    def test_detect_if_rubric_true(self, manager):
        """Test rubric detection when is_rubric is true."""
        data = {"is_rubric": True}
        is_rubric, reason = manager._detect_if_rubric(data)
        assert is_rubric is True
        assert reason == ""

    def test_detect_if_rubric_false(self, manager):
        """Test rubric detection when is_rubric is false."""
        data = {"is_rubric": False, "reason": "Not a rubric"}
        is_rubric, reason = manager._detect_if_rubric(data)
        assert is_rubric is False
        assert reason == "Not a rubric"

    def test_validate_rubric_data_valid(self, manager, valid_rubric_data):
        """Test validation with valid rubric data."""
        # Should not raise any error
        manager._validate_rubric_data(valid_rubric_data)

    def test_validate_rubric_data_missing_name(self, manager, valid_rubric_data):
        """Test validation fails if rubric name is missing."""
        valid_rubric_data["rubric_name"] = ""
        with pytest.raises(RubricImportError) as excinfo:
            manager._validate_rubric_data(valid_rubric_data)
        assert "Missing rubric name" in str(excinfo.value)

    def test_validate_rubric_data_invalid_weights(self, manager, valid_rubric_data):
        """Test validation fails if weights don't sum to ~100."""
        valid_rubric_data["dimensions"][0]["weight"] = 10.0
        with pytest.raises(RubricImportError) as excinfo:
            manager._validate_rubric_data(valid_rubric_data)
        assert "weights must sum to ~100" in str(excinfo.value)

    def test_validate_rubric_data_invalid_score_range(self, manager, valid_rubric_data):
        """Test validation fails if score range is invalid (min >= max)."""
        valid_rubric_data["dimensions"][0]["levels"][0]["score_min"] = 50
        valid_rubric_data["dimensions"][0]["levels"][0]["score_max"] = 40
        with pytest.raises(RubricImportError) as excinfo:
            manager._validate_rubric_data(valid_rubric_data)
        assert "invalid score range" in str(excinfo.value)

    def test_create_rubric_in_db_success(self, manager, teacher, valid_rubric_data):
        """Test successful database creation of rubric and its components."""
        rubric = manager._create_rubric_in_db(valid_rubric_data, teacher, "Custom Name")

        assert rubric.rubric_desc == "Custom Name"
        assert rubric.user_id_user == teacher
        assert MarkingRubric.objects.count() == 1

        # Check dimensions (RubricItems)
        assert RubricItem.objects.filter(rubric_id_marking_rubric=rubric).count() == 2
        item_arg = RubricItem.objects.get(rubric_item_name="Argumentation")
        assert item_arg.rubric_item_weight == Decimal("60.0")

        # Check levels (RubricLevelDescs)
        assert (
            RubricLevelDesc.objects.filter(rubric_item_id_rubric_item=item_arg).count()
            == 2
        )
        level_poor = RubricLevelDesc.objects.get(
            rubric_item_id_rubric_item=item_arg, level_min_score=0
        )
        assert level_poor.level_max_score == 30
        assert "Poor" in level_poor.level_desc

    def test_create_rubric_in_db_rollback_on_error(
        self, manager, teacher, valid_rubric_data
    ):
        """Test that transaction rolls back if an error occurs during save."""
        # Force an error by providing invalid data that passes validation but fails DB save
        # (e.g. name too long)
        valid_rubric_data["dimensions"][0]["name"] = "X" * 101  # max_length is 50

        with pytest.raises(RubricImportError):
            manager._create_rubric_in_db(valid_rubric_data, teacher, "Rollback Test")

        # Verify nothing was saved
        assert MarkingRubric.objects.filter(rubric_desc="Rollback Test").count() == 0
        assert RubricItem.objects.count() == 0

    def test_import_rubric_with_ai_success(self, manager, teacher, valid_rubric_data):
        """Test the full import workflow successfully."""
        manager.parser.parse_pdf.return_value = valid_rubric_data
        pdf_file = SimpleUploadedFile("test.pdf", b"content")

        result = manager.import_rubric_with_ai(pdf_file, teacher)

        assert result["success"] is True
        assert result["items_count"] == 2
        assert result["levels_count"] == 3
        assert MarkingRubric.objects.filter(rubric_id=result["rubric_id"]).exists()

    def test_import_rubric_with_ai_not_a_rubric(self, manager, teacher):
        """Test import workflow when AI says it's not a rubric."""
        manager.parser.parse_pdf.return_value = {
            "is_rubric": False,
            "reason": "This is a grocery list",
            "confidence": 0.9,
        }
        pdf_file = SimpleUploadedFile("list.pdf", b"eggs, milk")

        result = manager.import_rubric_with_ai(pdf_file, teacher)

        assert result["success"] is False
        assert result["detection"]["is_rubric"] is False
        assert result["detection"]["reason"] == "This is a grocery list"
        assert MarkingRubric.objects.count() == 0

    def test_generate_rubric_text(self, manager, teacher):
        """Test rubric text generation for AI prompt."""
        # Create a sample rubric
        rubric = MarkingRubric.objects.create(
            user_id_user=teacher, rubric_desc="Test Rubric"
        )
        item = RubricItem.objects.create(
            rubric_id_marking_rubric=rubric,
            rubric_item_name="Grammar",
            rubric_item_weight=Decimal("50.0"),
        )
        RubricLevelDesc.objects.create(
            rubric_item_id_rubric_item=item,
            level_min_score=0,
            level_max_score=10,
            level_desc="Poor grammar",
        )

        text = manager.generate_rubric_text(rubric)

        assert "Rubric: Test Rubric" in text
        assert "Dimension: Grammar (Weight: 50.0%)" in text
        assert "- Score 0-10: Poor grammar" in text
