from __future__ import annotations

from datetime import datetime, timedelta

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.http import HttpRequest
from django.utils import timezone
from ninja import Query, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from core.models import (
    Class,
    Enrollment,
    Feedback,
    FeedbackItem,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Submission,
    Task,
    TeachingAssn,
    Unit,
    User,
    UserBadge,
)
from core.models import RubricLevelDesc as RubricLevelDescModel

from ..utils.auth import JWTAuth
from ..utils.permissions import IsAdminOrLecturer
from .schemas import (
    AdminDashboardOut,
    AdminStatsOut,
    BadgeOut,
    ClassDetailOut,
    ClassFilterParams,
    ClassIn,
    ClassOut,
    ClassOverviewOut,
    DashboardActivityItemOut,
    DashboardUserInfoOut,
    EnrollmentFilterParams,
    EnrollmentIn,
    EnrollmentOut,
    FeedbackFilterParams,
    FeedbackIn,
    FeedbackItemFilterParams,
    FeedbackItemIn,
    FeedbackItemOut,
    FeedbackOut,
    LecturerDashboardOut,
    LecturerStatsOut,
    MarkingRubricIn,
    MarkingRubricOut,
    PaginationParams,
    ProgressEntryOut,
    RubricDetailOut,
    RubricFilterParams,
    RubricImportOut,
    RubricItemDetailOut,
    RubricItemFilterParams,
    RubricItemIn,
    RubricItemOut,
    RubricLevelDescFilterParams,
    RubricLevelDescIn,
    RubricLevelDescOut,
    RubricVisibilityUpdate,
    StudentDashboardOut,
    StudentStatsOut,
    SubmissionFilterParams,
    SubmissionIn,
    SubmissionOut,
    SystemStatusOut,
    TaskFilterParams,
    TaskIn,
    TaskOut,
    TeachingAssnIn,
    TeachingAssnOut,
    UnitFilterParams,
    UnitIn,
    UnitOut,
    UserFilterParams,
    UserIn,
    UserOut,
    UserProgressOut,
    UserStatsOut,
    UserUpdateIn,
)

router = Router(tags=["Core"], auth=JWTAuth())


def paginate(queryset, params: PaginationParams):
    if isinstance(queryset, list):
        # Already a list (from .values())
        total = len(queryset)
        start = (params.page - 1) * params.page_size
        end = start + params.page_size
        return {"count": total, "results": queryset[start:end]}
    else:
        # QuerySet
        total = queryset.count()
        start = (params.page - 1) * params.page_size
        end = start + params.page_size
        return {"count": total, "results": list(queryset[start:end])}


# =============================================================================
# Dashboard
# =============================================================================


def _to_float(value) -> float | None:
    return float(value) if value is not None else None


def _build_dashboard_user_info(user: User) -> DashboardUserInfoOut:
    full_name = f"{user.user_fname or ''} {user.user_lname or ''}".strip()
    return DashboardUserInfoOut(
        id=user.user_id,
        name=full_name or user.user_email,
        role=user.user_role or "student",
        email=user.user_email,
    )


def _make_activity_item(
    item_id: int,
    activity_type: str,
    title: str,
    description: str,
    timestamp,
    icon: str,
) -> DashboardActivityItemOut:
    return DashboardActivityItemOut(
        id=item_id,
        type=activity_type,
        title=title,
        description=description,
        timestamp=timestamp,
        icon=icon,
    )


def _score_map_for_submissions(submission_ids: list[int]) -> dict[int, float]:
    if not submission_ids:
        return {}

    rows = (
        FeedbackItem.objects.filter(
            feedback_id_feedback__submission_id_submission_id__in=submission_ids
        )
        .values("feedback_id_feedback__submission_id_submission_id")
        .annotate(avg_score=models.Avg("feedback_item_score"))
    )
    return {
        row["feedback_id_feedback__submission_id_submission_id"]: float(row["avg_score"])
        for row in rows
        if row["avg_score"] is not None
    }


def _average_feedback_score(submission_ids: list[int] | None = None) -> float | None:
    qs = FeedbackItem.objects.all()
    if submission_ids is not None:
        if not submission_ids:
            return None
        qs = qs.filter(feedback_id_feedback__submission_id_submission_id__in=submission_ids)

    avg_score = qs.aggregate(avg=models.Avg("feedback_item_score"))["avg"]
    return _to_float(avg_score)


def _build_class_overview_item(class_obj: Class) -> ClassOverviewOut:
    class_submissions = Submission.objects.filter(task_id_task__class_id_class=class_obj)
    class_submission_ids = list(class_submissions.values_list("submission_id", flat=True))

    student_count = Enrollment.objects.filter(class_id_class=class_obj).count()
    pending_reviews = class_submissions.filter(feedback__isnull=True).count()

    return ClassOverviewOut(
        id=class_obj.class_id,
        name=class_obj.class_name or f"Class {class_obj.class_id}",
        unitName=class_obj.unit_id_unit.unit_name if class_obj.unit_id_unit else None,
        studentCount=student_count,
        essayCount=len(class_submission_ids),
        avgScore=_average_feedback_score(class_submission_ids),
        pendingReviews=pending_reviews,
    )


