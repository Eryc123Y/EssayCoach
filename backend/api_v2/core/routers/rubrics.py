from __future__ import annotations

from django.conf import settings
from django.db.models import Q
from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from api_v2.schemas.base import PaginationParams, SuccessResponse
from api_v2.types.ids import (
    RubricId,
    RubricItemId,
)
from api_v2.utils.auth import JWTAuth
from core.models import (
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
)
from core.models import RubricLevelDesc as RubricLevelDescModel
from core.services import RubricService

from ..schemas import (
    MarkingRubricIn,
    MarkingRubricOut,
    RubricDetailOut,
    RubricDuplicateIn,
    RubricFilterParams,
    RubricImportOut,
    RubricItemDetailOut,
    RubricItemFilterParams,
    RubricItemIn,
    RubricItemOut,
    RubricLevelDescFilterParams,
    RubricLevelDescIn,
    RubricLevelDescOut,
    RubricVisibilityUpdate,
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



router = Router(tags=["Rubrics"], auth=JWTAuth())

# =============================================================================
# MarkingRubrics
# =============================================================================


@router.get("/rubrics/", response=list[MarkingRubricOut])
def list_rubrics(request: HttpRequest, filters: RubricFilterParams = RubricFilterParams()):
    """
    List rubrics with visibility-based filtering.

    - Public rubrics: Visible to all authenticated users
    - Private rubrics: Only visible to creator or admin
    - Students: Only see public rubrics
    - Admins: See all rubrics (public and private)

    Query params:
    - visibility=public|private: Filter by visibility (overrides default role-based filtering)
    """
    user = request.auth

    # Get visibility filter directly from query params (FilterSchema doesn't parse it automatically)
    visibility_filter = request.GET.get("visibility")

    # Build base queryset based on role
    if user.user_role == "student":
        # Students can only see public rubrics
        qs = MarkingRubric.objects.filter(visibility="public")
    elif user.user_role == "admin":
        # Admins see all rubrics
        qs = MarkingRubric.objects.all()
    else:
        # Lecturers see their own private rubrics + all public rubrics
        qs = MarkingRubric.objects.filter(Q(visibility="public") | Q(user_id_user=user))

    # If visibility filter is explicitly provided, apply it on top
    # This allows admins/lecturers to filter by specific visibility
    if visibility_filter:
        if user.user_role == "admin":
            # Admin can filter by any visibility
            qs = qs.filter(visibility=visibility_filter)
        elif user.user_role == "lecturer":
            # Lecturers can filter by visibility, but for private they only see their own
            if visibility_filter == "public":
                qs = qs.filter(visibility="public")
            elif visibility_filter == "private":
                # Only show lecturer's own private rubrics
                qs = MarkingRubric.objects.filter(visibility="private", user_id_user=user)
        elif user.user_role == "student":
            # Students can only filter public (they can't see private at all)
            qs = qs.filter(visibility=visibility_filter)

    # Apply other filters (user_id_user, rubric_desc)
    if filters.user_id_user:
        qs = qs.filter(user_id_user=filters.user_id_user)
    if filters.rubric_desc:
        qs = qs.filter(rubric_desc__icontains=filters.rubric_desc)

    # Convert queryset to list of dicts for Schema validation
    result = list(qs.values("rubric_id", "user_id_user", "rubric_create_time", "rubric_desc", "visibility"))

    return paginate(result, PaginationParams())["results"]


@router.get("/rubrics/public/", response=list[MarkingRubricOut])
def list_public_rubrics(request: HttpRequest, filters: RubricFilterParams = RubricFilterParams()):
    """
    List all public rubrics (available to all authenticated users).

    This endpoint is useful for students to browse available rubrics
    and for lecturers to discover shared rubrics.
    """
    qs = filters.filter(MarkingRubric.objects.filter(visibility="public"))
    return paginate(qs, PaginationParams())["results"]


@router.post("/rubrics/", response=MarkingRubricOut)
def create_rubric(request: HttpRequest, data: MarkingRubricIn):
    """Create a new rubric (lecturer/admin only)."""
    user = request.auth
    if user.user_role not in ["lecturer", "admin"]:
        raise HttpError(403, "Only lecturers and admins can create rubrics")

    # Validate visibility value
    if data.visibility not in ["public", "private"]:
        raise HttpError(400, "Visibility must be 'public' or 'private'")

    rubric = MarkingRubric.objects.create(
        user_id_user=user,
        rubric_desc=data.rubric_desc,
        visibility=data.visibility,
    )

    # Return dict to ensure proper serialization
    return {
        "rubric_id": rubric.rubric_id,
        "user_id_user": rubric.user_id_user_id,
        "rubric_create_time": rubric.rubric_create_time,
        "rubric_desc": rubric.rubric_desc,
        "visibility": rubric.visibility,
    }


@router.post("/rubrics/import_from_pdf_with_ai/", response=RubricImportOut)
def import_rubric_from_pdf_with_ai(request: HttpRequest, file: UploadedFile, rubric_name: str | None = None):
    from ai_feedback.rubric_parser import RubricParseError, SiliconFlowRubricParser
    from core.rubric_manager import RubricImportError, RubricManager

    if not file:
        raise HttpError(400, "PDF file is required")

    if file.content_type and file.content_type != "application/pdf":
        raise HttpError(400, "Only PDF files are supported")

    try:
        parser = SiliconFlowRubricParser(api_key=settings.SILICONFLOW_API_KEY)
        manager = RubricManager(parser)

        result = manager.import_rubric_with_ai(file, request.auth, rubric_name)

        if not result.get("detection", {}).get("is_rubric", False):
            return (
                400,
                RubricImportOut(
                    success=False,
                    error="This PDF does not appear to be a rubric. Please upload a proper rubric PDF file.",
                    detection=result.get("detection"),
                    ai_parsed=result.get("ai_parsed", False),
                    ai_model=result.get("ai_model"),
                ),
            )

        return (201, RubricImportOut(**result))
    except (RubricParseError, RubricImportError, ValueError) as exc:
        return (400, RubricImportOut(success=False, error=str(exc)))


@router.get("/rubrics/{rubric_id}/", response=MarkingRubricOut)
def get_rubric(request: HttpRequest, rubric_id: RubricId):
    """
    Get a specific rubric by ID.

    Permissions:
    - Public rubrics: Visible to all authenticated users
    - Private rubrics: Only visible to creator or admin
    """
    user = request.auth

    try:
        rubric = MarkingRubric.objects.select_related("user_id_user").get(rubric_id=rubric_id)

        # Check permissions
        if rubric.visibility == "private":
            if user.user_role not in ["admin", "lecturer"] and rubric.user_id_user != user:
                raise HttpError(403, "You do not have permission to view this private rubric")
            if user.user_role == "lecturer" and rubric.user_id_user != user:
                raise HttpError(403, "You can only view your own private rubrics")

        # Return dict to ensure proper serialization (user_id_user_id -> user_id_user)
        return {
            "rubric_id": rubric.rubric_id,
            "user_id_user": rubric.user_id_user_id,
            "rubric_create_time": rubric.rubric_create_time,
            "rubric_desc": rubric.rubric_desc,
            "visibility": rubric.visibility,
        }
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.get("/rubrics/{rubric_id}/detail/", response=RubricDetailOut)
def get_rubric_detail(request: HttpRequest, rubric_id: RubricId):
    """
    Get rubric with nested items and level descriptions.

    Permissions:
    - Public rubrics: Visible to all authenticated users
    - Private rubrics: Only visible to creator or admin
    """
    user = request.auth

    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id)

        # Check permissions for private rubrics
        if rubric.visibility == "private":
            if user.user_role not in ["admin", "lecturer"] and rubric.user_id_user != user:
                raise HttpError(403, "You do not have permission to view this private rubric")
            if user.user_role == "lecturer" and rubric.user_id_user != user:
                raise HttpError(403, "You can only view your own private rubrics")

        rubric_items = list(RubricItem.objects.filter(rubric_id_marking_rubric=rubric))

        rubric_item_ids = [item.rubric_item_id for item in rubric_items]
        levels = RubricLevelDescModel.objects.filter(rubric_item_id_rubric_item_id__in=rubric_item_ids)
        levels_by_item: dict[int, list[RubricLevelDescModel]] = {}
        for level in levels:
            levels_by_item.setdefault(level.rubric_item_id_rubric_item_id, []).append(level)

        rubric_item_out = []
        for item in rubric_items:
            rubric_item_out.append(
                RubricItemDetailOut(
                    rubric_item_id=item.rubric_item_id,
                    rubric_id_marking_rubric=item.rubric_id_marking_rubric_id,
                    rubric_item_name=item.rubric_item_name,
                    rubric_item_weight=item.rubric_item_weight,
                    level_descriptions=[
                        RubricLevelDescOut(
                            level_desc_id=level.level_desc_id,
                            rubric_item_id_rubric_item=level.rubric_item_id_rubric_item_id,
                            level_min_score=level.level_min_score,
                            level_max_score=level.level_max_score,
                            level_desc=level.level_desc,
                        )
                        for level in levels_by_item.get(item.rubric_item_id, [])
                    ],
                )
            )

        # Return as dict - Ninja will serialize to RubricDetailOut
        # Note: Must use user_id_user_id (the alias) for proper serialization
        return {
            "rubric_id": rubric.rubric_id,
            "user_id_user": rubric.user_id_user_id,
            "rubric_create_time": rubric.rubric_create_time,
            "rubric_desc": rubric.rubric_desc,
            "visibility": rubric.visibility,
            "rubric_items": [
                {
                    "rubric_item_id": item.rubric_item_id,
                    "rubric_id_marking_rubric": item.rubric_id_marking_rubric_id,
                    "rubric_item_name": item.rubric_item_name,
                    "rubric_item_weight": item.rubric_item_weight,
                    "level_descriptions": [
                        {
                            "level_desc_id": level.level_desc_id,
                            "rubric_item_id_rubric_item": level.rubric_item_id_rubric_item_id,
                            "level_min_score": level.level_min_score,
                            "level_max_score": level.level_max_score,
                            "level_desc": level.level_desc,
                        }
                        for level in levels_by_item.get(item.rubric_item_id, [])
                    ],
                }
                for item in rubric_items
            ],
        }
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.get("/rubrics/{rubric_id}/detail_with_items/", response=RubricDetailOut)
def get_rubric_detail_with_items(request: HttpRequest, rubric_id: RubricId):
    return get_rubric_detail(request, rubric_id)


