

"""
Auth App for EssayCoach Platform
================================

This Django app handles authentication and authorization for the EssayCoach platform.
It manages user registration, login, logout, password management, and role-based permissions.

Key Features:
- User registration and email verification
- Secure login/logout functionality
- Password reset and change capabilities
- Role-based access control (Students, Teachers, Administrators)
- JWT token authentication for API endpoints
- Session management

Models:
- CustomUser: Extended user model with additional profile fields
- UserProfile: Additional user information and preferences
- Role: User roles and permissions

API Endpoints:
- /auth/register/ - User registration
- /auth/login/ - User authentication
- /auth/logout/ - User logout
- /auth/password-reset/ - Password reset functionality
- /auth/profile/ - User profile management

Usage:
Add 'auth' to INSTALLED_APPS in settings.py to enable this app.
"""

from django.apps import AppConfig


class AuthConfig(AppConfig):
    """Configuration for the Auth application."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "auth"
    label = "essay_auth"  # Unique label to avoid conflict with django.contrib.auth
    verbose_name = "Authentication and Authorization"

    def ready(self):
        """Initialize the app when Django starts."""
        pass
