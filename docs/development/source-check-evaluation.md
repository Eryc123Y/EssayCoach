# Source-check evaluation

Practice feedback can mark a factual claim as **supported**, **contradicted**, or **unresolved** using sources the backend fetched itself. The acceptance record shows this works on single cases. This harness measures it on a fixed, labelled, bilingual set, so a change to a prompt, model, or retrieval adapter can be compared with an earlier run.

## What is measured

`backend/ai_feedback/evaluation/source_check_cases.jsonl` holds 32 short essays, 16 English and 16 Chinese. Each contains one claim, or none:

| Expected | Cases per language | A trustworthy check should |
| --- | ---: | --- |
| `supported` | 6 | reach *supported* from a retrieved quote (for example, the United Nations was founded in 1945) |
| `contradicted` | 6 | reach *contradicted* (for example, humans use only ten percent of their brains) |
| `unresolved` | 2 | not claim verification of something no public source settles (a village's exact 1987 population) |
| `no_claim` | 2 | extract no factual claim from an opinion |

Reported per language and overall, each with a 95% Wilson interval:

- **Coverage**: resolvable claims that reached the correct verified verdict.
- **Verdict precision**: of the verified verdicts emitted, the share that were correct.
- **False verification**: cases where a wrong or unjustified verified verdict was emitted. This is the costly failure, so each one is listed by case ID for review and makes the command exit with status 1.

Separate outcomes distinguish a claim that stayed unresolved (`missed`), a claim that was never extracted (`claim_not_extracted`), an opinion that produced a check (`spurious_claim`), and a provider failure (`error`).

## Run it

It calls the real provider, so it needs the signed-in Codex runtime and live network access, and it spends subscription usage. From `backend/`:

```bash
uv run python manage.py eval_source_checks --dry-run              # validate the case file only
uv run python manage.py eval_source_checks --language en --limit 8 # a small balanced sample
uv run python manage.py eval_source_checks                        # all 32 cases, one at a time
```

Options: `--model` (default `gpt-6-luna`, or `EVAL_MODEL`), `--timeout` seconds per Codex turn, `--out` directory. A limit samples across verdict labels and languages instead of taking only the first English cases. The command writes `results.json` and `report.md` there. Keep each run's report with the change it tested. Exit status 1 means false verification; status 2 means at least one provider error, so a failed provider cannot produce a passing evaluation.

## Observed local run — 2026-10-01

The full 32-case run used the signed-in ChatGPT subscription, `gpt-6-luna`, and live public-source retrieval. It finished at 09:45 UTC. The ignored local evidence is in `backend/source-eval-results/2026-10-01-baseline/`.

| Outcome | English | Chinese | Overall |
| --- | ---: | ---: | ---: |
| Correct case outcome | 15/16 | 14/16 | 29/32 |
| Correct verified verdict among resolvable claims | 12/12 | 11/12 | 23/24 |
| Correct verdict among emitted verified verdicts | 12/12 | 11/11 | 23/23 |
| False verification | 0 | 0 | 0 |
| Provider error | 0 | 0 | 0 |

Three cases need interpretation: `zh-contradicted-02` (the Great Wall visible from the Moon) stayed unresolved because no matching source was retrieved. Both `en-no_claim-01` and `zh-no_claim-01` extracted the daily-writing/calming statement as a possible factual claim and left it unresolved. Their opinion labels are debatable because the wording also suggests a causal effect; this run keeps the original labels and counts them as spurious extraction. No labels were changed to improve the result.

The 95% interval for overall correct outcomes is 76%–97%; the interval for verified-verdict precision is 86%–100%. This small fixed set does not establish general accuracy. The run predates the SDK timeout repair and the evaluation output's supporting-quote fields; the separate persisted bilingual workflow run records matching quotes and retrieval times, while future evaluation reports retain them directly.

## Reading the result

- With 32 cases the intervals are wide (16 of 16 correct still has a lower bound near 80%). Use the numbers to catch regressions and to compare two runs, not as a general accuracy claim.
- Each essay holds one claim, so the set says nothing about essays with several claims, long essays, recent events, or topics outside these well-known facts.
- Results depend on network reachability and live search, so compare runs made under similar conditions. A provider error is recorded as a result rather than stopping the run.
- The expected labels are facts the authors checked by hand. Review a label before trusting a disagreement; a wrong label is a case-file bug.

## Queue and provider reliability tests

These run without Codex (`cd backend && uv run pytest api_v2/core/tests/test_ai_queue_recovery.py ai_feedback`):

- Formal scoring, practice analysis, and coach chat each refuse a live lease, reclaim an expired one, and fail visibly with `lease_exhausted` after three attempts.
- A result from a superseded attempt is discarded, four concurrent workers claim one job only once, and a failed job can be retried only while attempts remain.
- The Codex adapters interrupt a turn that times out and reject a non-ChatGPT login, an incomplete turn, invalid JSON, and a payload without the expected fields.

These automated tests use a fake provider. Separate local checks on 2026-10-01 used the real Codex runtime: a worker was killed during scoring, its original 15-minute lease was allowed to expire, and a restarted worker completed attempt 2 with exactly one saved AI proposal. Two formal tasks and two practice tasks also completed with concurrent real workers. A deliberately short real Codex timeout persisted a visible `timeout` failure and exited in 1.26 seconds after the SDK was updated to 0.159.3. The teacher then retried the failed job through the API while a student retry was denied; real scoring completed attempt 2 with exactly one saved AI proposal. This is evidence for these observed cases, not a guarantee for every duration or concurrency level.
