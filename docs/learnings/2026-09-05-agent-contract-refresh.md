# Agent Contract Refresh

## Summary

The root agent file previously combined persistent rules with feature status,
an old migration backlog, endpoint inventories, and dated validation totals.
Its 35,606 bytes exceeded Codex's default 32 KiB project-document budget before
nested guidance was added.

The current contract uses Codex as the primary agent and Gemini through
Antigravity as occasional assistance. It routes task details to nested rules,
separates product AI configuration from coding-agent choice, and matches checks
to the changed surface.

## Scope And Provenance

- Previous context remains in Git at
  `f4ef15b:AGENTS.md`; inspect it as historical material, not current
  instructions or evidence that tests pass on a later checkout.
- Removed the unused Claude entry point and local feature-dev plugin setting.
- Antigravity IDE reads `AGENTS.md` natively, so no Gemini entry point is needed.
  The IDE added support in 1.20.5; see the
  [official changelog](https://antigravity.google/changelog?app=antigravity-ide).
  Updated the existing Cursor compatibility pointer to the same contract.
- Included four existing frontend contracts in version control after removing
  the ignore that hid them from fresh clones.
- Replaced stale provider-migration priority text in backend guidance with
  pointers to the factory and stable API contracts.
- Kept authentication, authorization, API v2, user-change preservation, and
  required CI boundaries. No application model/provider or runtime code changed.

## Verification Scope

This is an instruction migration. Review instruction paths, effective chain
sizes, ignore behavior, the staged diff, and `git diff --check`.
No application test, database run, model evaluation, or deployment is implied
by this note. Actual check outcomes belong in the commit/PR handoff.

## Maintenance

Record implementation history here and feature requirements in PRDs. Keep
agent contracts focused on instructions that remain useful across tasks.
Use the user's configured model/effort, and evaluate real tasks before claiming
that a prompt or model change improved productivity.
