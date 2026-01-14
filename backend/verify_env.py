import os
import sys
from pathlib import Path


def check_env():
    print("Checking backend environment configuration...")

    # Check .env file existence
    env_path = Path(".env")
    if env_path.exists():
        print("✅ .env file found at root")
    else:
        print("❌ .env file NOT found at root")

    # Check variables (we simulate loading or check os.environ if loaded)
    # Since this script runs standalone, we need to load .env manually or expect user to run with it loaded
    # But usually devs use direnv or python-dotenv

    required_keys = ["DIFY_API_KEY", "DIFY_BASE_URL"]

    # Check keys present in file content (safe check)
    if env_path.exists():
        content = env_path.read_text()
        for key in required_keys:
            if f"{key}=" in content:
                print(f"✅ {key} is present in .env")
            elif key == "DIFY_API_KEY" and "DIFY_API=" in content:
                print(f"⚠️ DIFY_API found (supported fallback for DIFY_API_KEY)")
            else:
                print(f"❌ {key} is MISSING in .env")

    print("\nRubric Check:")
    if Path("rubric.pdf").exists():
        print("✅ rubric.pdf found")
    else:
        print("❌ rubric.pdf MISSING")


if __name__ == "__main__":
    check_env()
