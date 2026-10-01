"""Role-aware help articles and durable local support tickets."""

from __future__ import annotations

import os

from django.http import HttpRequest
from ninja import Query, Router
from ninja.errors import HttpError

from api_v2.utils.auth import JWTAuth
from api_v2.utils.permissions import IsAdmin
from core.help_content import visible_articles
from core.models import HelpArticleVote, SupportTicket

from .schemas import (
    ArticleOut,
    ArticleSearchIn,
    ArticleVoteIn,
    ArticleVoteOut,
    FAQOut,
    SupportContactOut,
    SupportTicketIn,
    SupportTicketOut,
    SupportTicketUpdateIn,
)

router = Router(tags=["Help Center"], auth=JWTAuth())

FAQS = [
    {
        "question": {"en": "How do I get access?", "zh": "如何获得访问权限？"},
        "answer": {
            "en": "Use an invitation from your institution. Contact your course team if you need one.",
            "zh": "请使用所在机构发出的邀请。如需邀请，请联系课程团队。",
        },
    },
    {
        "question": {"en": "Does practice feedback affect my grade?", "zh": "练习反馈会影响成绩吗？"},
        "answer": {
            "en": "No. Practice feedback is separate from formal assessment and grades.",
            "zh": "不会。练习反馈与正式考核和成绩分开。",
        },
    },
    {
        "question": {"en": "Why can’t I see an assignment or grade?", "zh": "为什么看不到作业或成绩？"},
        "answer": {
            "en": (
                "Check class enrollment and whether the assignment is published. Grades appear after teaching staff "
                "review and release them."
            ),
            "zh": "请检查班级选课状态和作业是否已发布。成绩须经教师复核并发布后才会显示。",
        },
    },
]


@router.get("/faqs/", response=list[FAQOut])
def list_faqs(request: HttpRequest, language: str = "en"):
    if language not in ("en", "zh"):
        raise HttpError(400, "Unsupported language")
    return [{"question": item["question"][language], "answer": item["answer"][language]} for item in FAQS]


@router.get("/support/contact/", response=SupportContactOut)
def support_contact(request: HttpRequest):
    email = os.environ.get("SUPPORT_EMAIL", "").strip() or None
    return {"email": email, "configured": email is not None}


def _ticket_out(ticket: SupportTicket) -> dict:
    return {
        "id": ticket.pk,
        "user_id": ticket.user_id,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
        "staff_reply": ticket.staff_reply,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
    }


@router.get("/articles/", response=list[ArticleOut])
def search_articles(request: HttpRequest, filters: ArticleSearchIn = Query(...)):
    return visible_articles(
        request.auth.user_role,
        filters.language,
        query=filters.query,
        category=filters.category,
    )


@router.get("/articles/{article_slug}/", response=ArticleOut)
def get_article(request: HttpRequest, article_slug: str, language: str = "en"):
    if language not in ("en", "zh"):
        raise HttpError(400, "Unsupported language")
    article = next(
        (item for item in visible_articles(request.auth.user_role, language) if item["slug"] == article_slug),
        None,
    )
    if article is None:
        raise HttpError(404, "Article not found")
    return article


def _check_article_visible(request: HttpRequest, article_slug: str) -> None:
    if not any(item["slug"] == article_slug for item in visible_articles(request.auth.user_role, "en")):
        raise HttpError(404, "Article not found")


def _article_vote_out(request: HttpRequest, article_slug: str) -> dict:
    votes = HelpArticleVote.objects.filter(article_slug=article_slug)
    own = votes.filter(user=request.auth).first()
    return {
        "helpful": own.helpful if own else None,
        "helpful_count": votes.filter(helpful=True).count(),
        "unhelpful_count": votes.filter(helpful=False).count(),
    }


@router.get("/articles/{article_slug}/feedback/", response=ArticleVoteOut)
def get_article_feedback(request: HttpRequest, article_slug: str):
    _check_article_visible(request, article_slug)
    return _article_vote_out(request, article_slug)


@router.post("/articles/{article_slug}/feedback/", response=ArticleVoteOut)
def vote_on_article(request: HttpRequest, article_slug: str, data: ArticleVoteIn):
    _check_article_visible(request, article_slug)
    HelpArticleVote.objects.update_or_create(
        user=request.auth, article_slug=article_slug, defaults={"helpful": data.helpful}
    )
    return _article_vote_out(request, article_slug)


@router.post("/tickets/", response=SupportTicketOut)
def create_ticket(request: HttpRequest, data: SupportTicketIn):
    subject = data.subject.strip()
    description = data.description.strip()
    if not subject or len(description) < 10:
        raise HttpError(400, "A subject and description of at least 10 characters are required")
    if data.attachment_ids:
        raise HttpError(400, "Attachments are not supported in the local release")
    ticket = SupportTicket.objects.create(
        user=request.auth,
        subject=subject,
        description=description,
        priority=data.priority,
    )
    return _ticket_out(ticket)


@router.get("/tickets/me/", response=list[SupportTicketOut])
def get_my_tickets(request: HttpRequest):
    return [_ticket_out(ticket) for ticket in SupportTicket.objects.filter(user=request.auth)]


@router.get("/admin/tickets/", response=list[SupportTicketOut])
def list_all_tickets(request: HttpRequest):
    IsAdmin().check(request)
    return [_ticket_out(ticket) for ticket in SupportTicket.objects.all()[:200]]


@router.patch("/admin/tickets/{ticket_id}/", response=SupportTicketOut)
def update_ticket(request: HttpRequest, ticket_id: int, data: SupportTicketUpdateIn):
    IsAdmin().check(request)
    ticket = SupportTicket.objects.filter(pk=ticket_id).first()
    if ticket is None:
        raise HttpError(404, "Ticket not found")
    ticket.status = data.status
    ticket.staff_reply = data.staff_reply.strip()
    ticket.handled_by = request.auth
    ticket.save(update_fields=["status", "staff_reply", "handled_by", "updated_at"])
    return _ticket_out(ticket)
