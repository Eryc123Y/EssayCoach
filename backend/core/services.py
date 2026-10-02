"""
Core services for EssayCoach application.

This module contains business logic and data aggregation services
that are shared across the application.
"""

from __future__ import annotations

from datetime import timedelta

from core.models import (
    Class,
    DeadlineExtension,
    Task,
)


class TaskService:
    @staticmethod
    def duplicate_task(source_task, user, target_class_id: int | None, new_title: str | None, new_deadline) -> Task:
        from django.utils import timezone
        from ninja.errors import HttpError

        from core.models import Task

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

        now = timezone.now()
        if new_deadline and new_deadline <= now:
            raise HttpError(400, "New assignment deadline must be in the future")
        new_task.task_due_datetime = new_deadline or source_task.task_due_datetime
        if new_task.task_due_datetime <= now:
            new_task.task_due_datetime = now + timedelta(days=7)

        new_task.task_status = "draft"
        new_task.rubric_snapshot = None
        new_task.rubric_version = 0
        new_task.task_publish_datetime = now
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

        if new_deadline <= task.task_due_datetime:
            raise HttpError(400, "New deadline must extend the current deadline")

        task.task_due_datetime = new_deadline
        task.save()
        return task

    @staticmethod
    def extend_deadline_per_student(task, student, new_deadline, reason: str, granted_by) -> DeadlineExtension:
        from django.utils import timezone
        from ninja.errors import HttpError

        from core.models import DeadlineExtension

        if new_deadline <= task.task_due_datetime:
            raise HttpError(400, "Per-student deadline must be after the global deadline")
        if new_deadline <= timezone.now():
            raise HttpError(400, "New deadline must be in the future")
        existing = DeadlineExtension.objects.filter(task_id_task=task, user_id_user=student).first()
        if existing and new_deadline <= existing.extended_deadline:
            raise HttpError(400, "New deadline must extend the existing student deadline")

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
                    new_level = RubricLevelDesc.objects.get(level_desc_id=level.level_desc_id)
                    new_level.pk = None
                    new_level.level_desc_id = None
                    new_level.rubric_item_id_rubric_item = new_item
                    new_level.save()

            return new_rubric
