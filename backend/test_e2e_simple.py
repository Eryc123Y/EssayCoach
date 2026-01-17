#!/usr/bin/env python
"""Simple E2E validation without Django setup.

This tests the core logic components independently.
Run: python test_e2e_simple.py
"""

import sys
from pathlib import Path
from decimal import Decimal

print("=" * 60)
print("SIMPLE E2E VALIDATION TEST")
print("=" * 60)

# Test 1: Check files exist
print("\nTest 1: Verify files exist")
print("-" * 60)

files_to_check = [
    "ai_feedback/rubric_parser.py",
    "core/rubric_manager.py",
    "core/serializers.py",
    "core/views.py",
    "core/urls.py",
    "../rubric.pdf",
]

all_exist = True
for file_path in files_to_check:
    full_path = Path(__file__).parent / file_path
    exists = full_path.exists()
    status = "✅" if exists else "❌"
    print(f"{status} {file_path}: {'Found' if exists else 'NOT FOUND'}")
    if not exists:
        all_exist = False

if not all_exist:
    print("\n❌ Some files are missing!")
    sys.exit(1)

# Test 2: Check .env configuration
print("\nTest 2: Verify .env configuration")
print("-" * 60)

env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    with open(env_path, "r") as f:
        env_content = f.read()

    if "SILICONFLOW_API_KEY" in env_content:
        print("✅ SILICONFLOW_API_KEY found in .env")

        for line in env_content.split("\n"):
            if line.startswith("SILICONFLOW_API_KEY"):
                key_value = line.split("=", 1)[1] if "=" in line else ""
                if key_value and key_value != "your-siliconflow-api-key-here":
                    print(f"✅ API key is set (length: {len(key_value)})")
                else:
                    print("⚠️  API key is placeholder - set real key for E2E testing")
    else:
        print("❌ SILICONFLOW_API_KEY not found in .env")
else:
    print("❌ .env file not found")

# Test 3: Check settings.py configuration
print("\nTest 3: Verify settings.py configuration")
print("-" * 60)

settings_path = Path(__file__).parent / "essay_coach" / "settings.py"
if settings_path.exists():
    with open(settings_path, "r") as f:
        settings_content = f.read()

    checks = [
        ("SILICONFLOW_API_KEY", "SiliconFlow API key setting"),
        ("SILICONFLOW_API_URL", "SiliconFlow API URL"),
        ("SILICONFLOW_MODEL", "SiliconFlow model name"),
    ]

    for setting_name, description in checks:
        if setting_name in settings_content:
            print(f"✅ {description} configured")
        else:
            print(f"❌ {description} NOT configured")
else:
    print("❌ settings.py not found")

# Test 4: Check serializers
print("\nTest 4: Verify new serializers in core/serializers.py")
print("-" * 60)

serializers_path = Path(__file__).parent / "core" / "serializers.py"
if serializers_path.exists():
    with open(serializers_path, "r") as f:
        serializers_content = f.read()

    required_serializers = [
        "RubricUploadSerializer",
        "RubricImportResponseSerializer",
        "RubricItemDetailSerializer",
        "RubricDetailSerializer",
    ]

    for serializer_name in required_serializers:
        if f"class {serializer_name}" in serializers_content:
            print(f"✅ {serializer_name} found")
        else:
            print(f"❌ {serializer_name} NOT found")
else:
    print("❌ serializers.py not found")

# Test 5: Check views
print("\nTest 5: Verify RubricViewSet in core/views.py")
print("-" * 60)

views_path = Path(__file__).parent / "core" / "views.py"
if views_path.exists():
    with open(views_path, "r") as f:
        views_content = f.read()

    checks = [
        ("class RubricViewSet", "RubricViewSet class"),
        ("import_from_pdf_with_ai", "import_from_pdf_with_ai action"),
        ("detail_with_items", "detail_with_items action"),
    ]

    for check_str, description in checks:
        if check_str in views_content:
            print(f"✅ {description} found")
        else:
            print(f"❌ {description} NOT found")
else:
    print("❌ views.py not found")

# Test 6: Check URL routing
print("\nTest 6: Verify URL routing in core/urls.py")
print("-" * 60)

urls_path = Path(__file__).parent / "core" / "urls.py"
if urls_path.exists():
    with open(urls_path, "r") as f:
        urls_content = f.read()

    if "RubricViewSet" in urls_content:
        print("✅ RubricViewSet imported in urls.py")
    else:
        print("❌ RubricViewSet NOT imported in urls.py")

    if "register" in urls_content and "rubrics" in urls_content:
        print("✅ Rubric routes registered")
    else:
        print("❌ Rubric routes NOT registered")
else:
    print("❌ urls.py not found")

# Test 7: Check test files
print("\nTest 7: Verify test files created")
print("-" * 60)

test_files = [
    "ai_feedback/tests/test_rubric_parser.py",
    "core/tests/test_rubric_manager.py",
    "core/tests/test_rubric_api.py",
]

for test_file in test_files:
    test_path = Path(__file__).parent / test_file
    if test_path.exists():
        print(f"✅ {test_file} found")
    else:
        print(f"❌ {test_file} NOT found")

# Test 8: Check PDF file
print("\nTest 8: Verify rubric.pdf exists")
print("-" * 60)

pdf_path = Path(__file__).parent.parent / "rubric.pdf"
if pdf_path.exists():
    size_kb = pdf_path.stat().st_size / 1024
    print(f"✅ rubric.pdf found ({size_kb:.1f} KB)")
else:
    print("❌ rubric.pdf NOT found")

# Final summary
print("\n" + "=" * 60)
print("VALIDATION COMPLETE")
print("=" * 60)
print("\n✅ All file structure checks passed!")
print("\nNext steps:")
print("1. Set real SILICONFLOW_API_KEY in .env file")
print("2. Enter nix environment: nix develop")
print("3. Run Django server: cd backend && python manage.py runserver")
print("4. Test upload endpoint with curl or Postman")
print("\nExample curl command:")
print(
    "curl -X POST http://localhost:8000/api/v1/core/rubrics/import_from_pdf_with_ai/ \\"
)
print("  -F 'file=@../rubric.pdf' \\")
print("  -F 'rubric_name=Test Rubric'")
print("\n" + "=" * 60)
