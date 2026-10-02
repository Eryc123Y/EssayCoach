"""Institution-only essay sharing, peer responses, and teacher moderation."""

from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from api_v2.types.enums import ReportDecision, ReportStatus, ReportTargetType, SocialContentStatus
from api_v2.utils.auth import JWTAuth
from api_v2.utils.course_scope import can_manage_class
from core.models import (
    Class,
    ContentReport,
    Enrollment,
    Feedback,
    SharedEssay,
    SocialInteraction,
    SocialPostingBan,
    Submission,
    User,
)
from core.notifications import dispatch_notification

from .schemas import (
    ContentReportIn,
    ContentReportOut,
    PostingBanIn,
    ResolveReportIn,
    SharedEssayIn,
    ShareUpdateIn,
    SocialInteractionIn,
    SocialInteractionOut,
)

router = Router(tags=["Social Hub"], auth=JWTAuth())


def _can_moderate(user: User, share: SharedEssay) -> bool:
    return can_manage_class(user, share.class_obj)


def _can_view(user: User, share: SharedEssay) -> bool:
    if share.owner_id == user.pk or _can_moderate(user, share):
        return share.status != "removed"
    if share.status != "visible" or share.visibility == "anonymous":
        return False
    if share.visibility == "public":
        return True
    return Enrollment.objects.filter(user_id_user=user, class_id_class=share.class_obj).exists()


def _require_share(user: User, submission_id: int) -> SharedEssay:
    share = get_object_or_404(
        SharedEssay.objects.select_related("submission__task_id_task", "owner", "class_obj"),
        submission_id=submission_id,
    )
    if not _can_view(user, share):
        raise HttpError(404, "Shared essay not found")
    return share


def _require_moderator(user: User, share: SharedEssay) -> None:
    if not _can_moderate(user, share):
        raise HttpError(403, "Only this class's teaching staff can moderate")


def _posting_allowed(user: User, class_obj: Class) -> None:
    if SocialPostingBan.objects.filter(user=user, class_obj=class_obj, expires_at__gt=timezone.now()).exists():
        raise HttpError(403, "Posting is temporarily disabled for this class")


def _response_visible(item: SocialInteraction, viewer: User, can_moderate: bool) -> bool:
    """Removed responses are gone for everyone; hidden ones stay visible to moderators and their author."""
    if item.status == SocialContentStatus.REMOVED:
        return False
    if item.status == SocialContentStatus.HIDDEN:
        return can_moderate or item.user_id == viewer.pk
    return True


def _display_name(user: User) -> str:
    return user.get_full_name() or user.user_email


def _serialize(share: SharedEssay, viewer: User) -> dict:
    can_moderate = _can_moderate(viewer, share)
    interactions = [item for item in share.interactions.all() if _response_visible(item, viewer, can_moderate)]
    author_visible = share.visibility != "anonymous" or share.owner_id == viewer.pk or can_moderate
    return {
        "id": share.pk,
        "submission_id": share.submission_id,
        "class_id": share.class_obj_id,
        "class_name": share.class_obj.class_name,
        "task_title": share.submission.task_id_task.task_title,
        "essay_text": share.submission.submission_txt,
        "user_id": share.owner_id if author_visible else None,
        "author": (share.owner.get_full_name() or share.owner.user_email) if author_visible else "Anonymous",
        "visibility": share.visibility,
        "caption": share.caption,
        "tags": share.tags,
        "status": share.status,
        "created_at": share.created_at,
        "updated_at": share.updated_at,
        "likes_count": sum(item.interaction_type == "like" for item in interactions),
        "comments_count": sum(item.interaction_type in {"comment", "feedback"} for item in interactions),
        "bookmarks_count": sum(item.interaction_type == "bookmark" for item in interactions),
        "liked_by_me": any(item.user_id == viewer.pk and item.interaction_type == "like" for item in interactions),
        "bookmarked_by_me": any(
            item.user_id == viewer.pk and item.interaction_type == "bookmark" for item in interactions
        ),
        "is_mine": share.owner_id == viewer.pk,
        "can_moderate": can_moderate,
    }


