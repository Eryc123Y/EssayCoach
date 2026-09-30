"""Practice ownership, revision snapshots, and durable analysis behavior."""

from datetime import UTC, datetime
from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client
from pypdf import PdfWriter

from ai_feedback.practice_provider import PracticeAnalysisResult, PracticeChatResult
from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import PracticeEssay, PracticeEvidence, PracticeRun, User
from core.practice import process_next_run
from core.practice_chat import process_next_turn


def _client(user):
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {create_jwt_pair(user).access}"
    return client


@pytest.mark.django_db
def test_practice_document_import_extracts_text_and_enforces_scope():
    student = User.objects.create_user(user_email="import-student@example.com", password="StudentPass123!")
    lecturer = User.objects.create_user(
        user_email="import-teacher@example.com", password="TeacherPass123!", user_role="lecturer"
    )
    path = "/api/v2/practice/import/"
    client = _client(student)
    plain = SimpleUploadedFile("essay.txt", b"My first paragraph.\n\nMy second paragraph.")
    response = client.post(path, {"file": plain})
    assert response.status_code == 200, response.content
    assert response.json()["content"] == "My first paragraph.\n\nMy second paragraph."
    assert response.json()["character_count"] == len(response.json()["content"])

    docx = BytesIO()
    with ZipFile(docx, "w", compression=ZIP_DEFLATED) as archive:
        archive.writestr(
            "word/document.xml",
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            "<w:body><w:p><w:r><w:t>第一段</w:t></w:r></w:p>"
            "<w:p><w:r><w:t>Second paragraph.</w:t></w:r></w:p></w:body></w:document>",
        )
    response = client.post(path, {"file": SimpleUploadedFile("draft.docx", docx.getvalue())})
    assert response.status_code == 200, response.content
    assert response.json()["content"] == "第一段\nSecond paragraph."

    empty_pdf = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.write(empty_pdf)
    response = client.post(path, {"file": SimpleUploadedFile("scanned.pdf", empty_pdf.getvalue())})
    assert response.status_code == 400
    assert "no selectable text" in response.json()["detail"]

    response = client.post(path, {"file": SimpleUploadedFile("essay.exe", b"plain text")})
    assert response.status_code == 400
    response = client.post(path, {"file": SimpleUploadedFile("huge.txt", b"a" * (10 * 1024 * 1024 + 1))})
    assert response.status_code == 400
    assert _client(lecturer).post(path, {"file": SimpleUploadedFile("essay.txt", b"Private")}).status_code == 403


@pytest.mark.django_db
def test_practice_draft_revision_and_owner_scope():
    student = User.objects.create_user(user_email="practice-a@example.com", password="StudentPass123!")
    other = User.objects.create_user(user_email="practice-b@example.com", password="StudentPass123!")
    lecturer = User.objects.create_user(
        user_email="practice-teacher@example.com", password="TeacherPass123!", user_role="lecturer"
    )
    client = _client(student)
    created = client.post(
        "/api/v2/practice/essays/",
        {"goal": "Explain climate change", "content": "First draft", "language": "en"},
        content_type="application/json",
    )
    assert created.status_code == 201, created.content
    essay_id = created.json()["essay_id"]
    path = f"/api/v2/practice/essays/{essay_id}/"
    assert _client(other).get(path).status_code == 404
    assert _client(lecturer).get(path).status_code == 403
    assert _client(other).get("/api/v2/practice/essays/").json() == []

    conflict = client.patch(path, {"expected_version": 0, "content": "Wrong"}, content_type="application/json")
    assert conflict.status_code == 409
    saved = client.patch(path, {"expected_version": 1, "content": "Second draft"}, content_type="application/json")
    assert saved.status_code == 200
    assert saved.json()["version"] == 2
    assert PracticeEssay.objects.get(pk=essay_id).content == "Second draft"

    started = client.post(f"{path}analyze/", {"expected_version": 2}, content_type="application/json")
    assert started.status_code == 200, started.content
    assert started.json()["status"] == "pending"
    assert started.json()["revision_rubric"] is None
    run_id = started.json()["run_id"]
    assert _client(other).get(f"/api/v2/practice/runs/{run_id}/").status_code == 404
    repeated = client.post(f"{path}analyze/", {"expected_version": 2}, content_type="application/json")
    assert repeated.json()["run_id"] == run_id

    client.patch(path, {"expected_version": 2, "content": "Third draft"}, content_type="application/json")
    second = client.post(f"{path}analyze/", {"expected_version": 3}, content_type="application/json")
    assert second.status_code == 200
    assert second.json()["revision_number"] == 2
    assert PracticeRun.objects.get(pk=run_id).revision.content == "Second draft"


