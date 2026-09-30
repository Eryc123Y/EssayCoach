"""Manual rubric creation and private nested-resource authorization."""

from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import MarkingRubric, RubricItem, RubricLevelDesc, Unit, User


def client_for(user):
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


def rubric_payload(visibility="private"):
    return {
        "rubric_desc": "Argument and evidence",
        "visibility": visibility,
        "items": [
            {
                "rubric_item_name": "Argument",
                "rubric_item_weight": "60.0",
                "exemplar_text": "A precise claim supported by reasons.",
                "levels": [
                    {"level_min_score": 0, "level_max_score": 4, "level_desc": "Developing"},
                    {"level_min_score": 5, "level_max_score": 10, "level_desc": "Strong"},
                ],
            },
            {
                "rubric_item_name": "Evidence",
                "rubric_item_weight": "40.0",
                "levels": [
                    {"level_min_score": 0, "level_max_score": 10, "level_desc": "Evidence quality"},
                ],
            },
        ],
    }


@pytest.mark.django_db
def test_student_manual_private_and_nested_visibility():
    owner = User.objects.create_user(user_email="manual-student@example.com", password="pass", user_role="student")
    other = User.objects.create_user(user_email="other-student@example.com", password="pass", user_role="student")
    owner_client, other_client = client_for(owner), client_for(other)
    response = owner_client.post(
        "/api/v2/core/rubrics/create-with-items/",
        data=rubric_payload(), content_type="application/json",
    )
    assert response.status_code == 200, response.content
    rubric = response.json()
    assert len(rubric["rubric_items"]) == 2
    assert rubric["rubric_items"][0]["exemplar_text"].startswith("A precise")
    assert {row["rubric_id"] for row in owner_client.get("/api/v2/core/rubrics/").json()} == {rubric["rubric_id"]}
    assert other_client.get(f"/api/v2/core/rubrics/{rubric['rubric_id']}/detail/").status_code == 403
    assert other_client.get("/api/v2/core/rubrics/").json() == []
    item_id = rubric["rubric_items"][0]["rubric_item_id"]
    level_id = rubric["rubric_items"][0]["level_descriptions"][0]["level_desc_id"]
    assert other_client.get(f"/api/v2/core/rubric-items/{item_id}/").status_code == 403
    assert other_client.get(f"/api/v2/core/rubric-levels/{level_id}/").status_code == 403
    assert other_client.get("/api/v2/core/rubric-items/").json() == []
    assert other_client.get("/api/v2/core/rubric-levels/").json() == []
    assert owner_client.get(f"/api/v2/core/rubric-items/{item_id}/").status_code == 200
    assert owner_client.get(f"/api/v2/core/rubric-levels/{level_id}/").status_code == 200


@pytest.mark.django_db
def test_manual_rubric_validation_is_atomic():
    user = User.objects.create_user(user_email="manual-validation@example.com", password="pass", user_role="lecturer")
    client = client_for(user)
    bad_weight = rubric_payload()
    bad_weight["items"][0]["rubric_item_weight"] = "50"
    response = client.post("/api/v2/core/rubrics/create-with-items/", data=bad_weight, content_type="application/json")
    assert response.status_code == 400
    bad_range = rubric_payload()
    bad_range["items"][0]["levels"][1]["level_min_score"] = 7
    response = client.post("/api/v2/core/rubrics/create-with-items/", data=bad_range, content_type="application/json")
    assert response.status_code == 400
    assert MarkingRubric.objects.count() == 0
    public = client.post(
        "/api/v2/core/rubrics/create-with-items/", data=rubric_payload("public"), content_type="application/json",
    )
    assert public.status_code == 200, public.content
    assert MarkingRubric.objects.count() == 1
    assert RubricItem.objects.count() == 2
    assert RubricLevelDesc.objects.count() == 3


@pytest.mark.django_db
def test_student_cannot_create_public_manual_rubric_or_duplicate_public_to_public():
    lecturer = User.objects.create_user(user_email="manual-teacher@example.com", password="pass", user_role="lecturer")
    student = User.objects.create_user(user_email="manual-learner@example.com", password="pass", user_role="student")
    source = client_for(lecturer).post(
        "/api/v2/core/rubrics/create-with-items/", data=rubric_payload("public"), content_type="application/json",
    ).json()
    client = client_for(student)
    denied = client.post(
        "/api/v2/core/rubrics/create-with-items/", data=rubric_payload("public"), content_type="application/json",
    )
    assert denied.status_code == 403
    denied = client.post(
        f"/api/v2/core/rubrics/{source['rubric_id']}/duplicate/",
        data={"visibility": "public"}, content_type="application/json",
    )
    assert denied.status_code == 403
    copied = client.post(
        f"/api/v2/core/rubrics/{source['rubric_id']}/duplicate/",
        data={}, content_type="application/json",
    )
    assert copied.status_code == 200, copied.content
    assert copied.json()["visibility"] == "private"
    assert copied.json()["rubric_items"][0]["exemplar_text"] == source["rubric_items"][0]["exemplar_text"]


@pytest.mark.django_db
def test_student_private_rubric_can_be_used_in_practice_only_by_owner():
    owner = User.objects.create_user(user_email="practice-owner@example.com", password="pass", user_role="student")
    other = User.objects.create_user(user_email="practice-other@example.com", password="pass", user_role="student")
    created = client_for(owner).post(
        "/api/v2/core/rubrics/create-with-items/", data=rubric_payload(), content_type="application/json",
    ).json()
    payload = {
        "goal": "Improve argument", "content": "A short draft", "language": "en",
        "rubric_id": created["rubric_id"],
    }
    accepted = client_for(owner).post("/api/v2/practice/essays/", data=payload, content_type="application/json")
    assert accepted.status_code == 201, accepted.content
    assert accepted.json()["rubric_id"] == created["rubric_id"]
    denied = client_for(other).post("/api/v2/practice/essays/", data=payload, content_type="application/json")
    assert denied.status_code == 404


@pytest.mark.django_db
def test_student_study_rubric_cannot_be_attached_to_formal_assignment():
    admin = User.objects.create_user(user_email="rubric-admin@example.com", password="pass", user_role="admin")
    student = User.objects.create_user(user_email="rubric-student@example.com", password="pass", user_role="student")
    study_rubric = client_for(student).post(
        "/api/v2/core/rubrics/create-with-items/", data=rubric_payload(), content_type="application/json",
    ).json()
    staff_rubric = client_for(admin).post(
        "/api/v2/core/rubrics/create-with-items/", data=rubric_payload("public"), content_type="application/json",
    ).json()
    Unit.objects.create(unit_id="RUBRIC101", unit_name="Rubric security")
    payload = {
        "unit_id_unit": "RUBRIC101", "rubric_id_marking_rubric": study_rubric["rubric_id"],
        "task_due_datetime": (timezone.now() + timedelta(days=7)).isoformat(),
        "task_title": "Formal essay", "task_desc": "Write an essay", "task_status": "draft",
    }
    admin_client = client_for(admin)
    assert admin_client.post("/api/v2/core/tasks/", data=payload, content_type="application/json").status_code == 403
    payload["rubric_id_marking_rubric"] = staff_rubric["rubric_id"]
    created = admin_client.post("/api/v2/core/tasks/", data=payload, content_type="application/json")
    assert created.status_code == 200, created.content
    task_id = created.json()["task_id"]
    payload["rubric_id_marking_rubric"] = study_rubric["rubric_id"]
    changed = admin_client.put(f"/api/v2/core/tasks/{task_id}/", data=payload, content_type="application/json")
    assert changed.status_code == 403
