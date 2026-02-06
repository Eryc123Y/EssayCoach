"""
Unit tests for the core app models, serializers, and API endpoints.
Tests cover CRUD operations for all core models.
"""

from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from api_v1.core.models import (
    Class,
    Enrollment,
    Feedback,
    FeedbackItem,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Submission,
    Task,
    TeachingAssn,
    Unit,
    User,
)


class UserModelTest(TestCase):
    """Test cases for User model"""

    def setUp(self):
        """Create test user"""
        self.user = User.objects.create_user(
            user_email="testuser@example.com",
            password="testpass123",
            user_fname="John",
            user_lname="Doe",
        )

    def test_create_user(self):
        """Test creating a user"""
        self.assertEqual(self.user.user_email, "testuser@example.com")
        self.assertEqual(self.user.user_fname, "John")
        self.assertEqual(self.user.user_lname, "Doe")
        self.assertTrue(self.user.check_password("testpass123"))

    def test_create_superuser(self):
        """Test creating a superuser"""
        admin = User.objects.create_superuser(
            user_email="admin@example.com",
            password="adminpass123",
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_user_string_representation(self):
        """Test user string representation"""
        self.assertIsNotNone(str(self.user))

    def test_unique_email(self):
        """Test that email must be unique"""
        with self.assertRaises(Exception):
            User.objects.create_user(
                user_email="testuser@example.com",
                password="testpass123",
            )


class UnitModelTest(TestCase):
    """Test cases for Unit model"""

    def setUp(self):
        """Create test unit"""
        self.unit = Unit.objects.create(
            unit_id="ENG101",
            unit_name="English Composition",
            unit_desc="Basic writing and composition skills",
        )

    def test_create_unit(self):
        """Test creating a unit"""
        self.assertEqual(self.unit.unit_id, "ENG101")
        self.assertEqual(self.unit.unit_name, "English Composition")

    def test_unit_primary_key(self):
        """Test unit ID as primary key"""
        unit = Unit.objects.get(unit_id="ENG101")
        self.assertEqual(unit.unit_name, "English Composition")


class ClassModelTest(TestCase):
    """Test cases for Class model"""

    def setUp(self):
        """Create test unit and class"""
        self.unit = Unit.objects.create(
            unit_id="ENG101",
            unit_name="English Composition",
        )
        self.class_obj = Class.objects.create(
            unit_id_unit=self.unit,
            class_size=30,
        )

    def test_create_class(self):
        """Test creating a class"""
        self.assertEqual(self.class_obj.unit_id_unit.unit_id, "ENG101")
        self.assertEqual(self.class_obj.class_size, 30)

    def test_class_size_constraint(self):
        """Test that class size must be non-negative"""
        with self.assertRaises(Exception):
            class_obj = Class.objects.create(
                unit_id_unit=self.unit,
                class_size=-1,
            )
            class_obj.full_clean()


class EnrollmentModelTest(TestCase):
    """Test cases for Enrollment model"""

    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(
            user_email="student@example.com",
            password="pass123",
        )
        self.unit = Unit.objects.create(
            unit_id="ENG101",
            unit_name="English Composition",
        )
        self.class_obj = Class.objects.create(
            unit_id_unit=self.unit,
            class_size=30,
        )
        self.enrollment = Enrollment.objects.create(
            user_id_user=self.user,
            class_id_class=self.class_obj,
            unit_id_unit=self.unit,
        )

    def test_create_enrollment(self):
        """Test creating an enrollment"""
        self.assertEqual(self.enrollment.user_id_user.user_email, "student@example.com")
        self.assertEqual(self.enrollment.class_id_class.class_size, 30)

    def test_enrollment_timestamp(self):
        """Test that enrollment has timestamp"""
        self.assertIsNotNone(self.enrollment.enrollment_time)

    def test_unique_enrollment_constraint(self):
        """Test that a student can only enroll once in a class per unit"""
        with self.assertRaises(Exception):
            Enrollment.objects.create(
                user_id_user=self.user,
                class_id_class=self.class_obj,
                unit_id_unit=self.unit,
            )


class MarkingRubricModelTest(TestCase):
    """Test cases for MarkingRubric model"""

    def setUp(self):
        """Create test user and rubric"""
        self.user = User.objects.create_user(
            user_email="teacher@example.com",
            password="pass123",
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
            rubric_desc="Essay Evaluation Rubric",
        )

    def test_create_rubric(self):
        """Test creating a rubric"""
        self.assertEqual(self.rubric.user_id_user.user_email, "teacher@example.com")
        self.assertEqual(self.rubric.rubric_desc, "Essay Evaluation Rubric")

    def test_rubric_timestamp(self):
        """Test that rubric has creation timestamp"""
        self.assertIsNotNone(self.rubric.rubric_create_time)


class RubricItemModelTest(TestCase):
    """Test cases for RubricItem model"""

    def setUp(self):
        """Create test rubric and item"""
        self.user = User.objects.create_user(
            user_email="teacher@example.com",
            password="pass123",
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
            rubric_desc="Essay Rubric",
        )
        self.item = RubricItem.objects.create(
            rubric_id_marking_rubric=self.rubric,
            rubric_item_name="Thesis Statement",
            rubric_item_weight=Decimal("25.0"),
        )

    def test_create_rubric_item(self):
        """Test creating a rubric item"""
        self.assertEqual(self.item.rubric_item_name, "Thesis Statement")
        self.assertEqual(self.item.rubric_item_weight, Decimal("25.0"))

    def test_rubric_item_weight_constraint(self):
        """Test that weight must be positive"""
        with self.assertRaises(Exception):
            item = RubricItem.objects.create(
                rubric_id_marking_rubric=self.rubric,
                rubric_item_name="Test Item",
                rubric_item_weight=Decimal("-5.0"),
            )
            item.full_clean()


class RubricLevelDescModelTest(TestCase):
    """Test cases for RubricLevelDesc model"""

    def setUp(self):
        """Create test level description"""
        self.user = User.objects.create_user(
            user_email="teacher@example.com",
            password="pass123",
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
        )
        self.item = RubricItem.objects.create(
            rubric_id_marking_rubric=self.rubric,
            rubric_item_name="Thesis",
            rubric_item_weight=Decimal("25.0"),
        )
        self.level = RubricLevelDesc.objects.create(
            rubric_item_id_rubric_item=self.item,
            level_min_score=0,
            level_max_score=5,
            level_desc="Poor thesis statement",
        )

    def test_create_level_desc(self):
        """Test creating a level description"""
        self.assertEqual(self.level.level_min_score, 0)
        self.assertEqual(self.level.level_max_score, 5)


class TaskModelTest(TestCase):
    """Test cases for Task model"""

    def setUp(self):
        """Create test task"""
        self.user = User.objects.create_user(
            user_email="teacher@example.com",
            password="pass123",
        )
        self.unit = Unit.objects.create(
            unit_id="ENG101",
            unit_name="English Composition",
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
        )
        self.task = Task.objects.create(
            unit_id_unit=self.unit,
            rubric_id_marking_rubric=self.rubric,
            task_due_datetime=timezone.now() + timedelta(days=7),
        )

    def test_create_task(self):
        """Test creating a task"""
        self.assertEqual(self.task.unit_id_unit.unit_id, "ENG101")
        self.assertEqual(self.task.rubric_id_marking_rubric.rubric_id, self.rubric.rubric_id)

    def test_task_timestamps(self):
        """Test that task has publish and due timestamps"""
        self.assertIsNotNone(self.task.task_publish_datetime)
        self.assertIsNotNone(self.task.task_due_datetime)
        self.assertLess(self.task.task_publish_datetime, self.task.task_due_datetime)


class SubmissionModelTest(TestCase):
    """Test cases for Submission model"""

    def setUp(self):
        """Create test submission"""
        self.user = User.objects.create_user(
            user_email="student@example.com",
            password="pass123",
        )
        self.unit = Unit.objects.create(
            unit_id="ENG101",
            unit_name="English Composition",
        )
        self.teacher = User.objects.create_user(
            user_email="teacher@example.com",
            password="pass123",
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.teacher,
        )
        self.task = Task.objects.create(
            unit_id_unit=self.unit,
            rubric_id_marking_rubric=self.rubric,
            task_due_datetime=timezone.now() + timedelta(days=7),
        )
        self.submission = Submission.objects.create(
            user_id_user=self.user,
            task_id_task=self.task,
            submission_txt="This is my essay content...",
        )

    def test_create_submission(self):
        """Test creating a submission"""
        self.assertEqual(self.submission.user_id_user.user_email, "student@example.com")
        self.assertEqual(self.submission.submission_txt, "This is my essay content...")

    def test_submission_timestamp(self):
        """Test that submission has timestamp"""
        self.assertIsNotNone(self.submission.submission_time)


class FeedbackModelTest(TestCase):
    """Test cases for Feedback model"""

    def setUp(self):
        """Create test feedback"""
        self.student = User.objects.create_user(
            user_email="student@example.com",
            password="pass123",
        )
        self.teacher = User.objects.create_user(
            user_email="teacher@example.com",
            password="pass123",
        )
        self.unit = Unit.objects.create(
            unit_id="ENG101",
            unit_name="English Composition",
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.teacher,
        )
        self.task = Task.objects.create(
            unit_id_unit=self.unit,
            rubric_id_marking_rubric=self.rubric,
            task_due_datetime=timezone.now() + timedelta(days=7),
        )
        self.submission = Submission.objects.create(
            user_id_user=self.student,
            task_id_task=self.task,
            submission_txt="Essay content",
        )
        self.feedback = Feedback.objects.create(
            submission_id_submission=self.submission,
            user_id_user=self.teacher,
        )

    def test_create_feedback(self):
        """Test creating feedback"""
        self.assertEqual(self.feedback.submission_id_submission.submission_id, self.submission.submission_id)
        self.assertEqual(self.feedback.user_id_user.user_email, "teacher@example.com")


class FeedbackItemModelTest(TestCase):
    """Test cases for FeedbackItem model"""

    def setUp(self):
        """Create test feedback item"""
        self.student = User.objects.create_user(
            user_email="student@example.com",
            password="pass123",
        )
        self.teacher = User.objects.create_user(
            user_email="teacher@example.com",
            password="pass123",
        )
        self.unit = Unit.objects.create(
            unit_id="ENG101",
            unit_name="English Composition",
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.teacher,
        )
        self.item = RubricItem.objects.create(
            rubric_id_marking_rubric=self.rubric,
            rubric_item_name="Thesis",
            rubric_item_weight=Decimal("25.0"),
        )
        self.task = Task.objects.create(
            unit_id_unit=self.unit,
            rubric_id_marking_rubric=self.rubric,
            task_due_datetime=timezone.now() + timedelta(days=7),
        )
        self.submission = Submission.objects.create(
            user_id_user=self.student,
            task_id_task=self.task,
            submission_txt="Essay content",
        )
        self.feedback = Feedback.objects.create(
            submission_id_submission=self.submission,
            user_id_user=self.teacher,
        )
        self.feedback_item = FeedbackItem.objects.create(
            feedback_id_feedback=self.feedback,
            rubric_item_id_rubric_item=self.item,
            feedback_item_score=8,
            feedback_item_comment="Good thesis",
            feedback_item_source="human",
        )

    def test_create_feedback_item(self):
        """Test creating a feedback item"""
        self.assertEqual(self.feedback_item.feedback_item_score, 8)
        self.assertEqual(self.feedback_item.feedback_item_source, "human")

    def test_feedback_item_source_constraint(self):
        """Test that source must be ai, human, or revised"""
        with self.assertRaises(Exception):
            item = FeedbackItem.objects.create(
                feedback_id_feedback=self.feedback,
                rubric_item_id_rubric_item=self.item,
                feedback_item_score=7,
                feedback_item_source="invalid",
            )
            item.full_clean()


class TeachingAssnModelTest(TestCase):
    """Test cases for TeachingAssn model"""

    def setUp(self):
        """Create test teaching assignment"""
        self.teacher = User.objects.create_user(
            user_email="teacher@example.com",
            password="pass123",
        )
        self.unit = Unit.objects.create(
            unit_id="ENG101",
            unit_name="English Composition",
        )
        self.class_obj = Class.objects.create(
            unit_id_unit=self.unit,
            class_size=30,
        )
        self.assignment = TeachingAssn.objects.create(
            user_id_user=self.teacher,
            class_id_class=self.class_obj,
        )

    def test_create_teaching_assignment(self):
        """Test creating a teaching assignment"""
        self.assertEqual(self.assignment.user_id_user.user_email, "teacher@example.com")
        self.assertEqual(self.assignment.class_id_class.class_size, 30)
