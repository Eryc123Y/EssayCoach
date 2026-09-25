"""Run the local durable AI scoring worker."""

from __future__ import annotations

import time

from django.core.management.base import BaseCommand
from django.utils import timezone
from opentelemetry import trace

from core.ai_jobs import process_next_job
from core.models import WorkerHeartbeat
from core.practice import process_next_run
from core.practice_chat import process_next_turn


class Command(BaseCommand):
    help = "Process EssayCoach formal scoring and practice jobs using the local ChatGPT-signed-in Codex runtime"

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true", help="Process at most one job and exit")
        parser.add_argument("--poll-seconds", type=float, default=2.0)

    def handle(self, *args, **options):
        once = options["once"]
        poll_seconds = max(0.2, options["poll_seconds"])
        try:
            while True:
                job = self._process("formal", process_next_job)
                practice_run = self._process("practice", process_next_run)
                chat_turn = self._process("chat", process_next_turn)
                processed = sum(item is not None for item in (job, practice_run, chat_turn))
                heartbeat, _ = WorkerHeartbeat.objects.get_or_create(
                    pk=1, defaults={"last_seen_at": timezone.now()}
                )
                heartbeat.last_seen_at = timezone.now()
                heartbeat.processed_jobs += processed
                heartbeat.save(update_fields=["last_seen_at", "processed_jobs"])
                if once:
                    return
                if job is None and practice_run is None and chat_turn is None:
                    time.sleep(poll_seconds)
        except KeyboardInterrupt:
            self.stdout.write("AI worker stopped")

    @staticmethod
    def _process(kind, process):
        tracer = trace.get_tracer("essaycoach.worker")
        with tracer.start_as_current_span(f"ai.{kind}") as span:
            item = process()
            if item is not None:
                item.refresh_from_db()
                span.set_attribute("job.kind", kind)
                span.set_attribute("job.id", str(item.pk))
                span.set_attribute("job.status", item.status)
                span.set_attribute("job.attempts", item.attempts)
                span.set_attribute("job.error_category", item.error_category)
                span.set_attribute("ai.model", item.model)
                span.set_attribute("ai.provider", getattr(item, "provider", "codex"))
            return item
