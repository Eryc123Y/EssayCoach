"""The source-check evaluation harness scores results correctly without calling Codex."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from types import SimpleNamespace

import pytest

from ai_feedback.evaluation import run_source_eval
from ai_feedback.evaluation.scoring import (
    CORRECT,
    ERROR,
    EXPECTED_LABELS,
    MISSED,
    NOT_EXTRACTED,
    SPURIOUS,
    WRONG,
    CaseError,
    classify,
    load_cases,
    render_markdown,
    summarize,
    validate_cases,
    wilson_interval,
)

CJK = re.compile(r"[一-鿿]")


# --- the labelled case set --------------------------------------------------


def test_case_set_is_balanced_across_languages_and_labels():
    cases = load_cases()
    counts = Counter((case["language"], case["expected"]) for case in cases)
    for language in ("en", "zh"):
        for label in EXPECTED_LABELS:
            assert counts[(language, label)] >= 2, (language, label)
    per_language = Counter(case["language"] for case in cases)
    assert per_language["en"] == per_language["zh"]


def test_each_case_is_written_in_its_declared_language():
    for case in load_cases():
        has_cjk = bool(CJK.search(case["essay"]))
        assert has_cjk == (case["language"] == "zh"), case["id"]


def test_validation_rejects_broken_cases():
    good = {
        "id": "a", "language": "en", "goal": "g", "essay": "Some claim.", "claim": "Some claim.",
        "expected": "supported",
    }
    validate_cases([good])
    with pytest.raises(CaseError, match="duplicate"):
        validate_cases([good, dict(good)])
    with pytest.raises(CaseError, match="unknown expected"):
        validate_cases([{**good, "id": "b", "expected": "maybe"}])
    with pytest.raises(CaseError, match="must appear in the essay"):
        validate_cases([{**good, "id": "c", "claim": "Not in the essay"}])
    with pytest.raises(CaseError, match="unsupported language"):
        validate_cases([{**good, "id": "d", "language": "fr"}])
    with pytest.raises(CaseError, match="missing"):
        validate_cases([{"id": "e"}])


# --- classification ---------------------------------------------------------


@pytest.mark.parametrize(
    ("expected", "verdicts", "outcome"),
    [
        ("supported", ["supported"], CORRECT),
        ("contradicted", ["contradicted"], CORRECT),
        ("supported", ["contradicted"], WRONG),  # the costly mistake
        ("contradicted", ["supported"], WRONG),
        ("supported", ["unresolved"], MISSED),
        ("supported", [], NOT_EXTRACTED),
        ("supported", ["supported", "contradicted"], WRONG),
        ("unresolved", [], CORRECT),
        ("unresolved", ["unresolved"], CORRECT),
        ("unresolved", ["supported"], WRONG),  # claimed verification of the unverifiable
        ("no_claim", [], CORRECT),
        ("no_claim", ["unresolved"], SPURIOUS),
        ("no_claim", ["contradicted"], WRONG),
    ],
)
def test_classify(expected, verdicts, outcome):
    assert classify(expected, verdicts) == outcome


# --- statistics -------------------------------------------------------------


def test_wilson_interval():
    assert wilson_interval(0, 0) is None
    interval = wilson_interval(5, 10)
    assert interval is not None
    low, high = interval
    assert low < 0.5 < high
    assert (round(low, 3), round(high, 3)) == (0.237, 0.763)
    interval = wilson_interval(10, 10)
    assert interval is not None
    low, high = interval
    assert high == 1.0 and 0.70 < low < 0.75  # never claims certainty from a small sample
    interval = wilson_interval(0, 10)
    assert interval is not None and interval[0] == 0.0


def _row(case_id, language, expected, outcome, verdicts=()):
    return {"id": case_id, "language": language, "expected": expected, "outcome": outcome, "verdicts": list(verdicts)}


def test_summary_metrics():
    rows = [
        _row("en-1", "en", "supported", CORRECT, ["supported"]),
        _row("en-2", "en", "contradicted", CORRECT, ["contradicted"]),
        _row("en-3", "en", "supported", MISSED, ["unresolved"]),
        _row("en-4", "en", "unresolved", WRONG, ["supported"]),
        _row("zh-1", "zh", "supported", NOT_EXTRACTED),
        _row("zh-2", "zh", "no_claim", CORRECT),
        _row("zh-3", "zh", "contradicted", ERROR),
    ]
    summary = summarize(rows)
    en = summary["by_language"]["en"]
    assert en["cases"] == 4
    assert en["coverage"]["successes"] == 2 and en["coverage"]["total"] == 3  # 3 resolvable, 2 reached
    assert en["verdict_precision"]["successes"] == 2 and en["verdict_precision"]["total"] == 3  # 2 right, 1 wrong
    assert en["false_verification"]["successes"] == 1
    zh = summary["by_language"]["zh"]
    assert zh["coverage"]["rate"] == 0.0
    assert zh["verdict_precision"]["rate"] is None  # nothing was verified, so precision is undefined
    overall = summary["overall"]
    assert overall["outcomes"][CORRECT] == 3 and overall["outcomes"][ERROR] == 1
    assert summary["wrong_verdicts"] == [{"id": "en-4", "expected": "unresolved", "verdicts": ["supported"]}]
    assert summary["errors"] == [{"id": "zh-3", "error": ""}]


def test_markdown_report_leads_with_wrong_verdicts_and_states_uncertainty():
    rows = [
        _row("en-1", "en", "unresolved", WRONG, ["supported"]),
        _row("en-2", "en", "supported", CORRECT, ["supported"]),
    ]
    report = render_markdown(summarize(rows), {"model": "test-model"})
    assert "- model: test-model" in report
    assert "## Wrong verified verdicts (review first)" in report and "`en-1`" in report
    assert "intervals are wide" in report


# --- running ----------------------------------------------------------------


class FakeProvider:
    """Answers from a table of essay text -> verdicts; raises for text it does not know."""

    def __init__(self, table):
        self.table = table
        self.seen = []

    def analyze(self, revision):
        self.seen.append(revision)
        if revision.content not in self.table:
            raise RuntimeError("provider unavailable")
        return SimpleNamespace(
            evidence=[
                {"verdict": verdict, "claim": "c", "source_url": "" if verdict == "unresolved" else "https://example.org"}
                for verdict in self.table[revision.content]
            ]
        )


def _cases():
    by_id = {case["id"]: case for case in load_cases()}
    return [by_id[i] for i in ("en-supported-01", "en-contradicted-01", "zh-no_claim-01", "zh-supported-01")]


def test_run_cases_records_verdicts_and_survives_provider_errors():
    cases = _cases()
    table = {
        cases[0]["essay"]: ["supported"],
        cases[1]["essay"]: ["supported"],  # wrong: expected contradicted
        cases[2]["essay"]: [],
        # cases[3] is unknown to the fake, so the provider raises
    }
    provider = FakeProvider(table)
    progress = []
    results = run_source_eval.run_cases(cases, provider, lambda done, total, row: progress.append((done, total)))
    assert [row["outcome"] for row in results] == [CORRECT, WRONG, CORRECT, ERROR]
    assert "provider unavailable" in results[3]["error"]
    assert progress == [(1, 4), (2, 4), (3, 4), (4, 4)]
    assert provider.seen[0].language == "en" and provider.seen[0].goal == cases[0]["goal"]
    assert provider.seen[0].rubric_snapshot is None


def test_select_cases_with_a_limit_covers_every_label():
    picked = run_source_eval.select_cases(load_cases(), "en", 8)
    assert {case["language"] for case in picked} == {"en"}
    assert Counter(case["expected"] for case in picked) == {label: 2 for label in EXPECTED_LABELS}


def test_bilingual_limit_represents_each_language_and_label():
    picked = run_source_eval.select_cases(load_cases(), None, 8)
    assert Counter((case["language"], case["expected"]) for case in picked) == {
        (language, label): 1 for language in ("en", "zh") for label in EXPECTED_LABELS
    }


def _args(tmp_path, **overrides):
    values = {
        "cases": run_source_eval.DEFAULT_CASES, "language": None, "limit": None, "model": "test-model",
        "timeout": 5.0, "out": tmp_path / "out", "dry_run": False,
    }
    return argparse.Namespace(**{**values, **overrides})


def test_execute_writes_reports_and_signals_wrong_verdicts_in_the_exit_code(tmp_path):
    every_case = load_cases()
    resolvable = ("supported", "contradicted")
    good = FakeProvider(
        {case["essay"]: [case["expected"]] if case["expected"] in resolvable else [] for case in every_case}
    )
    lines = []
    assert run_source_eval.execute(_args(tmp_path), lambda: good, out=lines.append) == 0
    saved = json.loads((tmp_path / "out" / "results.json").read_text(encoding="utf-8"))
    assert saved["summary"]["overall"]["pass_rate"]["rate"] == 1.0
    assert saved["meta"]["model"] == "test-model" and len(saved["results"]) == len(every_case)
    assert saved["results"][0]["evidence"][0]["source_url"] == "https://example.org"
    assert "Source-check evaluation" in (tmp_path / "out" / "report.md").read_text(encoding="utf-8")

    bad = FakeProvider({case["essay"]: ["supported"] for case in every_case})  # verifies everything, even opinions
    assert run_source_eval.execute(_args(tmp_path), lambda: bad, out=lambda line: None) == 1


def test_execute_reports_provider_failures_as_incomplete(tmp_path):
    assert run_source_eval.execute(_args(tmp_path), lambda: FakeProvider({}), out=lambda line: None) == 2
    saved = json.loads((tmp_path / "out" / "results.json").read_text(encoding="utf-8"))
    assert saved["summary"]["overall"]["outcomes"][ERROR] == len(load_cases())
    assert saved["summary"]["wrong_verdicts"] == []


def test_dry_run_and_empty_selection_never_build_the_provider(tmp_path):
    def forbidden():
        raise AssertionError("the provider must not be created")

    quiet = {"out": lambda line: None}
    assert run_source_eval.execute(_args(tmp_path, dry_run=True), forbidden, **quiet) == 0

    only_zh = tmp_path / "only_zh.jsonl"
    zh_case = next(case for case in load_cases() if case["language"] == "zh")
    only_zh.write_text(json.dumps(zh_case, ensure_ascii=False) + "\n", encoding="utf-8")
    assert run_source_eval.execute(_args(tmp_path, cases=only_zh, language="en"), forbidden, **quiet) == 2

    for bad_limit in (0, -3):  # would otherwise silently select a few cases and spend usage
        assert run_source_eval.execute(_args(tmp_path, limit=bad_limit), forbidden, **quiet) == 2
    assert not (tmp_path / "out").exists()
