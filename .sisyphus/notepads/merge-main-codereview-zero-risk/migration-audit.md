# Migration Audit (TASK-4) - Data/Migration Safety Checklist

Date: 2026-03-01
Scope: `backend/core/models.py` and migrations `0005`-`0009`

## Executive Verdict

- Forward migration chain `0005 -> 0009` is ordered correctly and applies cleanly.
- No direct destructive operations were found in forward migrations (`RemoveField`, `DeleteModel`, `RunSQL`, `RunPython` absent).
- Rollback (`0009 -> 0004`) is technically reversible and was validated, but it is **not data-preserving** for schema introduced in `0005`-`0009`.
- Merge safety for schema application: **SAFE with rollback backup requirement**.
- Project status context: merge remains blocked by prior security audit findings (`security-audit.md`).

## Model Delta Review (`backend/core/models.py`)

Relevant deltas represented by migrations `0005`-`0009`:

- `Task`
  - Added: `task_title` (CharField 200), `task_instructions` (TextField), `class_id_class` (nullable FK to `Class`)
  - Existing `task_status` default is `draft` (not changed by `0005`-`0009`, but impacts back-compat assumptions)
- `MarkingRubric`
  - Added: `visibility` (`public|private`, default `private`)
  - Added index: `marking_rubric_visibility_idx`
- `User`
  - Added: `preferences` (JSONField, default `dict`, blank allowed)
- New models
  - `Badge`
  - `UserBadge` (+ unique constraint on `(user_id_user, badge_id_badge)`)
  - `DeadlineExtension` (+ unique/check constraints and indexes)

Backward-compat assumptions identified:

- Existing `Task` rows must tolerate empty `task_title`/`task_instructions` during transition.
- Existing `MarkingRubric` rows default to `visibility='private'`.
- Existing `User` rows default to `preferences={}`.
- `class_id_class` in `Task` remains nullable, so legacy tasks without class linkage remain valid.

## Migration Chain Analysis (0005-0009)

## 0005_add_task_missing_fields.py

- Type: additive schema change
- Operations:
  - `AddField task.class_id_class` (nullable FK, `blank=True`, `null=True`)
  - `AddField task.task_instructions` with temporary default `""` (`preserve_default=False`)
  - `AddField task.task_title` with temporary default `""` (`preserve_default=False`)
- Data transform behavior:
  - Existing rows backfilled to empty strings for new non-null text/title fields at migration time.
- Destructive in forward path: no
- Rollback behavior:
  - Unapply drops all three added columns; any data written to them after rollout is lost.
- Merge safety: **SAFE** (forward), rollback is schema-reversible but data-lossy.

## 0006_fix_task_model_duplicates.py

- Type: field definition normalization
- Operations:
  - `AlterField task.task_instructions` (removes temporary blank/default migration-time shape)
  - `AlterField task.task_title` (removes temporary blank/default migration-time shape)
- Data transform behavior: none
- Destructive in forward path: no
- Rollback behavior:
  - Reverts field metadata to prior shape; no row-level data deletion by itself.
- Merge safety: **SAFE**.

## 0007_markingrubric_visibility_and_more.py

- Type: additive schema + index
- Operations:
  - `AddField markingrubric.visibility` default `private`
  - `AddIndex marking_rubric_visibility_idx`
- Data transform behavior:
  - Existing rubric rows receive `visibility='private'`.
- Destructive in forward path: no
- Rollback behavior:
  - Drops index and `visibility` column; post-migration visibility values are lost.
- Merge safety: **SAFE** (forward), rollback is schema-reversible but data-lossy.

## 0008_badge_user_preferences_userbadge_and_more.py

- Type: additive model introduction + user field addition
- Operations:
  - `CreateModel Badge`
  - `AddField user.preferences` JSON default `dict`
  - `CreateModel UserBadge`
  - `AddConstraint user_badge_unique`
- Data transform behavior:
  - Existing users backfilled with `{}` in `preferences`.
- Destructive in forward path: no
- Rollback behavior:
  - Drops `UserBadge`, `Badge`, and `user.preferences`.
  - Any badge relationships and user preference updates are lost after rollback.
- Merge safety: **SAFE** (forward), rollback is schema-reversible but materially data-lossy.

## 0009_deadlineextension_and_more.py

- Type: additive model introduction + constraints/indexes
- Operations:
  - `CreateModel DeadlineExtension`
  - `AddConstraint task_user_extension_uq`
  - `AddConstraint extension_after_original_ck`
- Data transform behavior: none
- Destructive in forward path: no
- Rollback behavior:
  - Drops `DeadlineExtension` table and all extension records.
- Merge safety: **SAFE** (forward), rollback is schema-reversible but data-lossy.

## Destructive Pattern Scan

Regex scan for `RemoveField|DeleteModel|RunSQL|RunPython|AlterField|RenameField|AlterModelTable|AlterUniqueTogether|AlterIndexTogether` across `0005`-`0009`:

- Found only `AlterField` in `0006` (expected metadata normalization).
- No `RemoveField`, `DeleteModel`, `RunSQL`, `RunPython`.

## Validation Evidence

Staging-like validation was executed on an isolated temporary database `essaycoach_migration_audit`:

1. Migrated temp DB to `core 0004`.
2. Seeded representative pre-0005 records using historical model state (`User`, `Unit`, `Class`, `MarkingRubric`, `Task`).
3. Applied forward migrations to `core 0009` successfully.
4. Verified default/backfill outcomes:
   - `Task.task_title == ""`
   - `Task.task_instructions == ""`
   - `Task.class_id_class is NULL`
   - `MarkingRubric.visibility == "private"`
   - `User.preferences == {}`
5. Rolled back to `core 0004` successfully.
6. Re-applied to `core 0009` successfully (service recovery path validated).

## Rollback Strategy (Operational)

## Code Rollback Method

- Deploy previous application revision (pre-`0005`) only together with DB rollback to matching migration state.
- Do not run old code against schema at `0009` if code expects pre-0005 model shape.

## DB Rollback Method

For emergency rollback:

1. Put app in maintenance/drain mode.
2. Take fresh DB backup/snapshot.
3. Execute: `uv run python manage.py migrate core 0004 --noinput`.
4. Deploy matching pre-0005 backend code.
5. Run smoke checks on auth, tasks, rubrics.

Important: rollback is technically reversible but **drops post-0005 data** (`task_title`, `task_instructions`, `class_id_class`, `visibility`, `preferences`, `badge/user_badge`, `deadline_extension`). Backup is mandatory.

## Service Recovery Steps

After rollback incident is resolved:

1. Restore fixed code branch.
2. Re-run: `uv run python manage.py migrate core 0009 --noinput`.
3. Validate key endpoints and read/write paths for tasks/rubrics/user settings.
4. If rollback window included writes to dropped structures, restore from snapshot or replay from audit/event logs.

## SAFE/UNSAFE Merge Labels

- `0005_add_task_missing_fields.py`: **SAFE** (forward apply), rollback data loss risk
- `0006_fix_task_model_duplicates.py`: **SAFE**
- `0007_markingrubric_visibility_and_more.py`: **SAFE** (forward apply), rollback data loss risk
- `0008_badge_user_preferences_userbadge_and_more.py`: **SAFE** (forward apply), rollback data loss risk
- `0009_deadlineextension_and_more.py`: **SAFE** (forward apply), rollback data loss risk

Overall for this checklist: **PASS with caution** (rollback is tested but not data-preserving; backups required).
