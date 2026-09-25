from __future__ import annotations

from datetime import timedelta

from django.db import models
from django.db.models import Q
from django.http import HttpRequest
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from api_v2.schemas.base import PaginationParams
from api_v2.types.ids import (
    RubricItemId,
)
from api_v2.utils.auth import JWTAuth
from core.models import (
    Class,
    CourseLeadAssignment,
    Enrollment,
    Feedback,
    FeedbackItem,
    Submission,
    TeachingAssn,
    User,
)

from ..schemas import (
    AdminDashboardOut,
    AdminStatsOut,
    ClassOverviewOut,
    DashboardActivityItemOut,
    DashboardUserInfoOut,
    LecturerDashboardOut,
    LecturerStatsOut,
    StudentDashboardOut,
    StudentStatsOut,
    SystemStatusOut,
)


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



router = Router(tags=["Dashboard"], auth=JWTAuth())

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
    item_id: RubricItemId,
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


def _score_map_for_submissions(submission_ids: list[int], *, published_only: bool = False) -> dict[int, float]:
    if not submission_ids:
        return {}

    if published_only:
        return {
            submission_id: float(score)
            for submission_id, score in Feedback.objects.filter(
                submission_id_submission_id__in=submission_ids,
                status="published",
                final_score__isnull=False,
            ).values_list("submission_id_submission_id", "final_score")
        }

    qs = FeedbackItem.objects.filter(feedback_id_feedback__submission_id_submission_id__in=submission_ids)
    if published_only:
        qs = qs.filter(feedback_id_feedback__status="published")
    rows = (
        qs
        .values("feedback_id_feedback__submission_id_submission_id")
        .annotate(avg_score=models.Avg("feedback_item_score"))
    )
    return {
        row["feedback_id_feedback__submission_id_submission_id"]: float(row["avg_score"])
        for row in rows
        if row["avg_score"] is not None
    }


def _average_feedback_score(submission_ids: list[int] | None = None, *, published_only: bool = False) -> float | None:
    if published_only:
        qs = Feedback.objects.filter(status="published", final_score__isnull=False)
        if submission_ids is not None:
            if not submission_ids:
                return None
            qs = qs.filter(submission_id_submission_id__in=submission_ids)
        return _to_float(qs.aggregate(avg=models.Avg("final_score"))["avg"])
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
    pending_reviews = class_submissions.exclude(feedback__status="published").count()

    return ClassOverviewOut(
        id=class_obj.class_id,
        name=class_obj.class_name or f"Class {class_obj.class_id}",
        unitName=class_obj.unit_id_unit.unit_name if class_obj.unit_id_unit else None,
        studentCount=student_count,
        essayCount=len(class_submission_ids),
        avgScore=_average_feedback_score(class_submission_ids, published_only=True),
        pendingReviews=pending_reviews,
    )


