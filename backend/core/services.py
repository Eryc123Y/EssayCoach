"""
Core services for EssayCoach application.

This module contains business logic and data aggregation services
that are shared across the application.
"""

from __future__ import annotations

from datetime import timedelta
from typing import TYPE_CHECKING

from django.db.models import Avg, Count
from django.utils import timezone as django_timezone

from core.models import Class, DeadlineExtension, Feedback, FeedbackItem, Submission, Task, TeachingAssn, User

if TYPE_CHECKING:
    from api_v2.core.schemas import (
        AdminDashboardOut,
        ClassOverviewOut,
        DashboardActivityItemOut,
        DashboardStatsOut,
        DashboardUserInfoOut,
        GradingQueueItemOut,
        LecturerDashboardOut,
        LecturerStatsOut,
        ProgressEntryOut,
        StudentDashboardOut,
        StudentEssayOut,
        StudentStatsOut,
    )


class DashboardService:
    """
    Service for dashboard data aggregation.

    Provides role-specific dashboard data for students, lecturers, and admins.
    """

    @staticmethod
    def get_user_info(user: User) -> DashboardUserInfoOut:
        """Get basic user information for dashboard."""
        from api_v2.core.schemas import DashboardUserInfoOut

        return DashboardUserInfoOut(
            id=user.user_id,
            name=user.get_full_name() or user.user_email,
            role=user.user_role or "student",
            email=user.user_email,
        )

    @staticmethod
    def get_dashboard_stats(user: User) -> DashboardStatsOut:
        """Get base dashboard statistics for any user."""
        from api_v2.core.schemas import DashboardStatsOut

        # Count user's submissions
        total_submissions = Submission.objects.filter(user_id_user=user).count()

        # Count recent activity (last 7 days)
        week_ago = django_timezone.now() - timedelta(days=7)
        recent_activity = Submission.objects.filter(user_id_user=user, submission_time__gte=week_ago).count()

        # Count pending notifications (placeholder - implement notifications module later)
        pending_notifications = 0

        return DashboardStatsOut(
            total_submissions=total_submissions,
            recent_activity_count=recent_activity,
            pending_notifications=pending_notifications,
        )

    @classmethod
    def get_lecturer_dashboard(cls, user: User) -> LecturerDashboardOut:
        """
        Get complete dashboard data for lecturer role.

        Includes:
        - Grading queue (pending essay reviews)
        - Class overview with metrics
        - Recent activity feed
        - Summary statistics
        """
        from api_v2.core.schemas import (
            LecturerDashboardOut,
        )

        # Get classes this lecturer teaches
        taught_class_ids = TeachingAssn.objects.filter(user_id_user=user).values_list("class_id_class_id", flat=True)

        # Get grading queue - essays submitted to lecturer's classes that need review
        grading_queue = cls.get_grading_queue(user, limit=10)

        # Get class metrics
        class_overview = cls.get_class_metrics_for_classes(list(taught_class_ids))

        # Get recent activity
        recent_activity = cls.get_activity_feed_for_lecturer(user, limit=10)

        # Calculate summary stats
        stats = cls.get_lecturer_stats(user, taught_class_ids)

        return LecturerDashboardOut(
            user=cls.get_user_info(user),
            stats=stats,
            grading_queue=grading_queue,
            class_overview=class_overview,
            recent_activity=recent_activity,
            summary={
                "essaysReviewedToday": stats.essaysReviewedToday,
                "pendingReviews": stats.pendingReviews,
                "totalClasses": stats.activeClasses,
                "avgGradingTime": stats.avgGradingTime,
            },
        )

    @classmethod
    def get_student_dashboard(cls, user: User) -> StudentDashboardOut:
        """
        Get complete dashboard data for student role.

        Includes:
        - My essays list with status
        - Progress trend (score improvement over time)
        - Recent activity feed
        - Summary statistics
        """

        # Get student's essays
        my_essays = cls.get_student_essays(user, limit=10)

        # Get progress trend
        progress_trend = cls.get_score_trend(user, limit=8)

        # Get recent activity
        recent_activity = cls.get_activity_feed_for_student(user, limit=10)

        # Calculate summary stats
        stats = cls.get_student_stats(user)

        return StudentDashboardOut(
            user=cls.get_user_info(user),
            stats=stats,
            my_essays=my_essays,
            progress_trend=progress_trend,
            recent_activity=recent_activity,
            summary={
                "essaysSubmitted": stats.essaysSubmitted,
                "avgScore": stats.avgScore,
                "improvementTrend": stats.improvementTrend,
                "feedbackReceived": stats.feedbackReceived,
            },
        )

    @classmethod
    def get_admin_dashboard(cls, user: User) -> AdminDashboardOut:
        """
        Get complete dashboard data for admin role.

        Includes:
        - Platform-wide statistics
        - System health metrics
        - User metrics
        - Recent activity
        """
        from api_v2.core.schemas import AdminStatsOut

        # Get platform stats
        total_users = User.objects.count()
        active_students = User.objects.filter(user_role="student", is_active=True).count()
        active_lecturers = User.objects.filter(user_role="lecturer", is_active=True).count()
        total_classes = Class.objects.count()

        stats = AdminStatsOut(
            totalUsers=total_users,
            activeStudents=active_students,
            activeLecturers=active_lecturers,
            totalClasses=total_classes,
            systemHealth="healthy",
        )

        # Get recent activity (platform-wide)
        recent_activity = cls.get_activity_feed_for_admin(limit=15)

        return AdminDashboardOut(
            user=cls.get_user_info(user),
            stats=stats,
            recent_activity=recent_activity,
            systemStatus={
                "database": "healthy",
                "api": "healthy",
                "ai_service": "healthy",
            },
            platform_stats={
                "totalSubmissions": Submission.objects.count(),
                "totalFeedback": Feedback.objects.count(),
                "totalTasks": Task.objects.count(),
            },
        )

    @staticmethod
    def get_lecturer_stats(user: User, taught_class_ids: list[int]) -> LecturerStatsOut:
        """Calculate lecturer statistics."""
        from api_v2.core.schemas import LecturerStatsOut

        today_start = django_timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # Essays reviewed today (feedback created today)
        essays_reviewed_today = Feedback.objects.filter(
            user_id_user=user,
            feedback_id__in=Feedback.objects.filter(
                submission_id_submission__in=Submission.objects.filter(
                    task_id_task__in=Task.objects.filter(
                        unit_id_unit__in=Class.objects.filter(class_id__in=taught_class_ids).values_list(
                            "unit_id_unit_id", flat=True
                        )
                    )
                )
            ),
            submission_id_submission__submission_time__gte=today_start,
        ).count()

        # Pending reviews (submissions without feedback)
        pending_reviews = (
            Submission.objects.filter(
                task_id_task__in=Task.objects.filter(
                    unit_id_unit__in=Class.objects.filter(class_id__in=taught_class_ids).values_list(
                        "unit_id_unit_id", flat=True
                    )
                )
            )
            .filter(feedback__isnull=True)
            .count()
        )

        # Active classes
        active_classes = len(taught_class_ids)

        # Average grading time (placeholder - would need timestamp tracking)
        avg_grading_time = None

        return LecturerStatsOut(
            essaysReviewedToday=essays_reviewed_today,
            pendingReviews=pending_reviews,
            activeClasses=active_classes,
            avgGradingTime=avg_grading_time,
        )

    @staticmethod
    def get_student_stats(user: User) -> StudentStatsOut:
        """Calculate student statistics."""
        from django.db.models import Avg

        from api_v2.core.schemas import StudentStatsOut

        # Essays submitted
        essays_submitted = Submission.objects.filter(user_id_user=user).count()

        # Average score from feedback items
        avg_score = None
        feedbacks = Feedback.objects.filter(user_id_user=user)
        if feedbacks.exists():
            avg_result = FeedbackItem.objects.filter(feedback_id_feedback__in=feedbacks).aggregate(
                avg_score=Avg("feedback_item_score")
            )
            avg_score = avg_result["avg_score"]

        # Determine improvement trend (compare recent vs older submissions)
        improvement_trend = "stable"
        if essays_submitted >= 2:
            # Get last 4 submissions
            submissions = Submission.objects.filter(user_id_user=user).order_by("-submission_time")[:4]

            if submissions.count() >= 2:
                submission_ids = list(submissions.values_list("submission_id", flat=True))
                recent_feedback = Feedback.objects.filter(submission_id_submission__in=submission_ids).order_by(
                    "-submission_id_submission__submission_time"
                )

                # Get scores from feedback items
                recent_scores = []
                for fb in recent_feedback:
                    items = fb.feedback_items.all()
                    if items.exists():
                        total = sum(item.feedback_item_score for item in items)
                        recent_scores.append(total)

                if len(recent_scores) >= 2:
                    first_half_avg = sum(recent_scores[: len(recent_scores) // 2]) / (len(recent_scores) // 2)
                    second_half_avg = sum(recent_scores[len(recent_scores) // 2 :]) / (
                        len(recent_scores) - len(recent_scores) // 2
                    )

                    if second_half_avg > first_half_avg * 1.1:
                        improvement_trend = "up"
                    elif second_half_avg < first_half_avg * 0.9:
                        improvement_trend = "down"

        # Feedback received count
        feedback_received = feedbacks.count()

        return StudentStatsOut(
            essaysSubmitted=essays_submitted,
            avgScore=avg_score,
            improvementTrend=improvement_trend,
            feedbackReceived=feedback_received,
        )

    @staticmethod
    def get_grading_queue(user: User, limit: int = 10) -> list[GradingQueueItemOut]:
        """
        Get essays pending review for lecturer.

        Returns submissions that have been AI-graded but not yet reviewed by lecturer.
        """
        from api_v2.core.schemas import GradingQueueItemOut

        # Get classes this lecturer teaches
        taught_class_ids = TeachingAssn.objects.filter(user_id_user=user).values_list("class_id_class_id", flat=True)

        # Get submissions to lecturer's tasks without lecturer feedback
        queue = (
            Submission.objects.filter(
                task_id_task__unit_id_unit__in=Class.objects.filter(class_id__in=taught_class_ids).values_list(
                    "unit_id_unit_id", flat=True
                )
            )
            .select_related(
                "user_id_user",
                "task_id_task",
                "task_id_task__unit_id_unit",
            )
            .prefetch_related("feedback")
            .filter(
                feedback__isnull=True  # No feedback yet
            )
            .order_by("submission_time")[:limit]
        )

        result = []
        now = django_timezone.now()

        for submission in queue:
            # Calculate if overdue
            due_date = submission.task_id_task.task_due_datetime if submission.task_id_task else None
            is_overdue = due_date and now > due_date

            result.append(
                GradingQueueItemOut(
                    submission_id=submission.submission_id,
                    essay_title=f"Submission #{submission.submission_id}",
                    student_name=submission.user_id_user.get_full_name() or submission.user_id_user.user_email,
                    student_email=submission.user_id_user.user_email,
                    submission_time=submission.submission_time,
                    task_name=str(submission.task_id_task) if submission.task_id_task else "Unknown Task",
                    class_name="Class",  # Would need to join through enrollment
                    is_overdue=is_overdue or False,
                    status="ai_graded",
                )
            )

        return result

    @staticmethod
    def get_class_metrics_for_classes(class_ids: list[int], limit: int = 5) -> list[ClassOverviewOut]:
        """
        Get performance metrics for multiple classes.

        Args:
            class_ids: List of class IDs to get metrics for
            limit: Maximum number of classes to return

        Returns:
            List of ClassOverviewOut with aggregated metrics
        """
        from api_v2.core.schemas import ClassOverviewOut

        if not class_ids:
            return []

        classes = (
            Class.objects.filter(class_id__in=class_ids)
            .select_related("unit_id_unit")
            .annotate(
                student_count=Count("enrollment", distinct=True),
                essay_count=Count("enrollment__user_id_user__submission", distinct=True),
            )[:limit]
        )

        result = []
        for cls in classes:
            # Calculate average score for this class's submissions
            avg_score_result = (
                Submission.objects.filter(task_id_task__unit_id_unit=cls.unit_id_unit_id)
                .filter(feedback__isnull=False)
                .aggregate(avg=Avg("feedback__feedback_items__feedback_item_score"))
            )
            avg_score = avg_score_result["avg"] or 0.0

            # Count pending reviews
            pending_reviews = Submission.objects.filter(
                task_id_task__unit_id_unit=cls.unit_id_unit_id, feedback__isnull=True
            ).count()

            # Calculate completion rate
            completion_rate = 0.0
            if cls.student_count > 0 and cls.essay_count > 0:
                # Simplified: essays / (students * avg tasks)
                completion_rate = min(100.0, (cls.essay_count / (cls.student_count * 3)) * 100)

            result.append(
                ClassOverviewOut(
                    class_id=cls.class_id,
                    class_name=f"Class {cls.class_id}",  # Would need name field
                    unit_name=cls.unit_id_unit.unit_name if cls.unit_id_unit else None,
                    student_count=cls.student_count,
                    essay_count=cls.essay_count,
                    avg_score=avg_score,
                    pending_reviews=pending_reviews,
                    completion_rate=completion_rate,
                )
            )

        return result

    @staticmethod
    def get_activity_feed_for_lecturer(user: User, limit: int = 10) -> list[DashboardActivityItemOut]:
        """Get recent activity feed for lecturer."""
        from api_v2.core.schemas import DashboardActivityItemOut

        # Get classes this lecturer teaches
        taught_class_ids = TeachingAssn.objects.filter(user_id_user=user).values_list("class_id_class_id", flat=True)

        # Get recent submissions to lecturer's classes
        submissions = (
            Submission.objects.filter(
                task_id_task__unit_id_unit__in=Class.objects.filter(class_id__in=taught_class_ids).values_list(
                    "unit_id_unit_id", flat=True
                )
            )
            .select_related("user_id_user")
            .order_by("-submission_time")[:limit]
        )

        result = []
        for sub in submissions:
            result.append(
                DashboardActivityItemOut(
                    id=sub.submission_id,
                    type="submission",
                    title="New Submission",
                    description=f"{sub.user_id_user.get_full_name() or 'Student'} submitted an essay",
                    timestamp=sub.submission_time,
                    icon="file-text",
                    user_name=sub.user_id_user.get_full_name() or sub.user_id_user.user_email,
                    related_id=sub.submission_id,
                    related_type="submission",
                )
            )

        return result

    @staticmethod
    def get_activity_feed_for_student(user: User, limit: int = 10) -> list[DashboardActivityItemOut]:
        """Get recent activity feed for student."""
        from api_v2.core.schemas import DashboardActivityItemOut

        # Get user's recent submissions
        submissions = Submission.objects.filter(user_id_user=user).order_by("-submission_time")[:limit]

        result = []
        for sub in submissions:
            has_feedback = hasattr(sub, "feedback") and sub.feedback is not None
            result.append(
                DashboardActivityItemOut(
                    id=sub.submission_id,
                    type="feedback" if has_feedback else "submission",
                    title="Feedback Received" if has_feedback else "Essay Submitted",
                    description=f"Submission #{sub.submission_id} - "
                    + ("Feedback available" if has_feedback else "Awaiting review"),
                    timestamp=sub.submission_time,
                    icon="check-circle" if has_feedback else "file-text",
                    user_name=sub.user_id_user.get_full_name() or sub.user_id_user.user_email,
                    related_id=sub.submission_id,
                    related_type="submission",
                )
            )

        return result

    @staticmethod
    def get_activity_feed_for_admin(limit: int = 15) -> list[DashboardActivityItemOut]:
        """Get platform-wide activity feed for admin."""
        from api_v2.core.schemas import DashboardActivityItemOut

        # Get recent submissions platform-wide
        submissions = Submission.objects.all().select_related("user_id_user").order_by("-submission_time")[:limit]

        result = []
        for sub in submissions:
            result.append(
                DashboardActivityItemOut(
                    id=sub.submission_id,
                    type="submission",
                    title="New Platform Submission",
                    description=f"{sub.user_id_user.get_full_name() or 'User'} submitted an essay",
                    timestamp=sub.submission_time,
                    icon="file-text",
                    user_name=sub.user_id_user.get_full_name() or sub.user_id_user.user_email,
                    related_id=sub.submission_id,
                    related_type="submission",
                )
            )

        return result

    @staticmethod
    def get_student_essays(user: User, limit: int = 10) -> list[StudentEssayOut]:
        """Get student's recent essay submissions."""
        from api_v2.core.schemas import StudentEssayOut

        submissions = (
            Submission.objects.filter(user_id_user=user)
            .select_related("task_id_task", "task_id_task__unit_id_unit")
            .prefetch_related("feedback")
            .order_by("-submission_time")[:limit]
        )

        result = []
        for sub in submissions:
            has_feedback = hasattr(sub, "feedback") and sub.feedback is not None
            status = "submitted"
            if has_feedback:
                status = "ai_graded"

            result.append(
                StudentEssayOut(
                    id=sub.submission_id,
                    title=f"Submission #{sub.submission_id}",
                    status=status,
                    submittedAt=sub.submission_time,
                    score=None,  # Would need to aggregate from feedback items
                    unitName=sub.task_id_task.unit_id_unit.unit_name if sub.task_id_task else None,
                    taskTitle=str(sub.task_id_task) if sub.task_id_task else None,
                )
            )

        return result

    @staticmethod
    def get_score_trend(user: User, limit: int = 8) -> list[ProgressEntryOut]:
        """
        Get student's score trend over time.

        Returns chronological list of submission scores for progress tracking.
        """
        from api_v2.core.schemas import ProgressEntryOut

        # Get submissions with feedback, ordered by time
        submissions = (
            Submission.objects.filter(user_id_user=user, feedback__isnull=False)
            .select_related("task_id_task")
            .prefetch_related("feedback__feedback_item")
            .order_by("submission_time")[:limit]
        )

        result = []
        prev_score = None

        for sub in submissions:
            # Calculate average score from feedback items
            feedback = sub.feedback.first() if hasattr(sub, "feedback") else None
            if feedback:
                avg_score = feedback.feedback_item.aggregate(avg=Avg("feedback_item_score"))["avg"] or 0.0
            else:
                avg_score = 0.0

            # Calculate improvement from previous
            improvement = None
            if prev_score is not None:
                improvement = avg_score - prev_score

            result.append(
                ProgressEntryOut(
                    submission_id=sub.submission_id,
                    essay_title=f"Submission #{sub.submission_id}",
                    score=avg_score,
                    submission_date=sub.submission_time,
                    improvement=improvement,
                )
            )

            prev_score = avg_score

        return result


class TaskService:
    @staticmethod
    def duplicate_task(source_task, user, target_class_id: int | None, new_title: str | None, new_deadline) -> Task:
        from django.utils import timezone

        from core.models import Class, Task

        # Deep copy task (ignoring primary key)
        new_task = Task.objects.get(task_id=source_task.task_id)
        new_task.pk = None
        new_task.task_id = None

        if target_class_id is not None:
            new_task.class_id_class = Class.objects.get(class_id=target_class_id)

        if new_title:
            new_task.task_title = new_title
        else:
            new_task.task_title = f"Copy of {source_task.task_title}"

        if new_deadline:
            new_task.task_due_datetime = new_deadline

        new_task.task_status = "draft"
        new_task.task_publish_datetime = timezone.now()
        new_task.save()
        return new_task

    @staticmethod
    def extend_deadline_global(task, new_deadline) -> Task:
        from django.utils import timezone
        from ninja.errors import HttpError

        if task.task_publish_datetime and new_deadline <= task.task_publish_datetime:
            raise HttpError(400, "New deadline cannot be before publish time")

        if new_deadline <= timezone.now():
            raise HttpError(400, "New deadline must be in the future")

        task.task_due_datetime = new_deadline
        task.save()
        return task

    @staticmethod
    def extend_deadline_per_student(task, student, new_deadline, reason: str, granted_by) -> DeadlineExtension:
        from ninja.errors import HttpError

        from core.models import DeadlineExtension

        if new_deadline <= task.task_due_datetime:
            raise HttpError(400, "Per-student deadline must be after the global deadline")

        extension, created = DeadlineExtension.objects.update_or_create(
            task_id_task=task,
            user_id_user=student,
            defaults={
                "original_deadline": task.task_due_datetime,
                "extended_deadline": new_deadline,
                "reason": reason,
                "granted_by": granted_by,
            },
        )
        return extension


class EnrollmentService:
    @staticmethod
    def batch_enroll(class_obj, student_emails: list[str]):
        import secrets

        from django.db import transaction

        from core.models import Enrollment, User

        result = {
            "success": True,
            "message": "Batch enrollment completed",
            "enrolled_count": 0,
            "created_count": 0,
            "already_enrolled": [],
            "newly_created": [],
            "failed": [],
        }

        with transaction.atomic():
            for email in student_emails:
                try:
                    user = User.objects.filter(user_email=email).first()
                    if not user:
                        # Create unregistered user
                        user = User.objects.create(
                            user_email=email,
                            user_role="student",
                            user_status="unregistered",
                            user_fname="",
                            user_lname="",
                            user_hash=secrets.token_urlsafe(16),
                        )
                        result["newly_created"].append(email)
                        result["created_count"] += 1

                    # Attempt enrollment
                    enrollment, created = Enrollment.objects.get_or_create(
                        user_id_user=user, class_id_class=class_obj, unit_id_unit=class_obj.unit_id_unit
                    )

                    if created:
                        result["enrolled_count"] += 1
                    else:
                        result["already_enrolled"].append(email)

                except Exception:
                    result["failed"].append(email)

            # Update class size
            class_obj.class_size = Enrollment.objects.filter(class_id_class=class_obj).count()
            class_obj.save()

        return result

    @staticmethod
    def invite_lecturer(email: str, first_name: str | None, last_name: str | None):
        import secrets

        from ninja.errors import HttpError

        from core.models import User

        user = User.objects.filter(user_email=email).first()
        if user:
            if user.user_role == "lecturer":
                return {"user": user, "status": "existing"}
            else:
                raise HttpError(409, f"User with email {email} already exists but is not a lecturer")

        user = User.objects.create(
            user_email=email,
            user_role="lecturer",
            user_status="unregistered",
            user_fname=first_name or "",
            user_lname=last_name or "",
            user_hash=secrets.token_urlsafe(16),
        )
        return {"user": user, "status": "created"}


class RubricService:
    @staticmethod
    def duplicate_rubric(source_rubric, user, new_desc: str | None, visibility: str):
        from django.db import transaction

        from core.models import MarkingRubric, RubricItem, RubricLevelDesc

        with transaction.atomic():
            new_rubric = MarkingRubric.objects.get(rubric_id=source_rubric.rubric_id)
            new_rubric.pk = None
            new_rubric.rubric_id = None
            new_rubric.user_id_user = user
            new_rubric.rubric_desc = new_desc or f"Copy of {source_rubric.rubric_desc}"
            new_rubric.visibility = visibility
            new_rubric.save()

            for item in source_rubric.rubric_items.all():
                new_item = RubricItem.objects.get(rubric_item_id=item.rubric_item_id)
                new_item.pk = None
                new_item.rubric_item_id = None
                new_item.rubric_id_marking_rubric = new_rubric
                new_item.save()

                for level in item.level_descriptions.all():
                    new_level = RubricLevelDesc.objects.get(rubric_level_desc_id=level.rubric_level_desc_id)
                    new_level.pk = None
                    new_level.rubric_level_desc_id = None
                    new_level.rubric_item_id_rubric_item = new_item
                    new_level.save()

            return new_rubric
