# Rollback Runbook

Date: 2026-03-01

## Trigger

Execute rollback if auth errors, RBAC violations, or major endpoint regressions exceed threshold during watch window.

## Procedure

1. Git rollback
- Identify merge commit on `main`.
- Revert merge commit with a standard revert commit (no force push).

2. Database rollback
- Restore latest pre-merge backup if data integrity issue is detected.
- If schema-only rollback is needed, use migration rollback to previous known-good revision.

3. Service recovery
- Run `make health`.
- Confirm with `make health-check`.

4. Verification after rollback
- Run `make lint`, `make typecheck`, `make test`.
- Re-validate auth and critical mutation endpoints.

## Ownership

- Incident lead: merge owner
- Backend rollback owner: backend reviewer
- Frontend rollback owner: frontend reviewer
