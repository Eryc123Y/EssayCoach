from __future__ import annotations

import csv
import io
import json
import os
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, List

from django.conf import settings
from django.db import transaction
from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from api_v1.core.models import (
    Class,
    Enrollment,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Task,
    TeachingAssn,
    Unit,
    User,
)

from ..utils.auth import TokenAuth
from .schemas import BatchDeleteIn, BatchOperationOut, BatchUpdateIn, ExportOut, ImportIn, ImportOut

router = Router(tags=["Advanced"], auth=TokenAuth())

EXPORT_DIR = Path(getattr(settings, "EXPORT_DIR", Path(tempfile.gettempdir()) / "essaycoach_exports"))
EXPORT_BASE_URL = getattr(settings, "EXPORT_BASE_URL", "/api/v2/advanced/export/download/")


@router.post("/batch-delete/", response=BatchOperationOut)
def batch_delete(request, data: BatchDeleteIn):
    """Batch delete resources by IDs."""
    model_map = {
        "users": User,
        # Add other models as needed
    }

    model_class = model_map.get(data.resource)
    if not model_class:
        raise HttpError(400, f"Unknown resource: {data.resource}")

    deleted_count = model_class.objects.filter(**{f"{data.resource}_id__in": data.ids}).delete()[0]

    return BatchOperationOut(
        success=True,
        message=f"Deleted {deleted_count} {data.resource}",
        affected_count=deleted_count,
    )


@router.post("/batch-update/", response=BatchOperationOut)
def batch_update(request, data: BatchUpdateIn):
    """Batch update resources by IDs."""
    model_map = {
        "users": User,
        # Add other models as needed
    }

    model_class = model_map.get(data.resource)
    if not model_class:
        raise HttpError(400, f"Unknown resource: {data.resource}")

    updated_count = model_class.objects.filter(**{f"{data.resource}_id__in": data.ids}).update(**data.fields)

    return BatchOperationOut(
        success=True,
        message=f"Updated {updated_count} {data.resource}",
        affected_count=updated_count,
    )


@router.post("/import/", response=ImportOut)
def import_data(request, data: ImportIn):
    """Import data from CSV/JSON format.

    Supports importing Users, Classes, Units, Rubrics, Tasks, and other models.
    Data is validated before import and bulk operations are used for efficiency.
    """
    format_type = data.format.lower()
    if format_type not in ("json", "csv"):
        return ImportOut(
            success=False,
            message=f"Unsupported format: {format_type}. Use 'json' or 'csv'.",
            imported_count=0,
            errors=[f"Invalid format: {format_type}"],
        )

    model_class = _get_model_class(data.resource)
    if not model_class:
        return ImportOut(
            success=False,
            message=f"Unknown resource: {data.resource}",
            imported_count=0,
            errors=[f"Unknown resource: {data.resource}"],
        )

    try:
        raw_data = data.data

        if format_type == "csv":
            parsed_data = _parse_csv_data(raw_data)
        else:
            parsed_data = _parse_json_data(raw_data)

        if not parsed_data:
            return ImportOut(
                success=True,
                message="No data to import",
                imported_count=0,
                errors=[],
            )

        imported_count, errors = _bulk_import(model_class, parsed_data)

        success = len(errors) == 0
        message = (
            f"Imported {imported_count} {data.resource} records"
            if success
            else f"Imported {imported_count} with {len(errors)} errors"
        )

        return ImportOut(
            success=success,
            message=message,
            imported_count=imported_count,
            errors=errors,
        )

    except Exception as e:
        return ImportOut(
            success=False,
            message=f"Import failed: {str(e)}",
            imported_count=0,
            errors=[str(e)],
        )


def _parse_csv_data(raw_data: list[dict]) -> list[dict]:
    """Parse CSV data from the input format.

    Expected format: list of dicts with 'row' key containing CSV string,
    or list of dicts with column keys.
    """
    if not raw_data:
        return []

    first_item = raw_data[0]

    if "row" in first_item:
        csv_content = "\n".join(item.get("row", "") for item in raw_data)
        reader = csv.DictReader(io.StringIO(csv_content))
        return [row for row in reader]

    return raw_data


def _parse_json_data(raw_data: list[dict]) -> list[dict]:
    """Parse and validate JSON data."""
    if not raw_data:
        return []

    parsed = []
    for item in raw_data:
        if isinstance(item, dict):
            parsed.append(item)
        elif isinstance(item, str):
            try:
                parsed.append(json.loads(item))
            except json.JSONDecodeError:
                continue
    return parsed


