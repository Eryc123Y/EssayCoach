from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from django.conf import settings


class DifyClientError(Exception):
    pass


class DifyClient:
    def __init__(self) -> None:
        self.api_key = os.environ.get(
            "DIFY_API_KEY",
            os.environ.get("APP_DIFY_API_KEY", None),
        )
        if not self.api_key:
            raise DifyClientError("DIFY_API_KEY must be set in the environment")

        self.base_url = os.environ.get("DIFY_BASE_URL", "https://api.dify.ai/v1")
        self.default_workflow_id = os.environ.get("DIFY_WORKFLOW_ID")
        self._rubric_upload_cache: Dict[str, str] = {}

    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
        }

    def _raise_for_status(self, response: requests.Response) -> None:
        if not response.ok:
            payload = response.text
            raise DifyClientError(
                f"Dify API returned {response.status_code}: {payload}"
            )

    def upload_file(
        self,
        file_path: Path,
        user: str,
        file_type: str = "PDF",
    ) -> str:
        cache_key = f"{user}:{file_path.name}"
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

    def build_rubric_file_input(self, upload_file_id: str) -> List[Dict[str, Any]]:
        return [
            {
                "transfer_method": "local_file",
                "upload_file_id": upload_file_id,
                "type": "document",
            }
        ]

    def run_workflow(
        self,
        inputs: Dict[str, Any],
        user: str,
        response_mode: str = "blocking",
        workflow_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if response_mode not in {"blocking", "streaming"}:
            raise DifyClientError("response_mode must be 'blocking' or 'streaming'")

        payload: Dict[str, Any] = {
            "inputs": inputs,
            "response_mode": response_mode,
            "user": user,
        }
        if trace_id:
            payload["trace_id"] = trace_id

        if workflow_id:
            url = f"{self.base_url}/workflows/{workflow_id}/run"
        else:
            url = f"{self.base_url}/workflows/run"

        response = requests.post(
            url,
            headers={**self.headers, "Content-Type": "application/json"},
            data=json.dumps(payload),
        )
        self._raise_for_status(response)
        return response.json()

    def get_workflow_run(self, workflow_run_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/workflows/run/{workflow_run_id}"
        response = requests.get(url, headers={**self.headers, "Content-Type": "application/json"})
        self._raise_for_status(response)
        return response.json()

    def get_rubric_upload_id(self, user: str) -> str:
        rubric_path = Path(settings.BASE_DIR) / "rubric.pdf"
        return self.upload_file(rubric_path, user)
