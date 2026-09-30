"""Institution-scoped profile portfolio with explicit peer visibility controls."""

from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpRequest
from ninja import Router, Schema
from ninja.errors import HttpError
from pydantic import Field

from api_v2.utils.auth import JWTAuth
from api_v2.utils.course_scope import visible_classes, visible_users
from core.models import Enrollment, Feedback, MarkingRubric, SharedEssay, Submission, TeachingAssn, User, UserBadge

router = Router(tags=["Profiles"], auth=JWTAuth())


class ProfileUpdateIn(Schema):
    bio: str = Field(max_length=300)
    visibility: str
    show_essays: bool
    show_scores: bool


def _can_view(actor: User, target: User) -> bool:
    if actor.pk == target.pk or actor.user_role == "admin":
        return True
    if target.user_role == "admin":
        return False
    if visible_users(actor).filter(pk=target.pk).exists():
        return True
    if target.profile_visibility == "private":
        return False
    if target.profile_visibility == "institution":
        return True
    actor_classes = Enrollment.objects.filter(user_id_user=actor).values_list("class_id_class_id", flat=True)
    if target.user_role == "student":
        return Enrollment.objects.filter(user_id_user=target, class_id_class_id__in=actor_classes).exists()
    return TeachingAssn.objects.filter(user_id_user=target, class_id_class_id__in=actor_classes).exists()


def _serialize(actor: User, target: User) -> dict:
    own = actor.pk == target.pk
    staff = actor.user_role == "admin" or visible_users(actor).filter(pk=target.pk).exists()
    see_essays = own or staff or target.profile_show_essays
    see_scores = own or target.profile_show_scores
    submissions = (
        Submission.objects.filter(user_id_user=target).select_related("task_id_task").order_by("-submission_time")
    )
    published = {
        feedback.submission_id_submission_id: feedback
        for feedback in Feedback.objects.filter(
            submission_id_submission__user_id_user=target,
            status="published",
            final_score__isnull=False,
        )
    }
    shared = {
        item.submission_id: item.share_id
        for item in SharedEssay.objects.filter(owner=target, status="visible")
    }
    history = []
    for submission in submissions if see_essays else []:
        feedback = published.get(submission.pk)
        if not own and feedback is None:
            continue
        history.append({
            "id": submission.pk,
            "title": submission.task_id_task.task_title,
            "submitted_at": submission.submission_time,
            "score": float(feedback.final_score) if feedback and see_scores else None,
            "released": feedback is not None,
            "shared_id": shared.get(submission.pk),
        })
    released_scores = [float(feedback.final_score) for feedback in published.values()]
    badges = UserBadge.objects.filter(user_id_user=target).select_related("badge_id_badge").order_by("-earned_at")
    classes = visible_classes(target) if target.user_role == "lecturer" else []
    student_count = (
        Enrollment.objects.filter(class_id_class__in=classes).values("user_id_user_id").distinct().count()
        if target.user_role == "lecturer" else None
    )
    average = round(sum(released_scores) / len(released_scores), 1) if released_scores and see_scores else None
    return {
        "user_id": target.pk,
        "name": target.get_full_name() or target.user_email.split("@")[0],
        "role": target.user_role,
        "email": target.user_email if own or staff else None,
        "joined_at": target.date_joined,
        "bio": target.bio,
        "avatar_url": f"/api/v2/core/profiles/{target.pk}/avatar/" if target.avatar_url else None,
        "visibility": target.profile_visibility if own else None,
        "show_essays": target.profile_show_essays if own else None,
        "show_scores": target.profile_show_scores if own else None,
        "total_submissions": submissions.count() if own or staff else len(published) if see_essays else None,
        "average_score": average,
        "released_results": len(released_scores) if own or staff or see_scores else None,
        "history": history,
        "badges": [{
            "id": item.badge_id_badge_id,
            "name": item.badge_id_badge.name,
            "description": item.badge_id_badge.description,
            "icon": item.badge_id_badge.icon,
            "earned_at": item.earned_at,
        } for item in badges] if own or staff or target.profile_visibility != "private" else [],
        "classes": [{"id": item.class_id, "name": item.class_name} for item in classes],
        "students_taught": student_count,
        "rubrics_created": (
            MarkingRubric.objects.filter(user_id_user=target).count() if target.user_role == "lecturer" else None
        ),
        "reviews_completed": (
            Feedback.objects.filter(reviewed_by=target).count() if target.user_role == "lecturer" else None
        ),
    }


@router.put("/profiles/me/", response=dict)
def update_profile(request: HttpRequest, data: ProfileUpdateIn):
    if data.visibility not in {"private", "classmates", "institution"}:
        raise HttpError(400, "Invalid profile visibility")
    user = request.auth
    user.bio = data.bio.strip()
    user.profile_visibility = data.visibility
    user.profile_show_essays = data.show_essays
    user.profile_show_scores = data.show_scores
    user.save(update_fields=["bio", "profile_visibility", "profile_show_essays", "profile_show_scores"])
    return _serialize(user, user)


@router.get("/profiles/{user_id}/", response=dict)
def get_profile(request: HttpRequest, user_id: int):
    target = User.objects.filter(pk=user_id, user_status="active").first()
    if target is None:
        raise HttpError(404, "Profile not found")
    if not _can_view(request.auth, target):
        raise HttpError(403, "Profile is private or outside your class")
    return _serialize(request.auth, target)


@router.get("/profiles/{user_id}/avatar/", response=None)
def get_profile_avatar(request: HttpRequest, user_id: int):
    target = User.objects.filter(pk=user_id, user_status="active").first()
    if target is None or not target.avatar_url:
        raise HttpError(404, "Avatar not found")
    if not _can_view(request.auth, target):
        raise HttpError(403, "Avatar is private")
    filename = Path(target.avatar_url).name
    if not filename.startswith(f"{target.pk}_"):
        raise HttpError(404, "Avatar not found")
    path = Path(settings.MEDIA_ROOT) / "avatars" / filename
    if not path.is_file():
        raise HttpError(404, "Avatar not found")
    content_type = "image/png" if path.suffix == ".png" else "image/jpeg"
    return FileResponse(path.open("rb"), content_type=content_type)
