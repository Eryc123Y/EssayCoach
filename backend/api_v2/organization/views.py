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
# Sign-in and the landing page are shown before anyone is authenticated, so the
# institution's name, logo and colour are readable without a token. Nothing else
# about the organization is exposed here.
public_router = Router(tags=["Organization"], auth=None)

_HEX_COLOR = re.compile(r"#[0-9a-fA-F]{6}")


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


def _is_web_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


@public_router.get("/branding/", response=dict)
def get_public_branding(request: HttpRequest):
    settings, _ = OrganizationSettings.objects.get_or_create(pk=1)
    # Stored values were validated on write; re-check so a bad row can never reach a page.
    return {
        "name": settings.name,
        "logo_url": settings.logo_url if _is_web_url(settings.logo_url) else "",
        "primary_color": settings.primary_color if _HEX_COLOR.fullmatch(settings.primary_color) else "#0f766e",
    }


@router.get("/", response=dict)
def get_organization(request: HttpRequest):
    IsAdmin().check(request)
    settings, _ = OrganizationSettings.objects.get_or_create(pk=1)
    return _serialize(settings)


@router.put("/", response=dict)
def update_organization(request: HttpRequest, data: OrganizationIn):
    IsAdmin().check(request)
    if not _HEX_COLOR.fullmatch(data.primary_color):
        raise HttpError(400, "Primary color must be a six-digit hex color")
    if data.logo_url:
        if not _is_web_url(data.logo_url):
            raise HttpError(400, "Logo must be an HTTP or HTTPS URL")
    settings, _ = OrganizationSettings.objects.get_or_create(pk=1)
    settings.name = data.name.strip()
    settings.logo_url = data.logo_url.strip()
    settings.primary_color = data.primary_color.lower()
    settings.updated_by = request.auth
    settings.save()
    return _serialize(settings)
