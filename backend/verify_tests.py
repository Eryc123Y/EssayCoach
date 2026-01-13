#!/usr/bin/env python
"""
Simple syntax verification script for the ai_feedback tests.
This checks that the test file can be parsed correctly by Python.
"""

import ast
import sys


def verify_test_file(file_path):
    """Verify that the test file has valid Python syntax."""
    try:
        with open(file_path, "r") as f:
            code = f.read()

        # Parse the code to check for syntax errors
        ast.parse(code)
        print(f"✅ {file_path} has valid Python syntax")
        return True
    except SyntaxError as e:
        print(f"❌ {file_path} has syntax error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")
        return False


def count_tests(file_path):
    """Count the number of test methods in the file."""
    try:
        with open(file_path, "r") as f:
            code = f.read()

        tree = ast.parse(code)
        test_count = 0
        test_classes = 0

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name.endswith("Tests"):
                test_classes += 1
                for item in node.body:
                    if isinstance(item, ast.FunctionDef) and item.name.startswith(
                        "test_"
                    ):
                        test_count += 1

        print(f"📊 Found {test_classes} test classes with {test_count} test methods")
        return test_count
    except Exception as e:
        print(f"❌ Error counting tests: {e}")
        return 0


def main():
    """Main function to verify the test file."""
    test_file = "ai_feedback/tests.py"

    print("=" * 60)
    print("AI Feedback Test File Verification")
    print("=" * 60)

    # Verify syntax
    if not verify_test_file(test_file):
        sys.exit(1)

    # Count tests
    test_count = count_tests(test_file)

    print("\n" + "=" * 60)
    print("Verification Complete")
    print("=" * 60)

    if test_count > 0:
        print(f"✅ Test file is ready with {test_count} tests")
        return 0
    else:
        print("❌ No tests found")
        return 1


if __name__ == "__main__":
    sys.exit(main())
