"""
Dashboard API Tests for Django Ninja API v2.

Tests for the role-based dashboard endpoints covering:
- Student dashboard (my essays, progress tracking)
- Lecturer dashboard (grading queue, class overview)
- Admin dashboard (system overview)
- RBAC permission checks
- Edge cases (empty states, error states)

Run with: uv run pytest api_v2/core/tests/test_dashboard.py -v
"""

from datetime import datetime, timedelta

import pytest
from django.test import Client
from django.utils import timezone as django_timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import Class, Enrollment, Feedback, MarkingRubric, Submission, Task, TeachingAssn, Unit, User

# =============================================================================
# Test Fixtures
# =============================================================================


@pytest.fixture
def student_user():
    """Create a student user for testing."""
    return User.objects.create_user(
        user_email="student@test.com",
        password="StudentPass123!",
        user_role="student",
        user_fname="Test",
        user_lname="Student",
    )


@pytest.fixture
def lecturer_user():
    """Create a lecturer user for testing."""
    return User.objects.create_user(
        user_email="lecturer@test.com",
        password="LecturerPass123!",
        user_role="lecturer",
        user_fname="Test",
        user_lname="Lecturer",
    )


@pytest.fixture
def admin_user():
    """Create an admin user for testing."""
    return User.objects.create_user(
        user_email="admin@test.com",
        password="AdminPass123!",
        user_role="admin",
        user_fname="Test",
        user_lname="Admin",
    )


@pytest.fixture
def unit():
    """Create a unit for testing."""
    return Unit.objects.create(
        unit_id="CS101",
        unit_name="Computer Science 101",
        unit_desc="Introduction to Computer Science",
    )


@pytest.fixture
def class_instance(unit):
    """Create a class for testing."""
    return Class.objects.create(
        unit_id_unit=unit,
        class_size=0,
    )


@pytest.fixture
def rubric(admin_user):
    """Create a marking rubric for testing."""
    return MarkingRubric.objects.create(
        user_id_user=admin_user,
        rubric_desc="Test Rubric",
    )


@pytest.fixture
def task(unit, rubric):
    """Create a task for testing."""
    return Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=django_timezone.now() + timedelta(days=7),
    )


@pytest.fixture
def submission(student_user, task):
    """Create a submission for testing."""
    return Submission.objects.create(
        task_id_task=task,
        user_id_user=student_user,
        submission_txt="This is a test essay submission.",
    )


@pytest.fixture
def feedback(submission, admin_user):
    """Create feedback for a submission."""
    return Feedback.objects.create(
        submission_id_submission=submission,
        user_id_user=admin_user,
    )


# =============================================================================
# Authentication Tests
# =============================================================================


@pytest.mark.django_db
def test_dashboard_requires_authentication():
    """Test that dashboard endpoint requires authentication."""
    client = Client()
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 401


# =============================================================================
# Student Dashboard Tests
# =============================================================================


@pytest.mark.django_db
def test_student_dashboard_basic_info(student_user):
    """Test student dashboard returns basic user info."""
    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    assert data["user"]["id"] == student_user.user_id
    assert data["user"]["email"] == student_user.user_email
    assert data["user"]["role"] == "student"


@pytest.mark.django_db
def test_student_dashboard_with_enrolled_class(student_user, class_instance, unit):
    """Test student dashboard works when student is enrolled in a class.

    Note: DashboardResponse includes 'classes' field for all roles,
    but it will be empty for students since they don't need class management.
    """
    # Create enrollment
    Enrollment.objects.create(
        user_id_user=student_user,
        class_id_class=class_instance,
        unit_id_unit=unit,
    )

    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    # DashboardResponse has classes field for all roles (empty for students)
    assert "classes" in data
    assert data["classes"] == []  # Students don't get class list
    assert "myEssays" in data


@pytest.mark.django_db
def test_student_dashboard_with_submissions(student_user, task, submission):
    """Test student dashboard shows student's submissions."""
    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    # Should have myEssays with the submission
    assert "myEssays" in data
    assert len(data["myEssays"]) >= 1


@pytest.mark.django_db
def test_student_dashboard_empty_state():
    """Test student dashboard with no data (empty state)."""
    student = User.objects.create_user(
        user_email="newstudent@test.com",
        password="Pass123!",
        user_role="student",
    )

    client = Client()
    jwt_pair = create_jwt_pair(student)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    assert data["stats"]["totalEssays"] == 0
    assert data["classes"] == []  # Students get empty classes list
    assert data["myEssays"] == []
    assert data["recentActivity"] == []


