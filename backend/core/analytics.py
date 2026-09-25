"""Published-grade analytics shared by role-scoped reporting endpoints."""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from statistics import mean

from django.db.models import Count, Q
from django.utils import timezone

from core.models import AIJob, Class, Enrollment, Feedback, FeedbackItem, Submission, Task, User


def _date_filter(queryset, field: str, start_date: date | None, end_date: date | None):
    if start_date:
        queryset = queryset.filter(**{f"{field}__date__gte": start_date})
    if end_date:
        queryset = queryset.filter(**{f"{field}__date__lte": end_date})
    return queryset


def _published(queryset, start_date: date | None, end_date: date | None):
    return _date_filter(
        queryset.filter(status="published", final_score__isnull=False).select_related(
            "submission_id_submission__task_id_task", "submission_id_submission__user_id_user"
        ),
        "published_at",
        start_date,
        end_date,
    )


def _average(scores: list[float]) -> float | None:
    return round(mean(scores), 2) if scores else None


def _score_rows(feedbacks: list[Feedback]) -> list[dict]:
    return [
        {
            "submission_id": feedback.submission_id_submission_id,
            "task_id": feedback.submission_id_submission.task_id_task_id,
            "task_title": feedback.submission_id_submission.task_id_task.task_title,
            "score": float(feedback.final_score),
            "published_at": feedback.published_at,
        }
        for feedback in sorted(
            feedbacks,
            key=lambda row: row.published_at or row.submission_id_submission.submission_time,
        )
    ]


def _trend(feedbacks: list[Feedback]) -> list[dict]:
    by_day: dict[date, list[float]] = defaultdict(list)
    for feedback in feedbacks:
        if feedback.published_at:
            by_day[timezone.localtime(feedback.published_at).date()].append(float(feedback.final_score))
    return [
        {"date": day.isoformat(), "average_score": _average(scores), "count": len(scores)}
        for day, scores in sorted(by_day.items())
    ]


def _criterion_performance(feedbacks: list[Feedback]) -> list[dict]:
    snapshots = {feedback.pk: feedback.rubric_snapshot or [] for feedback in feedbacks}
    if not snapshots:
        return []
    totals: dict[str, list[float]] = defaultdict(list)
    items = FeedbackItem.objects.filter(feedback_id_feedback_id__in=snapshots).values(
        "feedback_id_feedback_id", "rubric_item_id_rubric_item_id", "feedback_item_score"
    )
    for item in items:
        snapshot_item = next(
            (
                criterion
                for criterion in snapshots[item["feedback_id_feedback_id"]]
                if criterion["id"] == item["rubric_item_id_rubric_item_id"]
            ),
            None,
        )
        if snapshot_item and snapshot_item["max_score"] > 0:
            totals[snapshot_item["name"]].append(item["feedback_item_score"] / snapshot_item["max_score"] * 100)
    return [
        {"criterion": name, "average_percent": _average(values), "samples": len(values)}
        for name, values in sorted(totals.items(), key=lambda entry: mean(entry[1]))
    ]


def student_report(user: User, *, start_date: date | None = None, end_date: date | None = None) -> dict:
    submissions = _date_filter(Submission.objects.filter(user_id_user=user), "submission_time", start_date, end_date)
    feedbacks = list(
        _published(Feedback.objects.filter(submission_id_submission__user_id_user=user), start_date, end_date)
    )
    scores = [float(feedback.final_score) for feedback in feedbacks]
    enrolled_class_ids = list(Enrollment.objects.filter(user_id_user=user).values_list("class_id_class_id", flat=True))
    peer_scores = list(
        _published(
            Feedback.objects.filter(submission_id_submission__task_id_task__class_id_class_id__in=enrolled_class_ids),
            start_date,
            end_date,
        ).values_list("final_score", flat=True)
    )
    criteria = _criterion_performance(feedbacks)
    return {
        "user_id": user.pk,
        "total_submissions": submissions.count(),
        "published_results": len(feedbacks),
        "average_score": _average(scores),
        "class_average": _average([float(score) for score in peer_scores]),
        "score_history": _score_rows(feedbacks),
        "trend": _trend(feedbacks),
        "criteria": criteria,
        "recommendations": [
            {"criterion": item["criterion"], "average_percent": item["average_percent"]} for item in criteria[:2]
        ],
    }