def _build_student_dashboard_payload(user: User) -> StudentDashboardOut:
    submissions = list(
        Submission.objects.filter(user_id_user=user)
        .select_related("task_id_task__unit_id_unit")
        .order_by("-submission_time")
    )
    submission_ids = [submission.submission_id for submission in submissions]
    score_map = _score_map_for_submissions(submission_ids)
    feedback_submission_ids = set(
        Feedback.objects.filter(submission_id_submission_id__in=submission_ids).values_list(
            "submission_id_submission_id", flat=True
        )
    )

    my_essays = []
    for submission in submissions:
        task = submission.task_id_task
        task_title = task.task_title or f"Essay #{submission.submission_id}"
        has_feedback = submission.submission_id in feedback_submission_ids
        my_essays.append(
            {
                "id": submission.submission_id,
                "title": task_title,
                "status": "returned" if has_feedback else "submitted",
                "submittedAt": submission.submission_time,
                "score": score_map.get(submission.submission_id),
                "unitName": task.unit_id_unit.unit_name if task.unit_id_unit else None,
                "taskTitle": task.task_title or None,
            }
        )

    scored_submissions = [
        (submission.submission_time, score_map[submission.submission_id])
        for submission in submissions
        if submission.submission_id in score_map
    ]
    scored_submissions.sort(key=lambda item: item[0])

    improvement_trend = "stable"
    if len(scored_submissions) >= 2:
        prev_score = scored_submissions[-2][1]
        latest_score = scored_submissions[-1][1]
        if latest_score > prev_score:
            improvement_trend = "up"
        elif latest_score < prev_score:
            improvement_trend = "down"

    activities = []
    for submission in submissions[:6]:
        task = submission.task_id_task
        activities.append(
            _make_activity_item(
                item_id=submission.submission_id,
                activity_type="submission",
                title=f"Submitted: {task.task_title or 'Essay'}",
                description=f"Submitted to {task.unit_id_unit.unit_name if task.unit_id_unit else 'a class'}",
                timestamp=submission.submission_time,
                icon="file",
            )
        )

    recent_feedbacks = list(
        Feedback.objects.filter(submission_id_submission_id__in=submission_ids)
        .select_related("submission_id_submission__task_id_task__unit_id_unit")
        .order_by("-submission_id_submission__submission_time")[:6]
    )
    for feedback in recent_feedbacks:
        submission = feedback.submission_id_submission
        task = submission.task_id_task
        activities.append(
            _make_activity_item(
                item_id=feedback.feedback_id,
                activity_type="feedback",
                title=f"Feedback received: {task.task_title or 'Essay'}",
                description=(
                    f"New feedback for "
                    f"{task.unit_id_unit.unit_name if task.unit_id_unit else 'your submission'}"
                ),
                timestamp=submission.submission_time,
                icon="message",
            )
        )

    activities.sort(key=lambda item: item.timestamp, reverse=True)

    total_essays = len(submissions)
    average_score = _average_feedback_score(submission_ids)
    pending_grading = sum(
        1 for submission in submissions if submission.submission_id not in feedback_submission_ids
    )

    return StudentDashboardOut(
        user=_build_dashboard_user_info(user),
        stats=StudentStatsOut(
            totalEssays=total_essays,
            averageScore=average_score,
            pendingGrading=pending_grading,
            essaysSubmitted=total_essays,
            avgScore=average_score,
            improvementTrend=improvement_trend,
            feedbackReceived=len(feedback_submission_ids),
        ),
        myEssays=my_essays,
        recentActivity=activities[:10],
    )


def _build_lecturer_dashboard_payload(user: User) -> LecturerDashboardOut:
    assigned_classes = list(
        Class.objects.filter(
            class_id__in=TeachingAssn.objects.filter(user_id_user=user).values_list(
                "class_id_class_id", flat=True
            )
        ).select_related("unit_id_unit")
    )
    assigned_class_ids = [class_obj.class_id for class_obj in assigned_classes]
    taught_unit_ids = [class_obj.unit_id_unit_id for class_obj in assigned_classes if class_obj.unit_id_unit_id]

    submission_scope = Q(task_id_task__class_id_class_id__in=assigned_class_ids)
    if taught_unit_ids:
        submission_scope |= Q(
            task_id_task__class_id_class__isnull=True,
            task_id_task__unit_id_unit_id__in=taught_unit_ids,
        )

    relevant_submissions_qs = Submission.objects.none()
    if assigned_class_ids or taught_unit_ids:
        relevant_submissions_qs = (
            Submission.objects.filter(submission_scope)
            .select_related("task_id_task__unit_id_unit", "user_id_user")
            .order_by("-submission_time")
        )

    relevant_submissions = list(relevant_submissions_qs)
    relevant_submission_ids = [submission.submission_id for submission in relevant_submissions]

    feedback_submission_ids = set(
        Feedback.objects.filter(submission_id_submission_id__in=relevant_submission_ids)
        .values_list('submission_id_submission_id', flat=True)
    )

    pending_submissions = [
        submission for submission in relevant_submissions
        if submission.submission_id not in feedback_submission_ids
    ]

    classes = [_build_class_overview_item(class_obj) for class_obj in assigned_classes]

    grading_queue = []
    for submission in pending_submissions[:20]:
        task = submission.task_id_task
        student_name = submission.user_id_user.get_full_name() or submission.user_id_user.user_email
        grading_queue.append(
            {
                "submissionId": submission.submission_id,
                "studentName": student_name,
                "essayTitle": task.task_title or f"Essay #{submission.submission_id}",
                "submittedAt": submission.submission_time,
                "dueDate": task.task_due_datetime,
                "status": "pending_review",
                "aiScore": None,
            }
        )

    activities = []
    for submission in relevant_submissions[:6]:
        task = submission.task_id_task
        activities.append(
            _make_activity_item(
                item_id=submission.submission_id,
                activity_type="submission",
                title=f"New submission: {task.task_title or 'Essay'}",
                description=f"{submission.user_id_user.get_short_name()} submitted an essay",
                timestamp=submission.submission_time,
                icon="file",
            )
        )

    recent_feedbacks = list(
        Feedback.objects.filter(user_id_user=user)
        .select_related("submission_id_submission__task_id_task")
        .order_by("-submission_id_submission__submission_time")[:6]
    )
    for feedback in recent_feedbacks:
        submission = feedback.submission_id_submission
        task = submission.task_id_task
        activities.append(
            _make_activity_item(
                item_id=feedback.feedback_id,
                activity_type="grade",
                title=f"Reviewed: {task.task_title or 'Essay'}",
                description=f"Provided feedback for submission #{submission.submission_id}",
                timestamp=submission.submission_time,
                icon="check",
            )
        )

    activities.sort(key=lambda item: item.timestamp, reverse=True)

    avg_score = _average_feedback_score(relevant_submission_ids)
    today = timezone.now().date()
    reviewed_today = Feedback.objects.filter(
        user_id_user=user,
        submission_id_submission__submission_time__date=today,
    ).count()

    return LecturerDashboardOut(
        user=_build_dashboard_user_info(user),
        stats=LecturerStatsOut(
            totalEssays=len(relevant_submissions),
            averageScore=avg_score,
            pendingGrading=len(pending_submissions),
            essaysReviewedToday=reviewed_today,
            pendingReviews=len(pending_submissions),
            activeClasses=sum(1 for class_obj in assigned_classes if class_obj.class_status == "active"),
            avgGradingTime=None,
        ),
        classes=classes,
        gradingQueue=grading_queue,
        recentActivity=activities[:10],
    )


