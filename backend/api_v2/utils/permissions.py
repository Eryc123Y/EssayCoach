"""
RBAC Permission utilities for Django Ninja API v2.

This module provides permission classes for role-based access control.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from ninja.errors import HttpError

from api_v2.types.enums import UserRole

if TYPE_CHECKING:
    from django.http import HttpRequest

    from core.models import User


class PermissionDeniedError(HttpError):
    """Custom exception for permission denied errors."""

    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(403, message)


def has_role(user: User, roles: list[str | UserRole]) -> bool:
    """
    Check if user has one of the specified roles.

    Args:
        user: User instance to check
        roles: List of allowed roles (e.g., [UserRole.ADMIN, UserRole.LECTURER])

    Returns:
        True if user has one of the specified roles, False otherwise
    """
    if not user or not user.is_authenticated:
        return False
    return getattr(user, "user_role", None) in roles


def check_role(request: HttpRequest, roles: list[str | UserRole]) -> None:
    """
    Check if the authenticated user has one of the specified roles.
    Raises PermissionDenied if the user doesn't have the required role.

    Args:
        request: Django request with authenticated user
        roles: List of allowed roles

    Raises:
        PermissionDenied: If user doesn't have required role
    """
    user = getattr(request, "auth", None)
    if not has_role(user, roles):
        raise PermissionDeniedError(
            f"This action requires one of the following roles: "
            f"{', '.join(str(r) for r in roles)}"
        )


class IsAdminOrLecturer:
    """
    Permission class that allows only admin and lecturer roles.

    Usage as a decorator-like check:
        @router.post("/users/", response=UserOut)
        def create_user(request: HttpRequest, data: UserIn):
            IsAdminOrLecturer().check(request)
            # ... rest of the logic
    """

    allowed_roles: list[str | UserRole] = [UserRole.ADMIN, UserRole.LECTURER]

    def check(self, request: HttpRequest) -> None:
        """
        Check if the user has the required role.

        Args:
            request: Django request with authenticated user

        Raises:
            PermissionDenied: If user doesn't have required role
        """
        check_role(request, self.allowed_roles)

    def has_permission(self, request: HttpRequest) -> bool:
        """
        Check permission without raising an exception.

        Args:
            request: Django request with authenticated user

        Returns:
            True if user has permission, False otherwise
        """
        return has_role(getattr(request, "auth", None), self.allowed_roles)


class IsAdmin:
    """
    Permission class that allows only admin role.

    Usage:
        @router.delete("/users/{user_id}/")
        def delete_user(request: HttpRequest, user_id: int):
            IsAdmin().check(request)
            # ... rest of the logic
    """

    allowed_roles: list[str | UserRole] = [UserRole.ADMIN]

    def check(self, request: HttpRequest) -> None:
        """Check if the user is admin."""
        check_role(request, self.allowed_roles)

    def has_permission(self, request: HttpRequest) -> bool:
        """Check if user is admin without raising exception."""
        return has_role(getattr(request, "auth", None), self.allowed_roles)


class IsOwnerOrAdmin:
    """
    Permission class that allows:
    - Admin users (any role)
    - The user themselves (for self-modification)

    Usage:
        @router.put("/users/{user_id}/")
        def update_user(request: HttpRequest, user_id: int, data: UserIn):
            IsOwnerOrAdmin().check(request, user_id)
            # ... rest of the logic
    """

    def check(self, request: HttpRequest, target_user_id: int | None = None) -> None:
        """
        Check if user is admin or modifying their own account.

        Args:
            request: Django request with authenticated user
            target_user_id: The ID of the user being modified

        Raises:
            PermissionDenied: If user doesn't have permission
        """
        user = getattr(request, "auth", None)
        if not user:
            raise PermissionDeniedError("Authentication required")

        # Admin can do anything
        if has_role(user, [UserRole.ADMIN]):
            return

        # Users can only modify themselves
        if target_user_id is not None and user.user_id == target_user_id:
            return

        raise PermissionDeniedError("You can only modify your own account")


def check_admin_or_lecturer(request: HttpRequest) -> None:
    """
    Helper function to check admin/lecturer permission.

    Args:
        request: Django request with authenticated user

    Raises:
        PermissionDenied: If user is not admin or lecturer
    """
    IsAdminOrLecturer().check(request)
