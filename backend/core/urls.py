from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ClassViewSet,
    EnrollmentViewSet,
    FeedbackItemViewSet,
    FeedbackViewSet,
    MarkingRubricViewSet,
    RubricItemViewSet,
    RubricLevelDescViewSet,
    RubricViewSet,
    SubmissionViewSet,
    TaskViewSet,
    TeachingAssnViewSet,
    UnitViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"units", UnitViewSet)
router.register(r"classes", ClassViewSet)
router.register(r"enrollments", EnrollmentViewSet)
router.register(r"marking-rubrics", MarkingRubricViewSet, basename="marking-rubrics")
router.register(r"rubric-items", RubricItemViewSet, basename="rubric-items")
router.register(
    r"rubric-level-descs", RubricLevelDescViewSet, basename="rubric-level-descs"
)
router.register(r"tasks", TaskViewSet, basename="tasks")
router.register(r"submissions", SubmissionViewSet, basename="submissions")
router.register(r"feedbacks", FeedbackViewSet, basename="feedbacks")
router.register(r"feedback-items", FeedbackItemViewSet, basename="feedback-items")
router.register(
    r"teaching-assignments", TeachingAssnViewSet, basename="teaching-assignments"
)
router.register(r"rubrics", RubricViewSet, basename="rubrics")

urlpatterns = [
    path("", include(router.urls)),
]
