"""A generated citation cannot become verified evidence without a retrieved exact quote."""

import asyncio
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest

from ai_feedback.practice_provider import (
    CodexPracticeChatProvider,
    CodexPracticeProvider,
    PracticeChatResult,
    PracticeProviderError,
)
from ai_feedback.source_retrieval import RetrievedSource


def test_fact_verdict_requires_retrieved_exact_quote():
    source = RetrievedSource(
        title="Earth", url="https://en.wikipedia.org/wiki/Earth",
        excerpt="Earth is approximately spherical in shape.",
        retrieved_at=datetime.now(UTC), query="Earth shape",
    )

    class Search:
        def search(self, query, *, language, limit):
            assert query == "Earth shape" and language == "en" and limit == 2
            return [source]

    provider = CodexPracticeProvider(codex_bin="fake", source_search=Search())

    async def fabricated_turn(*args):
        return {"verdicts": [{
            "claim_index": 0, "verdict": "supported", "source_index": 0,
            "quote": "Earth is perfectly spherical", "rationale": "The source says so",
        }]}, None

    provider._turn = fabricated_turn
    result, _ = asyncio.run(provider._verify_claims(None, [{
        "claim": "Earth is perfectly spherical", "search_query": "Earth shape",
    }], "en"))
    assert result[0]["verdict"] == "unresolved"
    assert result[0]["source_url"] == ""

    async def real_turn(*args):
        return {"verdicts": [{
            "claim_index": 0, "verdict": "contradicted", "source_index": 0,
            "quote": "approximately spherical", "rationale": "Approximately is not perfect",
        }]}, None

    provider._turn = real_turn
    result, _ = asyncio.run(provider._verify_claims(None, [{
        "claim": "Earth is perfectly spherical", "search_query": "Earth shape",
    }], "en"))
    assert result[0]["verdict"] == "contradicted"
    assert result[0]["source_url"] == source.url


def test_coach_loads_database_context_before_entering_async_runtime():
    class EvidenceSet:
        def all(self):
            try:
                asyncio.get_running_loop()
            except RuntimeError:
                return [SimpleNamespace(
                    claim="Claim", verdict="unresolved", source_url="", supporting_quote=""
                )]
            raise AssertionError("ORM access occurred inside an async model turn")

    run = SimpleNamespace(
        revision=SimpleNamespace(goal="Improve", content="Essay"),
        report={"overall_score": 72}, evidence=EvidenceSet(),
    )
    coach = CodexPracticeChatProvider(codex_bin="fake")

    async def fake_reply(context):
        assert context["source_checks"][0]["verdict"] == "unresolved"
        return PracticeChatResult("Try one example.", "gpt-6-luna", "thread", None)

    coach._reply_async = fake_reply
    assert coach.reply(run, "What next?", []).answer == "Try one example."


def _practice_turn(provider, **turn_behaviour):
    """Drive the provider's single-turn helper against a fake thread."""
    interrupted = []

    class FakeTurn:
        async def run(self):
            if turn_behaviour.get("hang"):
                await asyncio.Event().wait()
            return SimpleNamespace(
                status=turn_behaviour.get("status", "completed"),
                final_response=turn_behaviour.get("final_response", ""),
                usage=None,
            )

        async def interrupt(self):
            interrupted.append(True)

    class FakeThread:
        async def turn(self, prompt, *, output_schema):
            return FakeTurn()

    return asyncio.run(provider._turn(FakeThread(), "prompt", {})), interrupted


def _practice_provider(**kwargs):
    return CodexPracticeProvider(codex_bin="fake-codex", source_search=object(), source_fetcher=object(), **kwargs)


