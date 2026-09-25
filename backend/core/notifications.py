"""Persist preference-aware notices and deliver local or configured SMTP email."""

from __future__ import annotations

import logging
import os

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction

from core.models import (
    CourseLeadAssignment,
    Enrollment,
    Feedback,
    Notification,
    PracticeRun,
    Submission,
    Task,
    TeachingAssn,
    User,
)

logger = logging.getLogger(__name__)


def _send_email(user: User, title: str, body: str, link: str) -> None:
    try:
        app_url = os.environ.get("ESSAYCOACH_APP_URL", "http://127.0.0.1:5100").rstrip("/")
        send_mail(title, f"{body}\n\n{app_url}{link}", settings.DEFAULT_FROM_EMAIL, [user.user_email])
    except Exception as exc:
        logger.warning("Notification email failed user_id=%s error_type=%s", user.pk, type(exc).__name__)


def dispatch_notification(
    user: User, *, event_key: str, kind: str, category: str,
    title_en: str, title_zh: str, body_en: str, body_zh: str, link: str,
) -> Notification | None:
    preferences = {**user.get_default_preferences(), **(user.preferences or {})}
    if not preferences.get(category, False):
        return None
    in_app = bool(preferences.get("in_app_notifications", True))
    email = bool(preferences.get("email_notifications", True))
    if not in_app and not email:
        return None
    notification, created = Notification.objects.get_or_create(
        event_key=f"{event_key}:u{user.pk}",
        defaults={
            "user": user, "kind": kind, "title_en": title_en, "title_zh": title_zh,
            "body_en": body_en, "body_zh": body_zh, "link": link, "in_app_visible": in_app,
        },
    )
    if created and email:
        chinese = preferences.get("language") == "zh"
        title = title_zh if chinese else title_en
        body = body_zh if chinese else body_en
        transaction.on_commit(lambda: _send_email(user, title, body, link))
    return notification


def notify_submission(submission: Submission) -> None:
    task = submission.task_id_task
    teacher_ids = set(
        TeachingAssn.objects.filter(class_id_class=task.class_id_class).values_list("user_id_user_id", flat=True)
    ) if task.class_id_class_id else set()
    teacher_ids.update(
        CourseLeadAssignment.objects.filter(unit_id_unit=task.unit_id_unit).values_list("user_id_user_id", flat=True)
    )
    for teacher in User.objects.filter(pk__in=teacher_ids, user_status="active"):
        dispatch_notification(
            teacher, event_key=f"submission:{submission.pk}", kind="submission", category="grading_alerts",
            title_en="New essay to review", title_zh="有新作文待复核",
            body_en=f"A student submitted {task.task_title}.", body_zh=f"学生提交了《{task.task_title}》。",
            link=f"/dashboard/review/{submission.pk}",
        )


def notify_assignment_published(task: Task) -> None:
    enrollments = Enrollment.objects.filter(unit_id_unit=task.unit_id_unit)
    if task.class_id_class_id:
        enrollments = enrollments.filter(class_id_class=task.class_id_class)
    student_ids = enrollments.values_list("user_id_user_id", flat=True)
    for student in User.objects.filter(pk__in=student_ids, user_role="student", user_status="active").distinct():
        dispatch_notification(
            student, event_key=f"task:{task.pk}:published", kind="assignment", category="submission_alerts",
            title_en="New writing assignment", title_zh="有新的写作作业",
            body_en=f"{task.task_title} is ready to view.", body_zh=f"《{task.task_title}》已发布。",
            link=f"/dashboard/tasks/{task.pk}",
        )


def notify_deadline_extended(task: Task, student: User, extended_deadline) -> None:
    dispatch_notification(
        student, event_key=f"task:{task.pk}:extension:{student.pk}:{extended_deadline.isoformat()}",
        kind="assignment", category="submission_alerts",
        title_en="Your assignment deadline changed", title_zh="你的作业截止时间已更新",
        body_en=f"Check your new deadline for {task.task_title}.",
        body_zh=f"请查看《{task.task_title}》的新截止时间。",
        link=f"/dashboard/tasks/{task.pk}",
    )


def notify_grade_published(feedback: Feedback) -> None:
    submission = feedback.submission_id_submission
    dispatch_notification(
        submission.user_id_user, event_key=f"grade:{feedback.pk}:published", kind="grade", category="submission_alerts",
        title_en="Your result is ready", title_zh="你的成绩已发布",
        body_en=f"The result for {submission.task_id_task.task_title} is available.",
        body_zh=f"《{submission.task_id_task.task_title}》的成绩已可查看。",
        link=f"/dashboard/submissions/{submission.pk}",
    )


def notify_practice_complete(run: PracticeRun) -> None:
    student = run.revision.essay.student
    dispatch_notification(
        student, event_key=f"practice:{run.pk}:complete", kind="practice", category="submission_alerts",
        title_en="Practice feedback is ready", title_zh="练习反馈已生成",
        body_en="Your writing coach has finished reviewing the latest draft.",
        body_zh="写作教练已完成最新草稿的反馈。",
        link="/dashboard/essay-analysis",
    )