@router.get("/feed/", response=list[dict])
def get_social_feed(
    request: HttpRequest,
    search: str = "",
    class_id: int | None = None,
    tag: str = "",
    mine: bool = False,
    moderation: bool = False,
    sort: str = "recent",
    limit: int = 20,
    offset: int = 0,
):
    if not 1 <= limit <= 50 or offset < 0:
        raise HttpError(400, "Invalid feed page")
    if sort not in {"recent", "trending"}:
        raise HttpError(400, "Unknown feed sort")
    queryset = (
        SharedEssay.objects.select_related("submission__task_id_task", "owner", "class_obj")
        .prefetch_related("interactions")
        .exclude(status="removed")
    )
    if class_id is not None:
        queryset = queryset.filter(class_obj_id=class_id)
    if moderation:
        if request.auth.user_role == "student":
            raise HttpError(403, "Teaching staff only")
    elif mine:
        queryset = queryset.filter(owner=request.auth)
    else:
        queryset = queryset.filter(status="visible")
    if search:
        queryset = queryset.filter(
            Q(submission__submission_txt__icontains=search)
            | Q(submission__task_id_task__task_title__icontains=search)
            | Q(caption__icontains=search)
            | Q(owner__user_fname__icontains=search)
            | Q(owner__user_lname__icontains=search)
        )
    shares = [share for share in queryset.order_by("-created_at")[:500] if _can_view(request.auth, share)]
    if tag:
        shares = [share for share in shares if tag.lower() in [str(value).lower() for value in share.tags]]
    if sort == "trending":
        shares.sort(
            key=lambda share: sum(item.interaction_type == "like" for item in share.interactions.all()), reverse=True
        )
    return [_serialize(share, request.auth) for share in shares[offset : offset + limit]]


@router.get("/feed/{submission_id}/", response=dict)
def get_shared_essay(request: HttpRequest, submission_id: int):
    return _serialize(_require_share(request.auth, submission_id), request.auth)


@router.post("/share/", response=dict)
def share_essay(request: HttpRequest, data: SharedEssayIn):
    actor = request.auth
    if actor.user_role != "student":
        raise HttpError(403, "Only students can share their essays")
    submission = get_object_or_404(Submission.objects.select_related("task_id_task"), pk=data.submission_id)
    if submission.user_id_user_id != actor.pk:
        raise HttpError(403, "You can share only your own essay")
    if not Feedback.objects.filter(submission_id_submission=submission, status="published").exists():
        raise HttpError(409, "Only essays with released grades can be shared")
    task = submission.task_id_task
    if task.class_id_class_id is not None:
        if data.class_id is not None and data.class_id != task.class_id_class_id:
            raise HttpError(400, "Class does not match the assignment")
        class_obj = task.class_id_class
    elif data.class_id is not None:
        class_obj = get_object_or_404(Class, pk=data.class_id, unit_id_unit=task.unit_id_unit)
    else:
        classes = list(Class.objects.filter(enrollment__user_id_user=actor, unit_id_unit=task.unit_id_unit)[:2])
        if len(classes) != 1:
            raise HttpError(400, "Choose a class for this shared essay")
        class_obj = classes[0]
    if not Enrollment.objects.filter(user_id_user=actor, class_id_class=class_obj).exists():
        raise HttpError(403, "You must belong to this class")
    _posting_allowed(actor, class_obj)
    tags = [tag.strip() for tag in data.tags if tag.strip()]
    if any(len(tag) > 30 for tag in tags):
        raise HttpError(400, "Tags must be 30 characters or fewer")
    with transaction.atomic():
        share, created = SharedEssay.objects.select_for_update().get_or_create(
            submission=submission,
            defaults={
                "owner": actor,
                "class_obj": class_obj,
                "visibility": data.visibility,
                "caption": data.caption.strip(),
                "tags": tags,
            },
        )
        if not created:
            if share.status != "removed":
                raise HttpError(409, "Essay is already shared")
            share.status = "visible"
            share.visibility = data.visibility
            share.class_obj = class_obj
            share.caption = data.caption.strip()
            share.tags = tags
            share.save(update_fields=["status", "visibility", "class_obj", "caption", "tags", "updated_at"])
    return _serialize(share, actor)


@router.put("/shares/{submission_id}/", response=dict)
def update_share(request: HttpRequest, submission_id: int, data: ShareUpdateIn):
    share = _require_share(request.auth, submission_id)
    if share.owner_id != request.auth.pk:
        raise HttpError(403, "Only the author can edit sharing")
    if share.status != "visible":
        raise HttpError(409, "This share is not visible")
    share.visibility = data.visibility
    share.caption = data.caption.strip()
    share.tags = [tag.strip() for tag in data.tags if tag.strip()]
    if any(len(tag) > 30 for tag in share.tags):
        raise HttpError(400, "Tags must be 30 characters or fewer")
    share.save(update_fields=["visibility", "caption", "tags", "updated_at"])
    return _serialize(share, request.auth)