def _build_student_dashboard_payload(user: User) -> StudentDashboardOut:
    submissions = list(
        Submission.objects.filter(user_id_user=user)
        .select_related("task_id_task__unit_id_unit")
        .order_by("-submission_time")
    )
    submission_ids = [submission.submission_id for submission in submissions]
    score_map = _score_map_for_submissions(submission_ids, published_only=True)
    feedback_submission_ids = set(
        Feedback.objects.filter(submission_id_submission_id__in=submission_ids, status="published").values_list(
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
        Feedback.objects.filter(submission_id_submission_id__in=submission_ids, status="published")
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
                    f"New feedback for {task.unit_id_unit.unit_name if task.unit_id_unit else 'your submission'}"
                ),
                timestamp=submission.submission_time,
                icon="message",
            )
        )

    activities.sort(key=lambda item: item.timestamp, reverse=True)

    total_essays = len(submissions)
    average_score = _average_feedback_score(submission_ids, published_only=True)
    pending_grading = sum(1 for submission in submissions if submission.submission_id not in feedback_submission_ids)

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
    lead_unit_ids = list(
        CourseLeadAssignment.objects.filter(user_id_user=user).values_list("unit_id_unit_id", flat=True)
    )
    assigned_classes = list(
        Class.objects.filter(
            Q(class_id__in=TeachingAssn.objects.filter(user_id_user=user).values_list("class_id_class_id", flat=True))
            | Q(unit_id_unit_id__in=lead_unit_ids)
        ).select_related("unit_id_unit").distinct()
    )
    assigned_class_ids = [class_obj.class_id for class_obj in assigned_classes]
    taught_unit_ids = set(lead_unit_ids)
    taught_unit_ids.update(
        class_obj.unit_id_unit_id for class_obj in assigned_classes if class_obj.unit_id_unit_id
    )

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

    feedback_by_submission = dict(
        Feedback.objects.filter(submission_id_submission_id__in=relevant_submission_ids).values_list(
            "submission_id_submission_id", "status"
        )
    )

    pending_submissions = [
        submission for submission in relevant_submissions
        if feedback_by_submission.get(submission.submission_id) != "published"
    ]

    classes = [_build_class_overview_item(class_obj) for class_obj in assigned_classes]

    grading_queue = []
    for submission in pending_submissions[:20]:
        task = submission.task_id_task
        student_name = submission.user_id_user.get_full_name() or submission.user_id_user.user_email
        grading_queue.append(
            {
                "submissionId": submission.submission_id,
                "classId": task.class_id_class_id,
                "studentName": student_name,
                "essayTitle": task.task_title or f"Essay #{submission.submission_id}",
                "submittedAt": submission.submission_time,
                "dueDate": task.task_due_datetime,
                "status": (
                    "ai_graded" if feedback_by_submission.get(submission.submission_id) == "ai_draft"
                    else "pending_review"
                ),
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
        Feedback.objects.filter(user_id_user=user, status__in=("lecturer_reviewed", "published"))
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

    avg_score = _average_feedback_score(relevant_submission_ids, published_only=True)
    today = timezone.now().date()
    reviewed_today = Feedback.objects.filter(
        reviewed_by=user,
        reviewed_at__date=today,
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
    pending_grading = Submission.objects.exclude(feedback__status="published").count()

    recent_submissions = list(
        Submission.objects.select_related("task_id_task__unit_id_unit", "user_id_user").order_by("-submission_time")[
            :100
        ]
    )

    total_users = User.objects.count()
    active_students = User.objects.filter(user_role="student", is_active=True).count()
    active_lecturers = User.objects.filter(user_role="lecturer", is_active=True).count()
    total_classes = Class.objects.count()
    average_score = _average_feedback_score(None, published_only=True)

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
        Feedback.objects.filter(status="published").select_related("submission_id_submission__task_id_task").order_by(
            "-submission_id_submission__submission_time"
        )[:8]
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
    feedbacks_last_24h = Feedback.objects.filter(submission_id_submission__submission_time__gte=last_24h).count()

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
def get_student_dashboard(request: HttpRequest) -> StudentDashboardOut:
    current_user = request.auth
    if current_user.user_role != "student":
        raise HttpError(403, "Only students can access the student dashboard")
    return _build_student_dashboard_payload(current_user)


@router.get("/dashboard/lecturer/", response=LecturerDashboardOut)
def get_lecturer_dashboard(request: HttpRequest) -> LecturerDashboardOut:
    current_user = request.auth
    if current_user.user_role not in ["lecturer", "admin"]:
        raise HttpError(403, "Only lecturers and admins can access the lecturer dashboard")
    return _build_lecturer_dashboard_payload(current_user)


@router.get("/dashboard/admin/", response=AdminDashboardOut)
def get_admin_dashboard(request: HttpRequest) -> AdminDashboardOut:
    current_user = request.auth
    if current_user.user_role != "admin":
        raise HttpError(403, "Only admins can access the admin dashboard")
    return _build_admin_dashboard_payload(current_user)


@router.get("/dashboard/", response=StudentDashboardOut | LecturerDashboardOut | AdminDashboardOut)
def get_dashboard_legacy(request: HttpRequest) -> StudentDashboardOut | LecturerDashboardOut | AdminDashboardOut:
    """Legacy role-aware dashboard endpoint used by existing tests/clients."""
    current_user = request.auth
    user_role = current_user.user_role or "student"

    if user_role == "admin":
        payload = _build_admin_dashboard_payload(current_user)
        payload.classes = [
            _build_class_overview_item(class_obj) for class_obj in Class.objects.all().select_related("unit_id_unit")
        ]
        return payload

    if user_role == "lecturer":
        return _build_lecturer_dashboard_payload(current_user)

    payload = _build_student_dashboard_payload(current_user)
    payload.classes = []
    return payload
