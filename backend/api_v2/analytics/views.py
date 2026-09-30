"""Role-scoped reports based on released formal assessment results."""

from __future__ import annotations

import csv
from datetime import date

from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError

from api_v2.utils.auth import JWTAuth
from api_v2.utils.course_scope import require_visible_class, require_visible_user
from core.analytics import class_report, institution_report, student_report
from core.models import Class, User

from .schemas import AnalyticsQueryIn

router = Router(tags=["Analytics"], auth=JWTAuth())


def _valid_dates(start_date: date | None, end_date: date | None) -> None:
    if start_date and end_date and start_date > end_date:
        raise HttpError(400, "Start date must be before or equal to end date")


def _report(
    request: HttpRequest,
    scope: str,
    user_id: int | None,
    class_id: int | None,
    start_date: date | None,
    end_date: date | None,
) -> dict:
    _valid_dates(start_date, end_date)
    actor = request.auth
    if scope == "student":
        if user_id is None:
            if actor.user_role != "student":
                raise HttpError(400, "user_id is required")
            user_id = actor.pk
        target = get_object_or_404(User, pk=user_id)
        require_visible_user(actor, target)
        if target.user_role != "student":
            raise HttpError(400, "Target account is not a student")
        return student_report(target, start_date=start_date, end_date=end_date)
    if scope == "class":
        if class_id is None:
            raise HttpError(400, "class_id is required")
        class_obj = get_object_or_404(Class, pk=class_id)
        require_visible_class(actor, class_obj)
        if actor.user_role == "student":
            raise HttpError(403, "Class reports are available to teaching staff")
        return class_report(class_obj, start_date=start_date, end_date=end_date)
    if scope == "institution":
        if actor.user_role != "admin":
            raise HttpError(403, "Institution reports require an administrator")
        return institution_report(start_date=start_date, end_date=end_date)
    raise HttpError(400, "Unknown analytics scope")


@router.get("/student/{user_id}/", response=dict)
def get_student_analytics(
    request: HttpRequest, user_id: int, start_date: date | None = None, end_date: date | None = None
):
    return _report(request, "student", user_id, None, start_date, end_date)


@router.get("/classes/{class_id}/", response=dict)
def get_class_analytics(
    request: HttpRequest, class_id: int, start_date: date | None = None, end_date: date | None = None
):
    return _report(request, "class", None, class_id, start_date, end_date)


@router.get("/institution/", response=dict)
def get_institution_analytics(request: HttpRequest, start_date: date | None = None, end_date: date | None = None):
    return _report(request, "institution", None, None, start_date, end_date)


@router.post("/query/", response=dict)
def query_analytics(request: HttpRequest, data: AnalyticsQueryIn):
    return _report(request, str(data.scope), data.user_id, data.class_id, data.start_date, data.end_date)


@router.get("/trends/", response=dict)
def get_trends(
    request: HttpRequest,
    scope: str,
    user_id: int | None = None,
    class_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    report = _report(request, scope, user_id, class_id, start_date, end_date)
    return {"scope": scope, "trend": report["trend"]}


@router.get("/export/")
def export_analytics(
    request: HttpRequest,
    scope: str,
    user_id: int | None = None,
    class_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    """Export the same visible data as CSV, with spreadsheet formula injection escaped."""
    report = _report(request, scope, user_id, class_id, start_date, end_date)
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="essaycoach-{scope}-analytics.csv"'
    response.write("\ufeff")
    writer = csv.writer(response)
    if scope == "student":
        writer.writerow(["submission_id", "task_id", "task_title", "score", "published_at"])
        rows = report["score_history"]
        fields = ("submission_id", "task_id", "task_title", "score", "published_at")
    elif scope == "class":
        writer.writerow(["user_id", "name", "email", "submissions", "published_results", "average_score"])
        rows = report["students"]
        fields = ("user_id", "name", "email", "submissions", "published_results", "average_score")
    else:
        writer.writerow(
            [
                "class_id",
                "class_name",
                "unit_id",
                "student_count",
                "submission_count",
                "published_count",
                "average_score",
            ]
        )
        rows = report["classes"]
        fields = (
            "class_id",
            "class_name",
            "unit_id",
            "student_count",
            "submission_count",
            "published_count",
            "average_score",
        )
    for row in rows:
        writer.writerow([_safe_csv(row[field]) for field in fields])
    return response


def _safe_csv(value: object) -> object:
    if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@")):
        return "'" + value
    return value
