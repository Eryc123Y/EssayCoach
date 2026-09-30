"""A formal submission is immutable and uses up an attempt, so bad text must never reach storage.

Run with: uv run pytest api_v2/core/tests/test_submission_validation.py -v
"""

import pytest
from django.test import Client

from api_v2.core.routers.submissions import MAX_ESSAY_CHARACTERS
from api_v2.core.tests.test_assessment_release import assessment  # noqa: F401  (pytest fixture)
from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import AIJob, Feedback, Submission


def _submit(student, task, text):
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(student).access}"
    return client.post(
        "/api/v2/core/submissions/",
        {"task_id_task": task.pk, "user_id_user": student.pk, "submission_txt": text},
        content_type="application/json",
    )


@pytest.fixture
def fresh_task(assessment):  # noqa: F811
    """The shared fixture already holds a submission; remove it so the student has a full attempt."""
    _teacher, student, *_rest, submission, feedback = assessment
    task = submission.task_id_task
    feedback.delete()
    submission.delete()
    return student, task


@pytest.mark.django_db
@pytest.mark.parametrize("text", ["", "   ", "\n\t \n", "　　"])
def test_blank_essay_is_rejected_without_using_an_attempt(fresh_task, text):
    student, task = fresh_task

    response = _submit(student, task, text)

    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]
    assert not Submission.objects.exists() and not Feedback.objects.exists() and not AIJob.objects.exists()
    assert _submit(student, task, "A real essay.").status_code == 200  # the attempt is still available


@pytest.mark.django_db
def test_oversized_essay_is_rejected_and_the_limit_itself_is_accepted(fresh_task):
    student, task = fresh_task

    too_long = _submit(student, task, "a" * (MAX_ESSAY_CHARACTERS + 1))
    assert too_long.status_code == 400
    assert f"{MAX_ESSAY_CHARACTERS:,}" in too_long.json()["detail"]
    assert not Submission.objects.exists() and not AIJob.objects.exists()

    at_limit = _submit(student, task, "a" * MAX_ESSAY_CHARACTERS)
    assert at_limit.status_code == 200
    assert Submission.objects.get().submission_txt == "a" * MAX_ESSAY_CHARACTERS  # stored exactly as sent


@pytest.mark.django_db
def test_surrounding_whitespace_is_kept_as_the_student_wrote_it(fresh_task):
    student, task = fresh_task

    response = _submit(student, task, "  Indented first line.\n")

    assert response.status_code == 200
    assert Submission.objects.get().submission_txt == "  Indented first line.\n"