@router.delete("/shares/{submission_id}/", response=dict)
def remove_share(request: HttpRequest, submission_id: int):
    share = _require_share(request.auth, submission_id)
    if share.owner_id != request.auth.pk and not _can_moderate(request.auth, share):
        raise HttpError(403, "Only the author or teaching staff can remove a share")
    share.status = "removed"
    share.save(update_fields=["status", "updated_at"])
    return {"success": True}


@router.post("/{submission_id}/interact/", response=dict)
def interact_with_essay(request: HttpRequest, submission_id: int, data: SocialInteractionIn):
    share = _require_share(request.auth, submission_id)
    if share.status != "visible":
        raise HttpError(409, "This essay is not available for interaction")
    if data.interaction_type in {"comment", "feedback"}:
        content = (data.content or "").strip()
        if len(content) < 3:
            raise HttpError(400, "Write at least three characters")
        _posting_allowed(request.auth, share.class_obj)
        interaction = SocialInteraction.objects.create(
            share=share,
            user=request.auth,
            interaction_type=data.interaction_type,
            content=content,
        )
        created = True
    else:
        interaction, created = SocialInteraction.objects.get_or_create(
            share=share,
            user=request.auth,
            interaction_type=data.interaction_type,
        )
    if (
        created
        and interaction.interaction_type in {"like", "comment", "feedback"}
        and share.owner_id != request.auth.pk
    ):
        action = {
            "like": ("liked", "点赞了"),
            "comment": ("commented on", "评论了"),
            "feedback": ("gave feedback on", "反馈了"),
        }[interaction.interaction_type]
        dispatch_notification(
            share.owner, event_key=f"social:interaction:{interaction.pk}", kind="social", category="social_alerts",
            title_en="Activity on your shared essay", title_zh="你分享的文章有新互动",
            body_en=f"Someone {action[0]} {share.submission.task_id_task.task_title}.",
            body_zh=f"有人{action[1]}《{share.submission.task_id_task.task_title}》。",
            link="/dashboard/community",
        )
    return _interaction_row(interaction, request.auth)


def _interaction_row(item: SocialInteraction, viewer: User) -> dict:
    return {
        "id": item.pk,
        "submission_id": item.share.submission_id,
        "user_id": item.user_id,
        "author": _display_name(item.user),
        "interaction_type": item.interaction_type,
        "content": item.content,
        "status": item.status,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        "is_mine": item.user_id == viewer.pk,
    }


@router.get("/{submission_id}/interactions/", response=list[SocialInteractionOut])
def list_interactions(request: HttpRequest, submission_id: int):
    share = _require_share(request.auth, submission_id)
    can_moderate = _can_moderate(request.auth, share)
    return [
        _interaction_row(item, request.auth)
        for item in share.interactions.filter(interaction_type__in=["comment", "feedback"])
        .exclude(status=SocialContentStatus.REMOVED)
        .select_related("user", "share")
        .order_by("created_at")
        if _response_visible(item, request.auth, can_moderate)
    ]


@router.delete("/interactions/{interaction_id}/", response=dict)
def remove_interaction(request: HttpRequest, interaction_id: int):
    item = get_object_or_404(
        SocialInteraction.objects.select_related("share__class_obj").exclude(status=SocialContentStatus.REMOVED),
        pk=interaction_id,
    )
    if item.user_id != request.auth.pk and not _can_moderate(request.auth, item.share):
        raise HttpError(403, "Cannot remove this response")
    if ContentReport.objects.filter(
        interaction=item, status__in=["open", "investigating"]
    ).exists():
        raise HttpError(409, "This response cannot be removed while its report is under review")
    item.delete()
    return {"success": True}


@router.delete("/{submission_id}/interact/{interaction_type}/", response=dict)
def remove_toggle(request: HttpRequest, submission_id: int, interaction_type: str):
    if interaction_type not in {"like", "bookmark"}:
        raise HttpError(400, "Only likes and bookmarks can be toggled")
    share = _require_share(request.auth, submission_id)
    SocialInteraction.objects.filter(share=share, user=request.auth, interaction_type=interaction_type).delete()
    return {"success": True}


