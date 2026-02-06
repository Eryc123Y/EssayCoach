"""
Root pytest configuration for Django tests.
"""

import os
import sys
from pathlib import Path

# Load environment variables from .env file before Django setup
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

backend_dir = Path(__file__).parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "essay_coach.settings")

import django

django.setup()
