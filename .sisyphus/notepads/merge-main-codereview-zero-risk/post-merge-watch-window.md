# Post-Merge Watch Window

Date: 2026-03-01
Window: 24 hours after merge

## Signals to Watch

1. API error rate on auth/core v2 endpoints
2. Auth failure rate and refresh-token error rate
3. P95 latency regressions on dashboard/task/class/rubric endpoints
4. Critical frontend path health (`/auth/sign-in`, `/dashboard/...`)

## Trigger Thresholds

- Auth endpoint error rate > 2% sustained for 10 minutes
- Core mutation endpoint error rate > 1% sustained for 10 minutes
- P95 latency regression > 30% on critical endpoints for 15 minutes

## Action on Trigger

1. Open incident and stop new deploys
2. Triage within 15 minutes
3. If unresolved quickly, execute rollback runbook