@router.post("/report/", response=ContentReportOut)
def report_content(request: HttpRequest, data: ContentReportIn):
    if data.reason not in {"spam", "offensive", "inappropriate", "other"}:
        raise HttpError(400, "Choose a report reason")
    if data.submission_id is None and data.interaction_id is None:
        raise HttpError(400, "Choose content to report")
    interaction = None
    if data.interaction_id is not None:
        interaction = get_object_or_404(
            SocialInteraction.objects.select_related("share", "user"), pk=data.interaction_id
        )
        if data.submission_id is not None and interaction.share.submission_id != data.submission_id:
            raise HttpError(400, "Report targets do not match")
        submission_id = interaction.share.submission_id
        if interaction.interaction_type not in {"comment", "feedback"}:
            raise HttpError(400, "Only comments and feedback can be reported")
    else:
        submission_id = data.submission_id
    share = _require_share(request.auth, submission_id)
    if interaction is not None and not _response_visible(interaction, request.auth, _can_moderate(request.auth, share)):
        raise HttpError(404, "Response not found")
    report = ContentReport.objects.create(
        share=share,
        interaction=interaction,
        target_type=ReportTargetType(interaction.interaction_type) if interaction else ReportTargetType.ESSAY,
        target_content=interaction.content if interaction else "",
        target_author=_display_name(interaction.user) if interaction else "",
        reporter=request.auth,
        reason=data.reason,
        description=data.description.strip(),
    )
    return _report_row(report, request.auth)


def _report_row(report: ContentReport, viewer: User) -> dict:
    """Describe the report by its persisted target, never by whichever object still exists."""
    share = report.share
    if report.target_type == ReportTargetType.ESSAY:
        author_visible = share.visibility != "anonymous" or share.owner_id == viewer.pk or _can_moderate(viewer, share)
        target_content = share.submission.submission_txt[:500]
        target_author = _display_name(share.owner) if author_visible else "Anonymous"
        target_status = share.status
    else:
        # A response deleted by its author leaves the snapshot; a moderator removal is a soft delete.
        interaction = report.interaction
        target_content = interaction.content if interaction else report.target_content
        target_author = _display_name(interaction.user) if interaction else report.target_author
        target_status = interaction.status if interaction else SocialContentStatus.REMOVED
    return {
        "id": report.pk,
        "submission_id": share.submission_id,
        "interaction_id": report.interaction_id,
        "target_type": report.target_type,
        "target_content": target_content,
        "target_author": target_author,
        "target_status": target_status,
        "reporter_id": report.reporter_id,
        "reason": report.reason,
        "description": report.description,
        "status": report.status,
        "decision": report.decision,
        "resolved_by": report.resolved_by_id,
        "resolved_at": report.resolved_at,
        "created_at": report.created_at,
    }


_REPORT_RELATED = ("share__class_obj", "share__submission", "share__owner", "reporter", "interaction__user")


@router.get("/reports/me/", response=list[ContentReportOut])
def my_reports(request: HttpRequest):
    return [
        _report_row(row, request.auth)
        for row in ContentReport.objects.filter(reporter=request.auth)
        .select_related(*_REPORT_RELATED)
        .order_by("-created_at")
    ]


@router.get("/moderation/reports/", response=list[ContentReportOut])
def moderation_reports(request: HttpRequest, status: str = "open"):
    if request.auth.user_role == "student":
        raise HttpError(403, "Teaching staff only")
    queryset = ContentReport.objects.select_related(*_REPORT_RELATED)
    if status != "all":
        queryset = queryset.filter(status=status)
    return [
        _report_row(row, request.auth)
        for row in queryset.order_by("-created_at")[:100]
        if _can_moderate(request.auth, row.share)
    ]


