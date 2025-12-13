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


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer


class MarkingRubricViewSet(viewsets.ModelViewSet):
    queryset = MarkingRubric.objects.all()
    serializer_class = MarkingRubricSerializer


class RubricItemViewSet(viewsets.ModelViewSet):
    queryset = RubricItem.objects.all()
    serializer_class = RubricItemSerializer


class RubricLevelDescViewSet(viewsets.ModelViewSet):
    queryset = RubricLevelDesc.objects.all()
    serializer_class = RubricLevelDescSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer


class FeedbackItemViewSet(viewsets.ModelViewSet):
    queryset = FeedbackItem.objects.all()
    serializer_class = FeedbackItemSerializer


class TeachingAssnViewSet(viewsets.ModelViewSet):
    queryset = TeachingAssn.objects.all()
    serializer_class = TeachingAssnSerializer
