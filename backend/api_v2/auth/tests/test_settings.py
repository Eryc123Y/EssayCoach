"""
Tests for Settings API endpoints.

Tests cover:
- Password change endpoint
- User preferences (GET/PUT)
- Avatar upload
- Session management
- Login history
"""

import json
import tempfile
from pathlib import Path

import pytest
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, override_settings

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import User


@pytest.mark.django_db
class TestPasswordChange:
    """Tests for password change endpoint."""

    def test_password_change_success(self):
        """Test successful password change with correct current password."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="OldPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.post(
            "/api/v2/auth/password-change/",
            content_type="application/json",
            data=json.dumps({
                "current_password": "OldPassword123!",
                "new_password": "NewPassword456!",
                "new_password_confirm": "NewPassword456!",
            }),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Password changed successfully" in data["message"]

        # Verify new password works
        authenticated_user = authenticate(username="test@example.com", password="NewPassword456!")
        assert authenticated_user is not None

    def test_password_change_wrong_current_password(self):
        """Test password change with incorrect current password."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="OldPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.post(
            "/api/v2/auth/password-change/",
            content_type="application/json",
            data=json.dumps({
                "current_password": "WrongPassword!",
                "new_password": "NewPassword456!",
                "new_password_confirm": "NewPassword456!",
            }),
        )

        assert response.status_code == 400
        data = response.json()
        assert "Current password is incorrect" in data.get("detail", str(data))

    def test_password_change_mismatched_new_passwords(self):
        """Test password change with mismatched new passwords."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="OldPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.post(
            "/api/v2/auth/password-change/",
            content_type="application/json",
            data=json.dumps({
                "current_password": "OldPassword123!",
                "new_password": "NewPassword456!",
                "new_password_confirm": "DifferentPassword789!",
            }),
        )

        assert response.status_code == 400

    def test_password_change_weak_password(self):
        """Test password change with weak new password."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="OldPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.post(
            "/api/v2/auth/password-change/",
            content_type="application/json",
            data=json.dumps({
                "current_password": "OldPassword123!",
                "new_password": "123",
                "new_password_confirm": "123",
            }),
        )

        # Validation error returns 422 (Unprocessable Content)
        assert response.status_code == 422


