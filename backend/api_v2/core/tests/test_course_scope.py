"""Course membership and staff assignment are checked by the API, not the UI."""

from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import (
    Class,
    ClassLeaveRequest,
    CourseLeadAssignment,
    Enrollment,
    Feedback,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Submission,
    Task,
    TeachingAssn,
    Unit,
    User,
)


def _client(user: User) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


@pytest.fixture
def scope(db):
    admin = User.objects.create_user(user_email="admin@example.com", password="AdminPass123!", user_role="admin")
    teacher = User.objects.create_user(
        user_email="teacher@example.com", password="TeacherPass123!", user_role="lecturer"
    )
    outsider = User.objects.create_user(
        user_email="outsider@example.com", password="TeacherPass123!", user_role="lecturer"
    )
    student = User.objects.create_user(
        user_email="student@example.com", password="StudentPass123!", user_role="student"
    )
    other_student = User.objects.create_user(
        user_email="other@example.com", password="StudentPass123!", user_role="student"
    )
    unit = Unit.objects.create(unit_id="ENG101", unit_name="Writing")
    other_unit = Unit.objects.create(unit_id="SCI101", unit_name="Science")
    assigned = Class.objects.create(unit_id_unit=unit, class_name="Writing A")
    outside = Class.objects.create(unit_id_unit=other_unit, class_name="Science B")
    TeachingAssn.objects.create(user_id_user=teacher, class_id_class=assigned)
    Enrollment.objects.create(user_id_user=student, class_id_class=assigned, unit_id_unit=unit)
    Enrollment.objects.create(user_id_user=other_student, class_id_class=outside, unit_id_unit=other_unit)
    return admin, teacher, outsider, student, assigned, outside, unit


@pytest.mark.django_db
def test_class_reads_are_limited_to_enrollment_and_teaching_scope(scope):
    admin, teacher, outsider, student, assigned, outside, unit = scope
    assert [row["class_id"] for row in _client(teacher).get("/api/v2/core/classes/").json()] == [assigned.pk]
    assert [row["class_id"] for row in _client(student).get("/api/v2/core/classes/").json()] == [assigned.pk]
    assert _client(student).get(f"/api/v2/core/classes/{assigned.pk}/").status_code == 200
    assert _client(student).get(f"/api/v2/core/classes/{outside.pk}/").status_code == 403
    assert _client(outsider).get(f"/api/v2/core/classes/{assigned.pk}/").status_code == 403
    assert _client(admin).get(f"/api/v2/core/classes/{outside.pk}/").status_code == 200
    assert _client(student).get(f"/api/v2/core/classes/{assigned.pk}/students/").status_code == 403


@pytest.mark.django_db
def test_only_assigned_staff_can_change_a_class(scope):
    admin, teacher, outsider, student, assigned, outside, unit = scope
    update = {"unit_id_unit": "ENG101", "class_name": "Renamed"}
    denied = _client(outsider).put(
        f"/api/v2/core/classes/{assigned.pk}/", update, content_type="application/json"
    )
    assert denied.status_code == 403
    assert _client(outsider).post(f"/api/v2/core/classes/{assigned.pk}/archive/").status_code == 403
    assert _client(teacher).put(
        f"/api/v2/core/classes/{assigned.pk}/", update, content_type="application/json"
    ).status_code == 200
    assert _client(teacher).post(f"/api/v2/core/classes/{outside.pk}/archive/").status_code == 403
    assert _client(admin).delete(f"/api/v2/core/classes/{assigned.pk}/").status_code == 409
    assert Class.objects.filter(pk=assigned.pk).exists()


