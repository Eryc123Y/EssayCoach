"""Read and retry durable local AI scoring jobs."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from django.http import HttpRequest
from ninja import Router, Schema
from ninja.errors import HttpError

from api_v2.utils.auth import JWTAuth
from api_v2.utils.course_scope import require_manage_task
from core.ai_jobs import retry_failed_job
from core.assessment import AssessmentError
from core.models import AIJob, Submission

router = Router(tags=["AI Jobs"], auth=JWTAuth())


class AIJobOut(Schema):
    job_id: UUID
    status: str
    attempts: int
    model: str
    error_category: str | None
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None
    result: dict | None
    usage: dict | None


def _visible_job(request: HttpRequest, job_id: UUID) -> tuple[AIJob, bool]:
    job = AIJob.objects.select_related("submission__task_id_task").filter(pk=job_id).first()
    if job is None:
        raise HttpError(404, "AI job not found")
    actor = request.auth
    if actor.user_role == "student":
        if job.submission.user_id_user_id != actor.pk:
            raise HttpError(403, "AI job is outside your scope")
        return job, True
    require_manage_task(actor, job.submission.task_id_task)
    return job, False


def _serialize(job: AIJob, *, student: bool) -> AIJobOut:
    return AIJobOut(
        job_id=job.pk,
        status=job.status,
        attempts=job.attempts,
        model=job.model,
        error_category=job.error_category or None,
        error_message=job.error_message or None,
        created_at=job.created_at,
        started_at=job.started_at,
        finished_at=job.finished_at,
        result=None if student else job.result,
        usage=None if student else job.usage,
    )


@router.get("/jobs/submission/{submission_id}/", response=AIJobOut)
def get_submission_ai_job(request: HttpRequest, submission_id: int):
    submission = Submission.objects.select_related("task_id_task").filter(pk=submission_id).first()
    if submission is None:
        raise HttpError(404, "Submission not found")
    actor = request.auth
    if actor.user_role == "student":
        if submission.user_id_user_id != actor.pk:
            raise HttpError(404, "AI job not found")
    else:
        require_manage_task(actor, submission.task_id_task)
    job = AIJob.objects.filter(submission=submission).first()
    if job is None:
        raise HttpError(404, "AI job not found")
    return _serialize(job, student=actor.user_role == "student")


@router.get("/jobs/{job_id}/", response=AIJobOut)
def get_ai_job(request: HttpRequest, job_id: UUID):
    job, student = _visible_job(request, job_id)
    return _serialize(job, student=student)


@router.post("/jobs/{job_id}/retry/", response=AIJobOut)
def retry_ai_job(request: HttpRequest, job_id: UUID):
    job, student = _visible_job(request, job_id)
    if student:
        raise HttpError(403, "Only teaching staff may retry formal scoring")
    try:
        job = retry_failed_job(job.pk)
    except AssessmentError as exc:
        raise HttpError(409, str(exc)) from exc
    return _serialize(job, student=False)
