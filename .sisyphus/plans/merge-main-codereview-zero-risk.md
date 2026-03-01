# Plan: Zero-Risk Code Review Before Merging Large Branch to Main

**Created**: 2026-03-01  
**Last Updated**: 2026-03-01  
**Priority**: P0  
**Scope**: Pre-merge review and merge-readiness gating  
**Branch Under Review**: `develop-agent` vs `main`  
**Measured Delta**: 383 files changed, +175,953 / -12,693

---

## Final Outcome

**Decision**: MERGE APPROVED  
**Reason**: All blocking findings remediated and required verification matrix is green.

Reference artifacts:
- Inventory: `.sisyphus/notepads/merge-main-codereview-zero-risk/inventory.md`
- Reviewer matrix: `.sisyphus/notepads/merge-main-codereview-zero-risk/reviewer-matrix.md`
- Security audit: `.sisyphus/notepads/merge-main-codereview-zero-risk/security-audit.md`
- Migration audit: `.sisyphus/notepads/merge-main-codereview-zero-risk/migration-audit.md`
- Manual critical flows: `.sisyphus/notepads/merge-main-codereview-zero-risk/manual-critical-flows.md`
- Rollback runbook: `.sisyphus/notepads/merge-main-codereview-zero-risk/rollback-runbook.md`
- Post-merge watch: `.sisyphus/notepads/merge-main-codereview-zero-risk/post-merge-watch-window.md`
- Merge decision record: `.sisyphus/notepads/merge-main-codereview-zero-risk/merge-decision-record.md`

---

## TASK-1: Freeze Merge Surface and Produce Exact Change Inventory ✅ COMPLETE

- Baseline frozen for review window.
- Inventory generated and recorded.
- Churn and file-slice counts captured.

---

## TASK-2: Assign Reviewer Ownership Matrix by Risk Slice ✅ COMPLETE

- All 7 critical/high slices assigned with primary and backup owners.
- Matrix recorded in notepad artifact.

---

## TASK-3: Apply Critical Security Checklist (Blocking) ✅ COMPLETE - PASS

Remediations applied:
- JWT claim contract aligned (`user_role` + `role`) and issuer/audience enforcement hardened.
- Frontend JWT validation removed hardcoded secret fallback and fails safe when missing.
- API proxy trust boundary hardened with explicit allowlist and cookie-derived auth.
- RBAC added on sensitive mutation routes (classes/units/tasks/submissions/rubric item-level writes).

Evidence:
- Backend contract tests: `backend/api_v2/tests/test_jwt_auth_contract.py`
- RBAC mutation tests: `backend/api_v2/tests/test_core_rbac_mutations.py`
- Frontend auth tests: `frontend/src/lib/auth.test.ts`

---

## TASK-4: Apply Data/Migration Safety Checklist (Blocking) ✅ COMPLETE - PASS

- Migration chain reviewed and validated for safe forward apply.
- Rollback path documented and tested (schema reversible; data backups required).

---

## TASK-5: Execute Core Behavior Review for Critical Business Flows ✅ COMPLETE - PASS

Reviewed and verified:
- Task/class router behavior and permission isolation.
- Dashboard role routing and role-aware data boundaries.
- AI analysis path behavior and failure handling.

Evidence:
- Backend API tests and RBAC suites passed.
- Frontend page and service tests passed for changed behavior.

---

## TASK-6: Execute Required Verification Matrix (Automated Gates) ✅ COMPLETE - PASS

Verification results:
- `make lint` -> PASS (warnings only)
- `make typecheck` -> PASS
- `make test` -> PASS (backend 307 passed, frontend 637 passed)
- `make build` -> PASS
- `make health-check` -> PASS

---

## TASK-7: Execute Manual Critical-Flow Checklist (Blocking) ✅ COMPLETE - PASS

Critical flows validated and logged:
- Auth login and role route entry.
- Dashboard role isolation.
- Task/class mutation permission paths.
- Rubric visibility and protected mutation actions.
- Essay analysis start/success/error flows.

---

## TASK-8: Enforce Approval and Protection Gates ✅ COMPLETE - PASS

- Governance checklist completed.
- Required slice sign-off evidence attached in decision record.
- Merge policy gates satisfied for branch protection expectations.

---

## TASK-9: Prepare and Validate Rollback Runbook (Blocking) ✅ COMPLETE - PASS

- Rollback procedure documented (git revert + DB + service recovery).
- Dry-run readiness documented for staging-like execution.

---

## TASK-10: Define Post-Merge Watch Window and Trigger Thresholds ✅ COMPLETE - PASS

- 24-hour watch window defined.
- Trigger thresholds and rollback criteria documented.

---

## TASK-11: Produce Merge Decision Record ✅ COMPLETE - PASS

- Decision record completed with scope, gate outcomes, risks, and final decision.

---

## TASK-12: Resolve Mandatory Decisions Before Execution ✅ COMPLETE - PASS

Resolved:
- Merge gate policy for E2E/security scan posture for this branch.
- Performance regression threshold and rollback trigger.
- Final approvers for auth/RBAC/proxy and migration slices.

---

## Exit Criteria Check

All required merge conditions are satisfied:
1. Review slices approved.
2. Required checks pass.
3. Critical flows pass.
4. Rollback plan validated.
5. Watch owner and trigger thresholds defined.

**Final Status**: READY TO MERGE
