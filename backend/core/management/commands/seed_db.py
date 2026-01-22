from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import connection


class Command(BaseCommand):
    help = "Seed database with initial data for development"

    def handle(self, *args, **options):
        """Seed database with test data for development"""

        # Step 1: Create admin user if not exists
        print("Creating admin user...")
        from core.models import User

        try:
            admin = User.objects.get(user_email="admin@example.com")
            print("  Admin user already exists")
        except User.DoesNotExist:
            admin = User.objects.create_superuser(
                user_email="admin@example.com",
                password="admin",
                user_fname="Admin",
                user_lname="User",
                user_role="admin",
                user_status="active",
            )
            print(f"  Created admin user: {admin.user_email}")

        # Step 2: Create test users
        print("\nCreating test users...")
        test_users = []
        for i in range(1, 4):
            email = f"student{i}@example.com"
            try:
                user = User.objects.get(user_email=email)
                print(f"  Student {i} already exists")
            except User.DoesNotExist:
                user = User.objects.create(
                    user_email=email,
                    user_fname=f"Student",
                    user_lname=f"{i}",
                    user_role="student",
                    user_status="active",
                    password=make_password(f"student{i}"),
                    is_active=True,
                )
                print(f"  Created student {i}: {user.user_email}")
            test_users.append(user)

        # Step 3: Create sample unit
        print("\nCreating sample unit...")
        from core.models import Unit

        try:
            unit = Unit.objects.get(unit_id="ENG101")
            print("  Sample unit already exists")
        except Unit.DoesNotExist:
            unit = Unit.objects.create(
                unit_id="ENG101",
                unit_name="English Composition",
                unit_desc="Introduction to English Composition",
            )
            print(f"  Created unit: {unit.unit_name}")

        # Step 4: Create sample class
        print("\nCreating sample class...")
        from core.models import Class

        # Check if unit has any classes
        cls = Class.objects.filter(unit_id_unit=unit).first()
        if cls:
            print(f"  Sample class already exists (ID: {cls.class_id})")
        else:
            cls = Class.objects.create(unit_id_unit=unit, class_size=len(test_users))
            print(f"  Created class for unit {unit.unit_id}")

        # Step 5: Enroll students in class
        print("\nEnrolling students in class...")
        from core.models import Enrollment

        for user in test_users:
            try:
                enrollment, created = Enrollment.objects.get_or_create(
                    user_id_user=user, class_id_class=cls, unit_id_unit=unit
                )
                if created:
                    print(f"  Enrolled {user.user_email} in class {cls.class_id}")
                else:
                    print(f"  {user.user_email} already enrolled")
            except Exception as e:
                print(f"  Error enrolling {user.user_email}: {e}")

        # Summary
        print("\nSeed completed successfully!")
        print(f"Summary:")
        print(f"  - Users: {User.objects.count()}")
        print(f"  - Units: {Unit.objects.count()}")
        print(f"  - Classes: {Class.objects.count()}")
        print(f"  - Enrollments: {Enrollment.objects.count()}")
