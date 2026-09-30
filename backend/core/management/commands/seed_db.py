from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.assessment import task_rubric_snapshot
from core.models import (
    Class,
    CourseLeadAssignment,
    Enrollment,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Task,
    TeachingAssn,
    Unit,
)

User = get_user_model()

# (name, weight, exemplar) for each criterion; levels are generated per item.
RUBRIC_ITEMS = [
    ("Argument", 50, "A specific, arguable thesis supported by evidence in every paragraph."),
    ("Structure", 30, "Each paragraph has one job, and transitions show how ideas connect."),
    ("Language", 20, "Precise word choice and varied sentence structure."),
]
LEVELS = [
    (0, 39, "Underdeveloped: the criterion is mostly absent."),
    (40, 69, "Developing: the criterion is present but inconsistent."),
    (70, 100, "Strong: the criterion is met clearly and consistently."),
]


class Command(BaseCommand):
    help = "Seed a disposable development database with demo accounts and one course"

    @transaction.atomic
    def handle(self, *args, **options):
        if User.objects.exists():
            self.stdout.write(self.style.WARNING("Database already has users. Skipping seed."))
            return

        admin = User.objects.create_user(
            user_email="admin@example.com",
            password="admin123",
            user_fname="Admin",
            user_lname="User",
            user_role="admin",
            user_status="active",
            is_staff=True,
        )
        lecturer = User.objects.create_user(
            user_email="lecturer@example.com",
            password="lecturer123",
            user_fname="John",
            user_lname="Smith",
            user_role="lecturer",
            user_status="active",
        )
        student = User.objects.create_user(
            user_email="student@example.com",
            password="student123",
            user_fname="Jane",
            user_lname="Doe",
            user_role="student",
            user_status="active",
        )
        for user in (admin, lecturer, student):
            self.stdout.write(self.style.SUCCESS(f"Created {user.user_role}: {user.user_email}"))

        unit = Unit.objects.create(
            unit_id="CS101",
            unit_name="Introduction to Computer Science",
            unit_desc="Basic CS course",
        )
        self.stdout.write(self.style.SUCCESS(f"Created unit: {unit.unit_id}"))

        class_obj = Class.objects.create(unit_id_unit=unit, class_name="CS101 Class A", class_size=1)
        TeachingAssn.objects.create(user_id_user=lecturer, class_id_class=class_obj)
        CourseLeadAssignment.objects.create(user_id_user=lecturer, unit_id_unit=unit, assigned_by=admin)
        Enrollment.objects.create(user_id_user=student, class_id_class=class_obj, unit_id_unit=unit)
        self.stdout.write(
            self.style.SUCCESS(f"Created class {class_obj.class_id} (join code {class_obj.class_join_code})")
        )

        rubric = MarkingRubric.objects.create(
            user_id_user=lecturer, rubric_desc="Argumentative essay rubric", visibility="public"
        )
        for name, weight, exemplar in RUBRIC_ITEMS:
            item = RubricItem.objects.create(
                rubric_id_marking_rubric=rubric,
                rubric_item_name=name,
                rubric_item_weight=weight,
                exemplar_text=exemplar,
            )
            for low, high, description in LEVELS:
                RubricLevelDesc.objects.create(
                    rubric_item_id_rubric_item=item,
                    level_min_score=low,
                    level_max_score=high,
                    level_desc=description,
                )

        Task.objects.create(
            unit_id_unit=unit,
            class_id_class=class_obj,
            rubric_id_marking_rubric=rubric,
            rubric_snapshot=task_rubric_snapshot(rubric),
            rubric_version=1,
            task_title="Essay 1: Technology and society",
            task_desc="A short argumentative essay.",
            task_instructions="Write 600-800 words. State a clear thesis and support it with evidence.",
            task_due_datetime=timezone.now() + timedelta(days=14),
            task_status="published",
            task_allow_resubmission=True,
        )
        self.stdout.write(self.style.SUCCESS("Created rubric and one published task"))

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
