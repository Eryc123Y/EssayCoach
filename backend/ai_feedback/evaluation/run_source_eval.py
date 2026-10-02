"""Run the bilingual source-check evaluation against the real Codex provider.

This calls the same provider the AI worker uses, so it needs the local
ChatGPT-signed-in Codex runtime and live network access, and it spends
subscription usage: each case is one analysis turn plus source discovery and
verification. Run it through the Django management command from ``backend/``:

    uv run python manage.py eval_source_checks --dry-run
    uv run python manage.py eval_source_checks --language en --limit 4
    uv run python manage.py eval_source_checks

It writes ``results.json`` and ``report.md`` to ``--out``. Results depend on
network reachability and the model's search behaviour, so compare runs made
under similar conditions.
"""

from __future__ import annotations

import argparse
import json
import os
import time
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Protocol

from ai_feedback.evaluation.scoring import (
    DEFAULT_CASES,
    ERROR,
    classify,
    load_cases,
    render_markdown,
    summarize,
)


class Analyzer(Protocol):
    def analyze(self, revision: Any) -> Any: ...


def run_cases(
    cases: list[dict[str, Any]],
    provider: Analyzer,
    progress: Callable[[int, int, dict[str, Any]], None] | None = None,
) -> list[dict[str, Any]]:
    """Analyse each case in turn and classify its source-check verdicts."""
    results: list[dict[str, Any]] = []
    for index, case in enumerate(cases, start=1):
        revision = SimpleNamespace(
            goal=case["goal"],
            content=case["essay"],
            language=case["language"],
            audience="",
            tone="",
            rubric_snapshot=None,
        )
        started = time.monotonic()
        row: dict[str, Any] = {"id": case["id"], "language": case["language"], "expected": case["expected"]}
        try:
            analysis = provider.analyze(revision)
            verdicts = [str(item.get("verdict", "unresolved")) for item in analysis.evidence]
            row.update(
                verdicts=verdicts,
                outcome=classify(case["expected"], verdicts),
                claims=[item.get("claim", "") for item in analysis.evidence],
                sources=[item.get("source_url", "") for item in analysis.evidence if item.get("source_url")],
                evidence=[{
                    key: item.get(key, "")
                    for key in (
                        "claim", "verdict", "rationale", "source_title", "source_url", "supporting_quote",
                    )
                } for item in analysis.evidence],
            )
        except Exception as exc:  # a provider failure is a result, not a crash of the whole run
            row.update(verdicts=[], outcome=ERROR, error=f"{type(exc).__name__}: {str(exc)[:200]}")
        row["seconds"] = round(time.monotonic() - started, 1)
        results.append(row)
        if progress:
            progress(index, len(cases), row)
    return results


def select_cases(cases: list[dict[str, Any]], language: str | None, limit: int | None) -> list[dict[str, Any]]:
    chosen = [case for case in cases if language in (None, case["language"])]
    if limit is None:
        return chosen
    # Keep every language/label represented, even when the file groups English first.
    groups = {(case["language"], case["expected"]) for case in chosen}
    per_group = max(1, limit // len(groups)) if groups else 1
    counts: dict[tuple[str, str], int] = {}
    picked = []
    for case in chosen:
        group = (case["language"], case["expected"])
        if counts.get(group, 0) < per_group:
            counts[group] = counts.get(group, 0) + 1
            picked.append(case)
    return picked


def add_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--cases", type=Path, default=DEFAULT_CASES)
    parser.add_argument("--language", choices=["en", "zh"])
    parser.add_argument(
        "--limit", type=int, help="Approximate case count, with at least one per language and expected label"
    )
    parser.add_argument("--model", default=os.environ.get("EVAL_MODEL", "gpt-6-luna"))
    parser.add_argument("--timeout", type=float, default=180, help="Seconds allowed per Codex turn")
    parser.add_argument("--out", type=Path, default=Path("source-eval-results"))
    parser.add_argument("--dry-run", action="store_true", help="Validate the case file and exit without calling Codex")


def execute(args: argparse.Namespace, provider_factory: Callable[[], Analyzer] | None = None, out=print) -> int:
    """Return 1 for wrong verification, 2 for an incomplete run, otherwise 0."""
    if args.limit is not None and args.limit < 1:
        out("--limit must be at least 1")
        return 2
    cases = select_cases(load_cases(args.cases), args.language, args.limit)
    out(f"{len(cases)} case(s) selected from {args.cases.name}")
    if args.dry_run:
        return 0
    if not cases:
        out("No cases match the filters")
        return 2

    def codex_provider() -> Analyzer:
        from ai_feedback.practice_provider import CodexPracticeProvider

        return CodexPracticeProvider(model=args.model, timeout_seconds=args.timeout)

    build_provider = provider_factory or codex_provider

    def show(done: int, total: int, row: dict[str, Any]) -> None:
        out(f"[{done}/{total}] {row['id']}: {row['outcome']} {row.get('verdicts', [])} ({row['seconds']}s)")

    results = run_cases(cases, build_provider(), show)
    summary = summarize(results)
    meta = {
        "model": args.model,
        "run at": datetime.now(UTC).isoformat(timespec="seconds"),
        "cases": len(cases),
        "timeout per turn": f"{args.timeout:g}s",
    }
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "results.json").write_text(
        json.dumps({"meta": meta, "summary": summary, "results": results}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    report = render_markdown(summary, meta)
    (args.out / "report.md").write_text(report, encoding="utf-8")
    out("\n" + report)
    out(f"Wrote {args.out / 'results.json'} and {args.out / 'report.md'}")
    if summary["wrong_verdicts"]:
        return 1
    return 2 if summary["errors"] else 0
