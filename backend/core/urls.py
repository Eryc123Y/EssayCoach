from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    UnitViewSet,
    ClassViewSet,
    EnrollmentViewSet,
    MarkingRubricViewSet,
    RubricItemViewSet,
    RubricLevelDescViewSet,
    TaskViewSet,
    SubmissionViewSet,
    FeedbackViewSet,
    FeedbackItemViewSet,
    TeachingAssnViewSet,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'units', UnitViewSet)
router.register(r'classes', ClassViewSet)
router.register(r'enrollments', EnrollmentViewSet)
router.register(r'marking-rubrics', MarkingRubricViewSet)
router.register(r'rubric-items', RubricItemViewSet)
router.register(r'rubric-level-descs', RubricLevelDescViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'feedbacks', FeedbackViewSet)
router.register(r'feedback-items', FeedbackItemViewSet)
router.register(r'teaching-assignments', TeachingAssnViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

