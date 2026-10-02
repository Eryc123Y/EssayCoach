import pytest
from django.core.management import call_command
from django.db import connection

from core.management.commands import seed_e2e
from core.models import Class, MarkingRubric, RubricItem, User


@pytest.mark.django_db
def test_seed_e2e_is_repeatable_and_creates_only_its_required_fixture_data(monkeypatch):
    # Keep pytest's active connection unchanged. The command guard remains
    # strict in production while this test permits its isolated database.
    monkeypatch.setattr(seed_e2e, "E2E_DATABASE_NAME", connection.settings_dict["NAME"])
    call_command("seed_e2e")
    call_command("seed_e2e")

    assert User.objects.filter(user_email="admin@e2e.essaycoach.example.com", user_role="admin").count() == 1
    assert Class.objects.filter(class_name="E2E invitation staging class", unit_id_unit_id="E2E101").count() == 1
    rubric = MarkingRubric.objects.get(rubric_desc="E2E Argument Rubric")
    assert rubric.visibility == "public"
    assert RubricItem.objects.filter(rubric_id_marking_rubric=rubric).count() == 1
