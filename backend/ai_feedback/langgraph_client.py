"""
LangGraph-based essay agent implementing EssayAgentInterface.

Enabled when ESSAY_AGENT_PROVIDER=langgraph. Requires OPENAI_API_KEY for live calls.
"""

from __future__ import annotations

import os
import threading
import time
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, NotRequired, TypedDict, cast

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph

from api_v2.types.enums import WorkflowStatus

from .exceptions import ConfigurationError, EssayAgentError, RubricError, WorkflowError
from .interfaces import EssayAgentInterface, WorkflowInput, WorkflowOutput
from .langgraph_schemas import EssayAnalysisLLM
from .rubric_prompt import load_rubric_prompt_context


class _GraphState(TypedDict):
    essay_question: str
    essay_content: str
    rubric_text: str
    rubric_name: str
    rubric_id: int
    language: str
    analysis: NotRequired[EssayAnalysisLLM]


_SYSTEM_PROMPT = """You are an expert academic writing assessor for EssayCoach.
You receive an essay question, the student's essay, and a marking rubric (plain text).
Score the essay against the rubric criteria. Be fair, specific, and constructive.
Return structured scores and feedback only; do not invent rubric criteria not present in the rubric text.
Ensure feedback_items align with rubric dimensions; overall_score should be the sum of criterion scores
where applicable, and total_possible should equal the sum of max_score across feedback_items unless the rubric
implies a different total."""


def _build_graph_app():
    """Single-node LangGraph: structured LLM call (expand with more nodes later)."""

    def analyze_node(state: _GraphState) -> dict[str, Any]:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ConfigurationError(
                message="OPENAI_API_KEY must be set when using ESSAY_AGENT_PROVIDER=langgraph",
                config_key="OPENAI_API_KEY",
            )
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        llm = ChatOpenAI(model=model, temperature=0.2, api_key=api_key)
        structured = llm.with_structured_output(EssayAnalysisLLM)
        human = (
            f"Essay question:\n{state['essay_question']}\n\n"
            f"Student essay:\n{state['essay_content']}\n\n"
            f"Rubric:\n{state['rubric_text']}\n\n"
            f"Preferred feedback language: {state.get('language', 'English')}\n"
            f"Rubric name (if useful): {state.get('rubric_name', '')}\n"
            f"Rubric id: {state.get('rubric_id', '')}\n"
        )
        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=human),
        ]
        result = cast(EssayAnalysisLLM, structured.invoke(messages))
        rid = state.get("rubric_id")
        rname = state.get("rubric_name")
        if result.rubric_id is None and rid is not None:
            result = result.model_copy(update={"rubric_id": rid})
        if result.rubric_name is None and rname:
            result = result.model_copy(update={"rubric_name": rname})
        return {"analysis": result}

    g = StateGraph(_GraphState)
    g.add_node("analyze", analyze_node)
    g.add_edge(START, "analyze")
    g.add_edge("analyze", END)
    return g.compile()


class LangGraphEssayAgent(EssayAgentInterface):
    """Essay analysis via LangGraph + OpenAI structured output."""

    def __init__(self) -> None:
        self._runs: dict[str, WorkflowOutput] = {}
        self._lock = threading.Lock()

    @property
    def provider_name(self) -> str:
        return "langgraph"

    @property
    def is_configured(self) -> bool:
        return bool(os.environ.get("OPENAI_API_KEY"))

    def analyze_essay(self, inputs: WorkflowInput) -> WorkflowOutput:
        if inputs.response_mode.value != "blocking":
            raise WorkflowError(
                message="LangGraph agent currently supports blocking mode only",
                recoverable=True,
            )
        t0 = time.perf_counter()
        try:
            rubric_text, rubric_name, rid = load_rubric_prompt_context(inputs.rubric_id, inputs.user_id)
        except RubricError:
            raise

        app = _build_graph_app()
        try:
            out_state = app.invoke(
                {
                    "essay_question": inputs.essay_question,
                    "essay_content": inputs.essay_content,
                    "rubric_text": rubric_text,
                    "rubric_name": rubric_name,
                    "rubric_id": rid,
                    "language": inputs.language,
                }
            )
        except ConfigurationError:
            raise
        except Exception as exc:
            raise WorkflowError(
                message=f"LangGraph analysis failed: {exc}",
                recoverable=True,
                original_error=exc,
            ) from exc

        analysis = out_state.get("analysis")
        if not isinstance(analysis, EssayAnalysisLLM):
            raise WorkflowError(message="LangGraph returned no analysis", recoverable=False)

        payload = analysis.model_dump()
        payload["analysis_metadata"] = {
            "provider": self.provider_name,
            "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        }

        elapsed = time.perf_counter() - t0
        run_id = uuid.uuid4().hex
        wf = WorkflowOutput(
            run_id=run_id,
            task_id=run_id,
            status=WorkflowStatus.SUCCEEDED,
            outputs=payload,
            error_message=None,
            elapsed_time_seconds=elapsed,
            token_usage=None,
            created_at=datetime.now(UTC),
            finished_at=datetime.now(UTC),
        )
        with self._lock:
            self._runs[run_id] = wf
        return wf

    def get_workflow_status(self, run_id: str) -> WorkflowOutput:
        with self._lock:
            wf = self._runs.get(run_id)
        if wf is None:
            raise WorkflowError(
                message=f"Workflow run not found: {run_id}",
                run_id=run_id,
                recoverable=False,
            )
        return wf

    def upload_file(self, file_path: Path, user_id: str, file_type: str = "PDF") -> str:
        raise EssayAgentError(
            message="File upload is not used for the LangGraph essay agent (rubrics load from the database).",
            recoverable=False,
        )

    def cancel_workflow(self, run_id: str) -> bool:
        return False

    def health_check(self) -> bool:
        return self.is_configured

    # RubricProcessorInterface is not mixed in; views use Dify for rubric PDF flows elsewhere.
    # LangGraph path loads rubrics via load_rubric_prompt_context only.
