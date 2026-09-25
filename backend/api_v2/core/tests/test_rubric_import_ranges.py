"""A scoring band may represent one exact point, but bands cannot overlap."""

import pytest

from core.rubric_manager import RubricImportError, RubricManager


def _rubric(levels):
    return {
        "rubric_name": "Writing", "dimensions": [
            {"name": "Argument", "weight": 100, "levels": levels},
        ],
    }


def test_single_point_score_band_is_valid():
    manager = RubricManager.__new__(RubricManager)
    manager._validate_rubric_data(_rubric([
        {"name": "Low", "score_min": 0, "score_max": 8},
        {"name": "Nine", "score_min": 9, "score_max": 9},
        {"name": "Ten", "score_min": 10, "score_max": 10},
    ]))


def test_overlapping_score_bands_are_rejected():
    manager = RubricManager.__new__(RubricManager)
    with pytest.raises(RubricImportError, match="overlapping"):
        manager._validate_rubric_data(_rubric([
            {"name": "Low", "score_min": 0, "score_max": 5},
            {"name": "High", "score_min": 5, "score_max": 10},
        ]))
