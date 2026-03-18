# PRD KNOWLEDGE BASE

## OVERVIEW
`docs/prd/` contains the numbered feature PRDs and the design-to-code assets that define intended behavior, UI states, and acceptance criteria.

## STRUCTURE
```text
prd/
├── 01-landing-page.md ... 14-help.md
├── REVISION_CHANGELOG.md
├── pencil-shadcn.pen
├── images/
└── resources/
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Dashboard requirements | `04-dashboard-overview.md` | role-specific dashboards |
| Essay workflow | `05-essay-practice.md` | feedback/revision feature intent |
| Rubric flows | `06-rubrics.md` | library, visibility, import |
| Tasks/classes | `09-assignments.md`, `10-classes.md` | PRD-09/10 |
| Deferred modules | `11-14` PRDs | mostly stubbed in code today |
| Design artifact | `pencil-shadcn.pen` | master UI file |

## CONVENTIONS
- PRD numbering matters; keep filenames stable and ordered.
- Most PRDs include role expectations, functional requirements, data shapes, API ideas, and acceptance checkpoints.
- Use PRDs to validate intent, state names, and UI expectations before changing code.
- `REVISION_CHANGELOG.md` tracks spec evolution across the set.

## ANTI-PATTERNS
- Do not assume current implementation fully matches the PRD; check code status separately.
- Do not turn speculative API tables into authoritative backend truth without reading actual routes.
- Do not ignore the design asset references when the PRD explicitly ties UI work to them.

## NOTES
- `docs/prd/` is stronger than ad hoc comments for feature intent.
- Image/resource subdirs support the PRDs; they are assets, not behavioral guidance.
