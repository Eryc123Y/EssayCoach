"""
CRUD tests for Tasks and Classes with new fields.
Tests cover create/read/update/delete operations with the extended field sets.
"""

import pytest
from datetime import timedelta
from django.utils import timezone
from core.models import Task, Class, Unit, MarkingRubric, Enrollment, User
from api_v2.utils.jwt_auth import create_jwt_pair


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_user(
        user_email="admin_crud@example.com",
        password="AdminPass123!",
        user_role="admin",
    )


@pytest.fixture
def student(db):
    """Create a student user."""
    return User.objects.create_user(
        user_email="student_crud@example.com",
        password="StudentPass123!",
        user_role="student",
    )


@pytest.fixture
def admin_token(admin_user):
    """Create JWT token for admin."""
    tokens = create_jwt_pair(admin_user)
    return tokens.access


@pytest.fixture
def student_token(student):
    """Create JWT token for student."""
    tokens = create_jwt_pair(student)
    return tokens.access


# =============================================================================
# Task CRUD Tests
# =============================================================================


@pytest.mark.django_db
def test_create_task_with_all_fields(client, admin_token, admin_user):
    """Admin can create task with all new fields."""
    unit = Unit.objects.create(unit_id="TEST001", unit_name="Test Unit")
    rubric = MarkingRubric.objects.create(
        rubric_id=1, user_id_user=admin_user, rubric_desc="Description"
    )

    payload = {
        "unit_id_unit": "TEST001",
        "rubric_id_marking_rubric": 1,
        "task_due_datetime": (timezone.now() + timedelta(days=7)).isoformat(),
        "task_title": "Test Essay",
        "task_desc": "Write a 500-word essay",
        "task_instructions": "Use APA format",
        "class_id_class": None,
        "task_status": "draft",
        "task_allow_late_submission": True,
    }

    response = client.post(
        "/api/v2/core/tasks/", payload, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {admin_token}"
    )
    assert response.status_code == 200
    data = response.json()

    assert data["task_title"] == "Test Essay"
    assert data["task_desc"] == "Write a 500-word essay"
    assert data["task_instructions"] == "Use APA format"
    assert data["task_status"] == "draft"
    assert data["task_allow_late_submission"] == True

    Task.objects.filter(task_title="Test Essay").delete()


@pytest.mark.django_db
def test_update_task_all_fields(client, admin_token, admin_user):
    """Admin can update all task fields."""
    unit = Unit.objects.create(unit_id="TEST002", unit_name="Test Unit 2")
    rubric = MarkingRubric.objects.create(
        rubric_id=2, user_id_user=admin_user, rubric_desc="Description 2"
    )
    task = Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=timezone.now() + timedelta(days=7),
        task_title="Original Title",
        task_desc="Original desc",
        task_instructions="Original instructions",
        task_status="draft",
        task_allow_late_submission=False,
    )

    payload = {
        "unit_id_unit": "TEST002",
        "rubric_id_marking_rubric": 2,
        "task_due_datetime": (timezone.now() + timedelta(days=14)).isoformat(),
        "task_title": "Updated Title",
        "task_desc": "Updated description",
        "task_instructions": "Updated instructions",
        "task_status": "published",
        "task_allow_late_submission": True,
    }

    response = client.put(
        f"/api/v2/core/tasks/{task.task_id}/",
        payload,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {admin_token}",
    )
    assert response.status_code == 200
    data = response.json()

    assert data["task_title"] == "Updated Title"
    assert data["task_desc"] == "Updated description"
    assert data["task_status"] == "published"

    task.delete()


