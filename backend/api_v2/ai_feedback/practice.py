"""Student-owned practice drafts, immutable revisions, and AI reports."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from django.db import transaction
from django.db.models import Q
from django.http import HttpRequest
from ninja import Router, Schema, Status
from ninja.errors import HttpError
from ninja.files import UploadedFile

from api_v2.utils.auth import JWTAuth
from core.models import MarkingRubric, PracticeChatTurn, PracticeEssay, PracticeRun
from core.observability import bind_ai_job, reset_ai_job
from core.practice import PracticeError, retry_run, start_analysis
from core.practice_chat import PracticeChatError, create_chat_turn, retry_chat_turn
from core.practice_import import PracticeImportError, extract_practice_text

router = Router(tags=["Practice"], auth=JWTAuth())


class PracticeCreateIn(Schema):
    goal: str
    content: str = ""
    language: str = "en"
    audience: str = ""
    tone: str = ""
    rubric_id: int | None = None


class PracticeUpdateIn(Schema):
    expected_version: int
    goal: str | None = None
    content: str | None = None
    language: str | None = None
    audience: str | None = None
    tone: str | None = None
    rubric_id: int | None = None


class PracticeEssayOut(Schema):
    essay_id: UUID
    goal: str
    content: str
    language: str
    audience: str
    tone: str
    rubric_id: int | None
    version: int
    created_at: datetime
    updated_at: datetime
    revision_count: int


class PracticeEvidenceOut(Schema):
    claim: str
    query: str
    verdict: str
    rationale: str
    source_title: str
    source_url: str
    source_excerpt: str
    supporting_quote: str
    retrieved_at: datetime | None


class PracticeRunOut(Schema):
    run_id: UUID
    essay_id: UUID
    revision_number: int
    revision_goal: str
    revision_content: str
    revision_rubric: list[dict] | None
    status: str
    attempts: int
    model: str
    report: dict | None
    evidence: list[PracticeEvidenceOut]
    error_category: str | None
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class StartAnalysisIn(Schema):
    expected_version: int


class PracticeChatIn(Schema):
    question: str


class PracticeChatTurnOut(Schema):
    turn_id: UUID
    run_id: UUID
    question: str
    answer: str | None
    status: str
    attempts: int
    error_message: str | None
    created_at: datetime
    finished_at: datetime | None


class PracticeImportOut(Schema):
    filename: str
    content: str
    character_count: int


def _student(request: HttpRequest):
    if request.auth.user_role != "student":
        raise HttpError(403, "Practice writing is available to students")
    return request.auth


def _rubric_for_student(rubric_id: int | None, student):
    if rubric_id is None:
        return None
    rubric = MarkingRubric.objects.filter(pk=rubric_id).filter(Q(visibility="public") | Q(user_id_user=student)).first()
    if rubric is None:
        raise HttpError(404, "Rubric not found")
    return rubric


def _essay(request: HttpRequest, essay_id: UUID) -> PracticeEssay:
    essay = PracticeEssay.objects.filter(pk=essay_id, student=_student(request)).first()
    if essay is None:
        raise HttpError(404, "Practice essay not found")
    return essay


def _validate_fields(goal: str, content: str, language: str, audience: str, tone: str):
    if not goal.strip() or len(goal) > 2000:
        raise HttpError(400, "Writing goal must be between 1 and 2,000 characters")
    if len(content) > 50000:
        raise HttpError(400, "Essay exceeds the 50,000 character limit")
    if language not in {"en", "zh"}:
        raise HttpError(400, "Language must be en or zh")
    if len(audience) > 80 or len(tone) > 80:
        raise HttpError(400, "Audience or tone is too long")


def _serialize_essay(essay: PracticeEssay) -> PracticeEssayOut:
    return PracticeEssayOut(
        essay_id=essay.pk, goal=essay.goal, content=essay.content, language=essay.language,
        audience=essay.audience, tone=essay.tone, rubric_id=essay.rubric_id,
        version=essay.version, created_at=essay.created_at, updated_at=essay.updated_at,
        revision_count=essay.revisions.count(),
    )


def _serialize_run(run: PracticeRun) -> PracticeRunOut:
    return PracticeRunOut(
        run_id=run.pk, essay_id=run.revision.essay_id, revision_number=run.revision.number,
        revision_goal=run.revision.goal, revision_content=run.revision.content,
        revision_rubric=run.revision.rubric_snapshot,
        status=run.status, attempts=run.attempts, model=run.model, report=run.report,
        evidence=[PracticeEvidenceOut(
            claim=item.claim, query=item.query, verdict=item.verdict, rationale=item.rationale,
            source_title=item.source_title, source_url=item.source_url,
            source_excerpt=item.source_excerpt, supporting_quote=item.supporting_quote,
            retrieved_at=item.retrieved_at,
        ) for item in run.evidence.all().order_by("evidence_id")],
        error_category=run.error_category or None, error_message=run.error_message or None,
        created_at=run.created_at, started_at=run.started_at, finished_at=run.finished_at,
    )


def _serialize_chat(turn: PracticeChatTurn) -> PracticeChatTurnOut:
    return PracticeChatTurnOut(
        turn_id=turn.pk, run_id=turn.run_id, question=turn.question,
        answer=turn.answer if turn.status == "succeeded" else None,
        status=turn.status, attempts=turn.attempts,
        error_message=turn.error_message or None,
        created_at=turn.created_at, finished_at=turn.finished_at,
    )


@router.get("/essays/", response=list[PracticeEssayOut])
def list_essays(request: HttpRequest):
    student = _student(request)
    essays = PracticeEssay.objects.filter(student=student).order_by("-updated_at")[:100]
    return [_serialize_essay(essay) for essay in essays]


@router.post("/import/", response=PracticeImportOut)
def import_document(request: HttpRequest, file: UploadedFile):
    _student(request)
    filename = file.name or ""
    try:
        content = extract_practice_text(filename, file.read(10 * 1024 * 1024 + 1))
    except PracticeImportError as exc:
        raise HttpError(400, str(exc)) from exc
    return PracticeImportOut(filename=filename[:200], content=content, character_count=len(content))


@router.post("/essays/", response={201: PracticeEssayOut})
def create_essay(request: HttpRequest, data: PracticeCreateIn):
    student = _student(request)
    _validate_fields(data.goal, data.content, data.language, data.audience, data.tone)
    essay = PracticeEssay.objects.create(
        student=student, goal=data.goal.strip(), content=data.content,
        language=data.language, audience=data.audience, tone=data.tone,
        rubric=_rubric_for_student(data.rubric_id, student),
    )
    return Status(201, _serialize_essay(essay))


@router.get("/essays/{essay_id}/", response=PracticeEssayOut)
def get_essay(request: HttpRequest, essay_id: UUID):
    return _serialize_essay(_essay(request, essay_id))


@router.patch("/essays/{essay_id}/", response=PracticeEssayOut)
def update_essay(request: HttpRequest, essay_id: UUID, data: PracticeUpdateIn):
    student = _student(request)
    with transaction.atomic():
        essay = PracticeEssay.objects.select_for_update().filter(pk=essay_id, student=student).first()
        if essay is None:
            raise HttpError(404, "Practice essay not found")
        if essay.version != data.expected_version:
            raise HttpError(409, "Draft changed; reload before saving")
        for name in ("goal", "content", "language", "audience", "tone"):
            if name in data.model_fields_set:
                value = getattr(data, name)
                if value is None:
                    raise HttpError(400, f"{name} cannot be null")
                setattr(essay, name, value)
        if "rubric_id" in data.model_fields_set:
            essay.rubric = _rubric_for_student(data.rubric_id, student)
        _validate_fields(essay.goal, essay.content, essay.language, essay.audience, essay.tone)
        essay.version += 1
        essay.save()
    return _serialize_essay(essay)


@router.post("/essays/{essay_id}/analyze/", response=PracticeRunOut)
def analyze_essay(request: HttpRequest, essay_id: UUID, data: StartAnalysisIn):
    student = _student(request)
    try:
        run = start_analysis(essay_id, student.pk, expected_version=data.expected_version)
    except PracticeError as exc:
        raise HttpError(409, str(exc)) from exc
    trace_token = bind_ai_job("practice", run.pk)
    reset_ai_job(trace_token)
    return _serialize_run(run)


@router.get("/essays/{essay_id}/runs/", response=list[PracticeRunOut])
def list_runs(request: HttpRequest, essay_id: UUID):
    essay = _essay(request, essay_id)
    runs = PracticeRun.objects.filter(revision__essay=essay).select_related("revision").order_by("-created_at")
    return [_serialize_run(run) for run in runs[:100]]


@router.get("/runs/{run_id}/", response=PracticeRunOut)
def get_run(request: HttpRequest, run_id: UUID):
    run = (
        PracticeRun.objects.select_related("revision")
        .filter(pk=run_id, revision__essay__student=_student(request))
        .first()
    )
    if run is None:
        raise HttpError(404, "Practice run not found")
    return _serialize_run(run)


@router.post("/runs/{run_id}/retry/", response=PracticeRunOut)
def retry_analysis(request: HttpRequest, run_id: UUID):
    student = _student(request)
    try:
        run = retry_run(run_id, student.pk)
    except PracticeError as exc:
        raise HttpError(409, str(exc)) from exc
    trace_token = bind_ai_job("practice", run.pk)
    reset_ai_job(trace_token)
    return _serialize_run(run)


@router.get("/runs/{run_id}/chat/", response=list[PracticeChatTurnOut])
def list_chat_turns(request: HttpRequest, run_id: UUID):
    student = _student(request)
    run = PracticeRun.objects.filter(pk=run_id, revision__essay__student=student).first()
    if run is None:
        raise HttpError(404, "Practice report not found")
    return [_serialize_chat(turn) for turn in PracticeChatTurn.objects.filter(run=run).order_by("created_at")[:100]]


@router.post("/runs/{run_id}/chat/", response={201: PracticeChatTurnOut})
def ask_coach(request: HttpRequest, run_id: UUID, data: PracticeChatIn):
    student = _student(request)
    try:
        turn = create_chat_turn(run_id, student.pk, data.question)
    except PracticeChatError as exc:
        raise HttpError(409, str(exc)) from exc
    trace_token = bind_ai_job("chat", turn.pk)
    reset_ai_job(trace_token)
    return Status(201, _serialize_chat(turn))


@router.post("/chat/{turn_id}/retry/", response=PracticeChatTurnOut)
def retry_coach(request: HttpRequest, turn_id: UUID):
    student = _student(request)
    try:
        turn = retry_chat_turn(turn_id, student.pk)
    except PracticeChatError as exc:
        raise HttpError(409, str(exc)) from exc
    trace_token = bind_ai_job("chat", turn.pk)
    reset_ai_job(trace_token)
    return _serialize_chat(turn)
