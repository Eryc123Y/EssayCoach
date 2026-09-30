"""Account-scoped in-app notifications."""

from __future__ import annotations

from django.http import HttpRequest
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from api_v2.utils.auth import JWTAuth
from core.models import Notification

router = Router(tags=["Notifications"], auth=JWTAuth())


def _serialize(item: Notification) -> dict:
    return {
        "id": item.pk,
        "kind": item.kind,
        "title_en": item.title_en,
        "title_zh": item.title_zh,
        "body_en": item.body_en,
        "body_zh": item.body_zh,
        "link": item.link,
        "read_at": item.read_at,
        "created_at": item.created_at,
    }


@router.get("/", response=dict)
def list_notifications(request: HttpRequest, unread_only: bool = False):
    queryset = Notification.objects.filter(user=request.auth, in_app_visible=True)
    unread_count = queryset.filter(read_at__isnull=True).count()
    if unread_only:
        queryset = queryset.filter(read_at__isnull=True)
    return {"unread_count": unread_count, "items": [_serialize(item) for item in queryset[:100]]}


@router.post("/{notification_id}/read/", response=dict)
def mark_notification_read(request: HttpRequest, notification_id: int):
    item = Notification.objects.filter(pk=notification_id, user=request.auth, in_app_visible=True).first()
    if item is None:
        raise HttpError(404, "Notification not found")
    if item.read_at is None:
        item.read_at = timezone.now()
        item.save(update_fields=["read_at"])
    return _serialize(item)
