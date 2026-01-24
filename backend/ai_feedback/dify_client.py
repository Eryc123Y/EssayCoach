"""
Dify client adapter implementing EssayAgentInterface.

This module provides a DifyClient that implements the EssayAgentInterface,
enabling seamless switching between Dify and other AI providers.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import requests

from core.models import MarkingRubric, RubricItem

from .exceptions import (
    APIServerError,
    APITimeoutError,
    ConfigurationError,
    EssayAgentError,
    RubricError,
    WorkflowError,
)
from .interfaces import (
    EssayAgentInterface,
    RubricInput,
    RubricProcessorInterface,
    WorkflowInput,
    WorkflowOutput,
)
from .response_transformer import DifyResponseTransformer


class DifyClient(EssayAgentInterface, RubricProcessorInterface):
    """
    Dify client implementing EssayAgentInterface.

    This class provides a complete implementation of EssayAgentInterface
    for the Dify AI provider, with full compatibility with the existing
    Dify API.
    """

    def __init__(self) -> None:
        self.api_key = os.environ.get(
            "DIFY_API_KEY",
            os.environ.get("APP_DIFY_API_KEY", os.environ.get("DIFY_API", None)),
        )
        if not self.api_key:
            raise ConfigurationError(
                message="DIFY_API_KEY must be set in the environment",
                config_key="DIFY_API_KEY",
            )

        self.base_url = os.environ.get("DIFY_BASE_URL", "https://api.dify.ai/v1")
        self._rubric_upload_cache: dict[str, str] = {}
        self._transformer = DifyResponseTransformer()

    @property
    def provider_name(self) -> str:
        return "dify"

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    @property
    def headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
        }

    def _raise_for_status(self, response: requests.Response) -> None:
        if not response.ok:
            payload = response.text
            raise APIServerError(
                message=f"Dify API returned {response.status_code}: {payload}",
                status_code=response.status_code,
                original_error=None,
            )

    # === EssayAgentInterface Implementation ===

    def analyze_essay(self, inputs: WorkflowInput) -> WorkflowOutput:
        """
        Analyze an essay using Dify workflow.

        This method implements the EssayAgentInterface.analyze_essay() method
        using the Dify API.
        """
        try:
            # Build rubric input
            rubric_input = RubricInput(
                rubric_id=inputs.rubric_id,
                user_id=inputs.user_id,
            )
            rubric_structure = self.build_rubric_input(rubric_input)

            # Build workflow inputs
            workflow_inputs = {
                "essay_question": inputs.essay_question,
                "essay_content": inputs.essay_content,
                "language": inputs.language,
                "essay_rubric": rubric_structure,
            }

            # Run workflow
            result = self.run_workflow(
                inputs=workflow_inputs,
                user=inputs.user_id,
                response_mode=inputs.response_mode.value,
            )

            return self._transformer.to_workflow_output(result)

        except EssayAgentError:
            raise
        except Exception as e:
            raise WorkflowError(
                message=f"Failed to analyze essay: {str(e)}",
                recoverable=True,
                original_error=e,
            )

    def get_workflow_status(self, run_id: str) -> WorkflowOutput:
        """Get the status of a Dify workflow run."""
        try:
            result = self.get_workflow_run(run_id)
            return self._transformer.to_workflow_output(result)
        except EssayAgentError:
            raise
        except Exception as e:
            raise WorkflowError(
                message=f"Failed to get workflow status: {str(e)}",
                run_id=run_id,
                recoverable=True,
                original_error=e,
            )

    def upload_file(
        self,
        file_path: Path,
        user_id: str,
        file_type: str = "PDF",
    ) -> str:
        """Upload a file to Dify."""
        import hashlib

        # Use hash of content + user for the cache key
        file_hash = hashlib.md5(file_path.read_bytes()).hexdigest()
        cache_key = f"{user_id}:{file_hash}"

        if cache_key in self._rubric_upload_cache:
            return self._rubric_upload_cache[cache_key]

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        url = f"{self.base_url}/files/upload"
        with file_path.open("rb") as fp:
            files = {
                "file": (file_path.name, fp, "application/pdf"),
            }
            data = {
                "user": user_id,
                "type": file_type,
            }
            response = requests.post(url, headers=self.headers, files=files, data=data)

        self._raise_for_status(response)
        body = response.json()
        upload_id = body.get("id")
        if not upload_id:
            raise RubricError(
                message="Dify upload response missing upload ID",
                recoverable=False,
            )

        self._rubric_upload_cache[cache_key] = upload_id
        return upload_id

    def cancel_workflow(self, run_id: str) -> bool:
        """Cancel a running Dify workflow."""
        # Dify doesn't provide a cancel endpoint in the current API
        # This is a placeholder for future implementation
        return False

    def health_check(self) -> bool:
        """Check if Dify API is accessible."""
        try:
            url = f"{self.base_url}/workflows"
            response = requests.get(url, headers=self.headers, timeout=10)
            return response.ok
        except requests.exceptions.RequestException:
            return False

    # === Dify-Specific Methods ===

    def run_workflow(
        self,
        inputs: dict[str, Any],
        user: str,
        response_mode: str = "blocking",
        trace_id: str | None = None,
    ) -> dict[str, Any]:
        """Run a Dify workflow."""
        if response_mode not in {"blocking", "streaming"}:
            raise ValueError("response_mode must be 'blocking' or 'streaming'")

        payload: dict[str, Any] = {
            "inputs": inputs,
            "response_mode": response_mode,
            "user": user,
        }
        if trace_id:
            payload["trace_id"] = trace_id

        url = f"{self.base_url}/workflows/run"

        try:
            response = requests.post(
                url,
                headers={**self.headers, "Content-Type": "application/json"},
                data=json.dumps(payload),
                timeout=300,  # 5 minute timeout for blocking calls
            )
        except requests.exceptions.Timeout:
            raise APITimeoutError(
                timeout_seconds=300,
                original_error=None,
            )

        self._raise_for_status(response)
        return response.json()

    def get_workflow_run(self, workflow_run_id: str) -> dict[str, Any]:
        """Get the status and result of a workflow run."""
        url = f"{self.base_url}/workflows/run/{workflow_run_id}"
        response = requests.get(
            url,
            headers={**self.headers, "Content-Type": "application/json"},
        )
        self._raise_for_status(response)
        return response.json()

    # === RubricProcessorInterface Implementation ===

    def build_rubric_input(self, rubric_input: RubricInput) -> dict[str, Any]:
        """Build rubric input structure for Dify."""
        user_id = rubric_input.user_id or "essaycoach-service"

        # If no rubric_id provided, find first available rubric for user
        rubric_id = rubric_input.rubric_id
        if rubric_id is None:
            rubric = MarkingRubric.objects.filter(user_id_user=user_id).order_by("-rubric_create_time").first()

            if not rubric:
                raise RubricError(
                    message=(
                        "No rubrics found in your library. "
                        "Please upload a rubric first before submitting essays for analysis."
                    ),
                    recoverable=False,
                )

            return self._build_rubric_from_database(rubric, user_id)

        # If rubric_id is provided, get the rubric object first
        try:
            rubric = MarkingRubric.objects.get(rubric_id=rubric_id)
        except MarkingRubric.DoesNotExist:
            raise RubricError(
                message=f"Rubric with ID {rubric_id} not found in your library.",
                rubric_id=rubric_id,
                recoverable=False,
            )

        return self._build_rubric_from_database(rubric, user_id)

    def validate_rubric(self, rubric_id: int) -> bool:
        """Validate that a rubric exists and has required fields."""
        try:
            rubric = MarkingRubric.objects.get(rubric_id=rubric_id)
            items = RubricItem.objects.filter(rubric_id_marking_rubric=rubric.rubric_id).prefetch_related(
                "level_descriptions"
            )
            return items.exists()
        except MarkingRubric.DoesNotExist:
            return False

    # === Helper Methods ===

    def _build_rubric_from_database(self, rubric: MarkingRubric, user: str) -> dict[str, Any]:
        """Build rubric structure from database model."""
        rubric_items = RubricItem.objects.filter(rubric_id_marking_rubric=rubric.rubric_id).prefetch_related(
            "level_descriptions"
        )

        if not rubric_items.exists():
            raise RubricError(
                message=(
                    f"No rubric items found for rubric ID {rubric.rubric_id}. This rubric may be empty or corrupted."
                ),
                rubric_id=rubric.rubric_id,
                recoverable=False,
            )

        # Build rubric text representation
        rubric_text = self._format_rubric_text(rubric, rubric_items)

        # Upload as a temporary text file
        import tempfile

        with tempfile.NamedTemporaryFile(
            mode="w+", suffix=".txt", delete=False, prefix=f"rubric_{rubric.rubric_id}_"
        ) as temp:
            temp.write(rubric_text)
            temp_path = Path(temp.name)

        try:
            upload_id = self.upload_file(temp_path, user)

            # Return the Dify file input structure
            return {
                "transfer_method": "local_file",
                "upload_file_id": upload_id,
                "type": "document",
            }
        except Exception as e:
            raise RubricError(
                message=f"Failed to build rubric from database: {str(e)}",
                rubric_id=rubric.rubric_id,
                recoverable=True,
                original_error=e,
            )
        finally:
            if temp_path.exists():
                temp_path.unlink()

    def _format_rubric_text(
        self,
        rubric: MarkingRubric,
        rubric_items: Any,
    ) -> str:
        """Format rubric as text for Dify document understanding."""
        lines = [
            f"Rubric: {rubric.rubric_desc or 'Untitled Rubric'}",
            "",
            "Evaluation Criteria:",
            "",
        ]

        for item in rubric_items:
            lines.append(f"{item.rubric_item_name} (Weight: {item.rubric_item_weight}%)")

            for level in item.level_descriptions.all():
                score_range = f"{level.level_min_score}-{level.level_max_score}"
                lines.append(f"  - {score_range} pts: {level.level_desc}")

            lines.append("")

        return "\n".join(lines)

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

    def get_or_create_rubric_upload(self, user: str, rubric_id: int | None) -> dict[str, Any]:
        """
        Get existing upload ID or create new one from database rubric.

        This is a convenience method that wraps build_rubric_input().
        """
        return self.build_rubric_input(RubricInput(rubric_id=rubric_id, user_id=user))
