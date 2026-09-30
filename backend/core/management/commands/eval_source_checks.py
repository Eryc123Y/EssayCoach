"""Evaluate practice source checks on a labelled bilingual claim set (uses real Codex)."""

from __future__ import annotations

import argparse

from django.core.management.base import BaseCommand, CommandError

from ai_feedback.evaluation.run_source_eval import add_arguments, execute
from ai_feedback.evaluation.scoring import CaseError


class Command(BaseCommand):
    help = "Evaluate practice source checks on a labelled bilingual claim set (calls the real Codex runtime)"

    def add_arguments(self, parser):
        add_arguments(parser)

    def handle(self, *args, **options):
        try:
            code = execute(argparse.Namespace(**options), out=self.stdout.write)
        except CaseError as exc:
            raise CommandError(str(exc)) from exc
        if code:
            raise SystemExit(code)
