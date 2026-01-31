"""Rubric Manager for AI-assisted rubric import and database operations."""

from __future__ import annotations

import json
import logging
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from django.db import transaction

from ai_feedback.rubric_parser import RubricParseError, SiliconFlowRubricParser
from core.models import MarkingRubric, RubricItem, RubricLevelDesc

if TYPE_CHECKING:
    from django.core.files.uploadedfile import UploadedFile

    from core.models import User

logger = logging.getLogger(__name__)


class RubricImportError(Exception):
    """Raised when rubric import validation or database save fails."""

    pass


class RubricManager:
    """Manage rubric import from AI-parsed PDF files.

    Handles the complete workflow:
    1. Parse PDF using SiliconFlowRubricParser
    2. Detect if PDF is actually a rubric
    3. Validate rubric structure
    4. Save to database atomically
    """

    def __init__(self, parser: SiliconFlowRubricParser | None = None):
        self.parser = parser or SiliconFlowRubricParser()

    def import_rubric_with_ai(
        self, pdf_file: UploadedFile, user: User, rubric_name: str | None = None
    ) -> dict[str, Any]:
        """Import rubric from PDF using AI parsing.

        Args:
            pdf_file: Uploaded PDF file
            user: User creating the rubric
            rubric_name: Optional custom name (overrides AI-extracted name)

        Returns:
            Dictionary with import results:
            {
              "success": bool,
              "rubric_id": int,
              "rubric_name": str,
              "items_count": int,
              "levels_count": int,
              "ai_parsed": bool,
              "ai_model": str,
              "detection": {
                "is_rubric": bool,
                "confidence": float,
                "reason": str (if not a rubric)
              }
            }

        Raises:
            RubricParseError: If PDF parsing fails
            RubricImportError: If validation or database save fails
        """
        logger.info(f"Starting rubric import for user {user.user_id}")

        try:
            parsed_data = self.parser.parse_pdf(pdf_file)

            is_rubric, reason = self._detect_if_rubric(parsed_data)

            if not is_rubric:
                logger.warning(f"PDF is not a rubric: {reason}")
                return {
                    "success": False,
                    "ai_parsed": True,
                    "ai_model": self.parser.model,
                    "detection": {
                        "is_rubric": False,
                        "confidence": parsed_data.get("confidence", 0.0),
                        "reason": reason,
                    },
                }

            self._validate_rubric_data(parsed_data)

            final_rubric_name = rubric_name or parsed_data.get("rubric_name", f"Rubric from {pdf_file.name}")

            rubric = self._create_rubric_in_db(parsed_data, user, final_rubric_name)

            items_count = len(parsed_data.get("dimensions", []))
            levels_count = sum(len(dim.get("levels", [])) for dim in parsed_data.get("dimensions", []))

            logger.info(
                f"Successfully imported rubric {rubric.rubric_id} with {items_count} items and {levels_count} levels"
            )

            return {
                "success": True,
                "rubric_id": rubric.rubric_id,
                "rubric_name": rubric.rubric_desc,
                "items_count": items_count,
                "levels_count": levels_count,
                "ai_parsed": True,
                "ai_model": self.parser.model,
                "detection": {
                    "is_rubric": True,
                    "confidence": parsed_data.get("confidence", 1.0),
                },
            }

        except RubricParseError as e:
            logger.error(f"Rubric parsing failed: {e}")
            raise
        except RubricImportError as e:
            logger.error(f"Rubric import validation failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during rubric import: {e}")
            raise RubricImportError(f"Rubric import failed: {e}") from e

    def _detect_if_rubric(self, parsed_data: dict[str, Any]) -> tuple[bool, str]:
        """Check if AI detected this as a rubric.

        Args:
            parsed_data: Parsed data from AI

        Returns:
            Tuple of (is_rubric, reason_if_not)
        """
        is_rubric = parsed_data.get("is_rubric", False)

        if not is_rubric:
            reason = parsed_data.get("reason", "Document does not appear to be a rubric")
            return False, reason

        return True, ""

    def _validate_rubric_data(self, parsed_data: dict[str, Any]) -> None:
        """Validate parsed rubric data structure.

        Args:
            parsed_data: Parsed data to validate

        Raises:
            RubricImportError: If validation fails
        """
        if not parsed_data.get("rubric_name"):
            raise RubricImportError("Missing rubric name")

        dimensions = parsed_data.get("dimensions", [])
        if not dimensions:
            raise RubricImportError("Rubric must have at least one dimension")

        total_weight = Decimal("0")
        for idx, dimension in enumerate(dimensions):
            if not dimension.get("name"):
                raise RubricImportError(f"Dimension {idx} missing name")

            weight = dimension.get("weight")
            if weight is None:
                raise RubricImportError(f"Dimension '{dimension.get('name')}' missing weight")

            try:
                weight_decimal = Decimal(str(weight))
                if weight_decimal <= 0:
                    raise RubricImportError(f"Dimension '{dimension.get('name')}' has non-positive weight: {weight}")
                total_weight += weight_decimal
            except (ValueError, TypeError) as e:
                raise RubricImportError(f"Invalid weight for dimension '{dimension.get('name')}': {weight}") from e

            levels = dimension.get("levels", [])
            if not levels:
                raise RubricImportError(f"Dimension '{dimension.get('name')}' has no levels")

            for level_idx, level in enumerate(levels):
                if not level.get("name"):
                    raise RubricImportError(f"Level {level_idx} in dimension '{dimension.get('name')}' missing name")
                if "score_min" not in level or "score_max" not in level:
                    raise RubricImportError(
                        f"Level '{level.get('name')}' in dimension '{dimension.get('name')}' missing score range"
                    )
                # Allow score_min == score_max only for "No submission" or "0" level
                if level["score_min"] > level["score_max"]:
                    logger.error(
                        f"Invalid score range detected. Full AI response:\n"
                        f"{json.dumps(parsed_data, indent=2, ensure_ascii=False)}"
                    )
                    raise RubricImportError(
                        f"Level '{level.get('name')}' has invalid score range: "
                        f"{level['score_min']}-{level['score_max']}"
                    )
                # Allow 0-0 range for "No submission" levels
                elif level["score_min"] == level["score_max"]:
                    level_name = level.get("name", "").lower()
                    level_desc = level.get("description", "").lower()
                    if level_name != "0" and "no submission" not in level_desc and "absent" not in level_desc:
                        logger.error(
                            f"Invalid score range detected. Full AI response:\n"
                            f"{json.dumps(parsed_data, indent=2, ensure_ascii=False)}"
                        )
                        raise RubricImportError(
                            f"Level '{level.get('name')}' has invalid score range: "
                            f"{level['score_min']}-{level['score_max']}"
                        )
                    logger.info(
                        f"Allowed special score range {level['score_min']}-"
                        f"{level['score_max']} for level: '{level.get('name')}'"
                    )

        if not (Decimal("99") <= total_weight <= Decimal("101")):
            raise RubricImportError(
                f"Rubric weights must sum to ~100, got {total_weight} (allowed range: 99-101 for rounding tolerance)"
            )

        logger.info(f"Rubric validation passed: {len(dimensions)} dimensions, total weight={total_weight}")

    @transaction.atomic
    def _create_rubric_in_db(self, parsed_data: dict[str, Any], user: User, rubric_name: str) -> MarkingRubric:
        """Create rubric records in database atomically.

        Args:
            parsed_data: Validated parsed data
            user: User creating the rubric
            rubric_name: Name for the rubric

        Returns:
            Created MarkingRubric instance

        Raises:
            RubricImportError: If database save fails
        """
        try:
            rubric = MarkingRubric.objects.create(user_id_user=user, rubric_desc=rubric_name)
            logger.info(f"Created MarkingRubric {rubric.rubric_id}")

            for dimension in parsed_data["dimensions"]:
                rubric_item = RubricItem.objects.create(
                    rubric_id_marking_rubric=rubric,
                    rubric_item_name=dimension["name"],
                    rubric_item_weight=Decimal(str(dimension["weight"])),
                )
                logger.debug(f"Created RubricItem {rubric_item.rubric_item_id}: {dimension['name']}")

                for level in dimension["levels"]:
                    description = level.get("description", "")
                    if level.get("name"):
                        description = f"{level['name']}: {description}" if description else level["name"]

                    RubricLevelDesc.objects.create(
                        rubric_item_id_rubric_item=rubric_item,
                        level_min_score=level["score_min"],
                        level_max_score=level["score_max"],
                        level_desc=description,
                    )

            return rubric

        except Exception as e:
            logger.error(f"Database save failed: {e}")
            raise RubricImportError(f"Failed to save rubric to database: {e}") from e

    def generate_rubric_text(self, rubric: MarkingRubric) -> str:
        """Generate a text representation of the rubric for AI processing.

        Args:
            rubric: MarkingRubric instance

        Returns:
            Formatted text string
        """
        lines = [f"Rubric: {rubric.rubric_desc}\n"]

        # Use prefetch_related to optimize database queries (Fix N+1 problem)
        items = RubricItem.objects.filter(rubric_id_marking_rubric=rubric).prefetch_related("level_descriptions")

        for item in items:
            lines.append(f"Dimension: {item.rubric_item_name} (Weight: {item.rubric_item_weight}%)")

            # Sort in Python to avoid hitting DB again if possible, or use the prefetched set
            # Since we need ordering, doing it in Python is efficient for small sets like rubric levels
            levels = sorted(
                item.level_descriptions.all(),
                key=lambda level: level.level_max_score,
                reverse=True,
            )

            for level in levels:
                lines.append(f"- Score {level.level_min_score}-{level.level_max_score}: {level.level_desc}")
            lines.append("")

        return "\n".join(lines)