@pytest.mark.django_db
def test_course_lead_can_create_class_and_direct_enrollment_is_retired(scope):
    admin, teacher, outsider, student, assigned, outside, unit = scope
    options_path = "/api/v2/core/classes/create-options/"
    assert [row["unit_id"] for row in _client(admin).get(options_path).json()] == ["ENG101", "SCI101"]
    assert _client(teacher).get(options_path).json() == []
    assert _client(student).get(options_path).json() == []
    body = {"unit_id_unit": unit.pk, "class_name": "Writing C"}
    assert _client(teacher).post("/api/v2/core/classes/", body, content_type="application/json").status_code == 403
    CourseLeadAssignment.objects.create(user_id_user=teacher, unit_id_unit=unit, assigned_by=admin)
    assert [row["unit_id"] for row in _client(teacher).get(options_path).json()] == ["ENG101"]
    assert _client(teacher).post("/api/v2/core/classes/", body, content_type="application/json").status_code == 200
    assert _client(teacher).post(
        "/api/v2/core/enrollments/",
        {"user_id_user": student.pk, "class_id_class": assigned.pk, "unit_id_unit": unit.pk},
        content_type="application/json",
    ).status_code == 410
    assert _client(teacher).post(
        f"/api/v2/core/classes/{assigned.pk}/students/?user_id={student.pk}"
    ).status_code == 410


@pytest.mark.django_db
def test_only_admin_can_assign_teaching_staff(scope):
    admin, teacher, outsider, student, assigned, outside, unit = scope
    payload = {"user_id_user": outsider.pk, "class_id_class": assigned.pk}
    assert _client(teacher).post(
        "/api/v2/core/teaching-assignments/", payload, content_type="application/json"
    ).status_code == 403
    assert _client(admin).post(
        "/api/v2/core/teaching-assignments/", payload, content_type="application/json"
    ).status_code == 200


@pytest.mark.django_db
def test_duplicate_class_requires_course_lead_and_starts_empty(scope):
    admin, teacher, outsider, student, assigned, outside, unit = scope
    path = f"/api/v2/core/classes/{assigned.pk}/duplicate/"
    assert _client(student).post(path, {}, content_type="application/json").status_code == 403
    assert _client(teacher).post(path, {}, content_type="application/json").status_code == 403
    CourseLeadAssignment.objects.create(user_id_user=teacher, unit_id_unit=unit, assigned_by=admin)
    response = _client(teacher).post(path, {"class_name": "Writing B"}, content_type="application/json")
    assert response.status_code == 200
    copy = Class.objects.get(pk=response.json()["class_id"])
    assert copy.class_name == "Writing B"
    assert copy.unit_id_unit_id == assigned.unit_id_unit_id
    assert copy.class_join_code != assigned.class_join_code
    assert copy.class_size == 0
    assert not Enrollment.objects.filter(class_id_class=copy).exists()


@pytest.mark.django_db
def test_class_leave_request_requires_staff_decision(scope):
    admin, teacher, outsider, student, assigned, outside, unit = scope
    base = f"/api/v2/core/classes/{assigned.pk}/leave-requests/"
    submitted = _client(student).post(base, {"reason": "Change of course"}, content_type="application/json")
    assert submitted.status_code == 200
    request_id = submitted.json()["id"]
    assert _client(student).post(base, {}, content_type="application/json").json()["id"] == request_id
    assert Enrollment.objects.filter(user_id_user=student, class_id_class=assigned).exists()
    assert [item["id"] for item in _client(teacher).get(base).json()] == [request_id]
    assert _client(outsider).get(base).status_code == 403
    decision_url = f"{base}{request_id}/decision/"
    assert _client(student).post(decision_url, {"approve": True}, content_type="application/json").status_code == 403
    assert _client(outsider).post(decision_url, {"approve": True}, content_type="application/json").status_code == 403
    declined = _client(teacher).post(decision_url, {"approve": False}, content_type="application/json")
    assert declined.status_code == 200
    assert declined.json()["status"] == "declined"
    assert Enrollment.objects.filter(user_id_user=student, class_id_class=assigned).exists()
    another = _client(student).post(base, {}, content_type="application/json")
    assert another.json()["id"] != request_id
    approved = _client(teacher).post(
        f"{base}{another.json()['id']}/decision/", {"approve": True}, content_type="application/json"
    )
    assert approved.status_code == 200
    assert _client(teacher).post(
        f"{base}{another.json()['id']}/decision/", {"approve": False}, content_type="application/json"
    ).status_code == 409
    assert not Enrollment.objects.filter(user_id_user=student, class_id_class=assigned).exists()
    assert ClassLeaveRequest.objects.get(pk=another.json()["id"]).decided_by_id == teacher.pk


