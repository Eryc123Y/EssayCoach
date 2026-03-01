"""
Core services for EssayCoach application.

This module contains business logic and data aggregation services
that are shared across the application.
"""

from __future__ import annotations

from core.models import Class, DeadlineExtension, Enrollment, MarkingRubric, RubricItem, RubricLevelDesc, Task, User


class TaskService:
    @staticmethod
    def duplicate_task(source_task, user, target_class_id: int | None, new_title: str | None, new_deadline) -> Task:
        from django.utils import timezone

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
