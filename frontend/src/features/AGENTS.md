# FEATURES KNOWLEDGE BASE

## OVERVIEW
`frontend/src/features/` follows a feature-slice pattern: domain code lives by feature, not by component type.

## STRUCTURE
```text
features/
├── dashboard/      # role dashboards + hooks + tests
├── essay-feedback/ # feedback UI, PDF, radar, revision chat
├── rubrics/        # rubric list/hooks/tests
├── tasks/          # task forms/cards/dialogs
├── classes/        # class list/forms/dialogs
├── settings/       # section components + Zustand store
└── profile/        # profile tabs + hooks
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Dashboard role UI | `dashboard/` | largest feature test surface |
| Essay analysis/feedback UX | `essay-feedback/` | PDF + radar + revision chat |
| Task workflows | `tasks/` | watch gitignore gotcha |
| Class workflows | `classes/` | batch enroll + invite lecturer |
| Settings state | `settings/` | only feature with a store subtree |
| Rubric loading/filtering | `rubrics/hooks/useRubrics.ts` | still tied to legacy rubric service |

## CONVENTIONS
- Prefer co-locating feature components, hooks, tests, and small local types.
- Add shared cross-feature helpers to `src/lib/` or `src/service/`, not to an arbitrary feature.
- Use feature barrel exports (`index.ts`) when a feature already exposes one.
- Co-located tests are the norm; many mature features already have strong test coverage.
- Hook-based state is default; Zustand store usage is exceptional, not automatic.

## TEST PATTERNS
- Tests are usually beside the feature code as `*.test.ts` / `*.test.tsx`.
- Scope fake timers per `describe` block, not globally.
- Prefer Testing Library queries like `screen.getByText()`.

## ANTI-PATTERNS
- Do not create duplicate feature-local service clients when `src/service/api/v2/` already owns the contract.
- Do not move shared auth/API logic into features.
- For new files under `tasks/`, remember root gitignore may require `git add -f`.

## NOTES
- `dashboard/` and `essay-feedback/` are the heaviest feature areas.
- `overview/` is dashboard-widget-oriented despite living as a separate feature.