def class_report(class_obj: Class, *, start_date: date | None = None, end_date: date | None = None) -> dict:
    students = list(User.objects.filter(enrollment__class_id_class=class_obj).distinct().order_by("user_id"))
    student_ids = [user.pk for user in students]
    tasks = list(
        Task.objects.filter(task_status__in=["published", "unpublished"])
        .filter(Q(class_id_class=class_obj) | Q(class_id_class__isnull=True, unit_id_unit=class_obj.unit_id_unit))
        .order_by("task_id")
    )
    task_ids = [task.pk for task in tasks]
    submissions = _date_filter(
        Submission.objects.filter(task_id_task_id__in=task_ids, user_id_user_id__in=student_ids),
        "submission_time",
        start_date,
        end_date,
    )
    feedbacks = list(
        _published(
            Feedback.objects.filter(
                submission_id_submission__task_id_task_id__in=task_ids,
                submission_id_submission__user_id_user_id__in=student_ids,
            ),
            start_date,
            end_date,
        )
    )
    scores = [float(feedback.final_score) for feedback in feedbacks]
    bins = [
        ("0–49", 0, 50),
        ("50–59", 50, 60),
        ("60–69", 60, 70),
        ("70–79", 70, 80),
        ("80–89", 80, 90),
        ("90–100", 90, 101),
    ]
    distribution = [
        {"range": label, "count": sum(low <= score < high for score in scores)} for label, low, high in bins
    ]
    by_student: dict[int, list[float]] = defaultdict(list)
    by_task: dict[int, list[float]] = defaultdict(list)
    for feedback in feedbacks:
        score = float(feedback.final_score)
        by_student[feedback.submission_id_submission.user_id_user_id].append(score)
        by_task[feedback.submission_id_submission.task_id_task_id].append(score)
    submitted_by_student = dict(
        submissions.values("user_id_user_id")
        .annotate(count=Count("submission_id"))
        .values_list("user_id_user_id", "count")
    )
    unique_submissions = len(set(submissions.values_list("user_id_user_id", "task_id_task_id")))
    students_out = [
        {
            "user_id": user.pk,
            "name": f"{user.user_fname or ''} {user.user_lname or ''}".strip() or user.user_email,
            "email": user.user_email,
            "submissions": submitted_by_student.get(user.pk, 0),
            "published_results": len(by_student[user.pk]),
            "average_score": _average(by_student[user.pk]),
        }
        for user in students
    ]
    tasks_out = [
        {
            "task_id": task.pk,
            "title": task.task_title,
            "published_results": len(by_task[task.pk]),
            "average_score": _average(by_task[task.pk]),
        }
        for task in tasks
    ]
    possible = len(students) * len(tasks)
    return {
        "class_id": class_obj.pk,
        "class_name": class_obj.class_name,
        "unit_id": class_obj.unit_id_unit_id,
        "student_count": len(students),
        "task_count": len(tasks),
        "submission_count": submissions.count(),
        "published_count": len(feedbacks),
        "average_score": _average(scores),
        "completion_rate": round(unique_submissions / possible * 100, 2) if possible else 0,
        "distribution": distribution,
        "trend": _trend(feedbacks),
        "criteria": _criterion_performance(feedbacks),
        "students": students_out,
        "tasks": tasks_out,
    }


def institution_report(*, start_date: date | None = None, end_date: date | None = None) -> dict:
    submissions = _date_filter(Submission.objects.all(), "submission_time", start_date, end_date)
    feedbacks = list(_published(Feedback.objects.all(), start_date, end_date))
    classes = [
        class_report(class_obj, start_date=start_date, end_date=end_date)
        for class_obj in Class.objects.filter(class_status="active").order_by("class_id")
    ]
    review_events = _date_filter(
        Feedback.objects.filter(reviewed_by__isnull=False), "reviewed_at", start_date, end_date
    )
    lecturer_activity = [
        {"user_id": row["reviewed_by_id"], "reviews": row["count"]}
        for row in review_events.values("reviewed_by_id").annotate(count=Count("feedback_id")).order_by("-count")
    ]
    return {
        "active_users": User.objects.filter(user_status="active", is_active=True).count(),
        "active_students": User.objects.filter(user_status="active", is_active=True, user_role="student").count(),
        "active_lecturers": User.objects.filter(user_status="active", is_active=True, user_role="lecturer").count(),
        "active_classes": len(classes),
        "submission_count": submissions.count(),
        "published_count": len(feedbacks),
        "average_score": _average([float(feedback.final_score) for feedback in feedbacks]),
        "trend": _trend(feedbacks),
        "classes": [
            {
                "class_id": item["class_id"],
                "class_name": item["class_name"],
                "unit_id": item["unit_id"],
                "student_count": item["student_count"],
                "submission_count": item["submission_count"],
                "published_count": item["published_count"],
                "average_score": item["average_score"],
            }
            for item in classes
        ],
        "lecturer_activity": lecturer_activity,
        "ai_jobs": dict(AIJob.objects.values("status").annotate(count=Count("job_id")).values_list("status", "count")),
    }
