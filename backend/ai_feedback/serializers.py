"""
DRF serializers for EssayCoach AI feedback.

NOTE: This file now uses auto-generated serializers from drf_pydantic models.
The actual serializer classes are generated from schemas.py using drf-pydantic.

This file provides a compatibility layer and can be gradually phased out
as views are updated to use the auto-generated drf_serializer directly.
"""

from __future__ import annotations

from typing import Any

# Import the auto-generated serializers from schemas
from .schemas import (
    WorkflowRunRequest,
)

# For backward compatibility, expose the auto-generated drf_serializer
# These will be None if drf-pydantic hasn't generated them yet
DifyWorkflowRunSerializer = getattr(WorkflowRunRequest, "drf_serializer", None)

if DifyWorkflowRunSerializer is None:
    # Fallback to manual serializer if drf_serializer not available
    from rest_framework import serializers

    class DifyWorkflowRunSerializer(serializers.Serializer):
        """
        Serializer for running the HTTP-triggered Essay Agent workflow.

        This is a fallback serializer used when drf-pydantic's auto-generated
        serializer is not available. The preferred approach is to use
        WorkflowRunRequest.drf_serializer directly.
        """

        essay_question = serializers.CharField(
            max_length=2000,
            help_text="Prompt or question that the student is responding to",
        )
        essay_content = serializers.CharField(
            max_length=20000,
            help_text="The full essay text submitted by the student",
        )
        language = serializers.CharField(
            max_length=48,
            required=False,
            default="English",
            help_text="Optional language hint for the workflow",
        )
        response_mode = serializers.ChoiceField(
            choices=("blocking", "streaming"),
            default="blocking",
            help_text="Blocking waits for completion, streaming returns SSE chunks",
        )
        user_id = serializers.CharField(
            max_length=128,
            required=False,
            help_text="Unique user identifier that Dify uses for analytics",
        )
        rubric_id = serializers.IntegerField(
            required=False,
            help_text="ID of the marking rubric to use for grading",
        )

        def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
            attrs.setdefault("language", "English")
            attrs.setdefault("response_mode", "blocking")
            if not attrs.get("user_id") or attrs.get("user_id") is None:
                attrs["user_id"] = "essaycoach-service"

            # Validate response_mode choices
            response_mode = attrs.get("response_mode")
            if response_mode and response_mode not in ("blocking", "streaming"):
                raise serializers.ValidationError({"response_mode": "response_mode must be 'blocking' or 'streaming'"})

            return attrs