@router.put("/rubrics/{rubric_id}/", response=MarkingRubricOut)
def update_rubric(request: HttpRequest, rubric_id: RubricId, data: MarkingRubricIn):
    """
    Update a rubric.

    Permissions:
    - Only creator or admin can update
    """
    user = request.auth

    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id)

        # Check permissions
        if user.user_role not in ["admin"] and rubric.user_id_user != user:
            raise HttpError(403, "You do not have permission to update this rubric")

        # Validate visibility if provided
        if data.visibility and data.visibility not in ["public", "private"]:
            raise HttpError(400, "Visibility must be 'public' or 'private'")

        rubric.rubric_desc = data.rubric_desc
        if data.visibility:
            rubric.visibility = data.visibility
        rubric.save()

        # Return dict to ensure proper serialization
        return {
            "rubric_id": rubric.rubric_id,
            "user_id_user": rubric.user_id_user_id,
            "rubric_create_time": rubric.rubric_create_time,
            "rubric_desc": rubric.rubric_desc,
            "visibility": rubric.visibility,
        }
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.patch("/rubrics/{rubric_id}/visibility/", response=MarkingRubricOut)
def update_rubric_visibility(request: HttpRequest, rubric_id: RubricId, data: RubricVisibilityUpdate):
    """
    Toggle rubric visibility between public and private.

    Permissions:
    - Only creator or admin can toggle visibility
    """
    user = request.auth

    # Validate visibility value
    if data.visibility not in ["public", "private"]:
        raise HttpError(400, "Visibility must be 'public' or 'private'")

    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id)

        # Check permissions - only creator or admin can change visibility
        if user.user_role != "admin" and rubric.user_id_user != user:
            raise HttpError(403, "Only the rubric creator or admin can change visibility")

        rubric.visibility = data.visibility
        rubric.save()

        # Return dict to ensure proper serialization
        return {
            "rubric_id": rubric.rubric_id,
            "user_id_user": rubric.user_id_user_id,
            "rubric_create_time": rubric.rubric_create_time,
            "rubric_desc": rubric.rubric_desc,
            "visibility": rubric.visibility,
        }
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.delete("/rubrics/{rubric_id}/", response=SuccessResponse)
def delete_rubric(request: HttpRequest, rubric_id: RubricId) -> SuccessResponse:
    """
    Delete a rubric.

    Permissions:
    - Only creator or admin can delete
    """
    user = request.auth

    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id)

        # Check permissions
        if user.user_role not in ["admin"] and rubric.user_id_user != user:
            raise HttpError(403, "You do not have permission to delete this rubric")

        rubric.delete()
        return SuccessResponse(success=True)
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


