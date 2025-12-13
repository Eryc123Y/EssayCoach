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


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class MarkingRubricViewSet(viewsets.ModelViewSet):
    queryset = MarkingRubric.objects.all()
    serializer_class = MarkingRubricSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class RubricItemViewSet(viewsets.ModelViewSet):
    queryset = RubricItem.objects.all()
    serializer_class = RubricItemSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class RubricLevelDescViewSet(viewsets.ModelViewSet):
    queryset = RubricLevelDesc.objects.all()
    serializer_class = RubricLevelDescSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class FeedbackItemViewSet(viewsets.ModelViewSet):
    queryset = FeedbackItem.objects.all()
    serializer_class = FeedbackItemSerializer
    permission_classes = []  # Allow unauthenticated access for testing


class TeachingAssnViewSet(viewsets.ModelViewSet):
    queryset = TeachingAssn.objects.all()
    serializer_class = TeachingAssnSerializer
    permission_classes = []  # Allow unauthenticated access for testing
