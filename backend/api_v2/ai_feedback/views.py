"""
Django Ninja views for AI Feedback module.

These views provide AI-powered essay analysis and feedback generation.
"""

from __future__ import annotations

import logging

from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from api_v1.ai_feedback.dify_client import DifyClient
from api_v1.ai_feedback.exceptions import (
    APIServerError,
    APITimeoutError,
    ConfigurationError,
    EssayAgentError,
    RubricError,
    WorkflowError,
)
from api_v1.ai_feedback.interfaces import ResponseMode, WorkflowInput

from ..utils.auth import TokenAuth
from .schemas import (
    ChatMessageIn,
    ChatMessageOut,
    WorkflowDataOut,
    WorkflowInputsOut,
    WorkflowRunIn,
    WorkflowRunOut,
    WorkflowStatusOut,
)

logger = logging.getLogger(__name__)

router = Router(tags=["AI Feedback"], auth=TokenAuth())


@router.post(
    "/agent/workflows/run/",
    response=WorkflowRunOut,
    summary="Run the Essay Agent Dify workflow",
    description="""
    Triggers the Essay Agent workflow using Dify. Provide `essay_question` and
    `essay_content`; the API automatically handles rubric upload.

    Optional `language` and `response_mode` (blocking or streaming) are supported.
    Uses EssayAgentInterface for provider-agnostic architecture.
    """,
)
def run_workflow(request: HttpRequest, data: WorkflowRunIn) -> WorkflowRunOut:
    """Run AI workflow for essay analysis."""
    try:
        client = DifyClient()

        response_mode = ResponseMode(data.response_mode)

        workflow_input = WorkflowInput(
            essay_question=data.essay_question,
            essay_content=data.essay_content,
            language=data.language,
            user_id=data.user_id,
            rubric_id=data.rubric_id,
            response_mode=response_mode,
        )

        result = client.analyze_essay(workflow_input)

        status_value = result.status.value if hasattr(result.status, "value") else result.status
        logger.info(f"Dify workflow result - run_id: {result.run_id}, status: {status_value}")

        return WorkflowRunOut(
            workflow_run_id=result.run_id,
            task_id=result.task_id,
            data=WorkflowDataOut(
                id=result.run_id,
                status=status_value,
                outputs=result.outputs,
                error=result.error_message,
                elapsed_time=result.elapsed_time_seconds,
                total_tokens=result.token_usage.get("total_tokens") if result.token_usage else None,
                total_steps=None,
                created_at=int(result.created_at.timestamp()) if result.created_at else None,
                finished_at=int(result.finished_at.timestamp()) if result.finished_at else None,
            ),
            inputs=WorkflowInputsOut(
                essay_question=data.essay_question,
                essay_content=data.essay_content,
                language=data.language,
            ),
            response_mode=data.response_mode,
        )

    except RubricError as exc:
        logger.error(f"Rubric error in run_workflow: {exc}")
        if "RUBRIC_NOT_FOUND" in str(exc) or "not found" in str(exc).lower():
            raise HttpError(404, str(exc))
        raise HttpError(400, str(exc))

    except APITimeoutError as exc:
        logger.error(f"API timeout in run_workflow: {exc}")
        raise HttpError(504, "AI service request timed out. Please try again.")

    except APIServerError as exc:
        logger.error(f"API server error in run_workflow: {exc}")
        raise HttpError(502, f"AI service error: {str(exc)}")

    except WorkflowError as exc:
        logger.error(f"Workflow error in run_workflow: {exc}")
        raise HttpError(500, str(exc))

    except EssayAgentError as exc:
        logger.error(f"Essay agent error in run_workflow: {exc}")
        raise HttpError(500, str(exc))

    except Exception as exc:
        logger.exception(f"Unexpected exception in run_workflow: {exc}")
        raise HttpError(500, "Internal server error") from None


