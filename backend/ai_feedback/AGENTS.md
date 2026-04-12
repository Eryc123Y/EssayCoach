# AI_FEEDBACK KNOWLEDGE BASE

## OVERVIEW
`backend/ai_feedback/` is the provider-facing essay-analysis integration layer. It currently wraps Dify, but the project priority is migrating this area to a custom agent architecture.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Current provider client | `dify_client.py` | active implementation |
| Abstraction contracts | `interfaces.py` | provider-neutral workflow interfaces |
| Error model | `exceptions.py` | unified exception hierarchy |
| Output shaping | `response_transformer.py` | provider response normalization |
| Rubric ingestion | `rubric_parser.py` | PDF parsing + provider interactions |

## CONVENTIONS
- Keep provider-specific logic behind interface-style boundaries.
- Raise typed exceptions from `exceptions.py`; callers map these to HTTP errors.
- Treat workflow input/output contracts as stable boundaries with the API layer.
- This module may depend on core models for rubric lookup, but it should stay isolated from general API/router concerns.

## MIGRATION CONTEXT
- This is the P0 migration surface called out in root `AGENTS.md`.
- Existing API shape should remain stable for the frontend while internals change from Dify to custom agents.
- If adding new agent code, make the transition path obvious from current Dify behaviors to future provider-neutral abstractions.

## ANTI-PATTERNS
- Do not leak provider-specific response shapes across the API boundary.
- Do not bypass the exception hierarchy with raw provider errors.
- Do not couple migration work directly to unrelated frontend refactors.

## NOTES
- `rubric_parser.py` is a hotspot: provider calls, parsing, and debug logic meet there.
- Read `backend/api_v2/ai_feedback/views.py` alongside this directory when changing end-to-end behavior.
