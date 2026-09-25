"""A generated citation cannot become verified evidence without a retrieved exact quote."""

import asyncio
from datetime import UTC, datetime
from types import SimpleNamespace

from ai_feedback.practice_provider import CodexPracticeChatProvider, CodexPracticeProvider, PracticeChatResult
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
