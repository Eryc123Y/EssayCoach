"""Create deterministic data and scores for the local Playwright acceptance gate.

This command is deliberately scoped to the disposable ``essaycoach_e2e``
database.  ``--process-job`` drives the ordinary durable queue with a local
test double; it never starts Codex or calls a remote model.
"""

from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from ai_feedback.codex_provider import ScoringResult
from core.ai_jobs import process_next_job
from core.models import Class, MarkingRubric, RubricItem, RubricLevelDesc, Unit, User

E2E_DOMAIN = "@e2e.essaycoach.example.com"
E2E_ADMIN_EMAIL = "admin" + E2E_DOMAIN
E2E_PASSWORD = "E2EPass123!"
E2E_UNIT_ID = "E2E101"
E2E_BOOTSTRAP_CLASS = "E2E invitation staging class"
E2E_WORKFLOW_CLASS = "E2E Composition Workshop"
E2E_RUBRIC_NAME = "E2E Argument Rubric"
E2E_DATABASE_NAME = "essaycoach_e2e"


@dataclass(frozen=True)
class DeterministicE2EScoringProvider:
    """A queue-compatible test double with fixed, rubric-valid proposals."""

    model: str = "e2e-deterministic-v1"

    def score(self, submission, rubric_snapshot: list[dict]) -> ScoringResult:
        items = [
            {
                "rubric_item_id": item["id"],
                "score": max(0, min(int(item["max_score"]), int(item["max_score"]) - 1)),
                "comment": "Deterministic E2E feedback for this criterion.",
            }
            for item in rubric_snapshot
        ]
        return ScoringResult(
            items=items,
            model=self.model,
            provider_thread_id="e2e-deterministic-thread",
            usage={"test_double": True},
        )


class Command(BaseCommand):
    help = "Seed the disposable E2E database or process one formal job with a deterministic test double"

    def add_arguments(self, parser) -> None:
        parser.add_argument("--process-job", metavar="JOB_ID", help="Process this pending E2E AI job without Codex")

    def handle(self, *args, **options) -> None:
        database_name = settings.DATABASES["default"]["NAME"]
        if database_name not in {E2E_DATABASE_NAME, f"test_{E2E_DATABASE_NAME}"}:
            raise CommandError(f"seed_e2e only runs against {E2E_DATABASE_NAME}; current database is {database_name!r}")
        job_id = options.get("process_job")
        if job_id:
            self._process_job(job_id)
            return
        self._seed()

    def _seed(self) -> None:
        with transaction.atomic():
            # The E2E database is disposable. Limit cleanup to named fixture
            # records so a mistaken invocation stays narrowly scoped.
            User.objects.filter(user_email__endswith=E2E_DOMAIN).delete()
            Class.objects.filter(
                class_name__in=(E2E_BOOTSTRAP_CLASS, E2E_WORKFLOW_CLASS), unit_id_unit_id=E2E_UNIT_ID
            ).delete()
            MarkingRubric.objects.filter(rubric_desc=E2E_RUBRIC_NAME).delete()

            unit, _ = Unit.objects.get_or_create(
                unit_id=E2E_UNIT_ID,
                defaults={"unit_name": "E2E Academic Writing", "unit_desc": "Playwright acceptance fixture"},
            )
            admin = User.objects.create_superuser(
                user_email=E2E_ADMIN_EMAIL,
                password=E2E_PASSWORD,
                user_fname="E2E",
                user_lname="Administrator",
            )
            Class.objects.create(
                unit_id_unit=unit,
                class_name=E2E_BOOTSTRAP_CLASS,
                class_desc="Used only to issue the teaching invitation.",
                class_join_code="E2ESTAGE",
            )
            rubric = MarkingRubric.objects.create(
                user_id_user=admin,
                rubric_desc=E2E_RUBRIC_NAME,
                visibility="public",
            )
            criterion = RubricItem.objects.create(
                rubric_id_marking_rubric=rubric,
                rubric_item_name="Argument and evidence",
                rubric_item_weight="100.0",
            )
            RubricLevelDesc.objects.create(
                rubric_item_id_rubric_item=criterion,
                level_min_score=0,
                level_max_score=10,
                level_desc="A clear claim supported with relevant evidence.",
            )
        self.stdout.write(self.style.SUCCESS("Seeded deterministic E2E admin, course, staging class, and rubric."))

    def _process_job(self, job_id: str) -> None:
        from core.models import AIJob

        job = AIJob.objects.filter(pk=job_id).first()
        if job is None:
            raise CommandError("E2E AI job was not found")
        if job.status != "pending":
            raise CommandError(f"E2E AI job must be pending, got {job.status}")
        job.provider = "e2e_deterministic"
        job.model = DeterministicE2EScoringProvider.model
        job.save(update_fields=["provider", "model"])
        processed = process_next_job(DeterministicE2EScoringProvider())
        if processed is None or str(processed.pk) != str(job.pk):
            raise CommandError("The requested E2E AI job was not processed")
        processed.refresh_from_db()
        if processed.status != "succeeded":
            raise CommandError(f"E2E AI job failed: {processed.error_message}")
        self.stdout.write(self.style.SUCCESS(f"Processed E2E AI job {processed.pk} with deterministic test double."))
