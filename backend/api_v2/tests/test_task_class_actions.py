"""
Test Task and Class action endpoints.
Run with: uv run pytest api_v2/tests/test_task_class_actions.py -v
"""

from datetime import datetime, timedelta

import pytest
from django.test import Client

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import Class, Enrollment, MarkingRubric, Submission, Task, Unit, User

# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def lecturer(db):
    """Create a lecturer user."""
    return User.objects.create_user(
        user_email="lecturer_test@example.com",
        password="LecturerPass123!",
        user_role="lecturer",
    )


@pytest.fixture
def student(db):
    """Create a student user."""
    return User.objects.create_user(
        user_email="student_test@example.com",
        password="StudentPass123!",
        user_role="student",
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_user(
        user_email="admin_test@example.com",
        password="AdminPass123!",
        user_role="admin",
    )


@pytest.fixture
def unit(db):
    """Create a unit."""
    return Unit.objects.create(
        unit_id="CS101",
        unit_name="Introduction to Computer Science",
        unit_desc="Basic CS course",
    )


@pytest.fixture
def rubric(db, lecturer):
    """Create a marking rubric."""
    return MarkingRubric.objects.create(
        user_id_user=lecturer,
        rubric_desc="Standard essay grading rubric",
    )


@pytest.fixture
def class_obj(db, unit, lecturer):
    """Create a class with join code."""
    return Class.objects.create(
        unit_id_unit=unit,
        class_name="CS101 Class A",
        class_desc="Test class",
        class_join_code="TEST001",
        class_term="semester1",
        class_year=2026,
        class_status="active",
    )


@pytest.fixture
def task_draft(db, unit, rubric, class_obj):
    """Create a draft task."""
    return Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_title="Test Essay",
        task_desc="Write an essay",
        task_instructions="Submit your essay here",
        task_due_datetime=datetime.now() + timedelta(days=7),
        class_id_class=class_obj,
        task_status="draft",
    )


@pytest.fixture
def task_published(db, unit, rubric, class_obj):
    """Create a published task."""
    return Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_title="Published Essay",
        task_desc="Write an essay",
        task_instructions="Submit your essay here",
        task_due_datetime=datetime.now() + timedelta(days=7),
        class_id_class=class_obj,
        task_status="published",
    )


@pytest.fixture
def submission(db, task_published, student):
    """Create a submission for a task."""
    return Submission.objects.create(
        task_id_task=task_published,
        user_id_user=student,
        submission_txt="This is my essay submission.",
    )


# =============================================================================
# Task Publish Tests
# =============================================================================


@pytest.mark.django_db
def test_publish_task_lecturer_can_publish(lecturer, task_draft):
    """Test that lecturer can publish a task."""
    jwt_pair = create_jwt_pair(lecturer)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post(f"/api/v2/core/tasks/{task_draft.task_id}/publish/")

    assert response.status_code == 200

    # Verify task was published by checking database
    task_draft.refresh_from_db()
    assert task_draft.task_status == "published"


@pytest.mark.django_db
def test_publish_task_admin_can_publish(admin_user, task_draft):
    """Test that admin can publish a task."""
    jwt_pair = create_jwt_pair(admin_user)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post(f"/api/v2/core/tasks/{task_draft.task_id}/publish/")

    assert response.status_code == 200
    # Verify task was published by checking database
    task_draft.refresh_from_db()
    assert task_draft.task_status == "published"