def _bulk_import(model_class: type, data: list[dict]) -> tuple[int, list[str]]:
    """Bulk import data with validation and error handling.

    Returns:
        Tuple of (imported_count, errors)
    """
    imported_count = 0
    errors: list[str] = []
    instances_to_create: list[Any] = []

    pk_field = _get_primary_key_field(model_class)

    for index, row in enumerate(data):
        try:
            validated_data = _validate_and_transform_row(model_class, row, pk_field)
            if validated_data is None:
                errors.append(f"Row {index + 1}: Validation failed")
                continue

            instance = model_class(**validated_data)
            instances_to_create.append(instance)

        except Exception as e:
            errors.append(f"Row {index + 1}: {str(e)}")

    if instances_to_create:
        try:
            with transaction.atomic():
                model_class.objects.bulk_create(
                    instances_to_create,
                    batch_size=1000,
                    ignore_conflicts=True,
                )
                imported_count = len(instances_to_create)
        except Exception as e:
            errors.append(f"Bulk create failed: {str(e)}")

    return imported_count, errors


def _get_primary_key_field(model_class: type) -> str:
    """Get the primary key field name for a model."""
    pk_field = model_class._meta.pk
    return pk_field.name if pk_field else "id"


def _validate_and_transform_row(
    model_class: type,
    row: dict,
    pk_field: str,
) -> dict[str, Any] | None:
    """Validate and transform a single row of data.

    - Removes primary key to let DB auto-generate
    - Validates foreign key references
    - Transforms field names to match model
    """
    validated = {}

    for field in model_class._meta.fields:
        field_name = field.name
        db_column = field.db_column or field_name

        value = row.get(field_name) or row.get(db_column)

        if field_name == pk_field and value:
            continue

        if field.is_relation and value:
            fk_valid = _validate_foreign_key(field, value)
            if not fk_valid:
                return None
            validated[field_name] = value
        elif value is not None:
            validated[field_name] = value

    return validated if validated else None


def _validate_foreign_key(field: Any, value: Any) -> bool:
    """Validate that a foreign key reference exists."""
    try:
        related_model = field.related_model
        pk_field = related_model._meta.pk.name
        return related_model.objects.filter(**{pk_field: value}).exists()
    except Exception:
        return False


def _get_model_class(resource: str) -> type | None:
    """Get model class by resource name."""
    model_map = {
        "users": User,
        "classes": Class,
        "units": Unit,
        "rubrics": MarkingRubric,
        "rubric_items": RubricItem,
        "rubric_level_descs": RubricLevelDesc,
        "tasks": Task,
        "enrollments": Enrollment,
        "teaching_assns": TeachingAssn,
    }
    return model_map.get(resource)


def _model_to_dict(instance: Any) -> dict[str, Any]:
    """Convert model instance to dictionary with related objects resolved."""
    data = {}
    for field in instance._meta.fields:
        value = getattr(instance, field.name)
        if hasattr(value, "pk"):
            data[field.name] = value.pk
        elif hasattr(value, "isoformat"):
            data[field.name] = value.isoformat()
        else:
            data[field.name] = value
    return data


def _get_export_filename(resource: str, format: str) -> str:
    """Generate unique export filename."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    return f"{resource}_{timestamp}_{unique_id}.{format}"


def _export_to_json(data: list[dict[str, Any]], filepath: Path) -> None:
    """Export data to JSON file."""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)


def _export_to_csv(data: list[dict[str, Any]], filepath: Path) -> None:
    """Export data to CSV file."""
    if not data:
        with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
            pass
        return

    fieldnames = list(data[0].keys())
    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)


@router.get("/export/", response=ExportOut)
def export_data(request, resource: str, format: str = "json"):
    """Export data to CSV/JSON format."""
    if format not in ("json", "csv"):
        raise HttpError(400, f"Unsupported format: {format}. Use 'json' or 'csv'.")

    model_class = _get_model_class(resource)
    if not model_class:
        raise HttpError(400, f"Unknown resource: {resource}")

    try:
        queryset = model_class.objects.all()
        data = [_model_to_dict(instance) for instance in queryset.iterator(chunk_size=1000)]

        EXPORT_DIR.mkdir(parents=True, exist_ok=True)
        filename = _get_export_filename(resource, format)
        filepath = EXPORT_DIR / filename

        if format == "json":
            _export_to_json(data, filepath)
        else:
            _export_to_csv(data, filepath)

        download_url = f"{EXPORT_BASE_URL}{filename}"

        return ExportOut(
            success=True,
            message=f"Exported {len(data)} {resource} records",
            download_url=download_url,
            format=format,
        )
    except Exception as e:
        raise HttpError(500, f"Export failed: {str(e)}")
