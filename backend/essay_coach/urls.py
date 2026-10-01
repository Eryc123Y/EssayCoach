"""URL routes for the Django admin and Ninja API v2."""

from django.contrib import admin
from django.urls import path

# Import Ninja API v2
from api_v2.api import api_v2

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v2/", api_v2.urls),
]
