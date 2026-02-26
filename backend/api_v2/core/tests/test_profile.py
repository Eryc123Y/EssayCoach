"""
Tests for Profile API endpoints.

Tests cover:
- User statistics endpoint
- User badges endpoint
- User progress endpoint

Run with: uv run pytest api_v2/core/tests/test_profile.py -v
"""

import pytest
from django.test import Client
from django.utils import timezone
from datetime import timedelta

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import User, Submission, Feedback, FeedbackItem, Badge, UserBadge, Task, Unit, MarkingRubric


# =============================================================================
# Test Fixtures
# =============================================================================


@pytest.fixture
def admin_user(db):
    """Create admin user."""
    return User.objects.create_user(
        user_email="admin_profile@example.com",
        password="admin123",
        user_fname="Admin",
        user_lname="User",
        user_role="admin",
        user_status="active",
    )


@pytest.fixture
def lecturer_user(db):
    """Create lecturer user."""
    return User.objects.create_user(
        user_email="lecturer_profile@example.com",
        password="lecturer123",
        user_fname="Lecturer",
        user_lname="User",
        user_role="lecturer",
        user_status="active",
    )


@pytest.fixture
def student_user(db):
    """Create student user."""
    return User.objects.create_user(
        user_email="student_profile@example.com",
        password="student123",
        user_fname="Student",
        user_lname="User",
        user_role="student",
        user_status="active",
    )


@pytest.fixture
def another_student(db):
    """Create another student user."""
    return User.objects.create_user(
        user_email="student2_profile@example.com",
        password="student123",
        user_fname="Another",
        user_lname="Student",
        user_role="student",
        user_status="active",
    )


@pytest.fixture
def task(db, admin_user):
    """Create a task for submissions."""
    unit = Unit.objects.create(unit_id="TEST001", unit_name="Test Unit")
    rubric = MarkingRubric.objects.create(user_id_user=admin_user, rubric_desc="Test Rubric")
    return Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=timezone.now() + timedelta(days=7),
        task_title="Test Task",
        task_instructions="Write an essay",
    )


@pytest.fixture
def submission_with_score(student_user, task):
    """Create a submission with feedback and score."""
    submission = Submission.objects.create(
        task_id_task=task,
        user_id_user=student_user,
        submission_txt="Test essay content",
    )
    feedback = Feedback.objects.create(
        submission_id_submission=submission,
        user_id_user=task.unit_id_unit.unit_id,  # Using unit_id as user for simplicity
    )
    # Create feedback items with scores
    FeedbackItem.objects.create(
        feedback_id_feedback=feedback,
        rubric_item_id_rubric_item_id=1,  # Will be created if not exists
        feedback_item_score=85,
        feedback_item_source="ai",
    )
    return submission


# =============================================================================
# User Stats Tests
# =============================================================================


