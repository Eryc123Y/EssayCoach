"""Administrator account changes revoke prior sessions without deleting student work."""

import pytest
from django.test import Client

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import (
    AdminAuditEvent,
    Class,
    CourseLeadAssignment,
    Enrollment,
    MarkingRubric,
    PasswordResetGrant,
    Submission,
    Task,
    Unit,
    User,
)


def _client(user: User) -> Client:
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


@pytest.mark.django_db
def test_directory_filters_details_and_admin_only_access():
    admin = User.objects.create_user(
        user_email="directory-admin@example.com", password="TestPass123!", user_role="admin"
    )
    student = User.objects.create_user(
        user_email="directory-student@example.com", password="TestPass123!", user_fname="Mei"
    )
    teacher = User.objects.create_user(
        user_email="directory-teacher@example.com", password="TestPass123!", user_role="lecturer"
    )
    unit = Unit.objects.create(unit_id="DIR101", unit_name="Writing")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="Seminar")
    Enrollment.objects.create(user_id_user=student, class_id_class=class_obj, unit_id_unit=unit)
    client = _client(admin)
    assert _client(teacher).get("/api/v2/admin/users/").status_code == 403
    result = client.get("/api/v2/admin/users/?search=Mei&role=student").json()
    assert [item["user_id"] for item in result] == [student.pk]
    detail = client.get(f"/api/v2/admin/users/{student.pk}/").json()
    assert detail["classes"][0]["class_name"] == "Seminar"
    assert detail["submissions_count"] == 0
    CourseLeadAssignment.objects.create(user_id_user=teacher, unit_id_unit=unit, assigned_by=admin)
    teacher_detail = client.get(f"/api/v2/admin/users/{teacher.pk}/").json()
    assert teacher_detail["classes"][0]["relationship"] == "course_lead"
    path = f"/api/v2/admin/users/{student.pk}/"
    assert _client(teacher).patch(
        path, {"user_fname": "Meilin", "user_lname": "Chen"}, content_type="application/json"
    ).status_code == 403
    changed = client.patch(path, {"user_fname": "Meilin", "user_lname": "Chen"}, content_type="application/json")
    assert changed.status_code == 200
    assert changed.json()["user_fname"] == "Meilin"
    assert User.objects.get(pk=student.pk).user_email == "directory-student@example.com"
    assert AdminAuditEvent.objects.filter(target=student, action="profile_edit").count() == 1


@pytest.mark.django_db
def test_disable_enable_and_force_logout_invalidate_existing_tokens():
    admin = User.objects.create_user(user_email="action-admin@example.com", password="TestPass123!", user_role="admin")
    student = User.objects.create_user(user_email="action-student@example.com", password="TestPass123!")
    admin_client = _client(admin)
    old_client = _client(student)
    own_path = "/api/v2/core/users/me/"
    action_path = f"/api/v2/admin/users/{student.pk}/action/"
    assert old_client.get(own_path).status_code == 200
    assert (
        _client(student).post(action_path, {"action": "disable_user"}, content_type="application/json").status_code
        == 403
    )
    assert (
        admin_client.post(
            action_path, {"action": "disable_user", "reason": "Local test"}, content_type="application/json"
        ).status_code
        == 200
    )
    assert old_client.get(own_path).status_code == 401
    assert admin_client.get(f"/api/v2/admin/users/{student.pk}/activity/").json()[0]["action"] == "disable_user"
    assert admin_client.post(action_path, {"action": "enable_user"}, content_type="application/json").status_code == 200
    assert old_client.get(own_path).status_code == 401
    student.refresh_from_db()
    fresh_client = _client(student)
    assert fresh_client.get(own_path).status_code == 200
    assert (
        admin_client.post(action_path, {"action": "force_logout"}, content_type="application/json").status_code == 200
    )
    assert fresh_client.get(own_path).status_code == 401
    student.refresh_from_db()
    assert _client(student).get(own_path).status_code == 200
    assert AdminAuditEvent.objects.filter(target=student).count() == 3
    assert (
        admin_client.post(
            f"/api/v2/admin/users/{admin.pk}/action/", {"action": "disable_user"}, content_type="application/json"
        ).status_code
        == 409
    )


@pytest.mark.django_db
def test_account_with_course_records_cannot_be_cascade_deleted():
    admin = User.objects.create_user(user_email="delete-admin@example.com", password="TestPass123!", user_role="admin")
    student = User.objects.create_user(user_email="delete-student@example.com", password="TestPass123!")
    unit = Unit.objects.create(unit_id="DEL101", unit_name="Writing")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="Seminar")
    rubric = MarkingRubric.objects.create(user_id_user=admin, rubric_desc="Rubric")
    task = Task.objects.create(
        unit_id_unit=unit,
        class_id_class=class_obj,
        rubric_id_marking_rubric=rubric,
        task_title="Essay",
        task_due_datetime="2027-10-01T00:00:00Z",
    )
    submission = Submission.objects.create(task_id_task=task, user_id_user=student, submission_txt="My essay")
    response = _client(admin).delete(f"/api/v2/core/users/{student.pk}/")
    assert response.status_code == 409
    assert Submission.objects.filter(pk=submission.pk).exists()


@pytest.mark.django_db
def test_admin_issued_password_reset_is_one_time_and_revokes_old_tokens():
    admin = User.objects.create_user(user_email="reset-admin@example.com", password="TestPass123!", user_role="admin")
    student = User.objects.create_user(user_email="reset-student@example.com", password="OldPass123!")
    old_client = _client(student)
    issue_path = f"/api/v2/admin/users/{student.pk}/password-reset/"
    assert _client(student).post(issue_path).status_code == 403
    issued = _client(admin).post(issue_path)
    assert issued.status_code == 200
    token = issued.json()["token"]
    assert PasswordResetGrant.objects.filter(user=student).count() == 1
    second = _client(admin).post(issue_path)
    assert second.status_code == 200
    assert (
        Client()
        .post("/api/v2/auth/password-reset/preview/", {"token": token}, content_type="application/json")
        .status_code
        == 404
    )
    grant = PasswordResetGrant.objects.get(user=student, used_at__isnull=True)
    assert len(grant.token_hash) == 64
    latest = second.json()["token"]
    preview = Client().post("/api/v2/auth/password-reset/preview/", {"token": latest}, content_type="application/json")
    assert preview.status_code == 200
    assert preview.json()["email"] == student.user_email
    payload = {"token": latest, "new_password": "NewSecurePass123!", "new_password_confirm": "NewSecurePass123!"}
    complete = Client().post("/api/v2/auth/password-reset/complete/", payload, content_type="application/json")
    assert complete.status_code == 200
    student.refresh_from_db()
    assert student.check_password("NewSecurePass123!")
    assert not student.check_password("OldPass123!")
    assert old_client.get("/api/v2/core/users/me/").status_code == 401
    assert (
        Client().post("/api/v2/auth/password-reset/complete/", payload, content_type="application/json").status_code
        == 404
    )
