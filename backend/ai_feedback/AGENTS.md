# AI_FEEDBACK KNOWLEDGE BASE

## OVERVIEW
`backend/ai_feedback/` is the provider-facing essay-analysis integration layer.
Read `agent_factory.py` and the API caller to determine the selected provider;
the Dify and optional LangGraph paths are product behavior, separate from Codex.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Provider selection | `agent_factory.py` | configured essay-analysis backend |
| Dify provider client | `dify_client.py` | provider-specific implementation |
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
- Do not treat an old migration priority as authorization to change providers or models.
- Existing API shape should remain stable for the frontend while internals change from Dify to custom agents.
- If adding new agent code, make the transition path obvious from current Dify behaviors to future provider-neutral abstractions.

## ANTI-PATTERNS
- Do not leak provider-specific response shapes across the API boundary.
- Do not bypass the exception hierarchy with raw provider errors.
- Do not couple migration work directly to unrelated frontend refactors.

## NOTES
- `rubric_parser.py` is a hotspot: provider calls, parsing, and debug logic meet there.
- Read `backend/api_v2/ai_feedback/views.py` alongside this directory when changing end-to-end behavior.