@pytest.mark.django_db
def test_publish_task_student_cannot_publish(student, task_draft):
    """Test that student cannot publish a task."""
    jwt_pair = create_jwt_pair(student)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post(f"/api/v2/core/tasks/{task_draft.task_id}/publish/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_publish_task_unauthenticated():
    """Test that unauthenticated user cannot publish a task."""
    client = Client()

    response = client.post("/api/v2/core/tasks/1/publish/")

    assert response.status_code == 401


@pytest.mark.django_db
def test_publish_task_not_found(lecturer):
    """Test publishing non-existent task returns 404."""
    jwt_pair = create_jwt_pair(lecturer)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post("/api/v2/core/tasks/99999/publish/")

    assert response.status_code == 404


# =============================================================================
# Task Unpublish Tests
# =============================================================================


@pytest.mark.django_db
def test_unpublish_task_lecturer_can_unpublish(lecturer, task_published):
    """Test that lecturer can unpublish a task."""
    jwt_pair = create_jwt_pair(lecturer)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post(f"/api/v2/core/tasks/{task_published.task_id}/unpublish/")

    assert response.status_code == 200
    # Verify task was unpublished by checking database
    task_published.refresh_from_db()
    assert task_published.task_status == "unpublished"


@pytest.mark.django_db
def test_unpublish_task_student_cannot_unpublish(student, task_published):
    """Test that student cannot unpublish a task."""
    jwt_pair = create_jwt_pair(student)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post(f"/api/v2/core/tasks/{task_published.task_id}/unpublish/")

    assert response.status_code == 403


# =============================================================================
# Task Submissions Tests
# =============================================================================


@pytest.mark.django_db
def test_get_task_submissions_lecturer_can_view_all(lecturer, task_published, submission):
    """Test that lecturer can view all submissions for a task."""
    jwt_pair = create_jwt_pair(lecturer)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.get(f"/api/v2/core/tasks/{task_published.task_id}/submissions/")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["submission_id"] == submission.submission_id


@pytest.mark.django_db
def test_get_task_submissions_student_sees_own_only(student, task_published, submission):
    """Test that student only sees their own submissions."""
    # Create another submission from different student
    other_student = User.objects.create_user(
        user_email="other_student@example.com",
        password="OtherPass123!",
        user_role="student",
    )
    Submission.objects.create(
        task_id_task=task_published,
        user_id_user=other_student,
        submission_txt="Another essay submission.",
    )

    jwt_pair = create_jwt_pair(student)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.get(f"/api/v2/core/tasks/{task_published.task_id}/submissions/")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["user_id_user"] == student.user_id


@pytest.mark.django_db
def test_get_task_submissions_unauthenticated(task_published):
    """Test that unauthenticated user cannot view submissions."""
    client = Client()

    response = client.get(f"/api/v2/core/tasks/{task_published.task_id}/submissions/")

    assert response.status_code == 401


# =============================================================================
# Join Class Tests
# =============================================================================


@pytest.mark.django_db
def test_join_class_by_code_student_can_join(student, class_obj):
    """Test that student can join a class with valid join code."""
    jwt_pair = create_jwt_pair(student)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post(f"/api/v2/core/classes/join/?join_code={class_obj.class_join_code}")

    assert response.status_code == 200
    data = response.json()
    assert data["class_id"] == class_obj.class_id

    # Verify enrollment was created
    assert Enrollment.objects.filter(user_id_user=student, class_id_class=class_obj).exists()


@pytest.mark.django_db
def test_join_class_invalid_code(student):
    """Test that invalid join code returns 404."""
    jwt_pair = create_jwt_pair(student)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post("/api/v2/core/classes/join/?join_code=INVALID")

    assert response.status_code == 404


@pytest.mark.django_db
def test_join_class_already_enrolled(student, class_obj):
    """Test that already enrolled student gets error."""
    # First enrollment
    Enrollment.objects.create(
        user_id_user=student,
        class_id_class=class_obj,
        unit_id_unit=class_obj.unit_id_unit,
    )

    jwt_pair = create_jwt_pair(student)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post(f"/api/v2/core/classes/join/?join_code={class_obj.class_join_code}")

    assert response.status_code == 400


@pytest.mark.django_db
def test_join_class_unauthenticated(class_obj):
    """Test that unauthenticated user cannot join class."""
    client = Client()

    response = client.post(f"/api/v2/core/classes/join/?join_code={class_obj.class_join_code}")

    assert response.status_code == 401


# =============================================================================
# Get Class Students Tests
# =============================================================================


@pytest.mark.django_db
def test_get_class_students(lecturer, class_obj, student):
    """Test that lecturer can get list of students in a class."""
    # Enroll student
    Enrollment.objects.create(
        user_id_user=student,
        class_id_class=class_obj,
        unit_id_unit=class_obj.unit_id_unit,
    )

    jwt_pair = create_jwt_pair(lecturer)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.get(f"/api/v2/core/classes/{class_obj.class_id}/students/")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["user_id"] == student.user_id


@pytest.mark.django_db
def test_get_class_students_not_found(lecturer):
    """Test that non-existent class returns 404."""
    jwt_pair = create_jwt_pair(lecturer)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.get("/api/v2/core/classes/99999/students/")

    assert response.status_code == 404


@pytest.mark.django_db
def test_get_class_students_unauthenticated(class_obj):
    """Test that unauthenticated user cannot get students."""
    client = Client()

    response = client.get(f"/api/v2/core/classes/{class_obj.class_id}/students/")

    assert response.status_code == 401


# =============================================================================
# Archive Class Tests
# =============================================================================


@pytest.mark.django_db
def test_archive_class_lecturer_can_archive(lecturer, class_obj):
    """Test that lecturer can archive a class."""
    jwt_pair = create_jwt_pair(lecturer)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post(f"/api/v2/core/classes/{class_obj.class_id}/archive/")

    assert response.status_code == 200
    # Verify class was archived by checking database directly
    class_obj.refresh_from_db()
    assert class_obj.class_status == "archived"


@pytest.mark.django_db
def test_archive_class_student_cannot_archive(student, class_obj):
    """Test that student cannot archive a class."""
    jwt_pair = create_jwt_pair(student)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post(f"/api/v2/core/classes/{class_obj.class_id}/archive/")

    # Should return 403 Forbidden
    assert response.status_code == 403


@pytest.mark.django_db
def test_archive_class_not_found(lecturer):
    """Test that archiving non-existent class returns 404."""
    jwt_pair = create_jwt_pair(lecturer)
    auth_token = jwt_pair.access

    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {auth_token}"

    response = client.post("/api/v2/core/classes/99999/archive/")

    assert response.status_code == 404


@pytest.mark.django_db
def test_archive_class_unauthenticated(class_obj):
    """Test that unauthenticated user cannot archive class."""
    client = Client()

    response = client.post(f"/api/v2/core/classes/{class_obj.class_id}/archive/")

    assert response.status_code == 401
