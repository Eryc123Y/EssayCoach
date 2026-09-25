"""The local Codex adapter interrupts a scoring turn that exceeds its limit."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace

import pytest

from ai_feedback.codex_provider import CodexProviderError, CodexScoringProvider


def test_scoring_timeout_interrupts_turn(monkeypatch):
    interrupted = []

    class FakeTurn:
        async def run(self):
            await asyncio.Event().wait()

        async def interrupt(self):
            interrupted.append(True)

    class FakeThread:
        async def turn(self, prompt, *, output_schema):
            assert output_schema["required"] == ["items"]
            return FakeTurn()

    class FakeCodex:
        def __init__(self, config):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def account(self):
            return SimpleNamespace(account=SimpleNamespace(root=SimpleNamespace(type="chatgpt")))

        async def thread_start(self, **kwargs):
            return FakeThread()

    monkeypatch.setattr("ai_feedback.codex_provider.AsyncCodex", FakeCodex)
    provider = CodexScoringProvider(codex_bin="fake-codex", timeout_seconds=0.01)
    submission = SimpleNamespace(
        submission_txt="Essay",
        task_id_task=SimpleNamespace(task_title="Task", task_instructions="Instructions"),
    )
    with pytest.raises(CodexProviderError, match="timed out"):
        provider.score(submission, [{"id": 1, "name": "Argument", "max_score": 10, "weight": "100.0"}])
    assert interrupted == [True]
