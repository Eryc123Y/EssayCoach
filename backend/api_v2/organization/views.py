"""Persisted branding for the single private institution."""

from __future__ import annotations

import re
from urllib.parse import urlparse

from django.http import HttpRequest
from ninja import Router, Schema
from ninja.errors import HttpError
from pydantic import Field

from api_v2.utils.auth import JWTAuth
from api_v2.utils.permissions import IsAdmin
from core.models import OrganizationSettings

router = Router(tags=["Organization"], auth=JWTAuth())


class OrganizationIn(Schema):
    name: str = Field(min_length=2, max_length=120)
    logo_url: str = Field(default="", max_length=200)
    primary_color: str


def _serialize(settings: OrganizationSettings) -> dict:
    return {
        "name": settings.name,
        "logo_url": settings.logo_url,
        "primary_color": settings.primary_color,
        "invite_only": True,
        "updated_at": settings.updated_at,
    }


@router.get("/", response=dict)
def get_organization(request: HttpRequest):
    IsAdmin().check(request)
    settings, _ = OrganizationSettings.objects.get_or_create(pk=1)
    return _serialize(settings)


@router.put("/", response=dict)
def update_organization(request: HttpRequest, data: OrganizationIn):
    IsAdmin().check(request)
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", data.primary_color):
        raise HttpError(400, "Primary color must be a six-digit hex color")
    if data.logo_url:
        parsed = urlparse(data.logo_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise HttpError(400, "Logo must be an HTTP or HTTPS URL")
    settings, _ = OrganizationSettings.objects.get_or_create(pk=1)
    settings.name = data.name.strip()
    settings.logo_url = data.logo_url.strip()
    settings.primary_color = data.primary_color.lower()
    settings.updated_by = request.auth
    settings.save()
    return _serialize(settings)
