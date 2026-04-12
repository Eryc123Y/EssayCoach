"""Select essay agent implementation (Dify vs LangGraph)."""

from __future__ import annotations

import os

from .dify_client import DifyClient
from .interfaces import EssayAgentInterface
from .langgraph_client import LangGraphEssayAgent


def get_essay_agent() -> EssayAgentInterface:
    """
    Return the configured essay workflow agent.

    Env:
        ESSAY_AGENT_PROVIDER — ``dify`` (default) or ``langgraph``.
        LangGraph requires OPENAI_API_KEY (and optionally OPENAI_MODEL).
    """
    provider = os.environ.get("ESSAY_AGENT_PROVIDER", "dify").strip().lower()
    if provider in ("langgraph", "langchain"):
        return LangGraphEssayAgent()
    return DifyClient()