@pytest.mark.django_db
def test_worker_persists_evidence_and_student_can_retry_failed_run():
    student = User.objects.create_user(user_email="practice-worker@example.com", password="StudentPass123!")
    client = _client(student)
    essay = client.post(
        "/api/v2/practice/essays/",
        {"goal": "Explain a fact", "content": "The Earth is round.", "language": "en"},
        content_type="application/json",
    ).json()
    path = f"/api/v2/practice/essays/{essay['essay_id']}/analyze/"
    run_id = client.post(path, {"expected_version": 1}, content_type="application/json").json()["run_id"]

    class FailingProvider:
        def analyze(self, revision):
            raise RuntimeError("Private provider detail")

    process_next_run(FailingProvider())
    failed = client.get(f"/api/v2/practice/runs/{run_id}/")
    assert failed.json()["status"] == "failed"
    assert "Private provider detail" not in failed.content.decode()
    assert client.post(f"/api/v2/practice/runs/{run_id}/retry/").status_code == 200

    class FakeProvider:
        def analyze(self, revision):
            assert revision.content == "The Earth is round."
            return PracticeAnalysisResult(
                report={"overall_score": 78, "headline": "Clear claim", "skills": {}},
                evidence=[{
                    "claim": "The Earth is round", "query": "Earth shape", "verdict": "supported",
                    "rationale": "Source states the shape.", "source_title": "Earth",
                    "source_url": "https://en.wikipedia.org/wiki/Earth",
                    "source_excerpt": "Earth is approximately spherical.",
                    "supporting_quote": "approximately spherical",
                    "retrieved_at": datetime.now(UTC),
                }],
                model="gpt-6-luna", provider_thread_id="test-thread", usage={"input_tokens": 10},
            )

    process_next_run(FakeProvider())
    complete = client.get(f"/api/v2/practice/runs/{run_id}/").json()
    assert complete["status"] == "succeeded"
    assert complete["report"]["overall_score"] == 78
    assert complete["evidence"][0]["verdict"] == "supported"
    assert PracticeEvidence.objects.filter(run_id=run_id).count() == 1
    assert client.post(f"/api/v2/practice/runs/{run_id}/retry/").status_code == 409


@pytest.mark.django_db
def test_coach_chat_is_scoped_persisted_and_uses_prior_turns():
    student = User.objects.create_user(user_email="chat-owner@example.com", password="StudentPass123!")
    other = User.objects.create_user(user_email="chat-other@example.com", password="StudentPass123!")
    client = _client(student)
    essay = client.post(
        "/api/v2/practice/essays/", {"goal": "Improve an argument", "content": "A short claim."},
        content_type="application/json",
    ).json()
    run_id = client.post(
        f"/api/v2/practice/essays/{essay['essay_id']}/analyze/",
        {"expected_version": 1}, content_type="application/json",
    ).json()["run_id"]
    run = PracticeRun.objects.get(pk=run_id)
    run.status = "succeeded"
    run.report = {"overall_score": 70, "headline": "Add evidence"}
    run.save(update_fields=["status", "report"])
    path = f"/api/v2/practice/runs/{run_id}/chat/"
    first = client.post(path, {"question": "How can I improve?"}, content_type="application/json")
    assert first.status_code == 201, first.content
    assert first.json()["status"] == "pending"
    assert client.post(path, {"question": "Second question"}, content_type="application/json").status_code == 409
    assert _client(other).get(path).status_code == 404
    assert _client(other).post(path, {"question": "Can I see it?"}, content_type="application/json").status_code == 409

    class FakeCoach:
        def reply(self, run, question, history):
            assert question == "How can I improve?"
            assert history == []
            return PracticeChatResult("Add one specific example.", "gpt-6-luna", "chat-thread", None)

    process_next_turn(FakeCoach())
    complete = client.get(path).json()
    assert complete[0]["status"] == "succeeded"
    assert complete[0]["answer"] == "Add one specific example."

    client.post(path, {"question": "What kind of example?"}, content_type="application/json")

    class ContextCoach:
        def reply(self, run, question, history):
            assert history == [{"question": "How can I improve?", "answer": "Add one specific example."}]
            return PracticeChatResult("Use a published study.", "gpt-6-luna", "chat-thread-2", None)

    process_next_turn(ContextCoach())
    assert client.get(path).json()[1]["answer"] == "Use a published study."
