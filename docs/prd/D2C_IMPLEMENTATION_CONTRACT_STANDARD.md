# Design-to-Code Implementation Contract Standard (Desktop)

## 1. Scope
- This standard applies to desktop flows only.
- It is used for all `Implementation Contract / *` blocks in `pencil-shadcn.pen`.
- Goal: make each page contract machine-readable for deterministic design-to-code generation.

## 2. Required Fields (Canonical Order)
1. `route`: page route and required query params.
2. `layout`: shell/scaffold and zone composition (sidebar/header/content/panels).
3. `component-map`: key UI blocks mapped to reusable component IDs (or semantic component names).
4. `api`: endpoint contracts with method, path, request keys, response keys.
5. `data-shape`: page-level view model shape (cards, table rows, filters, detail panel).
6. `state`: required UI states (at minimum: `default/loading/empty/error/success`) and trigger transitions.
7. `permission`: role-based visibility/editability/action rights.
8. `event`: user/system events with payload and resulting state transition.
9. `error-handling`: backend/app errors mapped to UI behavior (inline, toast, modal, retry).
10. `analytics` (recommended): event names and properties for telemetry consistency.

## 3. Authoring Rules
- Use stable keys and separators: `key: value`.
- Use a single sentence per line when possible; avoid mixed language in one line.
- Always include route + state + permission + error-handling.
- Prefer explicit IDs for reusable blocks when already known in the .pen file.
- Keep event names in `domain.action.result` style (e.g., `auth.signin.succeeded`).

## 4. Canonical Line Template
- `route: /xxx?role={student|lecturer|admin}&state={default|loading|empty|error|success}`
- `layout: scaffold=<id|name>; zones={sidebar,header,content,detail}`
- `component-map: sidebar=<id>; primaryTable=<id>; primaryCard=<id>; modal=<id>`
- `api: GET /v1/xxx -> {items,total}; POST /v1/xxx -> {id,status}`
- `data-shape: kpi[], filters{}, tableRows[], pagination{}, detail{}`
- `state: default->loading->(success|empty|error); submitting->(success|error)`
- `permission: student={read}; lecturer={read,write}; admin={read,write,moderate}`
- `event: xxx.clicked(payload) -> state=loading; xxx.succeeded -> state=success`
- `error-handling: 400/422=inline; 401/403=forbidden banner; 409=conflict modal; 5xx=error toast+retry`
- `analytics: page_viewed, filter_changed, primary_action_clicked, submit_succeeded|failed`

## 5. Current File Coverage Matrix (`pencil-shadcn.pen`)
- `TQHlz` (`Implementation Contract / Auth`): mostly complete; add `api`, `data-shape`, `permission` normalization.
- `DUsH9` (`Implementation Contract / Rubrics`): missing explicit `api`, `error-handling`, `analytics`.
- `5DtSy` (`Implementation Contract / Dashboard`): good state mapping; add `api`, `data-shape`, `permission`.
- `7udAo` (`Implementation Contract / Settings`): strong events/modal/toast; add canonical `api` + `data-shape`.
- `wPofe` (`Implementation Contract / Essay`): currently minimal; needs full 10-field expansion.
- `Zknx3` (`Implementation Contract / Profile`): currently minimal; needs full 10-field expansion.
- `xbEBv` (`Implementation Contract / Assignment`): moderate; add canonical `layout/api/data-shape/permission`.
- `SeF8j` (`Implementation Contract / Classes`): currently minimal; needs full 10-field expansion.
- `Dpaup` (`Implementation Contract / Social`): currently minimal; needs full 10-field expansion.
- `hHZdN` (`Implementation Contract / Help`): currently minimal; needs full 10-field expansion.

## 6. Completion Definition (Step 1 Done)
- Every `Implementation Contract / *` block follows the same field order.
- No contract block has fewer than 9 lines (`analytics` optional but recommended).
- Every block contains explicit role permissions and error mapping.
- Contract text is directly translatable to typed page config/codegen input.

## 7. Next Execution Order
1. Apply this template to all existing contract blocks (`Step 1 execution in pen file`).
2. Normalize state models to align with each contract (`Step 2`).
3. Build export whitelist for clean component/code mapping (`Step 3`).

## 8. Execution Log
- 2026-02-20: Step 1 completed.
  - Standardized all `Implementation Contract / *` blocks in `pencil-shadcn.pen` to canonical fields.
  - Verified with screenshots and `snapshot_layout` checks (no layout problems in target pages).
- 2026-02-20: Step 2 completed.
  - Normalized state-flow language in all existing state-model sections:
    - `Auth / P0 Implementation State Models` (`8ohYW`)
    - `Dashboard / P1 Operational State Models` (`2foQV`)
    - `Settings / P1 Interaction State Models` (`BRGKm`)
    - `Essay / P0 Implementation State Models` (`8ZB8H`)
    - `Profile / P1 Interaction State Models` (`VG6Rt`)
    - `Assignment / P0 Implementation State Models` (`VdZTT`)
    - `Classes / P0 Implementation State Models` (`6yvHy`)
    - `Social / P0 Implementation State Models` (`9YOHn`)
    - `Help / P1 Operational State Models` (`MZxoA`)
  - Unified flow format across sections: `default -> loading -> (success|empty|error)` plus action-specific `submitting` lifecycle.
  - Re-validated with `snapshot_layout` on all affected top-level pages (no layout problems).
- 2026-02-20: Step 3 completed.
  - Marked doc-only design-system nodes in `pencil-shadcn.pen`:
    - `MzSDs` set to context `doc_showcase_board_exclude_from_codegen_scan`
    - Known anomaly variants set to context `doc_only_not_for_codegen` (`spbsy`, icon-button variants, selected input/modal variants)
  - Added visual boundary marker card: `Codegen Export Boundary / Desktop` under `mVrgL`.
  - Added allowlist-first manifest: `codegen-export-whitelist.desktop.json`.
  - Validation outcome: target top-level product pages still return `No layout problems.` after boundary tagging.
- 2026-02-20: Step 4 completed.
  - Added machine-readable mapping manifest: `codegen-component-mapping.desktop.json`.
  - Added human-readable mapping table: `codegen-component-mapping.desktop.md`.
  - Mapped all desktop allowlisted reusable components to code component families with `propsPreset` contracts.
  - Mapping coverage: no unknown/custom unresolved entries in the allowlist set.
- 2026-02-20: Step 5 completed.
  - Added readiness report artifacts:
    - `codegen-readiness.desktop.md`
    - `codegen-readiness.desktop.json`
  - Readiness verdict: `GO_CONDITIONAL` (no hard blockers, pilot-first rollout recommended).