@pytest.mark.django_db
class TestUserPreferences:
    """Tests for user preferences endpoints."""

    def test_get_preferences_default(self):
        """Test getting default user preferences."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get("/api/v2/auth/settings/preferences/")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email_notifications"] is True
        assert data["data"]["in_app_notifications"] is True
        assert data["data"]["submission_alerts"] is True
        assert data["data"]["grading_alerts"] is False
        assert data["data"]["weekly_digest"] is False
        assert data["data"]["language"] == "en"
        assert data["data"]["theme"] == "system"

    def test_update_preferences_partial(self):
        """Test updating only some preferences."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        # Update only email_notifications and theme
        response = client.put(
            "/api/v2/auth/settings/preferences/",
            content_type="application/json",
            data=json.dumps({
                "email_notifications": False,
                "theme": "dark",
            }),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email_notifications"] is False
        assert data["data"]["theme"] == "dark"
        # Other preferences should remain default
        assert data["data"]["in_app_notifications"] is True
        assert data["data"]["language"] == "en"

    def test_update_preferences_theme_validation(self):
        """Test theme field validation."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        # Invalid theme value
        response = client.put(
            "/api/v2/auth/settings/preferences/",
            content_type="application/json",
            data=json.dumps({
                "theme": "invalid_theme",
            }),
        )

        assert response.status_code == 422  # Validation error

    def test_update_preferences_persistence(self):
        """Test that preferences persist across requests."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        # Update preferences
        client.put(
            "/api/v2/auth/settings/preferences/",
            content_type="application/json",
            data=json.dumps({
                "email_notifications": False,
                "weekly_digest": True,
                "language": "zh",
            }),
        )

        # Get preferences again
        response = client.get("/api/v2/auth/settings/preferences/")

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["email_notifications"] is False
        assert data["data"]["weekly_digest"] is True
        assert data["data"]["language"] == "zh"


@pytest.mark.django_db
class TestAvatarUpload:
    """Tests for avatar upload endpoint."""

    def test_upload_avatar_png_success(self):
        """Test successful PNG avatar upload."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        # Create a simple PNG file (1x1 pixel)
        # Minimal valid PNG
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,  # IEND chunk
            0x42, 0x60, 0x82,
        ])

        avatar_file = SimpleUploadedFile(
            "test_avatar.png",
            png_data,
            content_type="image/png",
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            with override_settings(MEDIA_ROOT=tmpdir):
                response = client.post(
                    "/api/v2/auth/settings/avatar/",
                    {"avatar": avatar_file},
                )

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "avatar_url" in data
                assert "Avatar uploaded successfully" in data["message"]

    def test_upload_avatar_jpg_success(self):
        """Test successful JPG avatar upload."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        # Minimal JPEG file
        jpg_data = bytes([
            0xFF, 0xD8, 0xFF, 0xE0,  # SOI marker
            0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
            0xFF, 0xD9,  # EOI marker
        ])

        avatar_file = SimpleUploadedFile(
            "test_avatar.jpg",
            jpg_data,
            content_type="image/jpeg",
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            with override_settings(MEDIA_ROOT=tmpdir):
                response = client.post(
                    "/api/v2/auth/settings/avatar/",
                    {"avatar": avatar_file},
                )

                assert response.status_code == 200

    def test_upload_avatar_wrong_format(self):
        """Test avatar upload with wrong file format."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        # TXT file (not allowed)
        txt_file = SimpleUploadedFile(
            "test.txt",
            b"This is a text file",
            content_type="text/plain",
        )

        response = client.post(
            "/api/v2/auth/settings/avatar/",
            {"avatar": txt_file},
        )

        assert response.status_code == 400
        data = response.json()
        assert "Only PNG and JPG images are allowed" in data.get("detail", str(data))

    def test_upload_avatar_file_too_large(self):
        """Test avatar upload with file exceeding size limit."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        # Create file larger than 5MB
        large_data = b"x" * (6 * 1024 * 1024)  # 6MB

        large_file = SimpleUploadedFile(
            "large_avatar.png",
            large_data,
            content_type="image/png",
        )

        response = client.post(
            "/api/v2/auth/settings/avatar/",
            {"avatar": large_file},
        )

        assert response.status_code == 400
        data = response.json()
        assert "File size must be less than 5MB" in data.get("detail", str(data))


@pytest.mark.django_db
class TestSessionManagement:
    """Tests for session management endpoints."""

    def test_get_sessions_success(self):
        """Test getting active sessions."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get("/api/v2/auth/settings/sessions/")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)

    def test_revoke_nonexistent_session(self):
        """Test revoking non-existent session."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.delete(
            "/api/v2/auth/settings/sessions/nonexistent_session_key/",
        )

        assert response.status_code == 404


@pytest.mark.django_db
class TestLoginHistory:
    """Tests for login history endpoint."""

    def test_get_login_history_success(self):
        """Test getting login history."""
        user = User.objects.create_user(
            user_email="test@example.com",
            password="TestPassword123!",
            user_role="student",
        )
        jwt_pair = create_jwt_pair(user)

        client = Client()
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get("/api/v2/auth/settings/login-history/")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)


@pytest.mark.django_db
class TestSettingsPermissions:
    """Tests for Settings endpoint permissions."""

    def test_preferences_requires_auth(self):
        """Test that preferences endpoint requires authentication."""
        client = Client()

        response = client.get("/api/v2/auth/settings/preferences/")

        assert response.status_code in [401, 403]

    def test_avatar_requires_auth(self):
        """Test that avatar endpoint requires authentication."""
        client = Client()

        response = client.post(
            "/api/v2/auth/settings/avatar/",
            {"avatar": SimpleUploadedFile("test.png", b"x", content_type="image/png")},
        )

        assert response.status_code in [401, 403]

    def test_sessions_requires_auth(self):
        """Test that sessions endpoint requires authentication."""
        client = Client()

        response = client.get("/api/v2/auth/settings/sessions/")

        assert response.status_code in [401, 403]

    def test_login_history_requires_auth(self):
        """Test that login history endpoint requires authentication."""
        client = Client()

        response = client.get("/api/v2/auth/settings/login-history/")

        assert response.status_code in [401, 403]
