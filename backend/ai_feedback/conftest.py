"""
Pytest configuration for Django tests in the ai_feedback app.
"""

import os
import django
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).resolve().parent.parent
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "essay_coach.settings")
os.environ["DJANGO_SETTINGS_MODULE"] = "essay_coach.settings"

# Setup Django before importing anything that requires it
django.setup()

import pytest
from django.conf import settings


def pytest_configure(config):
    """Configure pytest with Django settings."""
    from django.test.utils import get_runner

    # Use the same settings as manage.py
    os.environ["DJANGO_SETTINGS_MODULE"] = "essay_coach.settings"

    # Ensure the database is configured for testing
    if hasattr(django.conf.settings, "DATABASES"):
        # Use SQLite for testing if PostgreSQL is not available
        django.conf.settings.DATABASES["default"] = {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }


def pytest_collection_modifyitems(config, items):
    """Add pytest-django markers."""
    for item in items:
        # Add django_db marker to all test functions
        if hasattr(item, "obj") and item.obj:
            if item.name.startswith("test_"):
                item.add_marker(pytest.mark.django_db)
