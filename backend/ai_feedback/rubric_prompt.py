"""Load rubric content as plain text for LLM prompts (LangGraph path)."""

from __future__ import annotations

from typing import Any

from core.models import MarkingRubric, RubricItem

from .exceptions import RubricError


def load_rubric_prompt_context(
    rubric_id: int | None,
    user_id: str,
) -> tuple[str, str | None, int | None]:
    """
    Return (rubric_text, rubric_name, rubric_id) for inclusion in an essay-analysis prompt.

    Mirrors DifyClient rubric resolution when rubric_id is None (first rubric for user).
    """
    if rubric_id is None:
        rubric = (
            MarkingRubric.objects.filter(user_id_user=user_id).order_by("-rubric_create_time").first()
        )
        if not rubric:
            raise RubricError(
                message=(
                    "No rubrics found in your library. "
                    "Please upload a rubric first before submitting essays for analysis."
                ),
                recoverable=False,
            )
    else:
        try:
            rubric = MarkingRubric.objects.get(rubric_id=rubric_id)
        except MarkingRubric.DoesNotExist as exc:
            raise RubricError(
                message=f"Rubric with ID {rubric_id} not found in your library.",
                rubric_id=rubric_id,
                recoverable=False,
            ) from exc

    rubric_items = RubricItem.objects.filter(rubric_id_marking_rubric=rubric.rubric_id).prefetch_related(
        "level_descriptions"
    )
    if not rubric_items.exists():
        raise RubricError(
            message=(
                f"No rubric items found for rubric ID {rubric.rubric_id}. This rubric may be empty or corrupted."
            ),
            rubric_id=rubric.rubric_id,
            recoverable=False,
        )

    text = _format_rubric_text(rubric, rubric_items)
    name = rubric.rubric_desc or "Untitled Rubric"
    return text, name, rubric.rubric_id


def _format_rubric_text(rubric: MarkingRubric, rubric_items: Any) -> str:
    lines = [
        f"Rubric: {rubric.rubric_desc or 'Untitled Rubric'}",
        "",
        "Evaluation Criteria:",
        "",
    ]
    for item in rubric_items:
        lines.append(f"{item.rubric_item_name} (Weight: {item.rubric_item_weight}%)")
        for level in item.level_descriptions.all():
            score_range = f"{level.level_min_score}-{level.level_max_score}"
            lines.append(f"  - {score_range} pts: {level.level_desc}")
        lines.append("")
    return "\n".join(lines)