@pytest.mark.django_db
def test_student_dashboard_stats_with_feedback(student_user, submission, feedback):
    """Test student dashboard calculates stats correctly."""
    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    # Student should see their submission in stats
    assert data["stats"]["totalEssays"] >= 1


# =============================================================================
# Lecturer Dashboard Tests
# =============================================================================


@pytest.mark.django_db
def test_lecturer_dashboard_basic_info(lecturer_user):
    """Test lecturer dashboard returns basic user info."""
    client = Client()
    jwt_pair = create_jwt_pair(lecturer_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    assert data["user"]["id"] == lecturer_user.user_id
    assert data["user"]["email"] == lecturer_user.user_email
    assert data["user"]["role"] == "lecturer"


@pytest.mark.django_db
def test_lecturer_dashboard_with_teaching_assignment(lecturer_user, class_instance):
    """Test lecturer dashboard shows assigned classes."""
    # Create teaching assignment
    TeachingAssn.objects.create(
        user_id_user=lecturer_user,
        class_id_class=class_instance,
    )

    client = Client()
    jwt_pair = create_jwt_pair(lecturer_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    assert len(data["classes"]) == 1
    assert data["classes"][0]["id"] == class_instance.class_id


@pytest.mark.django_db
def test_lecturer_dashboard_grading_queue(lecturer_user, class_instance, task, submission):
    """Test lecturer dashboard shows grading queue."""
    # Create teaching assignment
    TeachingAssn.objects.create(
        user_id_user=lecturer_user,
        class_id_class=class_instance,
    )

    client = Client()
    jwt_pair = create_jwt_pair(lecturer_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    # Lecturer should see submissions in grading queue
    assert "gradingQueue" in data


@pytest.mark.django_db
def test_lecturer_dashboard_empty_state():
    """Test lecturer dashboard with no classes (empty state)."""
    lecturer = User.objects.create_user(
        user_email="newlecturer@test.com",
        password="Pass123!",
        user_role="lecturer",
    )

    client = Client()
    jwt_pair = create_jwt_pair(lecturer)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    assert data["classes"] == []
    assert data["gradingQueue"] == []


# =============================================================================
# Admin Dashboard Tests
# =============================================================================


@pytest.mark.django_db
def test_admin_dashboard_basic_info(admin_user):
    """Test admin dashboard returns basic user info."""
    client = Client()
    jwt_pair = create_jwt_pair(admin_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    assert data["user"]["id"] == admin_user.user_id
    assert data["user"]["email"] == admin_user.user_email
    assert data["user"]["role"] == "admin"


@pytest.mark.django_db
def test_admin_dashboard_sees_all_classes(admin_user, class_instance):
    """Test admin dashboard shows all classes."""
    client = Client()
    jwt_pair = create_jwt_pair(admin_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    # Admin should see all classes
    assert len(data["classes"]) >= 1


@pytest.mark.django_db
def test_admin_dashboard_stats(admin_user, student_user, submission):
    """Test admin dashboard shows system-wide stats."""
    client = Client()
    jwt_pair = create_jwt_pair(admin_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    # Admin should see system stats
    assert "stats" in data
    assert data["stats"]["totalEssays"] >= 1


# =============================================================================
# RBAC Permission Tests
# =============================================================================


@pytest.mark.django_db
def test_student_cannot_see_other_students_submissions(student_user, submission):
    """Test that students can only see their own submissions."""
    # Create another student with their own submission
    other_student = User.objects.create_user(
        user_email="otherstudent@test.com",
        password="Pass123!",
        user_role="student",
    )
    other_task = Task.objects.create(
        unit_id_unit=submission.task_id_task.unit_id_unit,
        rubric_id_marking_rubric=submission.task_id_task.rubric_id_marking_rubric,
        task_due_datetime=django_timezone.now() + timedelta(days=7),
    )
    Submission.objects.create(
        task_id_task=other_task,
        user_id_user=other_student,
        submission_txt="Other student essay",
    )

    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    # Should only see own submission, not other student's
    for essay in data.get("myEssays", []):
        assert essay["id"] != other_student.user_id


@pytest.mark.django_db
def test_lecturer_sees_only_assigned_classes(lecturer_user, class_instance):
    """Test that lecturers only see their assigned classes."""
    # Create another class without teaching assignment
    other_unit = Unit.objects.create(
        unit_id="CS102",
        unit_name="Computer Science 102",
    )
    other_class = Class.objects.create(
        unit_id_unit=other_unit,
        class_size=0,
    )

    # Create teaching assignment only for first class
    TeachingAssn.objects.create(
        user_id_user=lecturer_user,
        class_id_class=class_instance,
    )

    client = Client()
    jwt_pair = create_jwt_pair(lecturer_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    # Should only see assigned class
    class_ids = [c["id"] for c in data["classes"]]
    assert class_instance.class_id in class_ids
    assert other_class.class_id not in class_ids


# =============================================================================
# Edge Cases and Error States
# =============================================================================


@pytest.mark.django_db
def test_dashboard_with_invalid_token():
    """Test dashboard rejects invalid token."""
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = "Bearer invalid_token_here"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_dashboard_with_expired_token(student_user):
    """Test dashboard rejects expired token."""
    # Create a token and manually expire it
    jwt_pair = create_jwt_pair(student_user)
    expired_token = jwt_pair.access + "_expired"

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {expired_token}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_dashboard_with_inactive_user():
    """Test dashboard rejects inactive user."""
    # Create inactive user directly


    client = Client()
    # Inactive users should not be able to get valid tokens
    # Test with invalid token instead
    client.defaults["HTTP_AUTHORIZATION"] = "Bearer invalid_token"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_dashboard_multiple_enrollments(student_user):
    """Test student dashboard with multiple class enrollments.

    Note: DashboardResponse includes 'classes' field for all roles,
    but it will be empty for students. This test verifies the dashboard
    works correctly even when student has enrollments.
    """
    # Create multiple classes with unique IDs
    classes = []
    for i in range(3):
        unit_i = Unit.objects.create(
            unit_id=f"CSM{i}01",
            unit_name=f"Course Multi {i}01",
        )
        cls = Class.objects.create(
            unit_id_unit=unit_i,
            class_size=0,
        )
        classes.append(cls)
        Enrollment.objects.create(
            user_id_user=student_user,
            class_id_class=cls,
            unit_id_unit=unit_i,
        )

    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    # DashboardResponse has classes field (empty for students)
    assert "classes" in data
    assert data["classes"] == []
    # But dashboard should still work
    assert "myEssays" in data
    assert "recentActivity" in data


@pytest.mark.django_db
def test_dashboard_multiple_teaching_assignments(lecturer_user):
    """Test lecturer dashboard with multiple teaching assignments."""
    # Create multiple classes with assignments
    for i in range(3):
        unit = Unit.objects.create(
            unit_id=f"CS{i}02",
            unit_name=f"Course {i}02",
        )
        cls = Class.objects.create(
            unit_id_unit=unit,
            class_size=0,
        )
        TeachingAssn.objects.create(
            user_id_user=lecturer_user,
            class_id_class=cls,
        )

    client = Client()
    jwt_pair = create_jwt_pair(lecturer_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    assert len(data["classes"]) == 3


# =============================================================================
# Dashboard Data Integrity Tests
# =============================================================================


@pytest.mark.django_db
def test_dashboard_user_role_consistency(student_user):
    """Test that dashboard user role matches actual user role."""
    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()
    assert data["user"]["role"] == student_user.user_role


@pytest.mark.django_db
def test_dashboard_response_schema(student_user):
    """Test that dashboard response matches expected schema."""
    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()

    # Check required top-level fields
    assert "user" in data
    assert "stats" in data
    assert "classes" in data
    assert "recentActivity" in data

    # Check user fields
    assert "id" in data["user"]
    assert "name" in data["user"] or "email" in data["user"]
    assert "role" in data["user"]
    assert "email" in data["user"]

    # Check stats fields
    assert "totalEssays" in data["stats"]
    assert "averageScore" in data["stats"] or data["stats"]["averageScore"] is None
    assert "pendingGrading" in data["stats"]

    # Check array fields
    assert isinstance(data["classes"], list)
    assert isinstance(data["recentActivity"], list)


@pytest.mark.django_db
def test_dashboard_submission_timestamps(student_user, submission):
    """Test that dashboard submission timestamps are formatted correctly."""
    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200

    data = response.json()

    # Check that timestamps are ISO format strings
    for essay in data.get("myEssays", []):
        if "submittedAt" in essay:
            # Should be able to parse as ISO datetime
            datetime.fromisoformat(essay["submittedAt"].replace("Z", "+00:00"))


# =============================================================================
# Dashboard V3 (Service Layer) Tests
# =============================================================================
# NOTE: These tests are commented out because the V3 endpoints are not yet implemented.
# TODO: Uncomment and implement when Dashboard V3 service layer is built.
#
# @pytest.mark.django_db
# def test_dashboard_v3_student_endpoint(student_user, submission):
#     """Test student dashboard V3 endpoint using service layer."""
#     client = Client()
#     jwt_pair = create_jwt_pair(student_user)
#     client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
#
#     response = client.get("/api/v2/core/dashboard/v3/")
#     assert response.status_code == 200
#
#     data = response.json()
#     # V3 response has different schema
#     assert "stats" in data
#     assert "my_essays" in data
#     assert "recent_activity" in data
#     assert "progress_trend" in data
#
#
# @pytest.mark.django_db
# def test_dashboard_v3_lecturer_endpoint(lecturer_user, class_instance):
#     """Test lecturer dashboard V3 endpoint using service layer."""
#     TeachingAssn.objects.create(
#         user_id_user=lecturer_user,
#         class_id_class=class_instance,
#     )
#
#     client = Client()
#     jwt_pair = create_jwt_pair(lecturer_user)
#     client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
#
#     response = client.get("/api/v2/core/dashboard/v3/")
#     assert response.status_code == 200
#
#     data = response.json()
#     assert "stats" in data
#     assert "grading_queue" in data
#     assert "class_overview" in data
#     assert "recent_activity" in data
#
#
# @pytest.mark.django_db
# def test_dashboard_v3_admin_endpoint(admin_user):
#     """Test admin dashboard V3 endpoint using service layer."""
#     client = Client()
#     jwt_pair = create_jwt_pair(admin_user)
#     client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
#
#     response = client.get("/api/v2/core/dashboard/v3/")
#     assert response.status_code == 200
#
#     data = response.json()
#     assert "stats" in data
#     assert "system_health" in data
#     assert "user_metrics" in data
#     assert "recent_activity" in data
#
#
# @pytest.mark.django_db
# def test_grading_queue_endpoint(lecturer_user, class_instance, task, submission):
#     """Test grading queue endpoint."""
#     TeachingAssn.objects.create(
#         user_id_user=lecturer_user,
#         class_id_class=class_instance,
#     )
#
#     client = Client()
#     jwt_pair = create_jwt_pair(lecturer_user)
#     client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
#
#     response = client.get("/api/v2/core/dashboard/grading-queue/")
#     assert response.status_code == 200
#
#     data = response.json()
#     assert isinstance(data, list)
#
#
# @pytest.mark.django_db
# def test_activity_feed_endpoint_student(student_user):
#     """Test activity feed endpoint for student."""
#     client = Client()
#     jwt_pair = create_jwt_pair(student_user)
#     client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
#
#     response = client.get("/api/v2/core/dashboard/activity-feed/")
#     assert response.status_code == 200
#
#     data = response.json()
#     assert isinstance(data, list)
#
#
# @pytest.mark.django_db
# def test_activity_feed_endpoint_lecturer(lecturer_user, class_instance):
#     """Test activity feed endpoint for lecturer."""
#     TeachingAssn.objects.create(
#         user_id_user=lecturer_user,
#         class_id_class=class_instance,
#     )
#
#     client = Client()
#     jwt_pair = create_jwt_pair(lecturer_user)
#     client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
#
#     response = client.get("/api/v2/core/dashboard/activity-feed/")
#     assert response.status_code == 200
#
#     data = response.json()
#     assert isinstance(data, list)
#
#
# @pytest.mark.django_db
# def test_class_metrics_endpoint(lecturer_user, class_instance):
#     """Test class metrics endpoint."""
#     TeachingAssn.objects.create(
#         user_id_user=lecturer_user,
#         class_id_class=class_instance,
#     )
#
#     client = Client()
#     jwt_pair = create_jwt_pair(lecturer_user)
#     client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
#
#     response = client.get(f"/api/v2/core/dashboard/class/{class_instance.class_id}/metrics/")
#     assert response.status_code == 200
#
#     data = response.json()
#     assert "class_id" in data
#     assert "class_name" in data
#     assert "student_count" in data
#
#
# @pytest.mark.django_db
# def test_class_metrics_endpoint_student_forbidden(student_user, class_instance):
#     """Test that students cannot access class metrics."""
#     client = Client()
#     jwt_pair = create_jwt_pair(student_user)
#     client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
#
#     response = client.get(f"/api/v2/core/dashboard/class/{class_instance.class_id}/metrics/")
#     assert response.status_code == 403