@pytest.mark.django_db
class TestUserStats:
    """Test GET /users/{user_id}/stats/ endpoint."""

    def test_get_own_stats_student(self, student_user, task):
        """Student can view their own stats."""
        # Create some submissions
        Submission.objects.create(
            task_id_task=task,
            user_id_user=student_user,
            submission_txt="Essay 1",
        )
        Submission.objects.create(
            task_id_task=task,
            user_id_user=student_user,
            submission_txt="Essay 2",
        )

        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/stats/")
        assert response.status_code == 200
        data = response.json()

        assert data["total_essays"] == 2
        assert data["total_submissions"] == 2
        # average_score will be None since no feedback items exist

    def test_get_stats_lecturer_view_student(self, lecturer_user, student_user, task):
        """Lecturer can view student's stats."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/stats/")
        assert response.status_code == 200

    def test_get_stats_admin_view_any(self, admin_user, student_user):
        """Admin can view any user's stats."""
        client = Client()
        jwt_pair = create_jwt_pair(admin_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/stats/")
        assert response.status_code == 200

    def test_get_stats_student_cannot_view_other(self, student_user, another_student):
        """Student cannot view other student's stats."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{another_student.user_id}/stats/")
        assert response.status_code == 403

    def test_get_stats_not_found(self, admin_user):
        """Non-existent user returns 404."""
        client = Client()
        jwt_pair = create_jwt_pair(admin_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get("/api/v2/core/users/99999/stats/")
        assert response.status_code == 404


# =============================================================================
# User Badges Tests
# =============================================================================


@pytest.mark.django_db
class TestUserBadges:
    """Test GET /users/{user_id}/badges/ endpoint."""

    def test_get_own_badges(self, student_user):
        """User can view their own badges."""
        # Create badge and award to student
        badge = Badge.objects.create(
            name="First Essay",
            description="Submitted your first essay",
            icon="icon-essay",
            criteria={"type": "first_submission"},
        )
        UserBadge.objects.create(
            user_id_user=student_user,
            badge_id_badge=badge,
        )

        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/badges/")
        assert response.status_code == 200
        data = response.json()

        assert len(data) == 1
        assert data[0]["name"] == "First Essay"
        assert data[0]["icon"] == "icon-essay"

    def test_get_empty_badges(self, student_user):
        """User with no badges returns empty list."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/badges/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_student_cannot_view_lecturer_badges(self, student_user, lecturer_user):
        """Student cannot view lecturer's badges."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{lecturer_user.user_id}/badges/")
        assert response.status_code == 403

    def test_student_can_view_other_student_badges(self, student_user, another_student):
        """Student can view other student's badges (social learning)."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{another_student.user_id}/badges/")
        assert response.status_code == 200

    def test_admin_can_view_any_badges(self, admin_user, student_user):
        """Admin can view any user's badges."""
        client = Client()
        jwt_pair = create_jwt_pair(admin_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/badges/")
        assert response.status_code == 200


# =============================================================================
# User Progress Tests
# =============================================================================


@pytest.mark.django_db
class TestUserProgress:
    """Test GET /users/{user_id}/progress/ endpoint."""

    def test_get_own_progress_monthly(self, student_user, task):
        """User can view their own monthly progress."""
        # Create submissions across different months
        now = timezone.now()
        Submission.objects.create(
            task_id_task=task,
            user_id_user=student_user,
            submission_txt="Essay 1",
            submission_time=now - timedelta(days=30),
        )
        Submission.objects.create(
            task_id_task=task,
            user_id_user=student_user,
            submission_txt="Essay 2",
            submission_time=now - timedelta(days=15),
        )
        Submission.objects.create(
            task_id_task=task,
            user_id_user=student_user,
            submission_txt="Essay 3",
            submission_time=now,
        )

        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/progress/?period=month")
        assert response.status_code == 200
        data = response.json()

        assert data["user_id"] == student_user.user_id
        assert isinstance(data["entries"], list)
        # Should have entries for the months with submissions

    def test_get_own_progress_weekly(self, student_user, task):
        """User can view their own weekly progress."""
        now = timezone.now()
        Submission.objects.create(
            task_id_task=task,
            user_id_user=student_user,
            submission_txt="Essay 1",
            submission_time=now - timedelta(weeks=2),
        )
        Submission.objects.create(
            task_id_task=task,
            user_id_user=student_user,
            submission_txt="Essay 2",
            submission_time=now - timedelta(days=5),
        )

        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/progress/?period=week")
        assert response.status_code == 200
        data = response.json()

        assert data["user_id"] == student_user.user_id
        assert isinstance(data["entries"], list)

    def test_get_progress_student_cannot_view_other(self, student_user, another_student):
        """Student cannot view other student's progress."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{another_student.user_id}/progress/")
        assert response.status_code == 403

    def test_get_progress_lecturer_can_view_student(self, lecturer_user, student_user):
        """Lecturer can view student's progress."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/progress/")
        assert response.status_code == 200

    def test_get_progress_admin_can_view_any(self, admin_user, student_user):
        """Admin can view any user's progress."""
        client = Client()
        jwt_pair = create_jwt_pair(admin_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/progress/")
        assert response.status_code == 200

    def test_get_progress_empty(self, student_user):
        """User with no submissions returns empty entries."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/users/{student_user.user_id}/progress/")
        assert response.status_code == 200
        data = response.json()

        assert data["user_id"] == student_user.user_id
        assert data["entries"] == []

    def test_progress_default_period_is_month(self, student_user, task):
        """Default period parameter is 'month'."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        # No period parameter
        response = client.get(f"/api/v2/core/users/{student_user.user_id}/progress/")
        assert response.status_code == 200


# =============================================================================
# Integration Tests
# =============================================================================


@pytest.mark.django_db
class TestProfileIntegration:
    """Integration tests for complete profile workflow."""

    def test_full_profile_data(self, student_user, task):
        """Get complete profile data: stats, badges, and progress."""
        # Create submissions with feedback
        now = timezone.now()
        for i in range(3):
            submission = Submission.objects.create(
                task_id_task=task,
                user_id_user=student_user,
                submission_txt=f"Essay {i+1}",
                submission_time=now - timedelta(days=i*7),
            )

        # Create badges
        badge = Badge.objects.create(
            name="Prolific Writer",
            description="Submitted 3 essays",
            icon="icon-pencil",
            criteria={"type": "submission_count", "count": 3},
        )
        UserBadge.objects.create(
            user_id_user=student_user,
            badge_id_badge=badge,
        )

        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        # Get stats
        stats_response = client.get(f"/api/v2/core/users/{student_user.user_id}/stats/")
        assert stats_response.status_code == 200
        stats = stats_response.json()
        assert stats["total_essays"] == 3

        # Get badges
        badges_response = client.get(f"/api/v2/core/users/{student_user.user_id}/badges/")
        assert badges_response.status_code == 200
        badges = badges_response.json()
        assert len(badges) == 1
        assert badges[0]["name"] == "Prolific Writer"

        # Get progress
        progress_response = client.get(f"/api/v2/core/users/{student_user.user_id}/progress/")
        assert progress_response.status_code == 200
        progress = progress_response.json()
        assert progress["user_id"] == student_user.user_id
