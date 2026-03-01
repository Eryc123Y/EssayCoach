from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from core.models import Class, Enrollment, Unit

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with test data"

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
        self.stdout.write(self.style.SUCCESS(f"Created admin: {admin.user_email}"))

        lecturer = User.objects.create_user(
            user_email="lecturer@example.com",
            password="lecturer123",
            user_fname="John",
            user_lname="Smith",
            user_role="lecturer",
            user_status="active",
        )
        self.stdout.write(self.style.SUCCESS(f"Created lecturer: {lecturer.user_email}"))

        student = User.objects.create_user(
            user_email="student@example.com",
            password="student123",
            user_fname="Jane",
            user_lname="Doe",
            user_role="student",
            user_status="active",
        )
        self.stdout.write(self.style.SUCCESS(f"Created student: {student.user_email}"))

        unit = Unit.objects.create(
            unit_name="Introduction to Computer Science",
            unit_code="CS101",
            unit_description="Basic CS course",
            unit_year=2024,
            unit_semester=1,
        )
        self.stdout.write(self.style.SUCCESS(f"Created unit: {unit.unit_code}"))

        class_obj = Class.objects.create(
            unit_id_unit=unit,
            class_size=1,
        )
        self.stdout.write(self.style.SUCCESS(f"Created class: {class_obj.class_id}"))

        Enrollment.objects.create(
            user_id_user=student,
            class_id_class=class_obj,
            unit_id_unit=unit,
        )
        self.stdout.write(self.style.SUCCESS("Created enrollment"))

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
