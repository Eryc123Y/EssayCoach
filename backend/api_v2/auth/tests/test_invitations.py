"""Invitation activation and teaching-scope permission checks."""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import Class, CourseLeadAssignment, Enrollment, Invitation, Unit, User


def _post(client: Client, path: str, data: dict, user: User | None = None):
    headers = {"HTTP_AUTHORIZATION": f"Bearer {create_jwt_pair(user).access}"} if user else {}
    return client.post(path, data, content_type="application/json", **headers)


@pytest.fixture
def school(db):
    admin = User.objects.create_user(
        user_email="admin@example.com", password="AdminPass123!", user_role="admin", user_status="active"
    )
    unit = Unit.objects.create(unit_id="ENG101", unit_name="English Writing")
    class_obj = Class.objects.create(unit_id_unit=unit, class_name="Writing A")
    return admin, unit, class_obj


@pytest.mark.django_db
def test_admin_to_lead_to_student_invitation_journey(school):
    admin, unit, class_obj = school
    client = Client()
    staff_invite = _post(
        client,
        "/api/v2/auth/invitations/",
        {"email": "Lead@Example.com", "role": "lecturer", "lead_unit_id": unit.pk},
        admin,
    )
    assert staff_invite.status_code == 200
    staff_token = staff_invite.json()["token"]
    assert Invitation.objects.get(email="lead@example.com").token_hash != staff_token

    staff_activation = _post(
        client,
        "/api/v2/auth/register/",
        {
            "invitation_token": staff_token,
            "password": "LecturerPass123!",
            "password_confirm": "LecturerPass123!",
            "role": "admin",
        },
    )
    assert staff_activation.status_code == 200
    lecturer = User.objects.get(user_email="lead@example.com")
    assert lecturer.user_role == "lecturer"
    assert CourseLeadAssignment.objects.filter(user_id_user=lecturer, unit_id_unit=unit).exists()
    assert _post(
        client,
        "/api/v2/auth/register/",
        {"invitation_token": staff_token, "password": "AnotherPass123!", "password_confirm": "AnotherPass123!"},
    ).status_code == 404

    student_invite = _post(
        client,
        "/api/v2/auth/invitations/",
        {"email": "Student@Example.com", "role": "student", "class_id": class_obj.pk},
        lecturer,
    )
    assert student_invite.status_code == 200
    student_token = student_invite.json()["token"]
    preview = _post(client, "/api/v2/auth/invitations/preview/", {"token": student_token})
    assert preview.status_code == 200
    assert preview.json()["class_name"] == "Writing A"
    assert preview.json()["email"] == "student@example.com"

    student_activation = _post(
        client,
        "/api/v2/auth/register/",
        {
            "invitation_token": student_token,
            "password": "StudentPass123!",
            "password_confirm": "StudentPass123!",
            "role": "admin",
        },
    )
    assert student_activation.status_code == 200
    student = User.objects.get(user_email="student@example.com")
    assert student.user_role == "student"
    assert Enrollment.objects.filter(user_id_user=student, class_id_class=class_obj).exists()
    class_obj.refresh_from_db()
    assert class_obj.class_size == 1


@pytest.mark.django_db
def test_public_registration_and_cross_class_invitation_denied(school):
    admin, unit, class_obj = school
    client = Client()
    uninvited = _post(
        client,
        "/api/v2/auth/register/",
        {"email": "self@example.com", "password": "GoodPass123!", "password_confirm": "GoodPass123!", "role": "admin"},
    )
    assert uninvited.status_code == 422
    assert not User.objects.filter(user_email="self@example.com").exists()

    lecturer = User.objects.create_user(
        user_email="other@example.com", password="TeacherPass123!", user_role="lecturer", user_status="active"
    )
    denied = _post(
        client,
        "/api/v2/auth/invitations/",
        {"email": "student@example.com", "role": "student", "class_id": class_obj.pk},
        lecturer,
    )
    assert denied.status_code == 403
    assert not Invitation.objects.exists()

    unauthenticated = _post(
        client,
        "/api/v2/auth/invitations/",
        {"email": "student@example.com", "role": "student", "class_id": class_obj.pk},
    )
    assert unauthenticated.status_code == 401


