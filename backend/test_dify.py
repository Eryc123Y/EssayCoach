import os
import sys
import django
from pathlib import Path

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "essay_coach.settings")
django.setup()

from ai_feedback.client import DifyClient


def test_dify():
    print("Testing Dify Integration...")
    try:
        client = DifyClient()
        print(f"API Key: {client.api_key[:5]}...")

        # Test 1: Upload Rubric
        print("\n1. Uploading Rubric...")
        # Path to rubric in repo root
        rubric_path = Path(__file__).parent.parent / "rubric.pdf"
        print(f"Looking for rubric at: {rubric_path}")

        if not rubric_path.exists():
            print("ERROR: Rubric file not found!")
            return

        # USE INTEGER USER ID TO REPRODUCE ISSUE
        user_id = 1

        upload_id = client.upload_file(rubric_path, user_id)
        print(f"Upload ID: {upload_id}")

        # Test 2: Run Workflow
        print("\n2. Running Workflow...")
        inputs = {
            "essay_question": "Write an essay about AI.",
            "essay_content": "AI is changing the world.",
            "language": "English",
            "essay_rubric": client.build_rubric_file_input(upload_id),
        }

        result = client.run_workflow(
            inputs=inputs, user=user_id, response_mode="blocking"
        )

        print("\nWorkflow Result:")
        print(f"Status: {result.get('status')}")
        if result.get("status") != "succeeded":
            print(f"Full Result: {result}")
        else:
            outputs = result.get("data", {}).get("outputs")
            print(f"Outputs keys: {outputs.keys() if outputs else 'None'}")

    except Exception as e:
        print(f"\nERROR: {e}")


if __name__ == "__main__":
    test_dify()
