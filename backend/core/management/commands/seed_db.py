from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed database with initial data for development"

    def handle(self, *args, **options):
        """Seed database with test data for development"""

        from core.models import User, Unit, Class, Enrollment, TeachingAssn

        # Step 1: Create admin user
        print("Creating admin user...")
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

        # Step 2: Create lecturer users
        print("\nCreating lecturer users...")
        lecturers = []
        for i in range(1, 3):
            email = f"lecturer{i}@example.com"
            try:
                lecturer = User.objects.get(user_email=email)
                print(f"  Lecturer {i} already exists")
            except User.DoesNotExist:
                lecturer = User.objects.create(
                    user_email=email,
                    user_fname="Lecturer",
                    user_lname=f"{i}",
                    user_role="lecturer",
                    user_status="active",
                    password=make_password(f"lecturer{i}"),
                    is_active=True,
                )
                print(f"  Created lecturer {i}: {lecturer.user_email}")
            lecturers.append(lecturer)

        # Step 3: Create student users
        print("\nCreating student users...")
        students = []
        for i in range(1, 7):
            email = f"student{i}@example.com"
            try:
                user = User.objects.get(user_email=email)
                print(f"  Student {i} already exists")
            except User.DoesNotExist:
                user = User.objects.create(
                    user_email=email,
                    user_fname="Student",
                    user_lname=f"{i}",
                    user_role="student",
                    user_status="active",
                    password=make_password(f"student{i}"),
                    is_active=True,
                )
                print(f"  Created student {i}: {user.user_email}")
            students.append(user)

        # Step 4: Create units
        print("\nCreating units...")
        units_data = [
            {"unit_id": "ENG101", "unit_name": "English Composition"},
            {"unit_id": "ENG201", "unit_name": "Advanced Writing"},
            {"unit_id": "HIS101", "unit_name": "World History"},
        ]
        units = []
        for unit_data in units_data:
            unit, created = Unit.objects.get_or_create(
                unit_id=unit_data["unit_id"],
                defaults={
                    "unit_name": unit_data["unit_name"],
                    "unit_desc": f"Introduction to {unit_data['unit_name']}",
                },
            )
            if created:
                print(f"  Created unit: {unit.unit_name}")
            else:
                print(f"  Unit already exists: {unit.unit_name}")
            units.append(unit)

        # Step 5: Create classes for each unit
        print("\nCreating classes...")
        classes_data = [
            {"unit": units[0], "name": "AP English", "lecturer": lecturers[0]},
            {"unit": units[1], "name": "Creative Writing", "lecturer": lecturers[1]},
            {"unit": units[2], "name": "History 101", "lecturer": lecturers[0]},
        ]
        created_classes = []
        for idx, cls_data in enumerate(classes_data, start=1):
            unit = cls_data["unit"]
            class_name = cls_data["name"]
            lecturer = cls_data["lecturer"]

            # Create class with specific ID to avoid conflicts
            cls, created = Class.objects.get_or_create(
                class_id=idx,
                defaults={"unit_id_unit": unit, "class_size": 0},
            )
            if created:
                print(f"  Created class: {class_name} (ID: {cls.class_id})")
            else:
                print(f"  Class already exists: {class_name} (ID: {cls.class_id})")

            # Create teaching association
            TeachingAssn.objects.get_or_create(
                user_id_user=lecturer,
                class_id_class=cls,
            )
            print(f"  Assigned {lecturer.user_fname} to {class_name}")
            created_classes.append(cls)

        # Step 6: Enroll students in classes
        print("\nEnrolling students in classes...")
        # Student 1-2: ENG101 (AP English)
        for student in students[:2]:
            enrollment, created = Enrollment.objects.get_or_create(
                user_id_user=student,
                class_id_class=created_classes[0],  # AP English
                unit_id_unit=units[0],
            )
            if created:
                print(f"  Enrolled {student.user_email} in AP English")
            created_classes[0].class_size = Enrollment.objects.filter(class_id_class=created_classes[0]).count()
            created_classes[0].save()

        # Student 3-4: ENG201 (Creative Writing)
        for student in students[2:4]:
            enrollment, created = Enrollment.objects.get_or_create(
                user_id_user=student,
                class_id_class=created_classes[1],  # Creative Writing
                unit_id_unit=units[1],
            )
            if created:
                print(f"  Enrolled {student.user_email} in Creative Writing")
            created_classes[1].class_size = Enrollment.objects.filter(class_id_class=created_classes[1]).count()
            created_classes[1].save()

        # Student 5-6: HIS101 (History 101)
        for student in students[4:6]:
            enrollment, created = Enrollment.objects.get_or_create(
                user_id_user=student,
                class_id_class=created_classes[2],  # History 101
                unit_id_unit=units[2],
            )
            if created:
                print(f"  Enrolled {student.user_email} in History 101")
            created_classes[2].class_size = Enrollment.objects.filter(class_id_class=created_classes[2]).count()
            created_classes[2].save()

        # Summary
        print("\n" + "=" * 50)
        print("Seed completed successfully!")
        print("=" * 50)
        print(f"  Users: {User.objects.count()} (1 admin, {len(lecturers)} lecturers, {len(students)} students)")
        print(f"  Units: {Unit.objects.count()}")
        print(f"  Classes: {Class.objects.count()}")
        print(f"  Enrollments: {Enrollment.objects.count()}")
        print(f"  Teaching Associations: {TeachingAssn.objects.count()}")
        print("\nTest accounts:")
        print("  Admin: admin@example.com / admin")
        print("  Lecturers: lecturer1@example.com / lecturer1, lecturer2@example.com / lecturer2")
        print("  Students: student1@example.com / student1, ...")
