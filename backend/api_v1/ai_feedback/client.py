from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import requests

from api_v1.core.models import MarkingRubric, RubricItem


class DifyClientError(Exception):
    pass


class DifyClient:
    def __init__(self) -> None:
        self.api_key = os.environ.get(
            "DIFY_API_KEY",
            os.environ.get("APP_DIFY_API_KEY", os.environ.get("DIFY_API", None)),
        )
        if not self.api_key:
            raise DifyClientError("DIFY_API_KEY must be set in the environment")

        self.base_url = os.environ.get("DIFY_BASE_URL", "https://api.dify.ai/v1")
        self._rubric_upload_cache: dict[str, str] = {}

    @property
    def headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
        }

    def _raise_for_status(self, response: requests.Response) -> None:
        if not response.ok:
            payload = response.text
            raise DifyClientError(f"Dify API returned {response.status_code}: {payload}")

    def upload_file(
        self,
        file_path: Path,
        user: str,
        file_type: str = "PDF",
    ) -> str:
        import hashlib

        # Use hash of content + user for the cache key
        file_hash = hashlib.md5(file_path.read_bytes()).hexdigest()
        cache_key = f"{user}:{file_hash}"

        if cache_key in self._rubric_upload_cache:
            return self._rubric_upload_cache[cache_key]

        if not file_path.exists():
            raise DifyClientError(f"File not found: {file_path}")

        url = f"{self.base_url}/files/upload"
        with file_path.open("rb") as fp:
            files = {
                "file": (file_path.name, fp, "application/pdf"),
            }
            data = {
                "user": user,
                "type": file_type,
            }
            response = requests.post(url, headers=self.headers, files=files, data=data)

        self._raise_for_status(response)
        body = response.json()
        upload_id = body.get("id")
        if not upload_id:
            raise DifyClientError("Dify upload response missing id")

        self._rubric_upload_cache[cache_key] = upload_id
        return upload_id

    def build_rubric_file_input(self, upload_file_id: str) -> dict[str, Any]:
        return {
            "transfer_method": "local_file",
            "upload_file_id": upload_file_id,
            "type": "document",
        }

    def run_workflow(
        self,
        inputs: dict[str, Any],
        user: str,
        response_mode: str = "blocking",
        trace_id: str | None = None,
    ) -> dict[str, Any]:
        if response_mode not in {"blocking", "streaming"}:
            raise DifyClientError("response_mode must be 'blocking' or 'streaming'")

        payload: dict[str, Any] = {
            "inputs": inputs,
            "response_mode": response_mode,
            "user": user,
        }
        if trace_id:
            payload["trace_id"] = trace_id

        url = f"{self.base_url}/workflows/run"

        response = requests.post(
            url,
            headers={**self.headers, "Content-Type": "application/json"},
            data=json.dumps(payload),
        )
        self._raise_for_status(response)
        return response.json()

    def get_workflow_run(self, workflow_run_id: str) -> dict[str, Any]:
        url = f"{self.base_url}/workflows/run/{workflow_run_id}"
        response = requests.get(url, headers={**self.headers, "Content-Type": "application/json"})
        self._raise_for_status(response)
        return response.json()

    def upload_rubric_content(self, content: str, filename: str, user: str) -> str:
        """Upload rubric content as a temporary file."""
        import tempfile

        with tempfile.NamedTemporaryFile(mode="w+", suffix=".txt", delete=False) as temp:
            temp.write(content)
            temp_path = Path(temp.name)

        try:
            return self.upload_file(temp_path, user)
        finally:
            if temp_path.exists():
                temp_path.unlink()

    def build_rubric_from_database(self, rubric: MarkingRubric, user: str) -> dict[str, Any]:
        """
        Build rubric input for Dify from database MarkingRubric model.

        Args:
            rubric: MarkingRubric model instance with rubric items and levels
            user: User identifier for Dify upload

        Returns:
            Dictionary with rubric structure compatible with Dify's document understanding

        Raises:
            DifyClientError: If rubric data cannot be retrieved or built
        """
        # Build rubric structure from database
        rubric_items = RubricItem.objects.filter(
            rubric_id_marking_rubric=rubric.rubric_id
        ).prefetch_related("level_descriptions")

        if not rubric_items.exists():
            raise DifyClientError(
                f"No rubric items found for rubric ID {rubric.rubric_id}. "
                "This rubric may be empty or corrupted."
            )

        dimensions = []
        for item in rubric_items:
            levels = []
            for level in item.level_descriptions.all():
                levels.append(
                    {
                        "name": level.level_desc,
                        "score_range": f"{level.level_min_score}-{level.level_max_score}",
                        "min_score": level.level_min_score,
                        "max_score": level.level_max_score,
                    }
                )

            dimensions.append(
                {
                    "name": item.rubric_item_name,
                    "weight": float(item.rubric_item_weight),
                    "levels": levels,
                }
            )

        rubric_text = f"""
Rubric: {rubric.rubric_desc}

Evaluation Criteria:
"""

        for dim in dimensions:
            rubric_text += f"\n{dim['name']} ({dim['weight']}%)\n"
            for level in dim["levels"]:
                rubric_text += f"  - {level['score_range']} pts: {level['name']}\n"

        # Upload as a temporary text file
        import tempfile

        with tempfile.NamedTemporaryFile(
            mode="w+", suffix=".txt", delete=False, prefix=f"rubric_{rubric.rubric_id}_"
        ) as temp:
            temp.write(rubric_text)
            temp_path = Path(temp.name)

        try:
            upload_id = self.upload_file(temp_path, user)
            print(f"DEBUG: Rubric uploaded with ID: {upload_id}")

            # Return the Dify file input structure
            return {
                "transfer_method": "local_file",
                "upload_file_id": upload_id,
                "type": "document",
            }
        except Exception as e:
            print(f"ERROR: Failed to upload rubric: {e}")
            raise DifyClientError(f"Failed to build rubric from database: {e}")
        finally:
            if temp_path.exists():
                temp_path.unlink()

    def get_or_create_rubric_upload(self, user: str, rubric_id: int | None) -> dict[str, Any]:
        """
        Get existing upload ID or create new one from database rubric.

        Args:
            user: User identifier
            rubric_id: Database rubric ID (or None to use first/default)

        Returns:
            Dictionary with rubric structure for Dify input

        Raises:
            DifyClientError: If no rubrics exist in database with detailed guidance
        """
        # If no rubric_id provided, find first available rubric for user
        if rubric_id is None:
            rubric = (
                MarkingRubric.objects.filter(user_id_user=user)
                .order_by("-rubric_create_time")
                .first()
            )

            if not rubric:
                raise DifyClientError(
                    "No rubrics found in your library. "
                    "Please upload a rubric first before submitting essays for analysis. "
                    "Go to Rubric Library → Upload Rubric → Return to submit essay."
                )

            print(f"DEBUG: Using first available rubric ID: {rubric.rubric_id}")
            # Pass the MarkingRubric object, not the ID
            return self.build_rubric_from_database(rubric, user)

        # If rubric_id is provided, get the rubric object first
        try:
            rubric = MarkingRubric.objects.get(rubric_id=rubric_id)
        except MarkingRubric.DoesNotExist:
            raise DifyClientError(
                f"Rubric with ID {rubric_id} not found in your library. "
                "Please select a valid rubric from the dropdown."
            )

        print(f"DEBUG: Using provided rubric ID: {rubric_id}")
        # Pass the MarkingRubric object, not the ID
        return self.build_rubric_from_database(rubric, user)