@pytest.mark.django_db
def test_expired_invitation_and_existing_account_password(school):
    admin, unit, class_obj = school
    client = Client()
    student = User.objects.create_user(
        user_email="student@example.com", password="ExistingPass123!", user_role="student", user_status="active"
    )
    invite = _post(
        client,
        "/api/v2/auth/invitations/",
        {"email": student.user_email, "role": "student", "class_id": class_obj.pk},
        admin,
    )
    token = invite.json()["token"]
    wrong = _post(
        client,
        "/api/v2/auth/register/",
        {"invitation_token": token, "password": "WrongPass123!", "password_confirm": "WrongPass123!"},
    )
    assert wrong.status_code == 401
    assert not Enrollment.objects.filter(user_id_user=student, class_id_class=class_obj).exists()
    accepted = _post(
        client,
        "/api/v2/auth/register/",
        {"invitation_token": token, "password": "ExistingPass123!", "password_confirm": "ExistingPass123!"},
    )
    assert accepted.status_code == 200
    assert Enrollment.objects.filter(user_id_user=student, class_id_class=class_obj).exists()

    expired_invite = _post(
        client,
        "/api/v2/auth/invitations/",
        {"email": "late@example.com", "role": "student", "class_id": class_obj.pk},
        admin,
    )
    expired_token = expired_invite.json()["token"]
    Invitation.objects.filter(email="late@example.com").update(expires_at=timezone.now() - timedelta(seconds=1))
    expired = _post(
        client,
        "/api/v2/auth/register/",
        {"invitation_token": expired_token, "password": "NewPass123!", "password_confirm": "NewPass123!"},
    )
    assert expired.status_code == 404


@pytest.mark.django_db
def test_legacy_user_writes_cannot_escalate_role_or_take_over_password(school):
    client = Client()
    lecturer = User.objects.create_user(
        user_email="teacher@example.com", password="TeacherPass123!", user_role="lecturer", user_status="active"
    )
    student = User.objects.create_user(
        user_email="student@example.com", password="StudentPass123!", user_role="student", user_status="active"
    )
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(student).access}"
    role_change = client.put(
        f"/api/v2/core/users/{student.pk}/", {"user_role": "admin"}, content_type="application/json"
    )
    assert role_change.status_code == 403
    staff_change = client.put(
        f"/api/v2/core/users/{student.pk}/", {"is_staff": True}, content_type="application/json"
    )
    assert staff_change.status_code == 403
    student.refresh_from_db()
    assert student.user_role == "student" and not student.is_staff

    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(lecturer).access}"
    cross_user = client.put(
        f"/api/v2/core/users/{student.pk}/", {"user_fname": "Changed"}, content_type="application/json"
    )
    assert cross_user.status_code == 403

    client.defaults.pop("HTTP_AUTHORIZATION")
    reset = _post(
        client,
        "/api/v2/auth/password-reset/",
        {"email": student.user_email, "new_password": "AttackerPass123!", "new_password_confirm": "AttackerPass123!"},
    )
    assert reset.status_code == 410
    student.refresh_from_db()
    assert student.check_password("StudentPass123!")


@pytest.mark.django_db
def test_suspended_account_cannot_login_or_use_existing_jwt(school):
    client = Client()
    student = User.objects.create_user(
        user_email="student@example.com", password="StudentPass123!", user_role="student", user_status="active"
    )
    token = create_jwt_pair(student).access
    student.user_status = "suspended"
    student.save(update_fields=["user_status"])
    login = _post(
        client, "/api/v2/auth/login-with-jwt/", {"email": student.user_email, "password": "StudentPass123!"}
    )
    assert login.status_code == 423
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    assert client.get("/api/v2/auth/me/jwt/").status_code == 401


@pytest.mark.django_db
def test_batch_invitations_deduplicate_and_report_existing_enrollment(school):
    admin, unit, class_obj = school
    client = Client()
    enrolled = User.objects.create_user(
        user_email="enrolled@example.com", password="StudentPass123!", user_role="student"
    )
    Enrollment.objects.create(user_id_user=enrolled, class_id_class=class_obj, unit_id_unit=unit)

    result = _post(
        client,
        "/api/v2/auth/invitations/batch/",
        {"class_id": class_obj.pk, "emails": ["New@Example.com", "new@example.com", "enrolled@example.com"]},
        admin,
    )
    assert result.status_code == 200
    assert [item["email"] for item in result.json()["created"]] == ["new@example.com"]
    assert result.json()["failed"][0]["email"] == "enrolled@example.com"
    assert Invitation.objects.count() == 1
    assert not User.objects.filter(user_email="new@example.com").exists()


@pytest.mark.django_db
def test_batch_invitations_require_class_teaching_scope(school):
    admin, unit, class_obj = school
    lecturer = User.objects.create_user(
        user_email="outside@example.com", password="TeacherPass123!", user_role="lecturer"
    )
    result = _post(
        Client(),
        "/api/v2/auth/invitations/batch/",
        {"class_id": class_obj.pk, "emails": ["a@example.com", "b@example.com"]},
        lecturer,
    )
    assert result.status_code == 403
    assert Invitation.objects.count() == 0


@pytest.mark.django_db
def test_local_superuser_bootstrap_has_product_admin_role():
    admin = User.objects.create_superuser(user_email="bootstrap@example.com", password="AdminPass123!")
    assert admin.user_role == "admin"
    assert admin.user_status == "active"
    assert admin.is_staff and admin.is_superuser
    assert _post(
        Client(), "/api/v2/auth/login-with-jwt/", {"email": admin.user_email, "password": "AdminPass123!"}
    ).status_code == 200
