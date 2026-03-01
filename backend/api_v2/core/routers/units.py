from __future__ import annotations

from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from api_v2.schemas.base import PaginationParams, SuccessResponse
from api_v2.types.ids import (
    UnitId,
)
from api_v2.utils.auth import JWTAuth
from api_v2.utils.permissions import IsAdminOrLecturer
from core.models import (
    Unit,
)

from ..schemas import (
    UnitFilterParams,
    UnitIn,
    UnitOut,
)


def paginate(queryset, params: PaginationParams):
    if isinstance(queryset, list):
        # Already a list (from .values())
        total = len(queryset)
        start = (params.page - 1) * params.page_size
        end = start + params.page_size
        return {"count": total, "results": queryset[start:end]}
    else:
        # QuerySet
        total = queryset.count()
        start = (params.page - 1) * params.page_size
        end = start + params.page_size
        return {"count": total, "results": list(queryset[start:end])}


router = Router(tags=["Units"], auth=JWTAuth())


def _check_admin_or_lecturer(request: HttpRequest) -> None:
    IsAdminOrLecturer().check(request)


# =============================================================================
# Units
# =============================================================================


@router.get("/units/", response=list[UnitOut])
def list_units(request: HttpRequest, filters: UnitFilterParams = UnitFilterParams()):
    qs = filters.filter(Unit.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/units/", response=UnitOut)
def create_unit(request: HttpRequest, data: UnitIn):
    _check_admin_or_lecturer(request)
    unit = Unit.objects.create(**data.dict())
    return unit


@router.get("/units/{unit_id}/", response=UnitOut)
def get_unit(request: HttpRequest, unit_id: UnitId):
    try:
        return Unit.objects.get(unit_id=unit_id)
    except Unit.DoesNotExist:
        raise HttpError(404, "Unit not found")


@router.put("/units/{unit_id}/", response=UnitOut)
def update_unit(request: HttpRequest, unit_id: UnitId, data: UnitIn):
    _check_admin_or_lecturer(request)
    try:
        unit = Unit.objects.get(unit_id=unit_id)
        for key, value in data.dict().items():
            setattr(unit, key, value)
        unit.save()
        return unit
    except Unit.DoesNotExist:
        raise HttpError(404, "Unit not found")


@router.delete("/units/{unit_id}/", response=SuccessResponse)
def delete_unit(request: HttpRequest, unit_id: UnitId) -> SuccessResponse:
    _check_admin_or_lecturer(request)
    try:
        unit = Unit.objects.get(unit_id=unit_id)
        unit.delete()
        return SuccessResponse(success=True)
    except Unit.DoesNotExist:
        raise HttpError(404, "Unit not found")