@pytest.mark.django_db
def test_submissions_require_enrollment_and_are_private(scope):
    admin, teacher, outsider, student, assigned, outside, unit = scope
    other_student = User.objects.get(user_email="other@example.com")
    rubric = MarkingRubric.objects.create(user_id_user=teacher, rubric_desc="Writing rubric")
    task = Task.objects.create(
        unit_id_unit=unit,
        class_id_class=assigned,
        rubric_id_marking_rubric=rubric,
        task_title="Essay",
        task_due_datetime=timezone.now() + timedelta(days=3),
        task_status="published",
    )
    own = {"task_id_task": task.pk, "user_id_user": student.pk, "submission_txt": "An original essay."}
    assert _client(other_student).post(
        "/api/v2/core/submissions/", own, content_type="application/json"
    ).status_code == 403
    assert _client(teacher).post(
        "/api/v2/core/submissions/", own, content_type="application/json"
    ).status_code == 403
    response = _client(student).post(
        "/api/v2/core/submissions/", own, content_type="application/json"
    )
    assert response.status_code == 200
    submission_id = response.json()["submission_id"]
    pending_feedback = Feedback.objects.get(submission_id_submission_id=submission_id)
    assert pending_feedback.status == "ai_pending"
    assert pending_feedback.user_id_user_id is None
    assert _client(student).get(f"/api/v2/core/assessments/{submission_id}/").status_code == 404
    assert _client(teacher).get(f"/api/v2/core/assessments/{submission_id}/").json()["status"] == "ai_pending"
    assert _client(teacher).get(f"/api/v2/core/feedbacks/{pending_feedback.pk}/").status_code == 200
    assert _client(student).get(f"/api/v2/core/submissions/{submission_id}/").status_code == 200
    assert _client(other_student).get(f"/api/v2/core/submissions/{submission_id}/").status_code == 403
    assert _client(outsider).get(f"/api/v2/core/submissions/{submission_id}/").status_code == 403
    assert _client(teacher).get(f"/api/v2/core/submissions/{submission_id}/").status_code == 200
    assert _client(student).put(
        f"/api/v2/core/submissions/{submission_id}/", own, content_type="application/json"
    ).status_code == 410
    assert _client(student).post(
        "/api/v2/core/submissions/", own, content_type="application/json"
    ).status_code == 409


@pytest.mark.django_db
def test_unpublished_feedback_is_staff_only(scope):
    admin, teacher, outsider, student, assigned, outside, unit = scope
    rubric = MarkingRubric.objects.create(user_id_user=teacher, rubric_desc="Writing rubric")
    task = Task.objects.create(
        unit_id_unit=unit,
        class_id_class=assigned,
        rubric_id_marking_rubric=rubric,
        task_title="Essay",
        task_due_datetime=timezone.now() + timedelta(days=3),
        task_status="published",
    )
    submission = Submission.objects.create(task_id_task=task, user_id_user=student, submission_txt="My essay")
    feedback = Feedback.objects.create(submission_id_submission=submission, user_id_user=teacher)
    assert _client(student).get("/api/v2/core/feedbacks/").json() == []
    assert _client(student).get(f"/api/v2/core/feedbacks/{feedback.pk}/").status_code == 403
    assert _client(outsider).get(f"/api/v2/core/feedbacks/{feedback.pk}/").status_code == 403
    assert _client(teacher).get(f"/api/v2/core/feedbacks/{feedback.pk}/").status_code == 200


