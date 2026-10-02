# AI_FEEDBACK KNOWLEDGE BASE

## OVERVIEW
`backend/ai_feedback/` is the provider-facing essay-analysis integration layer.
The product providers are Codex (`codex_provider.py`, `practice_provider.py`,
`codex_rubric_parser.py`). The earlier Dify and LangGraph clients were removed
because nothing called them; restore them from git history only if a task
explicitly brings those providers back.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Codex provider | `codex_provider.py` | formal assessment drafts and source checks |
| Practice provider | `practice_provider.py` | practice-studio reports and chat |
| Abstraction contracts | `interfaces.py` | provider-neutral workflow interfaces |
| Error model | `exceptions.py` | unified exception hierarchy |
| Source retrieval | `source_retrieval.py` | public-only HTTPS fetching for citation checks |
| Rubric ingestion | `rubric_parser.py` | PDF parsing + provider interactions |

## CONVENTIONS
- Keep provider-specific logic behind interface-style boundaries.
- Raise typed exceptions from `exceptions.py`; callers map these to HTTP errors.
- Treat workflow input/output contracts as stable boundaries with the API layer.
- This module may depend on core models for rubric lookup, but it should stay isolated from general API/router concerns.

## MIGRATION CONTEXT
- Do not treat an old migration priority as authorization to change providers or models.
- Keep the API shape stable for the frontend when provider internals change.
- New provider code should sit behind the interfaces in `interfaces.py`.

## ANTI-PATTERNS
- Do not leak provider-specific response shapes across the API boundary.
- Do not bypass the exception hierarchy with raw provider errors.
- Do not couple migration work directly to unrelated frontend refactors.

## NOTES
- `rubric_parser.py` is a hotspot: provider calls, parsing, and debug logic meet there.
- Read `backend/api_v2/ai_feedback/views.py` alongside this directory when changing end-to-end behavior.
