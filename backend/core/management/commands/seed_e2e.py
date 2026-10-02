"""Create deterministic data and scores for the local Playwright acceptance gate.

This command is deliberately scoped to the disposable ``essaycoach_e2e``
database.  ``--process-job`` and ``--process-practice`` drive the ordinary
durable queues with local test doubles; they never start Codex or call a
remote model.  ``--fixtures`` adds ready-made accounts, classes and an
assignment for the journey specs that do not exercise invitations.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from ai_feedback.codex_provider import ScoringResult
from ai_feedback.practice_provider import PracticeAnalysisResult
from core.ai_jobs import process_next_job
from core.assessment import task_rubric_snapshot
from core.models import (
    Class,
    CourseLeadAssignment,
    Enrollment,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Task,
    TeachingAssn,
    Unit,
    User,
)
from core.practice import process_next_run

E2E_DOMAIN = "@e2e.essaycoach.example.com"
E2E_ADMIN_EMAIL = "admin" + E2E_DOMAIN
E2E_PASSWORD = "E2EPass123!"
E2E_UNIT_ID = "E2E101"
E2E_BOOTSTRAP_CLASS = "E2E invitation staging class"
E2E_WORKFLOW_CLASS = "E2E Composition Workshop"
E2E_RUBRIC_NAME = "E2E Argument Rubric"
E2E_DATABASE_NAME = "essaycoach_e2e"

# Ready-made journey fixtures (``--fixtures``). Every account shares E2E_PASSWORD.
E2E_JOURNEY_CLASS = "E2E Journeys Class"
E2E_OTHER_CLASS = "E2E Other Lecturer Class"
E2E_JOURNEY_TASK = "E2E Journey Assignment"
E2E_FIXTURE_USERS = {
    "lead": ("lead" + E2E_DOMAIN, "lecturer", "Lena", "Lead"),
    "reviewer": ("reviewer" + E2E_DOMAIN, "lecturer", "Rory", "Reviewer"),
    "outsider": ("outsider" + E2E_DOMAIN, "lecturer", "Owen", "Outsider"),
    "alice": ("alice" + E2E_DOMAIN, "student", "Alice", "Author"),
    "bob": ("bob" + E2E_DOMAIN, "student", "Bob", "Peer"),
}


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


@dataclass(frozen=True)
class DeterministicE2EPracticeProvider:
    """A practice-queue test double returning a fixed, schema-valid report."""

    model: str = "e2e-deterministic-practice-v1"

    def analyze(self, revision) -> PracticeAnalysisResult:
        report = {
            "overall_score": 74,
            "headline": "E2E deterministic practice feedback",
            "general_feedback": "The claim is clear; add one more piece of evidence.",
            "strengths": ["Clear claim"],
            "next_steps": ["Support the claim with a cited source"],
            "skills": {"grammar": 80, "logic": 72, "tone": 75, "structure": 70, "vocabulary": 73},
            "annotations": [],
            "rubric_results": [],
            "claims": [],
        }
        return PracticeAnalysisResult(
            report=report, evidence=[], model=self.model, provider_thread_id="e2e-practice-thread", usage=None
        )


class FailingE2EPracticeProvider:
    """Fails like an unavailable provider so the retry path can be exercised."""

    def analyze(self, revision) -> PracticeAnalysisResult:
        raise RuntimeError("E2E simulated provider outage")


class Command(BaseCommand):
    help = "Seed the disposable E2E database or process one formal job with a deterministic test double"

    def add_arguments(self, parser) -> None:
        parser.add_argument("--process-job", metavar="JOB_ID", help="Process this pending E2E AI job without Codex")
        parser.add_argument("--fixtures", action="store_true", help="Also create the ready-made journey fixtures")
        parser.add_argument(
            "--process-practice",
            choices=["succeed", "fail"],
            help="Process the next pending practice run with a deterministic test double",
        )

    def handle(self, *args, **options) -> None:
        database_name = settings.DATABASES["default"]["NAME"]
        # Parallel runs may use suffixed copies such as essaycoach_e2e_a.
        if not str(database_name).removeprefix("test_").startswith(E2E_DATABASE_NAME):
            raise CommandError(
                f"seed_e2e only runs against {E2E_DATABASE_NAME}* databases; current database is {database_name!r}"
            )
        job_id = options.get("process_job")
        if job_id:
            self._process_job(job_id)
            return
        if options.get("process_practice"):
            self._process_practice(options["process_practice"])
            return
        self._seed()
        if options.get("fixtures"):
            self._seed_fixtures()

    def _seed(self) -> None:
        with transaction.atomic():
            # The E2E database is disposable. Limit cleanup to named fixture
            # records so a mistaken invocation stays narrowly scoped.
            User.objects.filter(user_email__endswith=E2E_DOMAIN).delete()
            Class.objects.filter(
                class_name__in=(E2E_BOOTSTRAP_CLASS, E2E_WORKFLOW_CLASS, E2E_JOURNEY_CLASS, E2E_OTHER_CLASS),
                unit_id_unit_id=E2E_UNIT_ID,
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

    def _seed_fixtures(self) -> None:
        with transaction.atomic():
            unit = Unit.objects.get(unit_id=E2E_UNIT_ID)
            admin = User.objects.get(user_email=E2E_ADMIN_EMAIL)
            users = {
                key: User.objects.create_user(
                    user_email=email,
                    password=E2E_PASSWORD,
                    user_fname=first,
                    user_lname=last,
                    user_role=role,
                    user_status="active",
                )
                for key, (email, role, first, last) in E2E_FIXTURE_USERS.items()
            }
            journeys = Class.objects.create(
                unit_id_unit=unit, class_name=E2E_JOURNEY_CLASS, class_desc="Ready-made journey fixture."
            )
            other = Class.objects.create(
                unit_id_unit=unit, class_name=E2E_OTHER_CLASS, class_desc="Taught only by the outsider lecturer."
            )
            TeachingAssn.objects.create(user_id_user=users["lead"], class_id_class=journeys)
            TeachingAssn.objects.create(user_id_user=users["reviewer"], class_id_class=journeys)
            TeachingAssn.objects.create(user_id_user=users["outsider"], class_id_class=other)
            CourseLeadAssignment.objects.create(user_id_user=users["lead"], unit_id_unit=unit, assigned_by=admin)
            for student in (users["alice"], users["bob"]):
                Enrollment.objects.create(user_id_user=student, class_id_class=journeys, unit_id_unit=unit)
            journeys.class_size = 2
            journeys.save(update_fields=["class_size"])
            rubric = MarkingRubric.objects.get(rubric_desc=E2E_RUBRIC_NAME)
            Task.objects.create(
                unit_id_unit=unit,
                class_id_class=journeys,
                rubric_id_marking_rubric=rubric,
                rubric_snapshot=task_rubric_snapshot(rubric),
                rubric_version=1,
                task_title=E2E_JOURNEY_TASK,
                task_desc="A ready-made assignment for journey specs.",
                task_instructions="State a claim and support it with evidence.",
                task_due_datetime=timezone.now() + timedelta(days=30),
                task_status="published",
            )
        self.stdout.write(self.style.SUCCESS("Seeded E2E journey fixtures."))

    def _process_practice(self, outcome: str) -> None:
        provider = DeterministicE2EPracticeProvider() if outcome == "succeed" else FailingE2EPracticeProvider()
        run = process_next_run(provider)
        if run is None:
            raise CommandError("No pending E2E practice run was found")
        run.refresh_from_db()
        expected = "succeeded" if outcome == "succeed" else "failed"
        if run.status != expected:
            raise CommandError(f"E2E practice run ended {run.status}, expected {expected}")
        self.stdout.write(self.style.SUCCESS(f"Processed E2E practice run {run.pk}: {run.status}."))

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