@pytest.mark.django_db
def test_assignment_list_and_publish_respect_course_scope(scope):
    admin, teacher, outsider, student, assigned, outside, unit = scope
    rubric = MarkingRubric.objects.create(user_id_user=teacher, rubric_desc="Writing rubric")
    item = RubricItem.objects.create(
        rubric_id_marking_rubric=rubric, rubric_item_name="Argument", rubric_item_weight=100
    )
    RubricLevelDesc.objects.create(
        rubric_item_id_rubric_item=item, level_min_score=0, level_max_score=10, level_desc="Argument quality"
    )
    own_task = Task.objects.create(
        unit_id_unit=unit,
        class_id_class=assigned,
        rubric_id_marking_rubric=rubric,
        task_title="Writing essay",
        task_due_datetime=timezone.now() + timedelta(days=3),
        task_status="draft",
    )
    other_task = Task.objects.create(
        unit_id_unit=outside.unit_id_unit,
        class_id_class=outside,
        rubric_id_marking_rubric=rubric,
        task_title="Science essay",
        task_due_datetime=timezone.now() + timedelta(days=3),
        task_status="published",
    )
    assert [row["task_id"] for row in _client(teacher).get("/api/v2/core/tasks/").json()] == [own_task.pk]
    assert _client(student).get("/api/v2/core/tasks/").json() == []
    assert _client(teacher).post(f"/api/v2/core/tasks/{other_task.pk}/publish/").status_code == 403
    assert _client(outsider).get(f"/api/v2/core/tasks/{own_task.pk}/").status_code == 403
    assert _client(teacher).post(f"/api/v2/core/tasks/{own_task.pk}/publish/").status_code == 200
    assert [row["task_id"] for row in _client(student).get("/api/v2/core/tasks/").json()] == [own_task.pk]
    assert _client(student).get(f"/api/v2/core/tasks/{other_task.pk}/").status_code == 403


@pytest.mark.django_db
def test_published_rubric_is_frozen_until_explicit_republication(scope):
    admin, teacher, outsider, student, assigned, outside, unit = scope
    rubric = MarkingRubric.objects.create(user_id_user=teacher, rubric_desc="First rubric")
    task = Task.objects.create(
        unit_id_unit=unit,
        class_id_class=assigned,
        rubric_id_marking_rubric=rubric,
        task_title="Versioned essay",
        task_due_datetime=timezone.now() + timedelta(days=3),
        task_status="draft",
    )
    path = f"/api/v2/core/tasks/{task.pk}/"
    assert _client(teacher).post(f"{path}publish/").status_code == 400

    item = RubricItem.objects.create(
        rubric_id_marking_rubric=rubric, rubric_item_name="Original criterion", rubric_item_weight=100
    )
    RubricLevelDesc.objects.create(
        rubric_item_id_rubric_item=item, level_min_score=0, level_max_score=10, level_desc="Original level"
    )
    assert _client(teacher).post(f"{path}publish/").status_code == 200
    frozen = _client(student).get(f"{path}rubric/").json()
    assert frozen["version"] == 1
    assert frozen["description"] == "First rubric"
    assert frozen["items"][0]["name"] == "Original criterion"

    rubric.rubric_desc = "Edited rubric"
    rubric.save(update_fields=["rubric_desc"])
    item.rubric_item_name = "Edited criterion"
    item.save(update_fields=["rubric_item_name"])
    assert _client(student).get(f"{path}rubric/").json() == frozen

    submission = _client(student).post(
        "/api/v2/core/submissions/",
        {"task_id_task": task.pk, "user_id_user": student.pk, "submission_txt": "An original essay."},
        content_type="application/json",
    )
    assert submission.status_code == 200
    feedback = Feedback.objects.get(submission_id_submission_id=submission.json()["submission_id"])
    assert feedback.rubric_snapshot == frozen["items"]
    assert _client(teacher).delete(f"/api/v2/core/rubrics/{rubric.pk}/").status_code == 409
    assert _client(teacher).delete(f"/api/v2/core/rubric-items/{item.pk}/").status_code == 409
    assert Submission.objects.filter(pk=submission.json()["submission_id"]).exists()

    assert _client(teacher).post(f"{path}unpublish/").status_code == 200
    assert _client(teacher).post(f"{path}publish/").status_code == 200
    refreshed = _client(student).get(f"{path}rubric/").json()
    assert refreshed["version"] == 2
    assert refreshed["description"] == "Edited rubric"
    assert refreshed["items"][0]["name"] == "Edited criterion"
    feedback.refresh_from_db()
    assert feedback.rubric_snapshot == frozen["items"]
