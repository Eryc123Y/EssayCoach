from __future__ import annotations

from ninja import Schema
from pydantic import Field


class BatchDeleteIn(Schema):
    resource: str = Field(..., description="Resource type (users, classes, etc.)")
    ids: list[int] = Field(..., description="List of IDs to delete")


class BatchUpdateIn(Schema):
    resource: str = Field(..., description="Resource type (users, classes, etc.)")
    ids: list[int] = Field(..., description="List of IDs to update")
    fields: dict = Field(..., description="Fields to update")


class BatchOperationOut(Schema):
    success: bool = True
    message: str
    affected_count: int = 0


class ImportIn(Schema):
    resource: str
    format: str = "json"
    data: list[dict]


class ImportOut(Schema):
    success: bool
    message: str
    imported_count: int
    errors: list[str] = []


class ExportOut(Schema):
    success: bool
    message: str
    download_url: str
    format: str
