"""
Unit tests for the core app models, serializers, and API endpoints.
Tests cover CRUD operations for all core models.
"""
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal

from .models import (
    User,
    Unit,
    Class,
    Enrollment,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Task,
    Submission,
    Feedback,
    FeedbackItem,
    TeachingAssn,
)


class UserModelTest(TestCase):
    """Test cases for User model"""

    def setUp(self):
        """Create test user"""
        self.user = User.objects.create_user(
            user_email='testuser@example.com',
            password='testpass123',
            user_fname='John',
            user_lname='Doe',
        )

    def test_create_user(self):
        """Test creating a user"""
        self.assertEqual(self.user.user_email, 'testuser@example.com')
        self.assertEqual(self.user.user_fname, 'John')
        self.assertEqual(self.user.user_lname, 'Doe')
        self.assertTrue(self.user.check_password('testpass123'))

    def test_create_superuser(self):
        """Test creating a superuser"""
        admin = User.objects.create_superuser(
            user_email='admin@example.com',
            password='adminpass123',
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
                user_email='testuser@example.com',
                password='testpass123',
            )


class UnitModelTest(TestCase):
    """Test cases for Unit model"""

    def setUp(self):
        """Create test unit"""
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
            unit_desc='Basic writing and composition skills',
        )

    def test_create_unit(self):
        """Test creating a unit"""
        self.assertEqual(self.unit.unit_id, 'ENG101')
        self.assertEqual(self.unit.unit_name, 'English Composition')

    def test_unit_primary_key(self):
        """Test unit ID as primary key"""
        unit = Unit.objects.get(unit_id='ENG101')
        self.assertEqual(unit.unit_name, 'English Composition')


class ClassModelTest(TestCase):
    """Test cases for Class model"""

    def setUp(self):
        """Create test unit and class"""
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
        )
        self.class_obj = Class.objects.create(
            unit_id_unit=self.unit,
            class_size=30,
        )

    def test_create_class(self):
        """Test creating a class"""
        self.assertEqual(self.class_obj.unit_id_unit.unit_id, 'ENG101')
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
            user_email='student@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
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
        self.assertEqual(self.enrollment.user_id_user.user_email, 'student@example.com')
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
            user_email='teacher@example.com',
            password='pass123',
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
            rubric_desc='Essay Evaluation Rubric',
        )

    def test_create_rubric(self):
        """Test creating a rubric"""
        self.assertEqual(self.rubric.user_id_user.user_email, 'teacher@example.com')
        self.assertEqual(self.rubric.rubric_desc, 'Essay Evaluation Rubric')

    def test_rubric_timestamp(self):
        """Test that rubric has creation timestamp"""
        self.assertIsNotNone(self.rubric.rubric_create_time)


class RubricItemModelTest(TestCase):
    """Test cases for RubricItem model"""

    def setUp(self):
        """Create test rubric and item"""
        self.user = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
            rubric_desc='Essay Rubric',
        )
        self.item = RubricItem.objects.create(
            rubric_id_marking_rubric=self.rubric,
            rubric_item_name='Thesis Statement',
            rubric_item_weight=Decimal('25.0'),
        )

    def test_create_rubric_item(self):
        """Test creating a rubric item"""
        self.assertEqual(self.item.rubric_item_name, 'Thesis Statement')
        self.assertEqual(self.item.rubric_item_weight, Decimal('25.0'))

    def test_rubric_item_weight_constraint(self):
        """Test that weight must be positive"""
        with self.assertRaises(Exception):
            item = RubricItem.objects.create(
                rubric_id_marking_rubric=self.rubric,
                rubric_item_name='Test Item',
                rubric_item_weight=Decimal('-5.0'),
            )
            item.full_clean()