@router.post("/moderation/reports/{report_id}/resolve/", response=ContentReportOut)
def resolve_report(request: HttpRequest, report_id: int, data: ResolveReportIn):
    """Apply a decision to the reported target only.

    An essay report hides or removes the shared essay. A response report hides or
    soft-removes that one response and never changes the essay, even when the
    response no longer exists. Removing a response also resolves every other open
    report on it, so no later report on that response can reach the essay.
    """
    if data.decision not in set(ReportDecision):
        raise HttpError(400, "Decision must be keep, hide, or remove")
    decision = ReportDecision(data.decision)
    with transaction.atomic():
        # Lock the reported response before any report row, so two moderators
        # resolving reports on the same response queue up instead of deadlocking.
        target_id = ContentReport.objects.filter(pk=report_id).values_list("interaction_id", flat=True).first()
        interaction = (
            SocialInteraction.objects.select_for_update().filter(pk=target_id).first() if target_id else None
        )
        report = get_object_or_404(
            ContentReport.objects.select_for_update(of=("self",)).select_related(
                "share__class_obj", "share__submission", "share__owner"
            ),
            pk=report_id,
        )
        _require_moderator(request.auth, report.share)
        if report.status in {ReportStatus.RESOLVED, ReportStatus.DISMISSED}:
            raise HttpError(409, "Report was already resolved")
        if interaction is not None and interaction.pk != report.interaction_id:
            interaction = None
        now = timezone.now()
        if report.target_type == ReportTargetType.ESSAY:
            share = report.share
            if decision == ReportDecision.HIDE and share.status == SocialContentStatus.VISIBLE:
                share.status = SocialContentStatus.HIDDEN
                share.save(update_fields=["status", "updated_at"])
            elif decision == ReportDecision.REMOVE and share.status != SocialContentStatus.REMOVED:
                share.status = SocialContentStatus.REMOVED
                share.save(update_fields=["status", "updated_at"])
        elif interaction is not None:
            if decision == ReportDecision.HIDE and interaction.status == SocialContentStatus.VISIBLE:
                interaction.status = SocialContentStatus.HIDDEN
                interaction.save(update_fields=["status", "updated_at"])
            elif decision == ReportDecision.REMOVE:
                if interaction.status != SocialContentStatus.REMOVED:
                    interaction.status = SocialContentStatus.REMOVED
                    interaction.save(update_fields=["status", "updated_at"])
                ContentReport.objects.filter(
                    interaction=interaction, status__in=[ReportStatus.OPEN, ReportStatus.INVESTIGATING]
                ).exclude(pk=report.pk).update(
                    status=ReportStatus.RESOLVED,
                    decision=ReportDecision.REMOVE,
                    resolved_by=request.auth,
                    resolved_at=now,
                    updated_at=now,
                )
        report.status = ReportStatus.DISMISSED if decision == ReportDecision.KEEP else ReportStatus.RESOLVED
        report.decision = decision
        report.resolved_by = request.auth
        report.resolved_at = now
        report.save(update_fields=["status", "decision", "resolved_by", "resolved_at", "updated_at"])
        report.interaction = interaction
    return _report_row(report, request.auth)


@router.post("/moderation/interactions/{interaction_id}/restore/", response=SocialInteractionOut)
def restore_interaction(request: HttpRequest, interaction_id: int):
    item = get_object_or_404(SocialInteraction.objects.select_related("share__class_obj", "user"), pk=interaction_id)
    _require_moderator(request.auth, item.share)
    if item.status != SocialContentStatus.HIDDEN:
        raise HttpError(409, "Only hidden responses can be restored")
    item.status = SocialContentStatus.VISIBLE
    item.save(update_fields=["status", "updated_at"])
    return _interaction_row(item, request.auth)


@router.post("/moderation/{submission_id}/hide/", response=dict)
def hide_share(request: HttpRequest, submission_id: int):
    share = get_object_or_404(SharedEssay.objects.select_related("class_obj"), submission_id=submission_id)
    _require_moderator(request.auth, share)
    if share.status == "removed":
        raise HttpError(409, "Removed essays cannot be restored")
    share.status = "hidden"
    share.save(update_fields=["status", "updated_at"])
    return {"success": True}


@router.post("/moderation/{submission_id}/restore/", response=dict)
def restore_share(request: HttpRequest, submission_id: int):
    share = get_object_or_404(SharedEssay.objects.select_related("class_obj"), submission_id=submission_id)
    _require_moderator(request.auth, share)
    if share.status != "hidden":
        raise HttpError(409, "Only hidden essays can be restored")
    share.status = "visible"
    share.save(update_fields=["status", "updated_at"])
    return {"success": True}


@router.post("/moderation/users/{user_id}/ban/", response=dict)
def ban_posting(request: HttpRequest, user_id: int, data: PostingBanIn):
    class_obj = get_object_or_404(Class, pk=data.class_id)
    if not can_manage_class(request.auth, class_obj):
        raise HttpError(403, "Only this class's teaching staff can manage posting")
    target = get_object_or_404(User, pk=user_id, user_role="student")
    if not Enrollment.objects.filter(user_id_user=target, class_id_class=class_obj).exists():
        raise HttpError(400, "Student does not belong to this class")
    ban = SocialPostingBan.objects.create(
        user=target,
        class_obj=class_obj,
        expires_at=timezone.now() + timedelta(days=data.days),
        reason=data.reason.strip(),
        created_by=request.auth,
    )
    return {"id": ban.pk, "user_id": target.pk, "class_id": class_obj.pk, "expires_at": ban.expires_at}
