from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import viewsets
from .models import (
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
from .serializers import (
    ClassSerializer,
    EnrollmentSerializer,
    FeedbackSerializer,
    FeedbackItemSerializer,
    MarkingRubricSerializer,
    RubricItemSerializer,
    RubricLevelDescSerializer,
    SubmissionSerializer,
    TaskSerializer,
    TeachingAssnSerializer,
    UnitSerializer,
    UserSerializer,
)


@extend_schema(
    tags=["Users"],
    summary="User management",
    description="CRUD operations for user accounts. Supports students, lecturers, and administrators.",
)
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user accounts.
    
    Provides full CRUD operations for the User model including:
    - List all users with pagination
    - Retrieve specific user by ID
    - Create new user accounts
    - Update existing user information
    - Delete user accounts
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer


@extend_schema(
    tags=["Education"],
    summary="Unit management",
    description="CRUD operations for educational units (courses/subjects). Units are identified by unique unit codes.",
)
class UnitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing educational units.
    
    Units represent courses or subjects in the system. Each unit has:
    - A unique unit code (e.g., 'CS101', 'ENG202')
    - A full name
    - An optional description
    """
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer


@extend_schema(
    tags=["Education"],
    summary="Class management",
    description="CRUD operations for classes. Classes are instances of units with a specific class size.",
)
class ClassViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing classes.
    
    Classes are specific instances of units. Each class:
    - Belongs to a unit
    - Tracks the current number of enrolled students
    - Can have multiple enrollments
    """
    queryset = Class.objects.all()
    serializer_class = ClassSerializer


@extend_schema(
    tags=["Education"],
    summary="Enrollment management",
    description="CRUD operations for student enrollments. Students enroll in classes for specific units.",
)
class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing student enrollments.
    
    Enrollments represent the relationship between:
    - Students (users with role 'student')
    - Classes
    - Units
    
    A student can only have one enrollment per class per unit at any time.
    """
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer


@extend_schema(
    tags=["Assessment"],
    summary="Marking rubric management",
    description="CRUD operations for marking rubrics. Rubrics define the criteria and structure for evaluating submissions.",
)
class MarkingRubricViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing marking rubrics.
    
    Rubrics are created by lecturers/admins and contain:
    - A description
    - Multiple rubric items (criteria)
    - Creation timestamp
    """
    queryset = MarkingRubric.objects.all()
    serializer_class = MarkingRubricSerializer


@extend_schema(
    tags=["Assessment"],
    summary="Rubric item management",
    description="CRUD operations for rubric items. Rubric items are individual criteria within a marking rubric.",
)
class RubricItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing rubric items.
    
    Rubric items are criteria within a rubric, each with:
    - A name (e.g., 'Content', 'Organization', 'Language')
    - A weight (percentage contribution to total score)
    - Associated level descriptions
    """
    queryset = RubricItem.objects.all()
    serializer_class = RubricItemSerializer


@extend_schema(
    tags=["Assessment"],
    summary="Rubric level description management",
    description="CRUD operations for rubric level descriptions. These define score ranges and their meanings for each rubric item.",
)
class RubricLevelDescViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing rubric level descriptions.
    
    Level descriptions define:
    - Score ranges (min and max)
    - Descriptions for each performance level
    - Examples: 'Poor' (0-4), 'Good' (5-7), 'Excellent' (8-10)
    """
    queryset = RubricLevelDesc.objects.all()
    serializer_class = RubricLevelDescSerializer


@extend_schema(
    tags=["Assessment"],
    summary="Task management",
    description="CRUD operations for tasks/assignments. Tasks are created by lecturers for students to complete.",
)
class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tasks/assignments.
    
    Tasks represent assignments that:
    - Belong to a specific unit
    - Use a marking rubric for evaluation
    - Have publish and due dates
    - Can have multiple submissions
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


@extend_schema(
    tags=["Assessment"],
    summary="Submission management",
    description="CRUD operations for essay submissions. Students submit their work for tasks, which can then receive feedback.",
)
class SubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing essay submissions.
    
    Submissions represent:
    - Student work submitted for a task
    - The complete essay text content
    - Submission timestamp
    - Can have associated feedback
    """
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer


@extend_schema(
    tags=["Assessment"],
    summary="Feedback management",
    description="CRUD operations for feedback. Feedback is provided by lecturers/admins for student submissions.",
)
class FeedbackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing feedback.
    
    Feedback represents:
    - Evaluations provided for submissions
    - One-to-one relationship with submissions
    - Created by lecturers/admins
    - Contains multiple feedback items
    """
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer


@extend_schema(
    tags=["Assessment"],
    summary="Feedback item management",
    description="CRUD operations for feedback items. Feedback items are individual scores and comments for each rubric criterion.",
)
class FeedbackItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing feedback items.
    
    Feedback items represent:
    - Scores for specific rubric items
    - Comments on student performance
    - Source of feedback (AI, human, or revised)
    - Part of a larger feedback evaluation
    """
    queryset = FeedbackItem.objects.all()
    serializer_class = FeedbackItemSerializer


@extend_schema(
    tags=["Education"],
    summary="Teaching assignment management",
    description="CRUD operations for teaching assignments. Assigns lecturers to specific classes.",
)
class TeachingAssnViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing teaching assignments.
    
    Teaching assignments represent:
    - The relationship between lecturers and classes
    - Which lecturer teaches which class
    - One lecturer can teach multiple classes
    - One class can have one lecturer
    """
    queryset = TeachingAssn.objects.all()
    serializer_class = TeachingAssnSerializer
