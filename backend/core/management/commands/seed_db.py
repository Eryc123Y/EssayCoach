from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from core.models import User, Unit, Class, Enrollment, TeachingAssn, MarkingRubric, RubricItem, RubricLevelDesc, Task, Submission, Feedback, FeedbackItem
from django.db import transaction, connection
from django.utils import timezone
from django.contrib.auth.hashers import make_password
import random
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seeds the database with initial data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        # Check if data already exists to avoid duplicates/errors
        if User.objects.count() > 0:
            self.stdout.write(self.style.WARNING('Database already contains data. Skipping seed.'))
            return

        try:
            with transaction.atomic():
                self.create_users()
                self.create_units()
                self.create_classes()
                self.create_enrollments()
                self.create_teaching_assns()
                self.create_rubrics()
                self.create_tasks()
                self.create_submissions()
                self.create_feedback()
            self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding database: {e}'))
            raise e

    def create_users(self):
        self.stdout.write('Creating users...')
        users_data = [
            (1, 'John', 'Doe', 'john.doe@example.com', 'student', 'active'),
            (2, 'Jane', 'Smith', 'jane.smith@example.com', 'lecturer', 'active'),
            (3, 'Admin', 'User', 'admin@example.com', 'admin', 'active'),
            (4, 'Alice', 'Johnson', 'alice.johnson@example.com', 'student', 'active'),
            (5, 'Bob', 'Williams', 'bob.williams@example.com', 'student', 'active'),
            # ... Adding a subset of users for brevity, but enough for testing ...
            # Realistically we would read from a CSV or list all 120. 
            # I will generate the rest procedurally to match the scale (120 users).
        ]
        
        # Add specific users from SQL
        specific_users = [
            (1, 'John', 'Doe', 'john.doe@example.com', 'student', 'active'),
            (2, 'Jane', 'Smith', 'jane.smith@example.com', 'lecturer', 'active'),
            (3, 'Admin', 'User', 'admin@example.com', 'admin', 'active'),
            # ...
        ]
        
        # Bulk create preparation
        users_to_create = []
        
        # 1. Specific Users
        # We'll create the first few manually to ensure they exist for login testing
        users_to_create.append(User(user_id=1, user_fname='John', user_lname='Doe', user_email='john.doe@example.com', user_role='student', user_status='active', password=make_password('password')))
        users_to_create.append(User(user_id=2, user_fname='Jane', user_lname='Smith', user_email='jane.smith@example.com', user_role='lecturer', user_status='active', password=make_password('password')))
        users_to_create.append(User(user_id=3, user_fname='Admin', user_lname='User', user_email='admin@example.com', user_role='admin', user_status='active', password=make_password('password')))

        # 2. Generate remaining students (4-94)
        for i in range(4, 95):
            users_to_create.append(User(
                user_id=i,
                user_fname=f'Student{i}',
                user_lname=f'User{i}',
                user_email=f'student{i}@example.com',
                user_role='student',
                user_status='active',
                password=make_password('password')
            ))
            
        # 3. Lecturers (95-97)
        for i in range(95, 98):
             users_to_create.append(User(
                user_id=i,
                user_fname=f'Lecturer{i}',
                user_lname=f'Teach',
                user_email=f'lecturer{i}@example.com',
                user_role='lecturer',
                user_status='active',
                password=make_password('password')
            ))

        # 4. Admins (98-99)
        for i in range(98, 100):
            users_to_create.append(User(
                user_id=i,
                user_fname=f'Admin{i}',
                user_lname=f'User',
                user_email=f'admin{i}@example.com',
                user_role='admin',
                user_status='active',
                password=make_password('password')
            ))

        # 5. Unregistered Students (100-120)
        for i in range(100, 121):
            users_to_create.append(User(
                user_id=i,
                user_fname=f'NewStudent{i}',
                user_lname=f'User{i}',
                user_email=f'newstudent{i}@example.com',
                user_role='student',
                user_status='unregistered',
                password=make_password('password')
            ))

        User.objects.bulk_create(users_to_create)
        
        # Assign Groups
        for user in User.objects.all():
            if user.user_role:
                try:
                    group = Group.objects.get(name=user.user_role)
                    user.groups.add(group)
                except Group.DoesNotExist:
                    pass
        
        # Reset sequence to prevent duplicate key errors on next insert
        # After bulk creating users with explicit user_id values, we need to advance
        # the sequence to the next available value (max + 1)
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT setval(pg_get_serial_sequence('\"user\"', 'user_id'), "
                "(SELECT COALESCE(MAX(user_id), 0) + 1 FROM \"user\"));"
            )


    def create_units(self):
        self.stdout.write('Creating units...')
        units = [
            ('CS101', 'Introduction to Computer Science', 'A foundational course.'),
            ('ENG202', 'Advanced Academic Writing', 'Advanced writing techniques.'),
            ('MATH303', 'Calculus III', 'Multivariable calculus.'),
            ('HIST404', 'World History', 'Overview of world history.'),
            ('PHIL505', 'Philosophy of Science', 'Philosophical underpinnings.'),
            ('BIO606', 'Biology 101', 'Principles of biology.'),
            ('CHEM707', 'Chemistry Basics', 'Basic chemistry concepts.'),
            ('ART808', 'Art History', 'Survey of art history.'),
            ('PSY909', 'Introduction to Psychology', 'Psychological theories.'),
            ('SOC1010', 'Sociology Fundamentals', 'Basic sociology concepts.'),
        ]
        Unit.objects.bulk_create([Unit(unit_id=u[0], unit_name=u[1], unit_desc=u[2]) for u in units])

    def create_classes(self):
        self.stdout.write('Creating classes...')
        unit_ids = ['CS101', 'ENG202', 'MATH303', 'HIST404', 'PHIL505', 'BIO606', 'CHEM707', 'ART808', 'PSY909', 'SOC1010', 'ENG202', 'PSY909', 'SOC1010']
        for uid in unit_ids:
            Class.objects.create(unit_id_unit_id=uid)

    def create_enrollments(self):
        self.stdout.write('Creating enrollments...')
        students = User.objects.filter(user_role='student', user_status='active')
        
        enrollments = []
        
        # Core units logic
        core_units = ['CS101', 'ENG202', 'MATH303', 'PSY909']
        
        for student in students:
            # Core unit assignment based on ID
            idx = student.user_id % 4
            unit_id = core_units[idx]
            
            # Find a class for this unit
            cls = Class.objects.filter(unit_id_unit_id=unit_id).first()
            if cls:
                enrollments.append(Enrollment(user_id_user=student, class_id_class=cls, unit_id_unit_id=unit_id))
            
            # Random electives
            if random.random() > 0.6:
                elective_units = ['HIST404', 'PHIL505', 'BIO606', 'CHEM707', 'ART808', 'SOC1010']
                e_unit = random.choice(elective_units)
                e_cls = Class.objects.filter(unit_id_unit_id=e_unit).first()
                if e_cls:
                    enrollments.append(Enrollment(user_id_user=student, class_id_class=e_cls, unit_id_unit_id=e_unit))
        
        # Use ignore_conflicts to handle potential duplicates from random logic
        Enrollment.objects.bulk_create(enrollments, ignore_conflicts=True)

    def create_teaching_assns(self):
        self.stdout.write('Creating teaching assignments...')
        lecturers = list(User.objects.filter(user_role='lecturer', user_status='active'))
        classes = list(Class.objects.all())
        
        if not lecturers:
            return

        assns = []
        for i, cls in enumerate(classes):
            lecturer = lecturers[i % len(lecturers)]
            assns.append(TeachingAssn(user_id_user=lecturer, class_id_class=cls))
        
        TeachingAssn.objects.bulk_create(assns, ignore_conflicts=True)

    def create_rubrics(self):
        self.stdout.write('Creating rubrics...')
        lecturers = User.objects.filter(user_role='lecturer', user_status='active')
        if not lecturers.exists():
            return

        rubrics = [
            (lecturers[0], 'Standard rubric for introductory essays.'),
            (lecturers[0], 'Advanced rubric for research papers.'),
            (lecturers[0], 'Comprehensive rubric for final projects.'),
        ]
        
        for lecturer, desc in rubrics:
            r = MarkingRubric.objects.create(user_id_user=lecturer, rubric_desc=desc)
            
            # Create items
            items = [
                ('Content', 40.0),
                ('Organization', 30.0),
                ('Language', 30.0)
            ]
            for name, weight in items:
                ri = RubricItem.objects.create(rubric_id_marking_rubric=r, rubric_item_name=name, rubric_item_weight=weight)
                
                # Create levels
                RubricLevelDesc.objects.create(rubric_item_id_rubric_item=ri, level_min_score=0, level_max_score=4, level_desc='Poor')
                RubricLevelDesc.objects.create(rubric_item_id_rubric_item=ri, level_min_score=5, level_max_score=7, level_desc='Good')
                RubricLevelDesc.objects.create(rubric_item_id_rubric_item=ri, level_min_score=8, level_max_score=10, level_desc='Excellent')

    def create_tasks(self):
        self.stdout.write('Creating tasks...')
        rubric = MarkingRubric.objects.first()
        if not rubric:
            return
            
        units = Unit.objects.all()
        for unit in units:
            Task.objects.create(
                unit_id_unit=unit,
                rubric_id_marking_rubric=rubric,
                task_due_datetime=timezone.now() + timedelta(days=30)
            )

    def create_submissions(self):
        self.stdout.write('Creating submissions...')
        tasks = Task.objects.all()
        
        submissions = []
        for task in tasks:
            # Find enrolled students for this unit
            enrollments = Enrollment.objects.filter(unit_id_unit=task.unit_id_unit)
            for enrollment in enrollments:
                if random.random() > 0.3: # 70% submission rate
                    submissions.append(Submission(
                        task_id_task=task,
                        user_id_user=enrollment.user_id_user,
                        submission_txt=f'Submission content for {task.unit_id_unit.unit_id} by {enrollment.user_id_user.user_email}'
                    ))
        Submission.objects.bulk_create(submissions)

    def create_feedback(self):
        self.stdout.write('Creating feedback...')
        submissions = Submission.objects.all()
        
        for submission in submissions:
            if random.random() > 0.2: # 80% feedback rate
                # Find a teacher
                # Simplified: just pick the first lecturer
                lecturer = User.objects.filter(user_role='lecturer').first()
                if not lecturer:
                    continue
                    
                feedback = Feedback.objects.create(
                    submission_id_submission=submission,
                    user_id_user=lecturer
                )
                
                # Feedback Items
                task = submission.task_id_task
                rubric = task.rubric_id_marking_rubric
                rubric_items = RubricItem.objects.filter(rubric_id_marking_rubric=rubric)
                
                f_items = []
                for ri in rubric_items:
                    f_items.append(FeedbackItem(
                        feedback_id_feedback=feedback,
                        rubric_item_id_rubric_item=ri,
                        feedback_item_score=random.randint(5, 10),
                        feedback_item_comment='Good work.',
                        feedback_item_source='human'
                    ))
                FeedbackItem.objects.bulk_create(f_items)