def _build_admin_dashboard_payload(user: User) -> AdminDashboardOut:
    total_submissions = Submission.objects.count()
    pending_grading = Submission.objects.filter(feedback__isnull=True).count()

    recent_submissions = list(
        Submission.objects.select_related("task_id_task__unit_id_unit", "user_id_user")
        .order_by("-submission_time")[:100]
    )

    total_users = User.objects.count()
    active_students = User.objects.filter(user_role="student", is_active=True).count()
    active_lecturers = User.objects.filter(user_role="lecturer", is_active=True).count()
    total_classes = Class.objects.count()
    average_score = _average_feedback_score(None)

    db_status = "healthy"
    try:
        User.objects.exists()
    except Exception:
        db_status = "critical"

    system_health = "healthy" if db_status == "healthy" else "critical"

    activities = []
    for submission in recent_submissions[:8]:
        task = submission.task_id_task
        student_name = submission.user_id_user.get_short_name() or submission.user_id_user.user_email
        activities.append(
            _make_activity_item(
                item_id=submission.submission_id,
                activity_type="submission",
                title=f"{student_name} submitted {task.task_title or 'an essay'}",
                description=f"Unit: {task.unit_id_unit.unit_name if task.unit_id_unit else 'N/A'}",
                timestamp=submission.submission_time,
                icon="file",
            )
        )

    recent_feedbacks = list(
        Feedback.objects.select_related("submission_id_submission__task_id_task")
        .order_by("-submission_id_submission__submission_time")[:8]
    )
    for feedback in recent_feedbacks:
        submission = feedback.submission_id_submission
        task = submission.task_id_task
        activities.append(
            _make_activity_item(
                item_id=feedback.feedback_id,
                activity_type="grade",
                title=f"Feedback completed: {task.task_title or 'Essay'}",
                description=f"Submission #{submission.submission_id} was reviewed",
                timestamp=submission.submission_time,
                icon="check",
            )
        )
    activities.sort(key=lambda item: item.timestamp, reverse=True)

    last_24h = timezone.now() - timedelta(hours=24)
    feedbacks_last_24h = Feedback.objects.filter(
        submission_id_submission__submission_time__gte=last_24h
    ).count()

    system_status = SystemStatusOut(
        database=db_status,
        submissionsLast24h=Submission.objects.filter(submission_time__gte=last_24h).count(),
        feedbacksLast24h=feedbacks_last_24h,
        activeUsers=User.objects.filter(is_active=True).count(),
    )

    return AdminDashboardOut(
        user=_build_dashboard_user_info(user),
        stats=AdminStatsOut(
            totalEssays=total_submissions,
            averageScore=average_score,
            pendingGrading=pending_grading,
            totalUsers=total_users,
            activeStudents=active_students,
            activeLecturers=active_lecturers,
            totalClasses=total_classes,
            systemHealth=system_health,
        ),
        recentActivity=activities[:12],
        systemStatus=system_status,
    )


@router.get("/dashboard/student/", response=StudentDashboardOut)
def get_student_dashboard(request: HttpRequest):
    current_user = request.auth
    if current_user.user_role != "student":
        raise HttpError(403, "Only students can access the student dashboard")
    return _build_student_dashboard_payload(current_user)


@router.get("/dashboard/lecturer/", response=LecturerDashboardOut)
def get_lecturer_dashboard(request: HttpRequest):
    current_user = request.auth
    if current_user.user_role not in ["lecturer", "admin"]:
        raise HttpError(403, "Only lecturers and admins can access the lecturer dashboard")
    return _build_lecturer_dashboard_payload(current_user)


@router.get("/dashboard/admin/", response=AdminDashboardOut)
def get_admin_dashboard(request: HttpRequest):
    current_user = request.auth
    if current_user.user_role != "admin":
        raise HttpError(403, "Only admins can access the admin dashboard")
    return _build_admin_dashboard_payload(current_user)


@router.get("/dashboard/")
def get_dashboard_legacy(request: HttpRequest):
    """Legacy role-aware dashboard endpoint used by existing tests/clients."""
    current_user = request.auth
    user_role = current_user.user_role or "student"

    if user_role == "admin":
        payload = _build_admin_dashboard_payload(current_user)
        # Using dict() to add the 'classes' attribute properly for legacy compat
        payload_dict = payload.dict()
        payload_dict["classes"] = [
            _build_class_overview_item(class_obj).dict()
            for class_obj in Class.objects.all().select_related("unit_id_unit")
        ]
        return payload_dict

    if user_role == "lecturer":
        return _build_lecturer_dashboard_payload(current_user)

    payload = _build_student_dashboard_payload(current_user)
    payload_dict = payload.dict()
    payload_dict["classes"] = []
    return payload_dict


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
def get_user(request: HttpRequest, user_id: int):
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
def update_user(request: HttpRequest, user_id: int, data: UserUpdateIn):
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


@router.delete("/users/{user_id}/")
def delete_user(request: HttpRequest, user_id: int):
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
        return {"success": True}
    except User.DoesNotExist:
        raise HttpError(404, "User not found")


# =============================================================================
# Profile Endpoints
# =============================================================================


@router.get("/users/{user_id}/stats/", response=UserStatsOut)
def get_user_stats(request: HttpRequest, user_id: int):
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
    feedback_items = FeedbackItem.objects.filter(
        feedback_id_feedback__submission_id_submission__in=submission_ids
    )

    # Calculate average score from feedback items
    avg_score_data = feedback_items.aggregate(
        avg_score=models.Avg("feedback_item_score")
    )
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
def get_user_badges(request: HttpRequest, user_id: int):
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
    user_badges = UserBadge.objects.filter(
        user_id_user_id=user_id
    ).select_related("badge_id_badge").order_by("-earned_at")

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
def get_user_progress(request: HttpRequest, user_id: int, period: str = "month"):
    """
    Get user's progress over time (weekly or monthly aggregation).

    Query params:
    - period: 'week' or 'month' (default: 'month')

    Returns time-series data with essay count and average score per period.

    Permissions:
    - Any authenticated user can view their own progress
    - Lecturers/Admins can view any user's progress
    """
    from datetime import timedelta

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
    submissions = Submission.objects.filter(
        user_id_user_id=user_id,
        submission_time__gte=start_date
    ).order_by("submission_time")

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
                scores = FeedbackItem.objects.filter(
                    feedback_id_feedback=feedback
                ).aggregate(avg=models.Avg("feedback_item_score"))["avg"]
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
                scores = FeedbackItem.objects.filter(
                    feedback_id_feedback=feedback
                ).aggregate(avg=models.Avg("feedback_item_score"))["avg"]
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
# Units
# =============================================================================


