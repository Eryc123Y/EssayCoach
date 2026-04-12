# LEARNINGS KNOWLEDGE BASE

## OVERVIEW
`docs/learnings/` is the repo’s implementation memory: post-task writeups, review findings, security lessons, and feature delivery logs live here.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Writing pattern | `README.md` | expected structure for new learning docs |
| Security/auth lessons | `jwt-refresh-security-lessons.md`, `codex-security-review-2026-02-24.md` | hardened auth takeaways |
| Dashboard history | `dashboard-*.md` | largest cluster of implementation memory |
| Feature delivery examples | `pdf-export-implementation.md`, `skill-radar-chart-implementation.md` | good concrete templates |
| Profile/settings history | `profile-backend-implementation.md`, `settings-module-implementation.md` | sync and account workflows |

## CONVENTIONS
- Treat these docs as retrospective memory: what changed, why it was judged correct, and what was learned.
- New files should keep the repo’s date/topic naming habit when possible.
- Include related files and verification context so later agents can trace decisions back to code.

## ANTI-PATTERNS
- Do not treat a learning doc as stronger than current code or PRDs.
- Do not record planned work here as if it already shipped.
- Do not leave security or review docs ambiguous about what was fixed versus what remained open.

## NOTES
- This directory is dense because many February 2026 implementation waves logged detailed retrospectives.
- For current truth, pair a learning doc with root `AGENTS.md` and the referenced source files.
