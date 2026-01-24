from __future__ import annotations

import logging
from typing import Any

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .dify_client import DifyClient
from .exceptions import (
    APIServerError,
    APITimeoutError,
    ConfigurationError,
    EssayAgentError,
    RubricError,
    WorkflowError,
)
from .interfaces import ResponseMode, WorkflowInput
from .schemas import WorkflowRunRequest

logger = logging.getLogger(__name__)


class WorkflowRunView(APIView):
    """
    Start the Essay Agent workflow in Dify with the default published workflow.

    The view builds the DSL inputs, uploads the shared rubric, and
    returns the workflow run metadata so clients can track the execution.

    This view uses drf_pydantic's auto-generated serializer from WorkflowRunRequest,
    which combines Pydantic validation with DRF serializer functionality.
    """

    permission_classes = [IsAuthenticated]

    # Use the auto-generated drf_serializer from WorkflowRunRequest
    @extend_schema(
        tags=["AI Feedback"],
        summary="Run the Essay Agent Dify workflow",
        description=(
            "Triggers the Essay Agent workflow using Dify. Provide `essay_question` and "
            "`essay_content`; the API automatically handles rubric upload. "
            "Optional `language` and `response_mode` (blocking or streaming) are supported. "
            "Uses EssayAgentInterface for provider-agnostic architecture."
        ),
        request=WorkflowRunRequest.drf_serializer,
        responses={
            200: OpenApiResponse(
                description="Dify workflow run metadata",
                examples=[
                    OpenApiExample(
                        "Run response",
                        value={
                            "workflow_run_id": "djflajgkldjgd",
                            "task_id": "9da23599-e713-473b-982c-4328d4f5c78a",
                            "status": "running",
                            "data": {
                                "id": "fdlsjfjejkghjda",
                            },
                            "inputs": {
                                "essay_question": "Sample question",
                                "essay_content": "Sample essay content",
                            },
                            "response_mode": "blocking",
                        },
                    )
                ],
            )
        },
        examples=[
            OpenApiExample(
                "Request body",
                summary="Complete request sample",
                value={
                    "essay_question": "What makes a strong thesis statement?",
                    "essay_content": "During the essay, the student argues that...",
                    "language": "English",
                    "response_mode": "blocking",
                    "user_id": "student-123",
                },
            )
        ],
    )
    def post(self, request) -> Response:
        serializer = WorkflowRunRequest.drf_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Initialize the new Dify client implementing EssayAgentInterface
            client = DifyClient()

            validated_data = serializer.validated_data
            if not isinstance(validated_data, dict) or "user_id" not in validated_data:
                return Response({"error": "Invalid request payload."}, status=status.HTTP_400_BAD_REQUEST)

            user_id: str = validated_data["user_id"]
            rubric_id: int | None = validated_data.get("rubric_id")

            # Build workflow input using the interface
            response_mode_str: str = validated_data["response_mode"]
            response_mode = ResponseMode(response_mode_str)

            workflow_input = WorkflowInput(
                essay_question=validated_data["essay_question"],
                essay_content=validated_data["essay_content"],
                language=validated_data.get("language", "English"),
                user_id=user_id,
                rubric_id=rubric_id,
                response_mode=response_mode,
            )

            result = client.analyze_essay(workflow_input)

            status_value = result.status.value if hasattr(result.status, "value") else result.status
            logger.info(f"Dify workflow result - run_id: {result.run_id}, status: {status_value}")

            # Build response matching frontend expectations
            response_data = {
                "workflow_run_id": result.run_id,
                "task_id": result.task_id,
                "data": {
                    "id": result.run_id,
                    "status": status_value,
                    "outputs": result.outputs,
                    "error": result.error_message,
                    "elapsed_time": result.elapsed_time_seconds,
                    "total_tokens": result.token_usage.get("total_tokens") if result.token_usage else None,
                    "total_steps": None,
                    "created_at": int(result.created_at.timestamp()) if result.created_at else None,
                    "finished_at": int(result.finished_at.timestamp()) if result.finished_at else None,
                },
                "inputs": {
                    "essay_question": validated_data["essay_question"],
                    "essay_content": validated_data["essay_content"],
                    "language": validated_data.get("language", "English"),
                    "essay_rubric": "rubric_file",  # Indicator that rubric was used
                },
                "response_mode": validated_data["response_mode"],
            }

            return Response(response_data, status=status.HTTP_200_OK)
        except RubricError as exc:
            logger.error(f"Rubric error in WorkflowRunView: {exc}")
            # Check if this is a "not found" error
            if "RUBRIC_NOT_FOUND" in str(exc) or "not found" in str(exc).lower():
                return Response({"error": str(exc)}, status=status.HTTP_404_NOT_FOUND)
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except APITimeoutError as exc:
            logger.error(f"API timeout in WorkflowRunView: {exc}")
            return Response(
                {"error": "AI service request timed out. Please try again."}, status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except APIServerError as exc:
            logger.error(f"API server error in WorkflowRunView: {exc}")
            return Response({"error": f"AI service error: {str(exc)}"}, status=status.HTTP_502_BAD_GATEWAY)
        except WorkflowError as exc:
            logger.error(f"Workflow error in WorkflowRunView: {exc}")
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except EssayAgentError as exc:
            logger.error(f"Essay agent error in WorkflowRunView: {exc}")
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as exc:
            logger.error(f"Unexpected exception in WorkflowRunView: {exc}")
            return Response(
                {"error": f"Internal server error: {str(exc)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