def test_practice_turn_timeout_interrupts_the_turn():
    interrupted = []

    class HangingTurn:
        async def run(self):
            await asyncio.Event().wait()

        async def interrupt(self):
            interrupted.append(True)

    class Thread:
        async def turn(self, prompt, *, output_schema):
            return HangingTurn()

    with pytest.raises(PracticeProviderError, match="timed out") as error:
        asyncio.run(_practice_provider(timeout_seconds=0.01)._turn(Thread(), "prompt", {}))
    assert interrupted == [True]
    assert error.value.category == "timeout"


def test_practice_turn_returns_payload_and_null_usage_when_unreported():
    (payload, usage), _ = _practice_turn(_practice_provider(), final_response='{"overall_score": 70}')
    assert payload == {"overall_score": 70}
    assert usage is None  # unknown usage stays null rather than zero


@pytest.mark.parametrize(
    ("status", "final_response", "message"),
    [
        ("failed", '{"a": 1}', "did not complete"),
        ("completed", "", "did not complete"),
        ("completed", "not json", "invalid structured output"),
        ("completed", "[1, 2]", "invalid structured output"),
    ],
)
def test_practice_turn_rejects_unusable_model_output(status, final_response, message):
    with pytest.raises(PracticeProviderError, match=message) as error:
        _practice_turn(_practice_provider(), status=status, final_response=final_response)
    assert error.value.category in {"provider", "model_output"}


# --- the per-criterion breakdown must match the rubric the student chose ---------------------

RUBRIC = [
    {"id": 1, "name": "Argument", "max_score": 10, "weight": "60.0"},
    {"id": 2, "name": "Structure", "max_score": 5, "weight": "40.0"},
]


def _report(rubric_results):
    return {
        "overall_score": 70,
        "skills": {name: 70 for name in ("grammar", "logic", "tone", "structure", "vocabulary")},
        "claims": [],
        "annotations": [],
        "rubric_results": rubric_results,
    }


def _result(criterion, score, max_score):
    return {"criterion": criterion, "score": score, "max_score": max_score, "justification": "because"}


def _validate(rubric_results, snapshot=RUBRIC):
    report = _report(rubric_results)
    revision = SimpleNamespace(content="An essay.", rubric_snapshot=snapshot)
    _practice_provider()._validate_report(report, revision)
    return report


def test_a_breakdown_that_matches_the_rubric_is_accepted():
    results = [_result("Argument", 8, 10), _result("Structure", 5, 5)]
    assert _validate(results)["rubric_results"] == results
    assert _validate([_result("Structure", 0, 5), _result(" Argument ", 10, 10)])  # order and padding do not matter


@pytest.mark.parametrize(
    "results",
    [
        [_result("Argument", 8, 10)],  # a criterion is missing
        [_result("Argument", 8, 10), _result("Argument", 7, 10), _result("Structure", 5, 5)],  # duplicated criterion
        [_result("Argument", 8, 10), _result("Structure", 5, 5), _result("Style", 3, 5)],  # invented criterion
        [_result("Argument", 8, 10), _result("Clarity", 5, 5)],  # a criterion the rubric does not have
        [_result("Argument", 8, 100), _result("Structure", 5, 5)],  # fabricated maximum
        [_result("Argument", 8, None), _result("Structure", 5, 5)],  # malformed maximum
        [_result("Argument", 11, 10), _result("Structure", 5, 5)],  # above the criterion maximum
        [_result("Argument", -1, 10), _result("Structure", 5, 5)],  # below zero
        [_result("Argument", True, 10), _result("Structure", 5, 5)],  # a boolean is not a score
        [_result("Argument", 7.5, 10), _result("Structure", 5, 5)],  # not a whole-number score
        [],  # the rubric was ignored entirely
        "not a list",
        ["not an object"],
    ],
)
def test_a_breakdown_that_does_not_match_the_rubric_fails_the_run(results):
    with pytest.raises(PracticeProviderError):
        _validate(results)


def test_without_a_rubric_the_models_breakdown_is_discarded():
    report = _validate([_result("Anything", 9, 10)], snapshot=None)
    assert report["rubric_results"] == []
