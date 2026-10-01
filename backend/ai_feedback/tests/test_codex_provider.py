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


def _install_fake_codex(monkeypatch, *, account_type="chatgpt", status="completed", final_response=""):
    """Fake AsyncCodex whose single turn finishes with the given status and output."""

    class FakeTurn:
        async def run(self):
            return SimpleNamespace(status=status, final_response=final_response, usage=None)

        async def interrupt(self):
            pass

    class FakeThread:
        id = "thread-1"

        async def turn(self, prompt, *, output_schema):
            return FakeTurn()

    class FakeCodex:
        def __init__(self, config):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def account(self):
            return SimpleNamespace(account=SimpleNamespace(root=SimpleNamespace(type=account_type)))

        async def thread_start(self, **kwargs):
            return FakeThread()

    monkeypatch.setattr("ai_feedback.codex_provider.AsyncCodex", FakeCodex)


def _score(provider):
    submission = SimpleNamespace(
        submission_txt="Essay",
        task_id_task=SimpleNamespace(task_title="Task", task_instructions="Instructions"),
    )
    return provider.score(submission, [{"id": 1, "name": "Argument", "max_score": 10, "weight": "100.0"}])


def test_scoring_returns_items_thread_and_model(monkeypatch):
    _install_fake_codex(monkeypatch, final_response='{"items": [{"rubric_item_id": 1, "score": 7}]}')
    result = _score(CodexScoringProvider(codex_bin="fake-codex", model="test-model"))
    assert result.items == [{"rubric_item_id": 1, "score": 7}]
    assert (result.model, result.provider_thread_id) == ("test-model", "thread-1")


def test_scoring_refuses_a_non_chatgpt_login(monkeypatch):
    _install_fake_codex(monkeypatch, account_type="apiKey")
    with pytest.raises(CodexProviderError, match="ChatGPT subscription login") as error:
        _score(CodexScoringProvider(codex_bin="fake-codex"))
    assert error.value.category == "subscription_login"


@pytest.mark.parametrize(
    ("status", "final_response", "message"),
    [
        ("failed", '{"items": []}', "did not complete"),
        ("completed", "", "did not complete"),
        ("completed", "not json", "invalid structured output"),
        ("completed", '["items"]', "invalid scoring result"),
        ("completed", '{"items": "none"}', "invalid scoring result"),
        ("completed", '{"scores": []}', "invalid scoring result"),
    ],
)
def test_scoring_rejects_unusable_model_output(monkeypatch, status, final_response, message):
    _install_fake_codex(monkeypatch, status=status, final_response=final_response)
    with pytest.raises(CodexProviderError, match=message) as error:
        _score(CodexScoringProvider(codex_bin="fake-codex"))
    assert error.value.category in {"provider", "model_output"}


def test_scoring_provider_requires_a_runtime_and_a_positive_timeout(monkeypatch):
    monkeypatch.delenv("CODEX_BIN", raising=False)
    monkeypatch.setattr("ai_feedback.codex_provider.shutil.which", lambda name: None)
    with pytest.raises(CodexProviderError, match="CODEX_BIN"):
        CodexScoringProvider()
    with pytest.raises(ValueError, match="positive"):
        CodexScoringProvider(codex_bin="fake-codex", timeout_seconds=0)