# =============================================================================
# RubricItems
# =============================================================================


@router.get("/rubric-items/", response=list[RubricItemOut])
def list_rubric_items(request: HttpRequest, filters: RubricItemFilterParams = RubricItemFilterParams()):
    qs = filters.filter(RubricItem.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/rubric-items/", response=RubricItemOut)
def create_rubric_item(request: HttpRequest, data: RubricItemIn):
    rubric = MarkingRubric.objects.get(rubric_id=data.rubric_id_marking_rubric)
    item = RubricItem.objects.create(
        rubric_id_marking_rubric=rubric,
        rubric_item_name=data.rubric_item_name,
        rubric_item_weight=data.rubric_item_weight,
    )
    return item


@router.get("/rubric-items/{item_id}/", response=RubricItemOut)
def get_rubric_item(request: HttpRequest, item_id: RubricItemId):
    try:
        return RubricItem.objects.get(rubric_item_id=item_id)
    except RubricItem.DoesNotExist:
        raise HttpError(404, "Rubric item not found")


@router.put("/rubric-items/{item_id}/", response=RubricItemOut)
def update_rubric_item(request: HttpRequest, item_id: RubricItemId, data: RubricItemIn):
    try:
        item = RubricItem.objects.get(rubric_item_id=item_id)
        item.rubric_item_name = data.rubric_item_name
        item.rubric_item_weight = data.rubric_item_weight
        item.save()
        return item
    except RubricItem.DoesNotExist:
        raise HttpError(404, "Rubric item not found")


@router.delete("/rubric-items/{item_id}/", response=SuccessResponse)
def delete_rubric_item(request: HttpRequest, item_id: RubricItemId) -> SuccessResponse:
    try:
        item = RubricItem.objects.get(rubric_item_id=item_id)
        item.delete()
        return SuccessResponse(success=True)
    except RubricItem.DoesNotExist:
        raise HttpError(404, "Rubric item not found")


# =============================================================================
# RubricLevelDescs
# =============================================================================


@router.get("/rubric-levels/", response=list[RubricLevelDescOut])
def list_rubric_levels(request: HttpRequest, filters: RubricLevelDescFilterParams = RubricLevelDescFilterParams()):
    qs = filters.filter(RubricLevelDesc.objects.all())
    return paginate(qs, PaginationParams())["results"]


@router.post("/rubric-levels/", response=RubricLevelDescOut)
def create_rubric_level(request: HttpRequest, data: RubricLevelDescIn):
    item = RubricItem.objects.get(rubric_item_id=data.rubric_item_id_rubric_item)
    level = RubricLevelDesc.objects.create(
        rubric_item_id_rubric_item=item,
        level_min_score=data.level_min_score,
        level_max_score=data.level_max_score,
        level_desc=data.level_desc,
    )
    return level


@router.get("/rubric-levels/{level_id}/", response=RubricLevelDescOut)
def get_rubric_level(request: HttpRequest, level_id: int):
    try:
        return RubricLevelDesc.objects.get(level_desc_id=level_id)
    except RubricLevelDesc.DoesNotExist:
        raise HttpError(404, "Rubric level not found")


@router.put("/rubric-levels/{level_id}/", response=RubricLevelDescOut)
def update_rubric_level(request: HttpRequest, level_id: int, data: RubricLevelDescIn):
    try:
        level = RubricLevelDesc.objects.get(level_desc_id=level_id)
        level.level_min_score = data.level_min_score
        level.level_max_score = data.level_max_score
        level.level_desc = data.level_desc
        level.save()
        return level
    except RubricLevelDesc.DoesNotExist:
        raise HttpError(404, "Rubric level not found")


@router.delete("/rubric-levels/{level_id}/", response=SuccessResponse)
def delete_rubric_level(request: HttpRequest, level_id: int) -> SuccessResponse:
    try:
        level = RubricLevelDesc.objects.get(level_desc_id=level_id)
        level.delete()
        return SuccessResponse(success=True)
    except RubricLevelDesc.DoesNotExist:
        raise HttpError(404, "Rubric level not found")



@router.post("/{rubric_id}/duplicate/", response=RubricDetailOut)
def duplicate_rubric(request: HttpRequest, rubric_id: RubricId, data: RubricDuplicateIn):
    """
    Duplicate a rubric with all its items and level descriptions.
    """
    user = request.auth
    try:
        source_rubric = MarkingRubric.objects.get(rubric_id=rubric_id)
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")

    if source_rubric.visibility == "private" and \
       source_rubric.user_id_user_id != user.user_id and user.user_role != "admin":
        raise HttpError(403, "Cannot duplicate a private rubric you don't own")

    new_rubric = RubricService.duplicate_rubric(source_rubric, user, data.rubric_desc, data.visibility)

    # We must format it to match RubricDetailOut by doing queries or using the helper if it exists
    return get_rubric_detail(request, new_rubric.rubric_id)
