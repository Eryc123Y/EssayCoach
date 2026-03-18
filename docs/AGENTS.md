# DOCS KNOWLEDGE BASE

## OVERVIEW
`docs/` mixes source-of-truth product docs, architecture references, implementation learnings, troubleshooting runbooks, and generated/static documentation assets.

## STRUCTURE
```text
docs/
├── prd/            # source-of-truth feature specs
├── architecture/   # auth/system/dev environment docs
├── learnings/      # implementation logs + lessons
├── troubleshooting/ # issue/runbook history
├── api-reference/  # generated OpenAPI artifacts
└── static/         # generated/vendor assets
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Feature requirements | `prd/AGENTS.md` | numbered PRDs + design assets |
| Auth/deployment/system design | `architecture/AGENTS.md` | reference docs; verify against code |
| Historical implementation context | `learnings/AGENTS.md` | what changed and why |
| Recovery steps | `troubleshooting/` | symptom→fix runbooks |
| Generated API docs | `api-reference/` | output, not hand-maintained |

## CONVENTIONS
- Treat `docs/prd/` as product source of truth for feature intent and UI/data expectations.
- Treat `docs/learnings/` as retrospective implementation memory, not normative spec.
- Treat `docs/architecture/` as reference context, not as stronger than PRDs or current code.
- Generated outputs belong in generated/static doc areas; avoid hand-editing them unless that workflow is explicit.
- `Makefile` + `scripts/generate-docs.py` own most regeneration flows.

## ANTI-PATTERNS
- Do not treat learnings docs as newer than actual code without verifying.
- Do not edit generated assets to “fix” source problems upstream.
- Do not rely on older frontend/backend READMEs when `CLAUDE.md` or current code contradicts them.

## COMMANDS
```bash
make docs-api
make docs-build
make docs
make docs-erd
```

## NOTES
- `prd/`, `learnings/`, and `troubleshooting/` are internal-facing working docs and are excluded from the public MkDocs site.
- `docs/static/js/mermaid.min.js` is vendor output; ignore it for repo guidance.
- The docs tree is large, but only a few subareas need behavioral guidance.
- Some architecture docs still describe older v1/DRF-era flows; always cross-check with `CLAUDE.md` and current route files.
