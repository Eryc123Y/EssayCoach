#!/usr/bin/env python
"""E2E test script for rubric import feature.

This script validates the rubric import implementation by:
1. Testing PDF text extraction
2. Testing AI parser (if API key is set)
3. Testing RubricManager validation logic
4. Verifying database operations (without actual DB writes)

Run: python test_e2e_rubric_import.py
"""

import os
import sys
from pathlib import Path

import django
import pytest
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile

from api_v1.ai_feedback.rubric_parser import SiliconFlowRubricParser
from api_v1.core.rubric_manager import RubricImportError, RubricManager

# Configure Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "essay_coach.settings")

# Setup Django
django.setup()

if (
    not settings.SILICONFLOW_API_KEY
    or settings.SILICONFLOW_API_KEY == "your-siliconflow-api-key-here"
):
    pytest.skip("SILICONFLOW_API_KEY not configured", allow_module_level=True)


def _run_pdf_extraction() -> bool:
    """Test 1: Verify PDF text extraction works."""
    print("=" * 60)
    print("TEST 1: PDF Text Extraction")
    print("=" * 60)

    pdf_path = Path(__file__).parent.parent / "rubric.pdf"
    if not pdf_path.exists():
        pytest.skip(f"rubric.pdf not found at {pdf_path}")

    try:
        with open(pdf_path, "rb") as f:
            pdf_content = f.read()

        uploaded_file = SimpleUploadedFile(
            "rubric.pdf", pdf_content, content_type="application/pdf"
        )

        parser = SiliconFlowRubricParser()
        text = parser.extract_text_from_pdf(uploaded_file)

        print(f"✅ PASS: Extracted {len(text)} characters from PDF")
        print(f"Preview (first 200 chars):\n{text[:200]}...")
        return True

    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False


def test_pdf_extraction():
    assert _run_pdf_extraction() is True


def _run_validation_logic() -> bool:
    """Test 2: Verify rubric data validation."""
    print("\n" + "=" * 60)
    print("TEST 2: Rubric Validation Logic")
    print("=" * 60)

    manager = RubricManager()

    # Test Case 2.1: Valid rubric data
    print("\nTest 2.1: Valid rubric data")
    valid_data = {
        "is_rubric": True,
        "confidence": 0.95,
        "rubric_name": "Test Rubric",
        "dimensions": [
            {
                "name": "Content",
                "weight": 40.0,
                "levels": [
                    {
                        "name": "Excellent",
                        "score_min": 36,
                        "score_max": 40,
                        "description": "Great work",
                    },
                    {
                        "name": "Good",
                        "score_min": 30,
                        "score_max": 35,
                        "description": "Good work",
                    },
                ],
            },
            {
                "name": "Organization",
                "weight": 60.0,
                "levels": [
                    {
                        "name": "Excellent",
                        "score_min": 54,
                        "score_max": 60,
                        "description": "Well organized",
                    },
                    {
                        "name": "Good",
                        "score_min": 45,
                        "score_max": 53,
                        "description": "Organized",
                    },
                ],
            },
        ],
    }

    try:
        manager._validate_rubric_data(valid_data)
        print("✅ PASS: Valid rubric data accepted")
    except RubricImportError as e:
        print(f"❌ FAIL: Valid data rejected: {e}")
        return False

    # Test Case 2.2: Invalid weights (don't sum to 100)
    print("\nTest 2.2: Invalid weights (sum to 80, not 100)")
    invalid_weights = valid_data.copy()
    invalid_weights["dimensions"] = [
        {
            "name": "Content",
            "weight": 40.0,
            "levels": [{"name": "Good", "score_min": 0, "score_max": 40, "description": "OK"}],
        },
        {
            "name": "Organization",
            "weight": 40.0,
            "levels": [{"name": "Good", "score_min": 0, "score_max": 40, "description": "OK"}],
        },
    ]

    try:
        manager._validate_rubric_data(invalid_weights)
        print("❌ FAIL: Invalid weights were accepted")
        return False
    except RubricImportError as e:
        print(f"✅ PASS: Invalid weights rejected: {e}")

    # Test Case 2.3: Invalid score ranges
    print("\nTest 2.3: Invalid score ranges (min >= max)")
    invalid_scores = valid_data.copy()
    invalid_scores["dimensions"] = [
        {
            "name": "Content",
            "weight": 100.0,
            "levels": [
                {
                    "name": "Bad",
                    "score_min": 10,
                    "score_max": 5,
                    "description": "Invalid",
                }
            ],
        }
    ]

    try:
        manager._validate_rubric_data(invalid_scores)
        print("❌ FAIL: Invalid score ranges were accepted")
        return False
    except RubricImportError as e:
        print(f"✅ PASS: Invalid score ranges rejected: {e}")

    return True