@pytest.mark.django_db
def test_task_filter_by_status(client, admin_token, admin_user):
    """Tasks can be filtered by status."""
    unit = Unit.objects.create(unit_id="TEST003", unit_name="Test Unit 3")
    rubric = MarkingRubric.objects.create(rubric_id=3, user_id_user=admin_user, rubric_desc="Test Rubric 3")
    Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=timezone.now() + timedelta(days=7),
        task_title="Draft Task",
        task_status="draft",
    )
    Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=timezone.now() + timedelta(days=7),
        task_title="Published Task",
        task_status="published",
    )

    response = client.get("/api/v2/core/tasks/?task_status=published", HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["task_title"] == "Published Task"

    Task.objects.filter(unit_id_unit=unit).delete()


@pytest.mark.django_db
def test_task_filter_by_title(client, admin_token, admin_user):
    """Tasks can be filtered by title search."""
    unit = Unit.objects.create(unit_id="TEST004", unit_name="Test Unit 4")
    rubric = MarkingRubric.objects.create(rubric_id=4, user_id_user=admin_user, rubric_desc="Test Rubric 4")
    Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=timezone.now() + timedelta(days=7),
        task_title="Essay on Climate Change",
        task_status="published",
    )
    Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=timezone.now() + timedelta(days=7),
        task_title="Essay on AI Ethics",
        task_status="published",
    )

    response = client.get("/api/v2/core/tasks/?task_title=Climate", HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert "Climate" in data[0]["task_title"]

    Task.objects.filter(unit_id_unit=unit).delete()


@pytest.mark.django_db
def test_student_cannot_create_task(client, student_token):
    """Students cannot create tasks."""
    payload = {
        "unit_id_unit": "TEST005",
        "rubric_id_marking_rubric": 5,
        "task_due_datetime": (timezone.now() + timedelta(days=7)).isoformat(),
        "task_title": "Student Attempt",
    }
    response = client.post(
        "/api/v2/core/tasks/", payload, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {student_token}"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_delete_task_admin(client, admin_token, admin_user):
    """Admin can delete tasks."""
    unit = Unit.objects.create(unit_id="TEST007", unit_name="Test Unit 7")
    rubric = MarkingRubric.objects.create(rubric_id=7, user_id_user=admin_user, rubric_desc="Test")
    task = Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=timezone.now() + timedelta(days=7),
        task_title="To Delete",
    )

    response = client.delete(f"/api/v2/core/tasks/{task.task_id}/", HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    assert response.status_code == 200

    assert not Task.objects.filter(task_id=task.task_id).exists()


# =============================================================================
# Class CRUD Tests
# =============================================================================


@pytest.mark.django_db
def test_create_class_with_all_fields(client, admin_token):
    """Admin can create class with all new fields."""
    unit = Unit.objects.create(unit_id="UNIT001", unit_name="Test Unit")

    payload = {
        "unit_id_unit": "UNIT001",
        "class_name": "English 101",
        "class_desc": "Introduction to Academic Writing",
        "class_join_code": "ENG101",
        "class_term": "fall",
        "class_year": 2026,
        "class_size": 0,
    }

    response = client.post(
        "/api/v2/core/classes/", payload, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {admin_token}"
    )
    assert response.status_code == 200
    data = response.json()

    assert data["class_name"] == "English 101"
    assert data["class_desc"] == "Introduction to Academic Writing"
    assert data["class_join_code"] == "ENG101"
    assert data["class_term"] == "fall"
    assert data["class_year"] == 2026

    Class.objects.filter(class_name="English 101").delete()


@pytest.mark.django_db
def test_update_class_all_fields(client, admin_token):
    """Admin can update all class fields."""
    unit = Unit.objects.create(unit_id="UNIT002", unit_name="Test Unit 2")
    class_obj = Class.objects.create(
        unit_id_unit=unit,
        class_name="Original Class",
        class_desc="Original desc",
        class_join_code="ORIG",
        class_term="spring",
        class_year=2025,
        class_size=0,
    )

    payload = {
        "unit_id_unit": "UNIT002",
        "class_name": "Updated Class",
        "class_desc": "Updated description",
        "class_join_code": "UPD",
        "class_term": "fall",
        "class_year": 2026,
        "class_size": 25,
    }

    response = client.put(
        f"/api/v2/core/classes/{class_obj.class_id}/",
        payload,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {admin_token}",
    )
    assert response.status_code == 200
    data = response.json()

    assert data["class_name"] == "Updated Class"
    assert data["class_join_code"] == "UPD"
    assert data["class_year"] == 2026

    class_obj.delete()


@pytest.mark.django_db
def test_class_filter_by_status(client, admin_token):
    """Classes can be filtered by status."""
    unit = Unit.objects.create(unit_id="UNIT003", unit_name="Test Unit 3")
    Class.objects.create(unit_id_unit=unit, class_name="Active Class", class_status="active")
    Class.objects.create(unit_id_unit=unit, class_name="Archived Class", class_status="archived")

    response = client.get("/api/v2/core/classes/?class_status=active", HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["class_name"] == "Active Class"

    Class.objects.filter(unit_id_unit=unit).delete()


@pytest.mark.django_db
def test_class_filter_by_name(client, admin_token):
    """Classes can be filtered by name search."""
    unit = Unit.objects.create(unit_id="UNIT004", unit_name="Test Unit 4")
    Class.objects.create(unit_id_unit=unit, class_name="English Composition", class_status="active")
    Class.objects.create(unit_id_unit=unit, class_name="Creative Writing", class_status="active")

    response = client.get("/api/v2/core/classes/?class_name=English", HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert "English" in data[0]["class_name"]

    Class.objects.filter(unit_id_unit=unit).delete()


@pytest.mark.django_db
def test_get_my_classes_returns_new_fields(client, student_token, student):
    """get_my_classes endpoint returns new class fields."""
    unit = Unit.objects.create(unit_id="UNIT005", unit_name="Test Unit 5")
    class_obj = Class.objects.create(
        unit_id_unit=unit,
        class_name="Student Class",
        class_desc="Test class",
        class_join_code="STU005",
        class_term="fall",
        class_year=2026,
        class_status="active",
        class_size=1,
    )
    Enrollment.objects.create(user_id_user=student, class_id_class=class_obj, unit_id_unit=unit)

    response = client.get("/api/v2/core/users/me/classes/", HTTP_AUTHORIZATION=f"Bearer {student_token}")
    assert response.status_code == 200
    data = response.json()

    assert len(data) == 1
    cls = data[0]
    assert cls["class_name"] == "Student Class"
    assert cls["class_desc"] == "Test class"
    assert cls["class_join_code"] == "STU005"
    assert cls["class_term"] == "fall"
    assert cls["class_year"] == 2026
    assert cls["class_status"] == "active"

    class_obj.delete()


@pytest.mark.django_db
def test_leave_class_student(client, student_token, student):
    """Student can leave a class."""
    unit = Unit.objects.create(unit_id="UNIT006", unit_name="Test Unit 6")
    class_obj = Class.objects.create(
        unit_id_unit=unit,
        class_name="To Leave",
        class_size=1,
    )
    enrollment = Enrollment.objects.create(user_id_user=student, class_id_class=class_obj, unit_id_unit=unit)

    response = client.delete(
        f"/api/v2/core/classes/{class_obj.class_id}/leave/", HTTP_AUTHORIZATION=f"Bearer {student_token}"
    )
    assert response.status_code == 200

    assert not Enrollment.objects.filter(enrollment_id=enrollment.enrollment_id).exists()

    class_obj.refresh_from_db()
    assert class_obj.class_size == 0

    class_obj.delete()


@pytest.mark.django_db
def test_leave_class_lecturer_forbidden(client, admin_token):
    """Lecturer cannot leave a class (only students can)."""
    unit = Unit.objects.create(unit_id="UNIT007", unit_name="Test Unit 7")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="Test", class_size=0)

    response = client.delete(
        f"/api/v2/core/classes/{class_obj.class_id}/leave/", HTTP_AUTHORIZATION=f"Bearer {admin_token}"
    )
    assert response.status_code == 403

    class_obj.delete()


@pytest.mark.django_db
def test_leave_class_not_enrolled(client, student_token):
    """Student gets error if not enrolled in class."""
    unit = Unit.objects.create(unit_id="UNIT008", unit_name="Test Unit 8")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="Not Enrolled", class_size=0)

    response = client.delete(
        f"/api/v2/core/classes/{class_obj.class_id}/leave/", HTTP_AUTHORIZATION=f"Bearer {student_token}"
    )
    assert response.status_code == 400
    assert "Not enrolled" in response.json()["detail"]

    class_obj.delete()


@pytest.mark.django_db
def test_student_cannot_create_class(client, student_token):
    """Students cannot create classes."""
    payload = {
        "unit_id_unit": "UNIT009",
        "class_name": "Student Attempt",
    }
    response = client.post(
        "/api/v2/core/classes/", payload, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {student_token}"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_delete_class_admin(client, admin_token):
    """Admin can delete classes."""
    unit = Unit.objects.create(unit_id="UNIT011", unit_name="Test Unit 11")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="To Delete")

    response = client.delete(f"/api/v2/core/classes/{class_obj.class_id}/", HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    assert response.status_code == 200

    assert not Class.objects.filter(class_id=class_obj.class_id).exists()