@router.post(
    "/chat/",
    response=ChatMessageOut,
    summary="Chat with AI about essay",
    description="""
    Send a message to AI and get a response about the essay.

    This endpoint uses Dify's chat-messages API to provide conversational
    feedback about essays. The context field can include essay_id, previous
    feedback, or any relevant context for the conversation.
    """,
)
def chat_with_ai(request: HttpRequest, data: ChatMessageIn) -> ChatMessageOut:
    """Chat with AI about essay feedback using Dify chat API."""
    try:
        client = DifyClient()
        user = request.user
        user_id = str(getattr(user, "user_id", user.id))
        context = data.context or {}
        response = _call_dify_chat(
            client=client,
            message=data.message,
            user_id=user_id,
            essay_id=context.get("essay_id"),
            conversation_id=context.get("conversation_id"),
            context=context,
        )

        return ChatMessageOut(
            message=response.get("answer", "I'm sorry, I couldn't process your request."),
            role="assistant",
        )

    except APITimeoutError as exc:
        logger.error(f"Chat API timeout: {exc}")
        raise HttpError(504, "AI service request timed out. Please try again.")

    except APIServerError as exc:
        logger.error(f"Chat API server error: {exc}")
        raise HttpError(502, f"AI service error: {str(exc)}")

    except ConfigurationError as exc:
        logger.error(f"Chat configuration error: {exc}")
        raise HttpError(500, "AI service is not properly configured.")

    except Exception as exc:
        logger.exception(f"Unexpected error in chat_with_ai: {exc}")
        raise HttpError(500, "Internal server error") from None


@router.get(
    "/agent/workflows/run/{workflow_run_id}/status/",
    response=WorkflowStatusOut,
    summary="Get workflow run status",
    description="""
    Get the status and results of a workflow run by its ID.

    This endpoint polls Dify to check the current status of a workflow execution.
    Returns status, outputs, error message, and timing information.
    """,
)
def get_workflow_status(request: HttpRequest, workflow_run_id: str) -> WorkflowStatusOut:
    """Get the status of a workflow run."""
    try:
        client = DifyClient()
        result = client.get_workflow_run(workflow_run_id)

        status = result.get("status", "unknown")
        outputs = result.get("outputs")
        error = result.get("error")
        elapsed_time = result.get("elapsed_time")
        total_tokens = result.get("total_tokens")
        created_at_ts = result.get("created_at")
        finished_at_ts = result.get("finished_at")

        from datetime import datetime

        created_at = datetime.fromtimestamp(created_at_ts) if created_at_ts else None
        finished_at = datetime.fromtimestamp(finished_at_ts) if finished_at_ts else None

        return WorkflowStatusOut(
            workflow_run_id=workflow_run_id,
            task_id=result.get("id", workflow_run_id),
            status=status,
            outputs=outputs,
            error_message=error,
            elapsed_time_seconds=elapsed_time,
            token_usage={"total_tokens": total_tokens} if total_tokens else {},
            created_at=created_at,
            finished_at=finished_at,
            tracing=result.get("tracing", {}),
        )

    except APITimeoutError as exc:
        logger.error(f"Workflow status API timeout: {exc}")
        raise HttpError(504, "AI service request timed out. Please try again.")

    except APIServerError as exc:
        logger.error(f"Workflow status API server error: {exc}")
        raise HttpError(502, f"AI service error: {str(exc)}")

    except Exception as exc:
        logger.exception(f"Unexpected error in get_workflow_status: {exc}")
        raise HttpError(500, "Internal server error") from None


def _call_dify_chat(
    client: DifyClient,
    message: str,
    user_id: str,
    essay_id: str | None = None,
    conversation_id: str | None = None,
    context: dict | None = None,
) -> dict:
    import json

    import requests

    inputs: dict[str, str] = {}
    if essay_id:
        inputs["essay_id"] = essay_id
    if context:
        for key in ["essay_question", "essay_content", "feedback_summary"]:
            if key in context:
                inputs[key] = context[key]

    payload: dict[str, object] = {
        "inputs": inputs,
        "query": message,
        "user": user_id,
        "response_mode": "blocking",
    }

    if conversation_id:
        payload["conversation_id"] = conversation_id

    url = f"{client.base_url}/chat-messages"

    try:
        response = requests.post(
            url,
            headers={**client.headers, "Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=60,
        )
    except requests.exceptions.Timeout:
        raise APITimeoutError(
            timeout_seconds=60,
            original_error=None,
        )

    if not response.ok:
        payload_text = response.text
        raise APIServerError(
            message=f"Dify chat API returned {response.status_code}: {payload_text}",
            status_code=response.status_code,
            original_error=None,
        )

    return response.json()
