"""
Root pytest configuration for Django tests.
"""

import os
import pytest
from unittest.mock import patch

# Set this BEFORE importing django or settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "essay_coach.settings")


def pytest_configure(config):
    """Configure pytest to use SQLite for tests."""
    from django.conf import settings

    # Configure SQLite for testing to avoid dependency on real Postgres
    settings.DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
        "ATOMIC_REQUESTS": False,
    }

    # Mock RunSQL to avoid Postgres-specific triggers during SQLite tests
    from django.db.migrations.operations.special import RunSQL

    original_database_forwards = RunSQL.database_forwards

    def mocked_database_forwards(self, app_label, schema_editor, from_state, to_state):
        if schema_editor.connection.vendor == "sqlite":
            # Skip Postgres-specific SQL in SQLite
            if any(
                pg_keyword in self.sql.upper()
                for pg_keyword in ["FUNCTION", "TRIGGER", "PLPGSQL", "DO"]
            ):
                return
        return original_database_forwards(
            self, app_label, schema_editor, from_state, to_state
        )

    RunSQL.database_forwards = mocked_database_forwards
