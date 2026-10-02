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


@pytest.mark.django_db
def test_seed_e2e_fixtures_are_repeatable_after_community_activity(monkeypatch):
    from core.models import ContentReport, Enrollment, SharedEssay, Submission, Task

    monkeypatch.setattr(seed_e2e, "E2E_DATABASE_NAME", connection.settings_dict["NAME"])
    call_command("seed_e2e", "--fixtures")

    alice = User.objects.get(user_email="alice@e2e.essaycoach.example.com")
    bob = User.objects.get(user_email="bob@e2e.essaycoach.example.com")
    task = Task.objects.get(task_title="E2E Journey Assignment")
    assert Enrollment.objects.filter(class_id_class=task.class_id_class).count() == 2
    submission = Submission.objects.create(task_id_task=task, user_id_user=alice, submission_txt="Shared essay")
    share = SharedEssay.objects.create(
        submission=submission, owner=alice, class_obj=task.class_id_class, visibility="class"
    )
    ContentReport.objects.create(share=share, reporter=bob, reason="spam")

    # Shared essays and reports PROTECT their users; the reseed must still succeed.
    call_command("seed_e2e", "--fixtures")
    assert not SharedEssay.objects.exists()
    assert User.objects.filter(user_email__endswith="@e2e.essaycoach.example.com").count() == 6


@pytest.mark.parametrize("name", ["essaycoach", "essaycoach_e2evil", "test_essaycoach_e2eproduction", "e2e"])
def test_seed_e2e_refuses_other_databases(monkeypatch, name):
    from django.core.management.base import CommandError

    monkeypatch.setattr(seed_e2e.settings, "DATABASES", {"default": {"NAME": name}})
    with pytest.raises(CommandError):
        call_command("seed_e2e")
