"""Per-student extensions must affect actual submission eligibility."""

from datetime import timedelta
from io import BytesIO
from zipfile import ZipFile

import pytest
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import (
    Class,
    Enrollment,
    MarkingRubric,
    Notification,
    RubricItem,
    RubricLevelDesc,
    Task,
    TeachingAssn,
    Unit,
    User,
)


def _client(user: User) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


@pytest.mark.django_db
def test_student_extension_allows_only_that_student_to_submit():
    teacher = User.objects.create_user(
        user_email="ext-teacher@example.com", password="TeacherPass123!", user_role="lecturer"
    )
    first = User.objects.create_user(
        user_email="ext-first@example.com", password="StudentPass123!", user_role="student"
    )
    second = User.objects.create_user(
        user_email="ext-second@example.com", password="StudentPass123!", user_role="student"
    )
    unit = Unit.objects.create(unit_id="EXT101", unit_name="Writing")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="Extension class")
    TeachingAssn.objects.create(user_id_user=teacher, class_id_class=class_obj)
    for student in (first, second):
        Enrollment.objects.create(user_id_user=student, class_id_class=class_obj, unit_id_unit=unit)
    rubric = MarkingRubric.objects.create(user_id_user=teacher, rubric_desc="Argument")
    item = RubricItem.objects.create(
        rubric_id_marking_rubric=rubric, rubric_item_name="Argument", rubric_item_weight=100
    )
    RubricLevelDesc.objects.create(
        rubric_item_id_rubric_item=item, level_min_score=0, level_max_score=10, level_desc="Quality"
    )
    task = Task.objects.create(
        unit_id_unit=unit, class_id_class=class_obj, rubric_id_marking_rubric=rubric,
        task_title="Past deadline", task_due_datetime=timezone.now() + timedelta(days=1), task_status="published",
    )
    Task.objects.filter(pk=task.pk).update(
        task_publish_datetime=timezone.now() - timedelta(days=2),
        task_due_datetime=timezone.now() - timedelta(days=1),
    )
    task.refresh_from_db()
    duplicate = _client(teacher).post(
        f"/api/v2/core/tasks/{task.pk}/duplicate/", {}, content_type="application/json"
    )
    assert duplicate.status_code == 200
    assert duplicate.json()["task_status"] == "draft"
    assert duplicate.json()["task_due_datetime"] > timezone.now().isoformat()
    eligible = _client(teacher).get(f"/api/v2/core/tasks/{task.pk}/eligible-students/")
    assert eligible.status_code == 200
    assert {row["user_id"] for row in eligible.json()} == {first.pk, second.pk}
    assert _client(first).get(f"/api/v2/core/tasks/{task.pk}/eligible-students/").status_code == 403
    path = "/api/v2/core/submissions/"
    for student in (first, second):
        denied = _client(student).post(
            path, {"task_id_task": task.pk, "user_id_user": student.pk, "submission_txt": "My essay"},
            content_type="application/json",
        )
        assert denied.status_code == 403
    tomorrow = timezone.now() + timedelta(days=1)
    granted = _client(teacher).post(
        f"/api/v2/core/tasks/{task.pk}/extend/",
        {"student_id": first.pk, "new_deadline": tomorrow.isoformat(), "reason": "Approved extension"},
        content_type="application/json",
    )
    assert granted.status_code == 200
    assert granted.json()["extension"]["user_id"] == first.pk
    assert Notification.objects.filter(user=first, kind="assignment").count() == 1
    own_deadline = _client(first).get(f"/api/v2/core/tasks/{task.pk}/my-deadline/")
    assert own_deadline.status_code == 200
    assert own_deadline.json()["is_extended"] is True
    assert own_deadline.json()["submission_count"] == 0
    other_deadline = _client(second).get(f"/api/v2/core/tasks/{task.pk}/my-deadline/")
    assert other_deadline.status_code == 200
    assert other_deadline.json()["is_extended"] is False
    accepted = _client(first).post(
        path, {"task_id_task": task.pk, "user_id_user": first.pk, "submission_txt": "My essay"},
        content_type="application/json",
    )
    assert accepted.status_code == 200
    denied_again = _client(second).post(
        path, {"task_id_task": task.pk, "user_id_user": second.pk, "submission_txt": "My essay"},
        content_type="application/json",
    )
    assert denied_again.status_code == 403
    Task.objects.filter(pk=task.pk).update(task_allow_resubmission=True)
    revision = _client(first).post(
        path, {"task_id_task": task.pk, "user_id_user": first.pk, "submission_txt": "My revised essay"},
        content_type="application/json",
    )
    assert revision.status_code == 200
    assert revision.json()["submission_id"] != accepted.json()["submission_id"]
    assert accepted.json()["submission_txt"] == "My essay"
    assert _client(first).get(f"/api/v2/core/tasks/{task.pk}/my-deadline/").json()["submission_count"] == 2
    assert _client(first).post(
        path, {"task_id_task": task.pk, "user_id_user": first.pk, "submission_txt": "A third essay"},
        content_type="application/json",
    ).status_code == 409
    summary = _client(teacher).get(f"/api/v2/core/tasks/{task.pk}/submission-summary/")
    assert summary.status_code == 200
    assert summary.json()["eligible_students"] == 2
    assert summary.json()["submitted_students"] == 1
    assert summary.json()["submission_versions"] == 2
    exported = _client(teacher).get(f"/api/v2/core/tasks/{task.pk}/submissions-export/")
    assert exported.status_code == 200
    with ZipFile(BytesIO(exported.content)) as archive:
        assert archive.read("manifest.csv").decode().count("ext-first@example.com") == 2
        assert archive.read(f"submission-{revision.json()['submission_id']}.txt") == b"My revised essay"
    assert _client(first).get(f"/api/v2/core/tasks/{task.pk}/submissions-export/").status_code == 403
    posted = _client(teacher).post(
        "/api/v2/core/tasks/",
        {
            "unit_id_unit": unit.pk, "class_id_class": class_obj.pk,
            "rubric_id_marking_rubric": rubric.pk,
            "task_title": "New assignment", "task_due_datetime": tomorrow.isoformat(),
            "task_status": "published", "task_instructions": "Write an argument",
        },
        content_type="application/json",
    )
    assert posted.status_code == 200
    assert Notification.objects.filter(user=first, kind="assignment").count() == 2
    assert Notification.objects.filter(user=second, kind="assignment").count() == 1