@router.get("/units/", response=list[UnitOut])
def list_units(request: HttpRequest, filters: UnitFilterParams = UnitFilterParams()):
    qs = filters.filter(Unit.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/units/", response=UnitOut)
def create_unit(request: HttpRequest, data: UnitIn):
    unit = Unit.objects.create(**data.dict())
    return unit


@router.get("/units/{unit_id}/", response=UnitOut)
def get_unit(request: HttpRequest, unit_id: str):
    try:
        return Unit.objects.get(unit_id=unit_id)
    except Unit.DoesNotExist:
        raise HttpError(404, "Unit not found")


@router.put("/units/{unit_id}/", response=UnitOut)
def update_unit(request: HttpRequest, unit_id: str, data: UnitIn):
    try:
        unit = Unit.objects.get(unit_id=unit_id)
        for key, value in data.dict().items():
            setattr(unit, key, value)
        unit.save()
        return unit
    except Unit.DoesNotExist:
        raise HttpError(404, "Unit not found")


@router.delete("/units/{unit_id}/")
def delete_unit(request: HttpRequest, unit_id: str):
    try:
        unit = Unit.objects.get(unit_id=unit_id)
        unit.delete()
        return {"success": True}
    except Unit.DoesNotExist:
        raise HttpError(404, "Unit not found")


# =============================================================================
# Classes
# =============================================================================


@router.get("/classes/", response=list[ClassOut])
def list_classes(
    request: HttpRequest,
    filters: ClassFilterParams = Query(...),
    pagination: PaginationParams = Query(...),
):
    qs = filters.filter(Class.objects.all())
    return paginate(qs, pagination)["results"]


@router.post("/classes/", response=ClassOut)
def create_class(request: HttpRequest, data: ClassIn):
    IsAdminOrLecturer().check(request)
    try:
        unit = Unit.objects.get(unit_id=data.unit_id_unit)
    except Unit.DoesNotExist:
        raise HttpError(400, "Unit not found")

    class_obj = Class.objects.create(
        unit_id_unit=unit,
        class_size=data.class_size,
        class_name=data.class_name,
        class_desc=data.class_desc,
        class_join_code=data.class_join_code,
        class_term=data.class_term,
        class_year=data.class_year,
    )
    return class_obj


@router.post("/classes/join/", response=ClassOut)
def join_class_by_code(request: HttpRequest, join_code: str):
    """Student joins a class using join code."""
    user = request.auth
    try:
        class_obj = Class.objects.get(class_join_code=join_code.upper())

        # Check if already enrolled
        if Enrollment.objects.filter(user_id_user=user, class_id_class=class_obj).exists():
            raise HttpError(400, "Already enrolled in this class")

        # Create enrollment
        Enrollment.objects.create(
            user_id_user=user,
            class_id_class=class_obj,
            unit_id_unit=class_obj.unit_id_unit,
        )

        # Update class size
        class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
        class_obj.save()

        return class_obj
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found with this join code")


@router.get("/classes/{class_id}/", response=ClassOut)
def get_class(request: HttpRequest, class_id: int):
    try:
        return Class.objects.get(class_id=class_id)
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.put("/classes/{class_id}/", response=ClassOut)
def update_class(request: HttpRequest, class_id: int, data: ClassIn):
    try:
        class_obj = Class.objects.get(class_id=class_id)
        if data.unit_id_unit:
            class_obj.unit_id_unit = Unit.objects.get(unit_id=data.unit_id_unit)
        if data.class_name:
            class_obj.class_name = data.class_name
        if data.class_desc is not None:
            class_obj.class_desc = data.class_desc
        if data.class_join_code is not None:
            class_obj.class_join_code = data.class_join_code
        if data.class_term:
            class_obj.class_term = data.class_term
        if data.class_year is not None:
            class_obj.class_year = data.class_year
        class_obj.class_size = data.class_size
        class_obj.save()
        return class_obj
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.delete("/classes/{class_id}/")
def delete_class(request: HttpRequest, class_id: int):
    try:
        class_obj = Class.objects.get(class_id=class_id)
        class_obj.delete()
        return {"success": True}
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


# =============================================================================
# Enrollments
# =============================================================================


@router.get("/enrollments/", response=list[EnrollmentOut])
def list_enrollments(request: HttpRequest, filters: EnrollmentFilterParams = EnrollmentFilterParams()):
    qs = filters.filter(Enrollment.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/enrollments/", response=EnrollmentOut)
def create_enrollment(request: HttpRequest, data: EnrollmentIn):
    enrollment = Enrollment.objects.create(**data.dict())
    return enrollment


@router.get("/enrollments/{enrollment_id}/", response=EnrollmentOut)
def get_enrollment(request: HttpRequest, enrollment_id: int):
    try:
        return Enrollment.objects.get(enrollment_id=enrollment_id)
    except Enrollment.DoesNotExist:
        raise HttpError(404, "Enrollment not found")


@router.delete("/enrollments/{enrollment_id}/")
def delete_enrollment(request: HttpRequest, enrollment_id: int):
    try:
        enrollment = Enrollment.objects.get(enrollment_id=enrollment_id)
        enrollment.delete()
        return {"success": True}
    except Enrollment.DoesNotExist:
        raise HttpError(404, "Enrollment not found")


# =============================================================================
# MarkingRubrics
# =============================================================================


@router.get("/rubrics/", response=list[MarkingRubricOut])
def list_rubrics(request: HttpRequest, filters: RubricFilterParams = RubricFilterParams()):
    """
    List rubrics with visibility-based filtering.

    - Public rubrics: Visible to all authenticated users
    - Private rubrics: Only visible to creator or admin
    - Students: Only see public rubrics
    - Admins: See all rubrics (public and private)

    Query params:
    - visibility=public|private: Filter by visibility (overrides default role-based filtering)
    """
    user = request.auth

    # Get visibility filter directly from query params (FilterSchema doesn't parse it automatically)
    visibility_filter = request.GET.get("visibility")

    # Build base queryset based on role
    if user.user_role == "student":
        # Students can only see public rubrics
        qs = MarkingRubric.objects.filter(visibility="public")
    elif user.user_role == "admin":
        # Admins see all rubrics
        qs = MarkingRubric.objects.all()
    else:
        # Lecturers see their own private rubrics + all public rubrics
        qs = MarkingRubric.objects.filter(
            Q(visibility="public") | Q(user_id_user=user)
        )

    # If visibility filter is explicitly provided, apply it on top
    # This allows admins/lecturers to filter by specific visibility
    if visibility_filter:
        if user.user_role == "admin":
            # Admin can filter by any visibility
            qs = qs.filter(visibility=visibility_filter)
        elif user.user_role == "lecturer":
            # Lecturers can filter by visibility, but for private they only see their own
            if visibility_filter == "public":
                qs = qs.filter(visibility="public")
            elif visibility_filter == "private":
                # Only show lecturer's own private rubrics
                qs = MarkingRubric.objects.filter(visibility="private", user_id_user=user)
        elif user.user_role == "student":
            # Students can only filter public (they can't see private at all)
            qs = qs.filter(visibility=visibility_filter)

    # Apply other filters (user_id_user, rubric_desc)
    if filters.user_id_user:
        qs = qs.filter(user_id_user=filters.user_id_user)
    if filters.rubric_desc:
        qs = qs.filter(rubric_desc__icontains=filters.rubric_desc)

    # Convert queryset to list of dicts for Schema validation
    result = list(qs.values(
        "rubric_id",
        "user_id_user",
        "rubric_create_time",
        "rubric_desc",
        "visibility"
    ))

    return paginate(result, PaginationParams())["results"]


@router.get("/rubrics/public/", response=list[MarkingRubricOut])
def list_public_rubrics(request: HttpRequest, filters: RubricFilterParams = RubricFilterParams()):
    """
    List all public rubrics (available to all authenticated users).

    This endpoint is useful for students to browse available rubrics
    and for lecturers to discover shared rubrics.
    """
    qs = filters.filter(MarkingRubric.objects.filter(visibility="public"))
    return paginate(qs, PaginationParams())["results"]


@router.post("/rubrics/", response=MarkingRubricOut)
def create_rubric(request: HttpRequest, data: MarkingRubricIn):
    """Create a new rubric (lecturer/admin only)."""
    user = request.auth
    if user.user_role not in ["lecturer", "admin"]:
        raise HttpError(403, "Only lecturers and admins can create rubrics")

    # Validate visibility value
    if data.visibility not in ["public", "private"]:
        raise HttpError(400, "Visibility must be 'public' or 'private'")

    rubric = MarkingRubric.objects.create(
        user_id_user=user,
        rubric_desc=data.rubric_desc,
        visibility=data.visibility,
    )

    # Return dict to ensure proper serialization
    return {
        "rubric_id": rubric.rubric_id,
        "user_id_user": rubric.user_id_user_id,
        "rubric_create_time": rubric.rubric_create_time,
        "rubric_desc": rubric.rubric_desc,
        "visibility": rubric.visibility,
    }


@router.post("/rubrics/import_from_pdf_with_ai/", response=RubricImportOut)
def import_rubric_from_pdf_with_ai(request: HttpRequest, file: UploadedFile, rubric_name: str | None = None):
    from ai_feedback.rubric_parser import RubricParseError, SiliconFlowRubricParser
    from core.rubric_manager import RubricImportError, RubricManager

    if not file:
        raise HttpError(400, "PDF file is required")

    if file.content_type and file.content_type != "application/pdf":
        raise HttpError(400, "Only PDF files are supported")

    try:
        parser = SiliconFlowRubricParser(api_key=settings.SILICONFLOW_API_KEY)
        manager = RubricManager(parser)

        result = manager.import_rubric_with_ai(file, request.auth, rubric_name)

        if not result.get("detection", {}).get("is_rubric", False):
            return (
                400,
                RubricImportOut(
                    success=False,
                    error="This PDF does not appear to be a rubric. Please upload a proper rubric PDF file.",
                    detection=result.get("detection"),
                    ai_parsed=result.get("ai_parsed", False),
                    ai_model=result.get("ai_model"),
                ),
            )

        return (201, RubricImportOut(**result))
    except (RubricParseError, RubricImportError, ValueError) as exc:
        return (400, RubricImportOut(success=False, error=str(exc)))


@router.get("/rubrics/{rubric_id}/", response=MarkingRubricOut)
def get_rubric(request: HttpRequest, rubric_id: int):
    """
    Get a specific rubric by ID.

    Permissions:
    - Public rubrics: Visible to all authenticated users
    - Private rubrics: Only visible to creator or admin
    """
    user = request.auth

    try:
        rubric = MarkingRubric.objects.select_related("user_id_user").get(rubric_id=rubric_id)

        # Check permissions
        if rubric.visibility == "private":
            if user.user_role not in ["admin", "lecturer"] and rubric.user_id_user != user:
                raise HttpError(403, "You do not have permission to view this private rubric")
            if user.user_role == "lecturer" and rubric.user_id_user != user:
                raise HttpError(403, "You can only view your own private rubrics")

        # Return dict to ensure proper serialization (user_id_user_id -> user_id_user)
        return {
            "rubric_id": rubric.rubric_id,
            "user_id_user": rubric.user_id_user_id,
            "rubric_create_time": rubric.rubric_create_time,
            "rubric_desc": rubric.rubric_desc,
            "visibility": rubric.visibility,
        }
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.get("/rubrics/{rubric_id}/detail/", response=RubricDetailOut)
def get_rubric_detail(request: HttpRequest, rubric_id: int):
    """
    Get rubric with nested items and level descriptions.

    Permissions:
    - Public rubrics: Visible to all authenticated users
    - Private rubrics: Only visible to creator or admin
    """
    user = request.auth

    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id)

        # Check permissions for private rubrics
        if rubric.visibility == "private":
            if user.user_role not in ["admin", "lecturer"] and rubric.user_id_user != user:
                raise HttpError(403, "You do not have permission to view this private rubric")
            if user.user_role == "lecturer" and rubric.user_id_user != user:
                raise HttpError(403, "You can only view your own private rubrics")

        rubric_items = list(RubricItem.objects.filter(rubric_id_marking_rubric=rubric))

        rubric_item_ids = [item.rubric_item_id for item in rubric_items]
        levels = RubricLevelDescModel.objects.filter(rubric_item_id_rubric_item_id__in=rubric_item_ids)
        levels_by_item: dict[int, list[RubricLevelDescModel]] = {}
        for level in levels:
            levels_by_item.setdefault(level.rubric_item_id_rubric_item_id, []).append(level)

        rubric_item_out = []
        for item in rubric_items:
            rubric_item_out.append(
                RubricItemDetailOut(
                    rubric_item_id=item.rubric_item_id,
                    rubric_id_marking_rubric=item.rubric_id_marking_rubric_id,
                    rubric_item_name=item.rubric_item_name,
                    rubric_item_weight=item.rubric_item_weight,
                    level_descriptions=[
                        RubricLevelDescOut(
                            level_desc_id=level.level_desc_id,
                            rubric_item_id_rubric_item=level.rubric_item_id_rubric_item_id,
                            level_min_score=level.level_min_score,
                            level_max_score=level.level_max_score,
                            level_desc=level.level_desc,
                        )
                        for level in levels_by_item.get(item.rubric_item_id, [])
                    ],
                )
            )

        # Return as dict - Ninja will serialize to RubricDetailOut
        # Note: Must use user_id_user_id (the alias) for proper serialization
        return {
            "rubric_id": rubric.rubric_id,
            "user_id_user": rubric.user_id_user_id,
            "rubric_create_time": rubric.rubric_create_time,
            "rubric_desc": rubric.rubric_desc,
            "visibility": rubric.visibility,
            "rubric_items": [
                {
                    "rubric_item_id": item.rubric_item_id,
                    "rubric_id_marking_rubric": item.rubric_id_marking_rubric_id,
                    "rubric_item_name": item.rubric_item_name,
                    "rubric_item_weight": item.rubric_item_weight,
                    "level_descriptions": [
                        {
                            "level_desc_id": level.level_desc_id,
                            "rubric_item_id_rubric_item": level.rubric_item_id_rubric_item_id,
                            "level_min_score": level.level_min_score,
                            "level_max_score": level.level_max_score,
                            "level_desc": level.level_desc,
                        }
                        for level in levels_by_item.get(item.rubric_item_id, [])
                    ],
                }
                for item in rubric_items
            ],
        }
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.get("/rubrics/{rubric_id}/detail_with_items/", response=RubricDetailOut)
def get_rubric_detail_with_items(request: HttpRequest, rubric_id: int):
    return get_rubric_detail(request, rubric_id)


@router.put("/rubrics/{rubric_id}/", response=MarkingRubricOut)
def update_rubric(request: HttpRequest, rubric_id: int, data: MarkingRubricIn):
    """
    Update a rubric.

    Permissions:
    - Only creator or admin can update
    """
    user = request.auth

    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id)

        # Check permissions
        if user.user_role not in ["admin"] and rubric.user_id_user != user:
            raise HttpError(403, "You do not have permission to update this rubric")

        # Validate visibility if provided
        if data.visibility and data.visibility not in ["public", "private"]:
            raise HttpError(400, "Visibility must be 'public' or 'private'")

        rubric.rubric_desc = data.rubric_desc
        if data.visibility:
            rubric.visibility = data.visibility
        rubric.save()

        # Return dict to ensure proper serialization
        return {
            "rubric_id": rubric.rubric_id,
            "user_id_user": rubric.user_id_user_id,
            "rubric_create_time": rubric.rubric_create_time,
            "rubric_desc": rubric.rubric_desc,
            "visibility": rubric.visibility,
        }
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.patch("/rubrics/{rubric_id}/visibility/", response=MarkingRubricOut)
def update_rubric_visibility(request: HttpRequest, rubric_id: int, data: RubricVisibilityUpdate):
    """
    Toggle rubric visibility between public and private.

    Permissions:
    - Only creator or admin can toggle visibility
    """
    user = request.auth

    # Validate visibility value
    if data.visibility not in ["public", "private"]:
        raise HttpError(400, "Visibility must be 'public' or 'private'")

    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id)

        # Check permissions - only creator or admin can change visibility
        if user.user_role != "admin" and rubric.user_id_user != user:
            raise HttpError(403, "Only the rubric creator or admin can change visibility")

        rubric.visibility = data.visibility
        rubric.save()

        # Return dict to ensure proper serialization
        return {
            "rubric_id": rubric.rubric_id,
            "user_id_user": rubric.user_id_user_id,
            "rubric_create_time": rubric.rubric_create_time,
            "rubric_desc": rubric.rubric_desc,
            "visibility": rubric.visibility,
        }
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.delete("/rubrics/{rubric_id}/")
def delete_rubric(request: HttpRequest, rubric_id: int):
    """
    Delete a rubric.

    Permissions:
    - Only creator or admin can delete
    """
    user = request.auth

    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id)

        # Check permissions
        if user.user_role not in ["admin"] and rubric.user_id_user != user:
            raise HttpError(403, "You do not have permission to delete this rubric")

        rubric.delete()
        return {"success": True}
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


