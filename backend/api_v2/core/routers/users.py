from __future__ import annotations

from datetime import datetime, timedelta

from django.db import models
from django.http import HttpRequest
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from api_v2.schemas.base import PaginationParams, SuccessResponse
from api_v2.types.ids import (
    UserId,
)
from api_v2.utils.auth import JWTAuth
from api_v2.utils.types import paginate
from core.models import (
    Class,
    Enrollment,
    Feedback,
    FeedbackItem,
    Submission,
    TeachingAssn,
    User,
    UserBadge,
)

from ..schemas import (
    BadgeOut,
    ClassDetailOut,
    ProgressEntryOut,
    UserFilterParams,
    UserIn,
    UserOut,
    UserProgressOut,
    UserStatsOut,
    UserUpdateIn,
)

router = Router(tags=["Users"], auth=JWTAuth())

# =============================================================================
# Users
# =============================================================================


@router.get("/users/", response=list[UserOut])
def list_users(request: HttpRequest, filters: UserFilterParams = UserFilterParams()):
    # Admin and lecturer can list all users
    # Students can only view themselves
    user = request.auth
    if user.user_role == "student":
        # Students can only see their own record
        return [user]

    # Admin and lecturer can see all users
    qs = filters.filter(User.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/users/", response=UserOut)
def create_user(request: HttpRequest, data: UserIn):
    # Only admin and lecturer can create users
    current_user = request.auth
    if current_user.user_role not in ["admin", "lecturer"]:
        raise HttpError(403, "Only admin and lecturer can create users")

    new_user = User.objects.create_user(
        user_email=data.user_email,
        password=data.password,
        user_fname=data.user_fname,
        user_lname=data.user_lname,
        user_role=data.user_role,
        user_status=data.user_status,
        is_active=data.is_active,
        is_staff=data.is_staff,
    )
    return new_user


@router.get("/users/me/", response=UserOut)
def get_current_user(request: HttpRequest):
    return request.auth


@router.get("/users/{user_id}/", response=UserOut)
def get_user(request: HttpRequest, user_id: UserId):
    """
    Get a specific user.

    Permissions:
    - Admin/Lecturer: Can view any user
    - Student: Can only view themselves
    """
    current_user = request.auth

    # Students can only view their own profile
    if current_user.user_role == "student" and current_user.user_id != user_id:
        raise HttpError(403, "You can only view your own profile")

    try:
        return User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")


@router.put("/users/{user_id}/", response=UserOut)
def update_user(request: HttpRequest, user_id: UserId, data: UserUpdateIn):
    """
    Update a user.

    Permissions:
    - Admin: Can update any user
    - Lecturer: Can update any user except admins
    - Student: Can only update themselves
    """
    current_user = request.auth

    # Permission check
    if current_user.user_role == "student":
        # Students can only update themselves
        if current_user.user_id != user_id:
            raise HttpError(403, "You can only update your own profile")
    elif current_user.user_role == "lecturer":
        # Lecturers cannot update admins
        try:
            target_user = User.objects.get(user_id=user_id)
            if target_user.user_role == "admin":
                raise HttpError(403, "Lecturers cannot modify admin accounts")
        except User.DoesNotExist:
            raise HttpError(404, "User not found")
    # Admins can update anyone

    try:
        user = User.objects.get(user_id=user_id)
        # Only update fields that are explicitly provided (not None)
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if key == "password":
                if value:
                    user.set_password(value)
            else:
                setattr(user, key, value)
        user.save()
        return user
    except User.DoesNotExist:
        raise HttpError(404, "User not found")


@router.delete("/users/{user_id}/", response=SuccessResponse)
def delete_user(request: HttpRequest, user_id: UserId) -> SuccessResponse:
    """
    Delete a user.

    Permissions:
    - Admin: Can delete any user (except other admins)
    - Lecturer/Student: Cannot delete users
    """
    current_user = request.auth

    # Only admins can delete users
    if current_user.user_role != "admin":
        raise HttpError(403, "Only admins can delete users")

    # Admins cannot delete other admins
    try:
        target_user = User.objects.get(user_id=user_id)
        if target_user.user_role == "admin":
            raise HttpError(403, "Cannot delete admin accounts")
        target_user.delete()
        return SuccessResponse(success=True)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")


# =============================================================================
# Profile Endpoints
# =============================================================================


@router.get("/users/{user_id}/stats/", response=UserStatsOut)
def get_user_stats(request: HttpRequest, user_id: UserId):
    """
    Get user statistics including essay count, average score, and activity.

    Permissions:
    - Any authenticated user can view their own stats
    - Lecturers/Admins can view any user's stats
    """
    current_user = request.auth

    # Permission check: students can only view their own stats
    if current_user.user_role == "student" and current_user.user_id != user_id:
        raise HttpError(403, "You can only view your own statistics")

    # Check if user exists
    try:
        User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

    # Get user's submissions
    submissions = Submission.objects.filter(user_id_user_id=user_id)
    total_submissions = submissions.count()

    # Get feedback items for scoring
    submission_ids = list(submissions.values_list("submission_id", flat=True))
    feedback_items = FeedbackItem.objects.filter(feedback_id_feedback__submission_id_submission__in=submission_ids)

    # Calculate average score from feedback items
    avg_score_data = feedback_items.aggregate(avg_score=models.Avg("feedback_item_score"))
    average_score = float(avg_score_data["avg_score"]) if avg_score_data["avg_score"] else None

    # Get last activity (most recent submission time)
    last_submission = submissions.order_by("-submission_time").first()
    last_activity = last_submission.submission_time if last_submission else None

    return UserStatsOut(
        total_essays=total_submissions,
        average_score=average_score,
        total_submissions=total_submissions,
        last_activity=last_activity,
    )


@router.get("/users/{user_id}/badges/", response=list[BadgeOut])
def get_user_badges(request: HttpRequest, user_id: UserId):
    """
    Get user's earned badges.

    Permissions:
    - Any authenticated user can view their own badges
    - Lecturers/Admins can view any user's badges
    - Students can view other students' badges (for social learning)
    """
    current_user = request.auth

    # Check if user exists first
    try:
        target_user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

    # Permission check: students cannot view lecturer/admin badges
    if current_user.user_role == "student":
        if target_user.user_role in ["lecturer", "admin"]:
            raise HttpError(403, "Students cannot view lecturer/admin badges")

    # Get user's earned badges
    user_badges = (
        UserBadge.objects.filter(user_id_user_id=user_id).select_related("badge_id_badge").order_by("-earned_at")
    )

    return [
        BadgeOut(
            id=ub.badge_id_badge.badge_id,
            name=ub.badge_id_badge.name,
            description=ub.badge_id_badge.description,
            icon=ub.badge_id_badge.icon,
            earned_at=ub.earned_at,
        )
        for ub in user_badges
    ]


@router.get("/users/{user_id}/progress/", response=UserProgressOut)
def get_user_progress(request: HttpRequest, user_id: UserId, period: str = "month"):
    """
    Get user's progress over time (weekly or monthly aggregation).

    Query params:
    - period: 'week' or 'month' (default: 'month')

    Returns time-series data with essay count and average score per period.

    Permissions:
    - Any authenticated user can view their own progress
    - Lecturers/Admins can view any user's progress
    """

    current_user = request.auth

    # Permission check: students can only view their own progress
    if current_user.user_role == "student" and current_user.user_id != user_id:
        raise HttpError(403, "You can only view your own progress")

    # Check if user exists
    try:
        User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

    # Get date range (last 6 months or last 12 weeks)
    now = timezone.now()
    if period == "week":
        start_date = now - timedelta(weeks=12)
    else:
        start_date = now - timedelta(days=180)  # ~6 months

    # Get submissions in date range
    submissions = Submission.objects.filter(user_id_user_id=user_id, submission_time__gte=start_date).order_by(
        "submission_time"
    )

    # Group by period and calculate stats
    if period == "week":
        # Group by week
        from collections import defaultdict

        weekly_data: dict[datetime, dict[str, int | list[float]]] = defaultdict(lambda: {"scores": [], "count": 0})

        for sub in submissions:
            # Get week start (Monday)
            week_start = sub.submission_time - timedelta(days=sub.submission_time.weekday())
            week_key = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

            # Need to carefully handle the types due to the union
            current_count = weekly_data[week_key]["count"]
            if isinstance(current_count, int):
                weekly_data[week_key]["count"] = current_count + 1

            # Get score for this submission
            try:
                feedback = Feedback.objects.get(submission_id_submission=sub)
                scores = FeedbackItem.objects.filter(feedback_id_feedback=feedback).aggregate(
                    avg=models.Avg("feedback_item_score")
                )["avg"]
                if scores:
                    current_scores = weekly_data[week_key]["scores"]
                    if isinstance(current_scores, list):
                        current_scores.append(float(scores))
            except Feedback.DoesNotExist:
                pass

        entries = []
        for week_start in sorted(weekly_data.keys()):
            data = weekly_data[week_start]
            scores_list = data["scores"]
            count = data["count"]
            if isinstance(scores_list, list) and isinstance(count, int):
                avg_score = sum(scores_list) / len(scores_list) if scores_list else None
                entries.append(
                    ProgressEntryOut(
                        date=week_start,
                        essay_count=count,
                        average_score=float(avg_score) if avg_score else None,
                    )
                )

    else:
        # Group by month
        from collections import defaultdict

        monthly_data: dict[datetime, dict[str, int | list[float]]] = defaultdict(lambda: {"scores": [], "count": 0})

        for sub in submissions:
            month_key = sub.submission_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

            current_count = monthly_data[month_key]["count"]
            if isinstance(current_count, int):
                monthly_data[month_key]["count"] = current_count + 1

            # Get score for this submission
            try:
                feedback = Feedback.objects.get(submission_id_submission=sub)
                scores = FeedbackItem.objects.filter(feedback_id_feedback=feedback).aggregate(
                    avg=models.Avg("feedback_item_score")
                )["avg"]
                if scores:
                    current_scores = monthly_data[month_key]["scores"]
                    if isinstance(current_scores, list):
                        current_scores.append(float(scores))
            except Feedback.DoesNotExist:
                pass

        entries = []
        for month_start in sorted(monthly_data.keys()):
            data = monthly_data[month_start]
            scores_list = data["scores"]
            count = data["count"]
            if isinstance(scores_list, list) and isinstance(count, int):
                avg_score = sum(scores_list) / len(scores_list) if scores_list else None
                entries.append(
                    ProgressEntryOut(
                        date=month_start,
                        essay_count=count,
                        average_score=float(avg_score) if avg_score else None,
                    )
                )

    return UserProgressOut(
        user_id=user_id,
        entries=entries,
    )


# =============================================================================
# User Classes (Role-based)
# =============================================================================


@router.get("/users/me/classes/", response=list[ClassDetailOut])
def get_my_classes(request):
    user = request.auth
    user_role = getattr(user, "user_role", None) or "student"

    if user_role == "admin":
        classes = Class.objects.all().select_related("unit_id_unit")
    elif user_role == "lecturer":
        class_ids = TeachingAssn.objects.filter(user_id_user=user).values_list("class_id_class_id", flat=True)
        classes = Class.objects.filter(class_id__in=class_ids).select_related("unit_id_unit")
    else:
        class_ids = Enrollment.objects.filter(user_id_user=user).values_list("class_id_class_id", flat=True)
        classes = Class.objects.filter(class_id__in=class_ids).select_related("unit_id_unit")

    result = []
    for class_obj in classes:
        result.append(
            ClassDetailOut(
                class_id=class_obj.class_id,
                unit_id_unit=class_obj.unit_id_unit_id,
                class_size=class_obj.class_size,
                unit_name=class_obj.unit_id_unit.unit_name if class_obj.unit_id_unit else None,
                class_name=class_obj.class_name,
                class_desc=class_obj.class_desc,
                class_join_code=class_obj.class_join_code,
                class_term=class_obj.class_term,
                class_year=class_obj.class_year,
                class_status=class_obj.class_status,
            )
        )
    return result