class RubricLevelDescModelTest(TestCase):
    """Test cases for RubricLevelDesc model"""

    def setUp(self):
        """Create test level description"""
        self.user = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
        )
        self.item = RubricItem.objects.create(
            rubric_id_marking_rubric=self.rubric,
            rubric_item_name='Thesis',
            rubric_item_weight=Decimal('25.0'),
        )
        self.level = RubricLevelDesc.objects.create(
            rubric_item_id_rubric_item=self.item,
            level_min_score=0,
            level_max_score=5,
            level_desc='Poor thesis statement',
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
            user_email='teacher@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
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
        self.assertEqual(self.task.unit_id_unit.unit_id, 'ENG101')
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
            user_email='student@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
        )
        self.teacher = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
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
            submission_txt='This is my essay content...',
        )

    def test_create_submission(self):
        """Test creating a submission"""
        self.assertEqual(self.submission.user_id_user.user_email, 'student@example.com')
        self.assertEqual(self.submission.submission_txt, 'This is my essay content...')

    def test_submission_timestamp(self):
        """Test that submission has timestamp"""
        self.assertIsNotNone(self.submission.submission_time)


class FeedbackModelTest(TestCase):
    """Test cases for Feedback model"""

    def setUp(self):
        """Create test feedback"""
        self.student = User.objects.create_user(
            user_email='student@example.com',
            password='pass123',
        )
        self.teacher = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
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
            submission_txt='Essay content',
        )
        self.feedback = Feedback.objects.create(
            submission_id_submission=self.submission,
            user_id_user=self.teacher,
        )

    def test_create_feedback(self):
        """Test creating feedback"""
        self.assertEqual(self.feedback.submission_id_submission.submission_id, self.submission.submission_id)
        self.assertEqual(self.feedback.user_id_user.user_email, 'teacher@example.com')


class FeedbackItemModelTest(TestCase):
    """Test cases for FeedbackItem model"""

    def setUp(self):
        """Create test feedback item"""
        self.student = User.objects.create_user(
            user_email='student@example.com',
            password='pass123',
        )
        self.teacher = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.teacher,
        )
        self.item = RubricItem.objects.create(
            rubric_id_marking_rubric=self.rubric,
            rubric_item_name='Thesis',
            rubric_item_weight=Decimal('25.0'),
        )
        self.task = Task.objects.create(
            unit_id_unit=self.unit,
            rubric_id_marking_rubric=self.rubric,
            task_due_datetime=timezone.now() + timedelta(days=7),
        )
        self.submission = Submission.objects.create(
            user_id_user=self.student,
            task_id_task=self.task,
            submission_txt='Essay content',
        )
        self.feedback = Feedback.objects.create(
            submission_id_submission=self.submission,
            user_id_user=self.teacher,
        )
        self.feedback_item = FeedbackItem.objects.create(
            feedback_id_feedback=self.feedback,
            rubric_item_id_rubric_item=self.item,
            feedback_item_score=8,
            feedback_item_comment='Good thesis',
            feedback_item_source='human',
        )

    def test_create_feedback_item(self):
        """Test creating a feedback item"""
        self.assertEqual(self.feedback_item.feedback_item_score, 8)
        self.assertEqual(self.feedback_item.feedback_item_source, 'human')

    def test_feedback_item_source_constraint(self):
        """Test that source must be ai, human, or revised"""
        with self.assertRaises(Exception):
            item = FeedbackItem.objects.create(
                feedback_id_feedback=self.feedback,
                rubric_item_id_rubric_item=self.item,
                feedback_item_score=7,
                feedback_item_source='invalid',
            )
            item.full_clean()


class TeachingAssnModelTest(TestCase):
    """Test cases for TeachingAssn model"""

    def setUp(self):
        """Create test teaching assignment"""
        self.teacher = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
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
        self.assertEqual(self.assignment.user_id_user.user_email, 'teacher@example.com')
        self.assertEqual(self.assignment.class_id_class.class_size, 30)