# =============================================================================
# RubricItems
# =============================================================================


@router.get("/rubric-items/", response=list[RubricItemOut])
def list_rubric_items(request: HttpRequest, filters: RubricItemFilterParams = RubricItemFilterParams()):
    qs = filters.filter(RubricItem.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/rubric-items/", response=RubricItemOut)
def create_rubric_item(request: HttpRequest, data: RubricItemIn):
    rubric = MarkingRubric.objects.get(rubric_id=data.rubric_id_marking_rubric)
    item = RubricItem.objects.create(
        rubric_id_marking_rubric=rubric,
        rubric_item_name=data.rubric_item_name,
        rubric_item_weight=data.rubric_item_weight,
    )
    return item


@router.get("/rubric-items/{item_id}/", response=RubricItemOut)
def get_rubric_item(request: HttpRequest, item_id: int):
    try:
        return RubricItem.objects.get(rubric_item_id=item_id)
    except RubricItem.DoesNotExist:
        raise HttpError(404, "Rubric item not found")


@router.put("/rubric-items/{item_id}/", response=RubricItemOut)
def update_rubric_item(request: HttpRequest, item_id: int, data: RubricItemIn):
    try:
        item = RubricItem.objects.get(rubric_item_id=item_id)
        item.rubric_item_name = data.rubric_item_name
        item.rubric_item_weight = data.rubric_item_weight
        item.save()
        return item
    except RubricItem.DoesNotExist:
        raise HttpError(404, "Rubric item not found")


@router.delete("/rubric-items/{item_id}/")
def delete_rubric_item(request: HttpRequest, item_id: int):
    try:
        item = RubricItem.objects.get(rubric_item_id=item_id)
        item.delete()
        return {"success": True}
    except RubricItem.DoesNotExist:
        raise HttpError(404, "Rubric item not found")


# =============================================================================
# RubricLevelDescs
# =============================================================================


@router.get("/rubric-levels/", response=list[RubricLevelDescOut])
def list_rubric_levels(request: HttpRequest, filters: RubricLevelDescFilterParams = RubricLevelDescFilterParams()):
    qs = filters.filter(RubricLevelDesc.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/rubric-levels/", response=RubricLevelDescOut)
def create_rubric_level(request: HttpRequest, data: RubricLevelDescIn):
    item = RubricItem.objects.get(rubric_item_id=data.rubric_item_id_rubric_item)
    level = RubricLevelDesc.objects.create(
        rubric_item_id_rubric_item=item,
        level_min_score=data.level_min_score,
        level_max_score=data.level_max_score,
        level_desc=data.level_desc,
    )
    return level


@router.get("/rubric-levels/{level_id}/", response=RubricLevelDescOut)
def get_rubric_level(request: HttpRequest, level_id: int):
    try:
        return RubricLevelDesc.objects.get(level_desc_id=level_id)
    except RubricLevelDesc.DoesNotExist:
        raise HttpError(404, "Rubric level not found")


@router.put("/rubric-levels/{level_id}/", response=RubricLevelDescOut)
def update_rubric_level(request: HttpRequest, level_id: int, data: RubricLevelDescIn):
    try:
        level = RubricLevelDesc.objects.get(level_desc_id=level_id)
        level.level_min_score = data.level_min_score
        level.level_max_score = data.level_max_score
        level.level_desc = data.level_desc
        level.save()
        return level
    except RubricLevelDesc.DoesNotExist:
        raise HttpError(404, "Rubric level not found")


@router.delete("/rubric-levels/{level_id}/")
def delete_rubric_level(request: HttpRequest, level_id: int):
    try:
        level = RubricLevelDesc.objects.get(level_desc_id=level_id)
        level.delete()
        return {"success": True}
    except RubricLevelDesc.DoesNotExist:
        raise HttpError(404, "Rubric level not found")


# =============================================================================
# Tasks
# =============================================================================


@router.get("/tasks/", response=list[TaskOut])
def list_tasks(
    request: HttpRequest,
    filters: TaskFilterParams = Query(...),
    pagination: PaginationParams = Query(...),
):
    qs = filters.filter(Task.objects.all())
    return paginate(qs, pagination)["results"]


@router.post("/tasks/", response=TaskOut)
def create_task(request: HttpRequest, data: TaskIn):
    IsAdminOrLecturer().check(request)

    try:
        unit = Unit.objects.get(unit_id=data.unit_id_unit)
    except Unit.DoesNotExist:
        raise HttpError(400, "Unit not found")

    try:
        rubric = MarkingRubric.objects.get(rubric_id=data.rubric_id_marking_rubric)
    except MarkingRubric.DoesNotExist:
        raise HttpError(400, "Rubric not found")

    class_obj = None
    if data.class_id_class is not None:
        try:
            class_obj = Class.objects.get(class_id=data.class_id_class)
        except Class.DoesNotExist:
            raise HttpError(400, "Class not found")

    task = Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=data.task_due_datetime,
        task_title=data.task_title,
        task_desc=data.task_desc,
        task_instructions=data.task_instructions or "",
        class_id_class=class_obj,
        task_status=data.task_status,
        task_allow_late_submission=data.task_allow_late_submission,
    )
    return task


@router.get("/tasks/{task_id}/", response=TaskOut)
def get_task(request: HttpRequest, task_id: int):
    try:
        return Task.objects.get(task_id=task_id)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.put("/tasks/{task_id}/", response=TaskOut)
def update_task(request: HttpRequest, task_id: int, data: TaskIn):
    try:
        task = Task.objects.get(task_id=task_id)
        if data.unit_id_unit:
            task.unit_id_unit = Unit.objects.get(unit_id=data.unit_id_unit)
        if data.rubric_id_marking_rubric:
            task.rubric_id_marking_rubric = MarkingRubric.objects.get(rubric_id=data.rubric_id_marking_rubric)
        task.task_due_datetime = data.task_due_datetime
        task.task_title = data.task_title
        task.task_desc = data.task_desc
        task.task_instructions = data.task_instructions
        if data.class_id_class is not None:
            task.class_id_class_id = data.class_id_class
        task.task_status = data.task_status
        task.task_allow_late_submission = data.task_allow_late_submission
        task.save()
        return task
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.delete("/tasks/{task_id}/")
def delete_task(request: HttpRequest, task_id: int):
    try:
        task = Task.objects.get(task_id=task_id)
        task.delete()
        return {"success": True}
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")

# =============================================================================
# Task Actions
# =============================================================================

@router.post("/tasks/{task_id}/publish/", response=TaskOut)
def publish_task(request: HttpRequest, task_id: int):
    """Publish a task (lecturer/admin only)."""
    user = request.auth
    if user.user_role not in ["lecturer", "admin"]:
        raise HttpError(403, "Only lecturers or admins can publish tasks")
    try:
        task = Task.objects.get(task_id=task_id)
        task.task_status = "published"
        task.save()
        return task
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.post("/tasks/{task_id}/unpublish/", response=TaskOut)
def unpublish_task(request: HttpRequest, task_id: int):
    """Unpublish a task (lecturer/admin only)."""
    user = request.auth
    if user.user_role not in ["lecturer", "admin"]:
        raise HttpError(403, "Only lecturers or admins can unpublish tasks")
    try:
        task = Task.objects.get(task_id=task_id)
        task.task_status = "unpublished"
        task.save()
        return task
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.get("/tasks/{task_id}/submissions/", response=list[SubmissionOut])
def get_task_submissions(request: HttpRequest, task_id: int):
    """Get all submissions for a task."""
    user = request.auth
    try:
        task = Task.objects.get(task_id=task_id)
        # Students can only see their own submissions
        if user.user_role == "student":
            return Submission.objects.filter(task_id_task=task, user_id_user=user)
        # Lecturers/admins can see all submissions
        return Submission.objects.filter(task_id_task=task)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")



# =============================================================================
# Submissions
# =============================================================================


@router.get("/submissions/", response=list[SubmissionOut])
def list_submissions(request: HttpRequest, filters: SubmissionFilterParams = SubmissionFilterParams()):
    qs = filters.filter(Submission.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/submissions/", response=SubmissionOut)
def create_submission(request: HttpRequest, data: SubmissionIn):
    task = Task.objects.get(task_id=data.task_id_task)
    user = User.objects.get(user_id=data.user_id_user)
    submission = Submission.objects.create(
        task_id_task=task,
        user_id_user=user,
        submission_txt=data.submission_txt,
    )
    return submission


@router.get("/submissions/{submission_id}/", response=SubmissionOut)
def get_submission(request: HttpRequest, submission_id: int):
    try:
        return Submission.objects.get(submission_id=submission_id)
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


@router.put("/submissions/{submission_id}/", response=SubmissionOut)
def update_submission(request: HttpRequest, submission_id: int, data: SubmissionIn):
    try:
        submission = Submission.objects.get(submission_id=submission_id)
        submission.submission_txt = data.submission_txt
        submission.save()
        return submission
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


@router.delete("/submissions/{submission_id}/")
def delete_submission(request: HttpRequest, submission_id: int):
    try:
        submission = Submission.objects.get(submission_id=submission_id)
        submission.delete()
        return {"success": True}
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


# =============================================================================
# Feedbacks
# =============================================================================


@router.get("/feedbacks/", response=list[FeedbackOut])
def list_feedbacks(request: HttpRequest, filters: FeedbackFilterParams = FeedbackFilterParams()):
    qs = filters.filter(Feedback.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/feedbacks/", response=FeedbackOut)
def create_feedback(request: HttpRequest, data: FeedbackIn):
    submission = Submission.objects.get(submission_id=data.submission_id_submission)
    user = User.objects.get(user_id=data.user_id_user)
    feedback = Feedback.objects.create(
        submission_id_submission=submission,
        user_id_user=user,
    )
    return feedback


@router.get("/feedbacks/{feedback_id}/", response=FeedbackOut)
def get_feedback(request: HttpRequest, feedback_id: int):
    try:
        return Feedback.objects.get(feedback_id=feedback_id)
    except Feedback.DoesNotExist:
        raise HttpError(404, "Feedback not found")


@router.delete("/feedbacks/{feedback_id}/")
def delete_feedback(request: HttpRequest, feedback_id: int):
    try:
        feedback = Feedback.objects.get(feedback_id=feedback_id)
        feedback.delete()
        return {"success": True}
    except Feedback.DoesNotExist:
        raise HttpError(404, "Feedback not found")


# =============================================================================
# FeedbackItems
# =============================================================================


@router.get("/feedback-items/", response=list[FeedbackItemOut])
def list_feedback_items(request: HttpRequest, filters: FeedbackItemFilterParams = FeedbackItemFilterParams()):
    qs = filters.filter(FeedbackItem.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/feedback-items/", response=FeedbackItemOut)
def create_feedback_item(request: HttpRequest, data: FeedbackItemIn):
    feedback = Feedback.objects.get(feedback_id=data.feedback_id_feedback)
    rubric_item = RubricItem.objects.get(rubric_item_id=data.rubric_item_id_rubric_item)
    item = FeedbackItem.objects.create(
        feedback_id_feedback=feedback,
        rubric_item_id_rubric_item=rubric_item,
        feedback_item_score=data.feedback_item_score,
        feedback_item_comment=data.feedback_item_comment,
        feedback_item_source=data.feedback_item_source,
    )
    return item


@router.get("/feedback-items/{item_id}/", response=FeedbackItemOut)
def get_feedback_item(request: HttpRequest, item_id: int):
    try:
        return FeedbackItem.objects.get(feedback_item_id=item_id)
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


@router.put("/feedback-items/{item_id}/", response=FeedbackItemOut)
def update_feedback_item(request: HttpRequest, item_id: int, data: FeedbackItemIn):
    try:
        item = FeedbackItem.objects.get(feedback_item_id=item_id)
        item.feedback_item_score = data.feedback_item_score
        item.feedback_item_comment = data.feedback_item_comment
        item.feedback_item_source = data.feedback_item_source
        item.save()
        return item
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


@router.delete("/feedback-items/{item_id}/")
def delete_feedback_item(request: HttpRequest, item_id: int):
    try:
        item = FeedbackItem.objects.get(feedback_item_id=item_id)
        item.delete()
        return {"success": True}
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


# =============================================================================
# TeachingAssignments
# =============================================================================


@router.get("/teaching-assignments/", response=list[TeachingAssnOut])
def list_teaching_assignments(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = TeachingAssn.objects.all()
    return paginate(qs, params)["results"]


@router.post("/teaching-assignments/", response=TeachingAssnOut)
def create_teaching_assignment(request: HttpRequest, data: TeachingAssnIn):
    user = User.objects.get(user_id=data.user_id_user)
    class_obj = Class.objects.get(class_id=data.class_id_class)
    assignment = TeachingAssn.objects.create(
        user_id_user=user,
        class_id_class=class_obj,
    )
    return assignment


@router.get("/teaching-assignments/{assignment_id}/", response=TeachingAssnOut)
def get_teaching_assignment(request: HttpRequest, assignment_id: int):
    try:
        return TeachingAssn.objects.get(teaching_assn_id=assignment_id)
    except TeachingAssn.DoesNotExist:
        raise HttpError(404, "Teaching assignment not found")


@router.delete("/teaching-assignments/{assignment_id}/")
def delete_teaching_assignment(request: HttpRequest, assignment_id: int):
    try:
        assignment = TeachingAssn.objects.get(teaching_assn_id=assignment_id)
        assignment.delete()
        return {"success": True}
    except TeachingAssn.DoesNotExist:
        raise HttpError(404, "Teaching assignment not found")


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


# =============================================================================
# Class Actions
# =============================================================================

@router.get("/classes/{class_id}/students/", response=list[UserOut])
def get_class_students(request: HttpRequest, class_id: int):
    """Get all students in a class."""
    try:
        class_obj = Class.objects.get(class_id=class_id)
        student_ids = Enrollment.objects.filter(class_id_class=class_obj).values_list("user_id_user", flat=True)
        return User.objects.filter(user_id__in=student_ids)
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.post("/classes/{class_id}/students/", response=UserOut)
def add_student_to_class(request: HttpRequest, class_id: int, user_id: int):
    """Add a student to a class (admin/lecturer only)."""
    try:
        class_obj = Class.objects.get(class_id=class_id)
        student = User.objects.get(user_id=user_id)

        if Enrollment.objects.filter(user_id_user=student, class_id_class=class_obj).exists():
            raise HttpError(400, "Student already enrolled")

        Enrollment.objects.create(
            user_id_user=student,
            class_id_class=class_obj,
            unit_id_unit=class_obj.unit_id_unit,
        )

        class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
        class_obj.save()

        return student
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")
    except User.DoesNotExist:
        raise HttpError(404, "Student not found")


@router.delete("/classes/{class_id}/students/{user_id}/")
def remove_student_from_class(request: HttpRequest, class_id: int, user_id: int):
    """Remove a student from a class (admin/lecturer only)."""
    try:
        class_obj = Class.objects.get(class_id=class_id)
        enrollment = Enrollment.objects.get(user_id_user_id=user_id, class_id_class=class_obj)
        enrollment.delete()

        class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
        class_obj.save()

        return {"success": True}
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")
    except Enrollment.DoesNotExist:
        raise HttpError(404, "Student not enrolled in this class")


@router.post("/classes/{class_id}/archive/", response=ClassOut)
def archive_class(request: HttpRequest, class_id: int):
    """Archive a class."""
    from datetime import datetime
    user = request.auth
    if user.user_role not in ["lecturer", "admin"]:
        raise HttpError(403, "Only lecturers or admins can archive classes")
    try:
        class_obj = Class.objects.get(class_id=class_id)
        class_obj.class_status = "archived"
        class_obj.class_archived_at = datetime.now()
        class_obj.save()
        return class_obj
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")
@router.delete("/classes/{class_id}/leave/")
def leave_class(request: HttpRequest, class_id: int):
    """Student leaves a class."""
    user = request.auth
    if user.user_role != "student":
        raise HttpError(403, "Only students can leave a class")

    try:
        class_obj = Class.objects.get(class_id=class_id)

        # Check if enrolled
        enrollment = Enrollment.objects.filter(user_id_user=user, class_id_class=class_obj).first()
        if not enrollment:
            raise HttpError(400, "Not enrolled in this class")

        # Delete enrollment
        enrollment.delete()

        # Update class size
        class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
        class_obj.save()

        return {"success": True, "message": "Successfully left the class"}
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")
