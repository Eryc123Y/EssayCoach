"""Score practice source checks against a labelled bilingual claim set.

Each case is a short essay that contains exactly one claim (or none). The
expected label says what a trustworthy source check should conclude:

- ``supported`` / ``contradicted``: a verifiable public fact; the check should
  reach that verdict from a retrieved quote.
- ``unresolved``: a claim no public source can settle; the check must not
  claim verification.
- ``no_claim``: an opinion; the check should not extract a factual claim.

Emitting the wrong verified verdict is the costly failure, so it is reported
separately from merely failing to reach a verdict.
"""

from __future__ import annotations

import json
import math
from collections import Counter
from pathlib import Path
from typing import Any

EXPECTED_LABELS = ("supported", "contradicted", "unresolved", "no_claim")
RESOLVED = {"supported", "contradicted"}
DEFAULT_CASES = Path(__file__).with_name("source_check_cases.jsonl")

# Outcomes, from best to worst.
CORRECT = "correct"
MISSED = "missed"  # a resolvable claim was extracted but stayed unresolved
NOT_EXTRACTED = "claim_not_extracted"  # a resolvable claim produced no check at all
SPURIOUS = "spurious_claim"  # an opinion produced an (unresolved) check
WRONG = "wrong_verdict"  # a verified verdict that is the opposite or unjustified
ERROR = "error"  # the provider raised
OUTCOMES = (CORRECT, MISSED, NOT_EXTRACTED, SPURIOUS, WRONG, ERROR)


class CaseError(ValueError):
    pass


def load_cases(path: Path = DEFAULT_CASES) -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            case = json.loads(line)
        except json.JSONDecodeError as exc:
            raise CaseError(f"{path.name}:{number} is not valid JSON") from exc
        cases.append(case)
    validate_cases(cases)
    return cases


def validate_cases(cases: list[dict[str, Any]]) -> None:
    seen: set[str] = set()
    for case in cases:
        missing = {"id", "language", "goal", "essay", "claim", "expected"} - case.keys()
        if missing:
            raise CaseError(f"case {case.get('id', '?')} is missing {sorted(missing)}")
        if case["id"] in seen:
            raise CaseError(f"duplicate case id {case['id']}")
        seen.add(case["id"])
        if case["language"] not in {"en", "zh"}:
            raise CaseError(f"case {case['id']} has unsupported language {case['language']!r}")
        if case["expected"] not in EXPECTED_LABELS:
            raise CaseError(f"case {case['id']} has unknown expected label {case['expected']!r}")
        if case["claim"] not in case["essay"]:
            raise CaseError(f"case {case['id']}: the claim text must appear in the essay")


def classify(expected: str, verdicts: list[str]) -> str:
    """Judge one case from the verdicts the source check produced (empty = no check)."""
    resolved = [verdict for verdict in verdicts if verdict in RESOLVED]
    if expected in RESOLVED:
        if any(verdict != expected for verdict in resolved):
            return WRONG
        if resolved:
            return CORRECT
        return MISSED if verdicts else NOT_EXTRACTED
    if resolved:
        return WRONG  # verified something that should not have been verifiable
    if expected == "no_claim" and verdicts:
        return SPURIOUS
    return CORRECT


def wilson_interval(successes: int, total: int, z: float = 1.96) -> tuple[float, float] | None:
    """95% Wilson score interval; None when there is nothing to measure."""
    if total == 0:
        return None
    p = successes / total
    denominator = 1 + z * z / total
    centre = (p + z * z / (2 * total)) / denominator
    margin = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator
    return max(0.0, centre - margin), min(1.0, centre + margin)


def _rate(successes: int, total: int) -> dict[str, Any]:
    interval = wilson_interval(successes, total)
    return {
        "successes": successes,
        "total": total,
        "rate": None if total == 0 else successes / total,
        "ci95": None if interval is None else [round(interval[0], 3), round(interval[1], 3)],
    }


def summarize(results: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate per language and overall. Each result needs language/expected/outcome."""

    def block(rows: list[dict[str, Any]]) -> dict[str, Any]:
        outcomes = Counter(row["outcome"] for row in rows)
        resolvable = [row for row in rows if row["expected"] in RESOLVED]
        correct_resolved = sum(1 for row in resolvable if row["outcome"] == CORRECT)
        emitted_wrong = outcomes[WRONG]
        # A verified verdict was emitted by every correct resolvable case and every wrong-verdict case.
        return {
            "cases": len(rows),
            "outcomes": {name: outcomes.get(name, 0) for name in OUTCOMES},
            "pass_rate": _rate(outcomes[CORRECT], len(rows)),
            "coverage": _rate(correct_resolved, len(resolvable)),
            "verdict_precision": _rate(correct_resolved, correct_resolved + emitted_wrong),
            "false_verification": _rate(emitted_wrong, len(rows)),
        }

    languages = sorted({row["language"] for row in results})
    return {
        "overall": block(results),
        "by_language": {
            language: block([row for row in results if row["language"] == language]) for language in languages
        },
        "wrong_verdicts": [
            {"id": row["id"], "expected": row["expected"], "verdicts": row.get("verdicts", [])}
            for row in results
            if row["outcome"] == WRONG
        ],
        "errors": [{"id": row["id"], "error": row.get("error", "")} for row in results if row["outcome"] == ERROR],
    }


def _percent(rate: dict[str, Any]) -> str:
    if rate["rate"] is None:
        return "n/a"
    low, high = rate["ci95"]
    return f"{rate['rate']:.0%} ({rate['successes']}/{rate['total']}, 95% CI {low:.0%}–{high:.0%})"


def render_markdown(summary: dict[str, Any], meta: dict[str, Any] | None = None) -> str:
    lines = ["# Source-check evaluation", ""]
    for key, value in (meta or {}).items():
        lines.append(f"- {key}: {value}")
    if meta:
        lines.append("")
    lines += [
        "| Scope | Cases | Pass rate | Coverage | Verdict precision | False verification |",
        "| --- | ---: | --- | --- | --- | --- |",
    ]
    scopes = [("overall", summary["overall"])] + list(summary["by_language"].items())
    for name, data in scopes:
        lines.append(
            f"| {name} | {data['cases']} | {_percent(data['pass_rate'])} | {_percent(data['coverage'])} "
            f"| {_percent(data['verdict_precision'])} | {_percent(data['false_verification'])} |"
        )
    lines += ["", "Coverage: resolvable claims that reached the correct verified verdict.",
              "Verdict precision: of the verified verdicts emitted, the share that were correct.",
              "False verification: cases where a wrong or unjustified verified verdict was emitted.", ""]
    outcomes = summary["overall"]["outcomes"]
    lines.append("Outcomes: " + ", ".join(f"{name}={count}" for name, count in outcomes.items()))
    if summary["wrong_verdicts"]:
        lines += ["", "## Wrong verified verdicts (review first)"]
        lines += [
            f"- `{item['id']}` expected {item['expected']}, got {item['verdicts']}"
            for item in summary["wrong_verdicts"]
        ]
    if summary["errors"]:
        lines += ["", "## Provider errors"]
        lines += [f"- `{item['id']}`: {item['error']}" for item in summary["errors"]]
    lines += [
        "",
        "With a few dozen cases the intervals are wide; treat this as a regression signal, not an accuracy claim.",
        "",
    ]
    return "\n".join(lines)