class UserAPITest(APITestCase):
    """Test cases for User API endpoints"""

    def setUp(self):
        """Set up test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            user_email='testuser@example.com',
            password='testpass123',
            user_fname='John',
            user_lname='Doe',
        )

    def test_list_users(self):
        """Test GET /api/v1/core/users/"""
        response = self.client.get('/api/v1/core/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_user(self):
        """Test GET /api/v1/core/users/{id}/"""
        response = self.client.get(f'/api/v1/core/users/{self.user.user_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_email'], 'testuser@example.com')

    def test_create_user(self):
        """Test POST /api/v1/core/users/"""
        data = {
            'user_email': 'newuser@example.com',
            'password': 'newpass123',
            'user_fname': 'Jane',
            'user_lname': 'Smith',
        }
        response = self.client.post('/api/v1/core/users/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user_email'], 'newuser@example.com')

    def test_update_user(self):
        """Test PUT /api/v1/core/users/{id}/"""
        data = {
            'user_email': 'updated@example.com',
            'user_fname': 'Johnny',
            'user_lname': 'Doe',
        }
        response = self.client.put(f'/api/v1/core/users/{self.user.user_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_partial_update_user(self):
        """Test PATCH /api/v1/core/users/{id}/"""
        data = {'user_fname': 'Jonathan'}
        response = self.client.patch(f'/api/v1/core/users/{self.user.user_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_user(self):
        """Test DELETE /api/v1/core/users/{id}/"""
        response = self.client.delete(f'/api/v1/core/users/{self.user.user_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class UnitAPITest(APITestCase):
    """Test cases for Unit API endpoints"""

    def setUp(self):
        """Set up test client and unit"""
        self.client = APIClient()
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
            unit_desc='Basic writing skills',
        )

    def test_list_units(self):
        """Test GET /api/v1/core/units/"""
        response = self.client.get('/api/v1/core/units/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_unit(self):
        """Test GET /api/v1/core/units/{id}/"""
        response = self.client.get(f'/api/v1/core/units/{self.unit.unit_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unit_name'], 'English Composition')

    def test_create_unit(self):
        """Test POST /api/v1/core/units/"""
        data = {
            'unit_id': 'MATH101',
            'unit_name': 'Basic Mathematics',
            'unit_desc': 'Fundamentals of math',
        }
        response = self.client.post('/api/v1/core/units/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_unit(self):
        """Test PUT /api/v1/core/units/{id}/"""
        data = {
            'unit_name': 'Advanced Composition',
            'unit_desc': 'Advanced writing skills',
        }
        response = self.client.put(f'/api/v1/core/units/{self.unit.unit_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_unit(self):
        """Test DELETE /api/v1/core/units/{id}/"""
        response = self.client.delete(f'/api/v1/core/units/{self.unit.unit_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class ClassAPITest(APITestCase):
    """Test cases for Class API endpoints"""

    def setUp(self):
        """Set up test client and class"""
        self.client = APIClient()
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
        )
        self.class_obj = Class.objects.create(
            unit_id_unit=self.unit,
            class_size=30,
        )

    def test_list_classes(self):
        """Test GET /api/v1/core/classes/"""
        response = self.client.get('/api/v1/core/classes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_class(self):
        """Test GET /api/v1/core/classes/{id}/"""
        response = self.client.get(f'/api/v1/core/classes/{self.class_obj.class_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['class_size'], 30)

    def test_create_class(self):
        """Test POST /api/v1/core/classes/"""
        data = {
            'unit_id_unit': self.unit.unit_id,
            'class_size': 25,
        }
        response = self.client.post('/api/v1/core/classes/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_class(self):
        """Test PUT /api/v1/core/classes/{id}/"""
        data = {
            'unit_id_unit': self.unit.unit_id,
            'class_size': 35,
        }
        response = self.client.put(f'/api/v1/core/classes/{self.class_obj.class_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_class(self):
        """Test DELETE /api/v1/core/classes/{id}/"""
        response = self.client.delete(f'/api/v1/core/classes/{self.class_obj.class_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class TaskAPITest(APITestCase):
    """Test cases for Task API endpoints"""

    def setUp(self):
        """Set up test client and task"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
        )
        self.task = Task.objects.create(
            unit_id_unit=self.unit,
            rubric_id_marking_rubric=self.rubric,
            task_due_datetime=timezone.now() + timedelta(days=7),
        )

    def test_list_tasks(self):
        """Test GET /api/v1/core/tasks/"""
        response = self.client.get('/api/v1/core/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_task(self):
        """Test GET /api/v1/core/tasks/{id}/"""
        response = self.client.get(f'/api/v1/core/tasks/{self.task.task_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_task(self):
        """Test POST /api/v1/core/tasks/"""
        data = {
            'unit_id_unit': self.unit.unit_id,
            'rubric_id_marking_rubric': self.rubric.rubric_id,
            'task_due_datetime': (timezone.now() + timedelta(days=5)).isoformat(),
        }
        response = self.client.post('/api/v1/core/tasks/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_task(self):
        """Test PUT /api/v1/core/tasks/{id}/"""
        data = {
            'unit_id_unit': self.unit.unit_id,
            'rubric_id_marking_rubric': self.rubric.rubric_id,
            'task_due_datetime': (timezone.now() + timedelta(days=10)).isoformat(),
        }
        response = self.client.put(f'/api/v1/core/tasks/{self.task.task_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_task(self):
        """Test DELETE /api/v1/core/tasks/{id}/"""
        response = self.client.delete(f'/api/v1/core/tasks/{self.task.task_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class EnrollmentAPITest(APITestCase):
    """Test cases for Enrollment API endpoints"""

    def setUp(self):
        """Set up test client and enrollment"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            user_email='student@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
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

    def test_list_enrollments(self):
        """Test GET /api/v1/core/enrollments/"""
        response = self.client.get('/api/v1/core/enrollments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_enrollment(self):
        """Test GET /api/v1/core/enrollments/{id}/"""
        response = self.client.get(f'/api/v1/core/enrollments/{self.enrollment.enrollment_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_enrollment(self):
        """Test POST /api/v1/core/enrollments/"""
        user2 = User.objects.create_user(
            user_email='student2@example.com',
            password='pass123',
        )
        data = {
            'user_id_user': user2.user_id,
            'class_id_class': self.class_obj.class_id,
            'unit_id_unit': self.unit.unit_id,
        }
        response = self.client.post('/api/v1/core/enrollments/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_delete_enrollment(self):
        """Test DELETE /api/v1/core/enrollments/{id}/"""
        response = self.client.delete(f'/api/v1/core/enrollments/{self.enrollment.enrollment_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class MarkingRubricAPITest(APITestCase):
    """Test cases for MarkingRubric API endpoints"""

    def setUp(self):
        """Set up test client and rubric"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
            rubric_desc='Essay Rubric',
        )

    def test_list_rubrics(self):
        """Test GET /api/v1/core/marking-rubrics/"""
        response = self.client.get('/api/v1/core/marking-rubrics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_rubric(self):
        """Test GET /api/v1/core/marking-rubrics/{id}/"""
        response = self.client.get(f'/api/v1/core/marking-rubrics/{self.rubric.rubric_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rubric_desc'], 'Essay Rubric')

    def test_create_rubric(self):
        """Test POST /api/v1/core/marking-rubrics/"""
        data = {
            'user_id_user': self.user.user_id,
            'rubric_desc': 'New Rubric',
        }
        response = self.client.post('/api/v1/core/marking-rubrics/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_rubric(self):
        """Test PUT /api/v1/core/marking-rubrics/{id}/"""
        data = {
            'user_id_user': self.user.user_id,
            'rubric_desc': 'Updated Rubric',
        }
        response = self.client.put(f'/api/v1/core/marking-rubrics/{self.rubric.rubric_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_rubric(self):
        """Test DELETE /api/v1/core/marking-rubrics/{id}/"""
        response = self.client.delete(f'/api/v1/core/marking-rubrics/{self.rubric.rubric_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class SubmissionAPITest(APITestCase):
    """Test cases for Submission API endpoints"""

    def setUp(self):
        """Set up test client and submission"""
        self.client = APIClient()
        self.student = User.objects.create_user(
            user_email='student@example.com',
            password='pass123',
        )
        self.teacher = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
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
            submission_txt='Essay content',
        )

    def test_list_submissions(self):
        """Test GET /api/v1/core/submissions/"""
        response = self.client.get('/api/v1/core/submissions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_submission(self):
        """Test GET /api/v1/core/submissions/{id}/"""
        response = self.client.get(f'/api/v1/core/submissions/{self.submission.submission_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_submission(self):
        """Test POST /api/v1/core/submissions/"""
        data = {
            'user_id_user': self.student.user_id,
            'task_id_task': self.task.task_id,
            'submission_txt': 'New essay content',
        }
        response = self.client.post('/api/v1/core/submissions/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_submission(self):
        """Test PUT /api/v1/core/submissions/{id}/"""
        data = {
            'user_id_user': self.student.user_id,
            'task_id_task': self.task.task_id,
            'submission_txt': 'Updated essay content',
        }
        response = self.client.put(f'/api/v1/core/submissions/{self.submission.submission_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_submission(self):
        """Test DELETE /api/v1/core/submissions/{id}/"""
        response = self.client.delete(f'/api/v1/core/submissions/{self.submission.submission_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class RubricItemAPITest(APITestCase):
    """Test cases for RubricItem API endpoints"""

    def setUp(self):
        """Set up test client and rubric item"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
            rubric_desc='Essay Rubric',
        )
        self.item = RubricItem.objects.create(
            rubric_id_marking_rubric=self.rubric,
            rubric_item_name='Thesis Statement',
            rubric_item_weight=Decimal('25.0'),
        )

    def test_list_rubric_items(self):
        """Test GET /api/v1/core/rubric-items/"""
        response = self.client.get('/api/v1/core/rubric-items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_rubric_item(self):
        """Test GET /api/v1/core/rubric-items/{id}/"""
        response = self.client.get(f'/api/v1/core/rubric-items/{self.item.rubric_item_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rubric_item_name'], 'Thesis Statement')

    def test_create_rubric_item(self):
        """Test POST /api/v1/core/rubric-items/"""
        data = {
            'rubric_id_marking_rubric': self.rubric.rubric_id,
            'rubric_item_name': 'Evidence',
            'rubric_item_weight': '20.0',
        }
        response = self.client.post('/api/v1/core/rubric-items/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_rubric_item(self):
        """Test PUT /api/v1/core/rubric-items/{id}/"""
        data = {
            'rubric_id_marking_rubric': self.rubric.rubric_id,
            'rubric_item_name': 'Updated Thesis',
            'rubric_item_weight': '30.0',
        }
        response = self.client.put(f'/api/v1/core/rubric-items/{self.item.rubric_item_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_rubric_item(self):
        """Test DELETE /api/v1/core/rubric-items/{id}/"""
        response = self.client.delete(f'/api/v1/core/rubric-items/{self.item.rubric_item_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class RubricLevelDescAPITest(APITestCase):
    """Test cases for RubricLevelDesc API endpoints"""

    def setUp(self):
        """Set up test client and level description"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.user,
        )
        self.item = RubricItem.objects.create(
            rubric_id_marking_rubric=self.rubric,
            rubric_item_name='Thesis',
            rubric_item_weight=Decimal('25.0'),
        )
        self.level = RubricLevelDesc.objects.create(
            rubric_item_id_rubric_item=self.item,
            level_min_score=0,
            level_max_score=5,
            level_desc='Poor thesis statement',
        )

    def test_list_rubric_level_descs(self):
        """Test GET /api/v1/core/rubric-level-descs/"""
        response = self.client.get('/api/v1/core/rubric-level-descs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_rubric_level_desc(self):
        """Test GET /api/v1/core/rubric-level-descs/{id}/"""
        response = self.client.get(f'/api/v1/core/rubric-level-descs/{self.level.level_desc_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['level_desc'], 'Poor thesis statement')

    def test_create_rubric_level_desc(self):
        """Test POST /api/v1/core/rubric-level-descs/"""
        data = {
            'rubric_item_id_rubric_item': self.item.rubric_item_id,
            'level_min_score': 6,
            'level_max_score': 10,
            'level_desc': 'Excellent thesis',
        }
        response = self.client.post('/api/v1/core/rubric-level-descs/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_rubric_level_desc(self):
        """Test PUT /api/v1/core/rubric-level-descs/{id}/"""
        data = {
            'rubric_item_id_rubric_item': self.item.rubric_item_id,
            'level_min_score': 0,
            'level_max_score': 4,
            'level_desc': 'Very poor thesis',
        }
        response = self.client.put(f'/api/v1/core/rubric-level-descs/{self.level.level_desc_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_rubric_level_desc(self):
        """Test DELETE /api/v1/core/rubric-level-descs/{id}/"""
        response = self.client.delete(f'/api/v1/core/rubric-level-descs/{self.level.level_desc_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class FeedbackAPITest(APITestCase):
    """Test cases for Feedback API endpoints"""

    def setUp(self):
        """Set up test client and feedback"""
        self.client = APIClient()
        self.student = User.objects.create_user(
            user_email='student@example.com',
            password='pass123',
        )
        self.teacher = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
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
            submission_txt='Essay content',
        )
        self.feedback = Feedback.objects.create(
            submission_id_submission=self.submission,
            user_id_user=self.teacher,
        )

    def test_list_feedbacks(self):
        """Test GET /api/v1/core/feedbacks/"""
        response = self.client.get('/api/v1/core/feedbacks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_feedback(self):
        """Test GET /api/v1/core/feedbacks/{id}/"""
        response = self.client.get(f'/api/v1/core/feedbacks/{self.feedback.feedback_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_feedback(self):
        """Test POST /api/v1/core/feedbacks/"""
        submission2 = Submission.objects.create(
            user_id_user=self.student,
            task_id_task=self.task,
            submission_txt='Another essay',
        )
        data = {
            'submission_id_submission': submission2.submission_id,
            'user_id_user': self.teacher.user_id,
        }
        response = self.client.post('/api/v1/core/feedbacks/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_feedback(self):
        """Test PUT /api/v1/core/feedbacks/{id}/"""
        data = {
            'submission_id_submission': self.submission.submission_id,
            'user_id_user': self.teacher.user_id,
        }
        response = self.client.put(f'/api/v1/core/feedbacks/{self.feedback.feedback_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_feedback(self):
        """Test DELETE /api/v1/core/feedbacks/{id}/"""
        response = self.client.delete(f'/api/v1/core/feedbacks/{self.feedback.feedback_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class FeedbackItemAPITest(APITestCase):
    """Test cases for FeedbackItem API endpoints"""

    def setUp(self):
        """Set up test client and feedback item"""
        self.client = APIClient()
        self.student = User.objects.create_user(
            user_email='student@example.com',
            password='pass123',
        )
        self.teacher = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
        )
        self.rubric = MarkingRubric.objects.create(
            user_id_user=self.teacher,
        )
        self.item = RubricItem.objects.create(
            rubric_id_marking_rubric=self.rubric,
            rubric_item_name='Thesis',
            rubric_item_weight=Decimal('25.0'),
        )
        self.task = Task.objects.create(
            unit_id_unit=self.unit,
            rubric_id_marking_rubric=self.rubric,
            task_due_datetime=timezone.now() + timedelta(days=7),
        )
        self.submission = Submission.objects.create(
            user_id_user=self.student,
            task_id_task=self.task,
            submission_txt='Essay content',
        )
        self.feedback = Feedback.objects.create(
            submission_id_submission=self.submission,
            user_id_user=self.teacher,
        )
        self.feedback_item = FeedbackItem.objects.create(
            feedback_id_feedback=self.feedback,
            rubric_item_id_rubric_item=self.item,
            feedback_item_score=8,
            feedback_item_comment='Good thesis',
            feedback_item_source='human',
        )

    def test_list_feedback_items(self):
        """Test GET /api/v1/core/feedback-items/"""
        response = self.client.get('/api/v1/core/feedback-items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_feedback_item(self):
        """Test GET /api/v1/core/feedback-items/{id}/"""
        response = self.client.get(f'/api/v1/core/feedback-items/{self.feedback_item.feedback_item_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['feedback_item_score'], 8)

    def test_create_feedback_item(self):
        """Test POST /api/v1/core/feedback-items/"""
        data = {
            'feedback_id_feedback': self.feedback.feedback_id,
            'rubric_item_id_rubric_item': self.item.rubric_item_id,
            'feedback_item_score': 9,
            'feedback_item_comment': 'Excellent',
            'feedback_item_source': 'ai',
        }
        response = self.client.post('/api/v1/core/feedback-items/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_feedback_item(self):
        """Test PUT /api/v1/core/feedback-items/{id}/"""
        data = {
            'feedback_id_feedback': self.feedback.feedback_id,
            'rubric_item_id_rubric_item': self.item.rubric_item_id,
            'feedback_item_score': 7,
            'feedback_item_comment': 'Updated comment',
            'feedback_item_source': 'revised',
        }
        response = self.client.put(f'/api/v1/core/feedback-items/{self.feedback_item.feedback_item_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_feedback_item(self):
        """Test DELETE /api/v1/core/feedback-items/{id}/"""
        response = self.client.delete(f'/api/v1/core/feedback-items/{self.feedback_item.feedback_item_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class TeachingAssnAPITest(APITestCase):
    """Test cases for TeachingAssn API endpoints"""

    def setUp(self):
        """Set up test client and teaching assignment"""
        self.client = APIClient()
        self.teacher = User.objects.create_user(
            user_email='teacher@example.com',
            password='pass123',
        )
        self.unit = Unit.objects.create(
            unit_id='ENG101',
            unit_name='English Composition',
        )
        self.class_obj = Class.objects.create(
            unit_id_unit=self.unit,
            class_size=30,
        )
        self.assignment = TeachingAssn.objects.create(
            user_id_user=self.teacher,
            class_id_class=self.class_obj,
        )

    def test_list_teaching_assignments(self):
        """Test GET /api/v1/core/teaching-assignments/"""
        response = self.client.get('/api/v1/core/teaching-assignments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_teaching_assignment(self):
        """Test GET /api/v1/core/teaching-assignments/{id}/"""
        response = self.client.get(f'/api/v1/core/teaching-assignments/{self.assignment.teaching_assn_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_teaching_assignment(self):
        """Test POST /api/v1/core/teaching-assignments/"""
        teacher2 = User.objects.create_user(
            user_email='teacher2@example.com',
            password='pass123',
        )
        data = {
            'user_id_user': teacher2.user_id,
            'class_id_class': self.class_obj.class_id,
        }
        response = self.client.post('/api/v1/core/teaching-assignments/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_teaching_assignment(self):
        """Test PUT /api/v1/core/teaching-assignments/{id}/"""
        data = {
            'user_id_user': self.teacher.user_id,
            'class_id_class': self.class_obj.class_id,
        }
        response = self.client.put(f'/api/v1/core/teaching-assignments/{self.assignment.teaching_assn_id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_teaching_assignment(self):
        """Test DELETE /api/v1/core/teaching-assignments/{id}/"""
        response = self.client.delete(f'/api/v1/core/teaching-assignments/{self.assignment.teaching_assn_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

