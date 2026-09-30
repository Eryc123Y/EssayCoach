"""The development seed command must stay in step with the current models.

Run with: uv run pytest api_v2/core/tests/test_seed_db.py -v
"""

import pytest
from django.core.management import call_command

from core.models import (
    Class,
    CourseLeadAssignment,
    Enrollment,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Task,
    TeachingAssn,
    User,
)


@pytest.mark.django_db
def test_seed_creates_a_usable_demo_course():
    call_command("seed_db", verbosity=0)

    assert set(User.objects.values_list("user_role", flat=True)) == {"admin", "lecturer", "student"}
    lecturer = User.objects.get(user_email="lecturer@example.com")
    student = User.objects.get(user_email="student@example.com")
    assert lecturer.check_password("lecturer123")

    class_obj = Class.objects.get()
    assert class_obj.class_join_code
    assert TeachingAssn.objects.filter(user_id_user=lecturer, class_id_class=class_obj).exists()
    assert CourseLeadAssignment.objects.filter(user_id_user=lecturer, unit_id_unit=class_obj.unit_id_unit).exists()
    assert Enrollment.objects.filter(user_id_user=student, class_id_class=class_obj).exists()

    rubric = MarkingRubric.objects.get()
    items = RubricItem.objects.filter(rubric_id_marking_rubric=rubric)
    assert sum(item.rubric_item_weight for item in items) == 100
    assert RubricLevelDesc.objects.filter(rubric_item_id_rubric_item__in=items).count() == 9

    task = Task.objects.get()
    assert task.task_status == "published"
    assert len(task.rubric_snapshot) == 3
    assert task.class_id_class == class_obj


@pytest.mark.django_db
def test_seed_is_skipped_when_users_already_exist():
    User.objects.create_user(user_email="existing@example.com", password="pw-12345678", user_role="student")

    call_command("seed_db", verbosity=0)

    assert User.objects.count() == 1
    assert not Task.objects.exists()
