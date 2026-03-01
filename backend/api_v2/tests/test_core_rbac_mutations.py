from __future__ import annotations

from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import Class, MarkingRubric, Submission, Task, Unit, User


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        user_email="rbac_admin@example.com",
        password="AdminPass123!",
        user_role="admin",
    )


@pytest.fixture
def lecturer_user(db):
    return User.objects.create_user(
        user_email="rbac_lecturer@example.com",
        password="LecturerPass123!",
        user_role="lecturer",
    )


@pytest.fixture
def other_lecturer_user(db):
    return User.objects.create_user(
        user_email="rbac_other_lecturer@example.com",
        password="LecturerPass123!",
        user_role="lecturer",
    )


@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        user_email="rbac_student@example.com",
        password="StudentPass123!",
        user_role="student",
    )


@pytest.fixture
def other_student_user(db):
    return User.objects.create_user(
        user_email="rbac_other_student@example.com",
        password="StudentPass123!",
        user_role="student",
    )


@pytest.fixture
def admin_token(admin_user):
    return create_jwt_pair(admin_user).access


@pytest.fixture
def lecturer_token(lecturer_user):
    return create_jwt_pair(lecturer_user).access


@pytest.fixture
def other_lecturer_token(other_lecturer_user):
    return create_jwt_pair(other_lecturer_user).access


@pytest.fixture
def student_token(student_user):
    return create_jwt_pair(student_user).access


@pytest.fixture
def unit(db):
    return Unit.objects.create(unit_id="RBAC101", unit_name="RBAC Unit")


@pytest.fixture
def rubric(db, lecturer_user):
    return MarkingRubric.objects.create(user_id_user=lecturer_user, rubric_desc="RBAC Rubric", visibility="private")


@pytest.fixture
def class_obj(db, unit):
    return Class.objects.create(
        unit_id_unit=unit,
        class_name="RBAC Class",
        class_desc="RBAC Class Description",
        class_join_code="RBAC01",
        class_term="semester1",
        class_year=2026,
        class_size=0,
    )


@pytest.fixture
def task(db, unit, rubric, class_obj):
    return Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=timezone.now() + timedelta(days=7),
        task_title="RBAC Task",
        task_desc="RBAC Task Description",
        task_instructions="Write an essay",
        class_id_class=class_obj,
        task_status="draft",
    )


@pytest.fixture
def submission(db, task, student_user):
    return Submission.objects.create(
        task_id_task=task,
        user_id_user=student_user,
        submission_txt="Original submission text",
    )


def _authed_client(token: str) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return client


@pytest.mark.django_db
def test_units_create_student_forbidden(student_token):
    client = _authed_client(student_token)
    response = client.post(
        "/api/v2/core/units/",
        {"unit_id": "RBAC102", "unit_name": "Nope"},
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_units_create_lecturer_allowed(lecturer_token):
    client = _authed_client(lecturer_token)
    response = client.post(
        "/api/v2/core/units/",
        {"unit_id": "RBAC103", "unit_name": "Allowed"},
        content_type="application/json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_tasks_update_student_forbidden(student_token, task):
    client = _authed_client(student_token)
    response = client.put(
        f"/api/v2/core/tasks/{task.task_id}/",
        {
            "unit_id_unit": task.unit_id_unit_id,
            "rubric_id_marking_rubric": task.rubric_id_marking_rubric_id,
            "task_due_datetime": (timezone.now() + timedelta(days=3)).isoformat(),
            "task_title": "Unauthorized Update",
            "task_desc": "Updated",
            "task_instructions": "Updated",
            "class_id_class": task.class_id_class_id,
            "task_status": "draft",
            "task_allow_late_submission": False,
        },
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_classes_update_student_forbidden(student_token, class_obj):
    client = _authed_client(student_token)
    response = client.put(
        f"/api/v2/core/classes/{class_obj.class_id}/",
        {
            "unit_id_unit": class_obj.unit_id_unit_id,
            "class_name": "Unauthorized Update",
            "class_desc": "Updated",
            "class_join_code": "RBAC02",
            "class_term": "semester2",
            "class_year": 2026,
            "class_size": 0,
        },
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_submission_create_student_cannot_spoof_user(student_token, task, other_student_user):
    client = _authed_client(student_token)
    response = client.post(
        "/api/v2/core/submissions/",
        {
            "task_id_task": task.task_id,
            "user_id_user": other_student_user.user_id,
            "submission_txt": "Spoofed",
        },
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_submission_update_other_student_forbidden(other_student_user, submission):
    token = create_jwt_pair(other_student_user).access
    client = _authed_client(token)
    response = client.put(
        f"/api/v2/core/submissions/{submission.submission_id}/",
        {
            "task_id_task": submission.task_id_task_id,
            "user_id_user": submission.user_id_user_id,
            "submission_txt": "Unauthorized update",
        },
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_feedback_create_student_forbidden(student_token, submission, student_user):
    client = _authed_client(student_token)
    response = client.post(
        "/api/v2/core/feedbacks/",
        {
            "submission_id_submission": submission.submission_id,
            "user_id_user": student_user.user_id,
        },
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_rubric_item_create_other_lecturer_forbidden(other_lecturer_token, rubric):
    client = _authed_client(other_lecturer_token)
    response = client.post(
        "/api/v2/core/rubric-items/",
        {
            "rubric_id_marking_rubric": rubric.rubric_id,
            "rubric_item_name": "Unauthorized Item",
            "rubric_item_weight": "25.0",
        },
        content_type="application/json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_rubric_level_create_owner_lecturer_allowed(lecturer_token, rubric):
    item_client = _authed_client(lecturer_token)
    create_item_response = item_client.post(
        "/api/v2/core/rubric-items/",
        {
            "rubric_id_marking_rubric": rubric.rubric_id,
            "rubric_item_name": "Owner Item",
            "rubric_item_weight": "30.0",
        },
        content_type="application/json",
    )
    assert create_item_response.status_code == 200
    item_id = create_item_response.json()["rubric_item_id"]

    response = item_client.post(
        "/api/v2/core/rubric-levels/",
        {
            "rubric_item_id_rubric_item": item_id,
            "level_min_score": 0,
            "level_max_score": 10,
            "level_desc": "Owner created level",
        },
        content_type="application/json",
    )
    assert response.status_code == 200