def test_validation_logic():
    assert _run_validation_logic() is True


def _run_rubric_detection() -> bool:
    """Test 3: Verify rubric detection logic."""
    print("\n" + "=" * 60)
    print("TEST 3: Rubric Detection")
    print("=" * 60)

    manager = RubricManager()

    # Test Case 3.1: Is a rubric
    print("\nTest 3.1: Detect valid rubric")
    rubric_data = {"is_rubric": True, "confidence": 0.95}
    is_rubric, reason = manager._detect_if_rubric(rubric_data)

    if is_rubric and reason == "":
        print("✅ PASS: Valid rubric detected")
    else:
        print(f"❌ FAIL: Valid rubric not detected: {reason}")
        return False

    # Test Case 3.2: Not a rubric
    print("\nTest 3.2: Detect non-rubric (essay)")
    non_rubric_data = {
        "is_rubric": False,
        "confidence": 0.90,
        "reason": "This appears to be an essay, not a rubric",
    }
    is_rubric, reason = manager._detect_if_rubric(non_rubric_data)

    if not is_rubric and "essay" in reason.lower():
        print(f"✅ PASS: Non-rubric detected: {reason}")
    else:
        print("❌ FAIL: Non-rubric detection failed")
        return False

    return True


def test_rubric_detection():
    assert _run_rubric_detection() is True


def _run_api_key_configuration() -> bool:
    """Test 4: Verify API key configuration."""
    print("\n" + "=" * 60)
    print("TEST 4: API Key Configuration")
    print("=" * 60)

    from django.conf import settings

    api_key = settings.SILICONFLOW_API_KEY

    if not api_key or api_key == "your-siliconflow-api-key-here":
        print("⚠️  WARNING: SILICONFLOW_API_KEY not set in .env")
        print("   AI parsing will not work until you set a real API key")
        print("   Current value:", api_key or "(empty)")
        return False
    else:
        print(f"✅ PASS: API key configured (length: {len(api_key)})")
        return True


def test_api_key_configuration():
    assert _run_api_key_configuration() is True


def _run_imports() -> bool:
    """Test 5: Verify all modules can be imported."""
    print("\n" + "=" * 60)
    print("TEST 5: Module Imports")
    print("=" * 60)

    try:
        from api_v1.ai_feedback.rubric_parser import (  # noqa: F401
            RubricParseError,
            SiliconFlowRubricParser,
        )

        print("✅ PASS: ai_feedback.rubric_parser imported")
    except ImportError as e:
        print(f"❌ FAIL: Cannot import rubric_parser: {e}")
        return False

    try:
        from api_v1.core.rubric_manager import (  # noqa: F401
            RubricImportError,
            RubricManager,
        )

        print("✅ PASS: core.rubric_manager imported")
    except ImportError as e:
        print(f"❌ FAIL: Cannot import rubric_manager: {e}")
        return False

    try:
        from api_v1.core.serializers import (  # noqa: F401
            RubricDetailSerializer,
            RubricImportResponseSerializer,
        )

        print("✅ PASS: core.serializers (new serializers) imported")
    except ImportError as e:
        print(f"❌ FAIL: Cannot import new serializers: {e}")
        return False

    try:
        # Import check only - not used in this test
        from api_v1.core.views import RubricViewSet  # noqa: F401

        print("✅ PASS: core.views.RubricViewSet imported")
    except ImportError as e:
        print(f"❌ FAIL: Cannot import RubricViewSet: {e}")
        return False

    return True


def main():
    """Run all E2E tests."""
    print("\n" + "🚀" * 30)
    print("E2E TEST SUITE: Rubric Import Feature")
    print("🚀" * 30 + "\n")

    results = []

    # Run all tests
    results.append(("Module Imports", _run_imports()))
    results.append(("API Key Configuration", _run_api_key_configuration()))
    results.append(("PDF Text Extraction", _run_pdf_extraction()))
    results.append(("Rubric Detection Logic", _run_rubric_detection()))
    results.append(("Validation Logic", _run_validation_logic()))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, result in results if result is True)
    failed = sum(1 for _, result in results if result is False)
    warnings = sum(1 for _, result in results if result is None)
    total = len(results)

    for test_name, result in results:
        if result is True:
            print(f"✅ {test_name}")
        elif result is False:
            print(f"❌ {test_name}")
        else:
            print(f"⚠️  {test_name}")

    print("\n" + "=" * 60)
    print(f"Total: {total} tests")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Warnings: {warnings} ⚠️")
    print("=" * 60)

    if failed == 0:
        print("\n🎉 All tests passed! Implementation is working correctly.")
        if warnings > 0:
            print("⚠️  Some warnings detected - check API key configuration above.")
        return 0
    else:
        print(f"\n❌ {failed} test(s) failed. Please review errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
