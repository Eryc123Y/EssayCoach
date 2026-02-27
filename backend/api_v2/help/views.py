from __future__ import annotations

from django.http import HttpRequest
from ninja import Router

from api_v2.utils.auth import JWTAuth

from .schemas import (
    ArticleOut,
    ArticleSearchIn,
    SupportTicketIn,
    SupportTicketOut,
)

router = Router(tags=["Help Center"], auth=JWTAuth())

# =============================================================================
# PRD-14: Help Center Endpoints
# =============================================================================


@router.get("/articles/", response=list[ArticleOut])
def search_articles(request: HttpRequest, filters: ArticleSearchIn = ArticleSearchIn(query="")):
    """Search for help articles."""
    # STUB: implementation pending
    return []


@router.get("/articles/{article_slug}/", response=ArticleOut)
def get_article(request: HttpRequest, article_slug: str):
    """Get a specific help article by its slug."""
    # STUB: implementation pending
    raise NotImplementedError(f"Article {article_slug} not implemented yet")


@router.post("/tickets/", response=SupportTicketOut)
def create_ticket(request: HttpRequest, data: SupportTicketIn):
    """Create a new support ticket."""
    # STUB: implementation pending
    raise NotImplementedError("Creating tickets not implemented yet")


@router.get("/tickets/me/", response=list[SupportTicketOut])
def get_my_tickets(request: HttpRequest):
    """Retrieve the current user's support tickets."""
    # STUB: implementation pending
    return []
