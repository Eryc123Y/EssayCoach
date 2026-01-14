from __future__ import annotations

from django.conf import settings
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .client import DifyClient, DifyClientError
from .serializers import (
    DifyWorkflowRunSerializer,
)


class WorkflowRunView(APIView):
    """
    Start the Essay Agent workflow in Dify with the default published workflow.

    The view builds the DSL inputs, uploads the shared `rubric.pdf`, and
    returns the workflow run metadata so clients can track the execution.
    """

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["AI Feedback"],
        summary="Run the Essay Agent Dify workflow",
        description=(
            "Triggers the Essay Agent workflow using Dify. Provide `essay_question` and "
            "`essay_content`; the API automatically sends `rubric.pdf` as the `essay_rubric` "
            "file input. Optional `language` and `response_mode` (blocking or streaming) are supported."
        ),
        request=DifyWorkflowRunSerializer,
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
        serializer = DifyWorkflowRunSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            client = DifyClient()

            user_id = serializer.validated_data["user_id"]
            inputs = {
                "essay_question": serializer.validated_data["essay_question"],
                "essay_content": serializer.validated_data["essay_content"],
                "language": serializer.validated_data.get("language", "English"),
                "essay_rubric": client.build_rubric_file_input(
                    client.get_rubric_upload_id(user_id)
                ),
            }

            result = client.run_workflow(
                inputs=inputs,
                user=user_id,
                response_mode=serializer.validated_data["response_mode"],
            )
        except DifyClientError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        payload = {
            "workflow_run_id": result.get("workflow_run_id"),
            "task_id": result.get("task_id"),
            "data": result.get("data"),
            "inputs": inputs,
            "response_mode": serializer.validated_data["response_mode"],
        }
        return Response(payload, status=status.HTTP_200_OK)


class WorkflowRunStatusView(APIView):
    """
    Fetch the latest status and outputs of a running workflow.

    Delegates to Dify's `/workflows/run/{workflow_run_id}` endpoint so the
    frontend can poll asynchronously after a blocking request or stream.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["AI Feedback"],
        summary="Get Dify workflow run status",
        description="Fetches the latest status/outputs of a workflow run by ID.",
        responses={
            200: OpenApiResponse(
                description="Current state of the workflow run",
                examples=[
                    OpenApiExample(
                        "Status response",
                        value={
                            "id": "b1ad3277-089e-42c6-9dff-6820d94fbc76",
                            "status": "succeeded",
                            "outputs": {"text": "Nice to meet you."},
                            "total_steps": 3,
                        },
                    )
                ],
            )
        },
    )
    def get(self, request, workflow_run_id: str) -> Response:
        try:
            client = DifyClient()
            result = client.get_workflow_run(workflow_run_id)
        except DifyClientError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(result, status=status.HTTP_200_OK)
