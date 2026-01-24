"""
API views for authentication endpoints.
"""

from typing import TYPE_CHECKING, Any

from django.contrib.auth import get_user_model
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    PasswordChangeSerializer,
    PasswordResetSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
)
from .utils import format_error_response, format_success_response, get_or_create_token

# Use TYPE_CHECKING to provide type hints while maintaining runtime flexibility.
if TYPE_CHECKING:
    from ..core.models import User
else:
    User = get_user_model()


class RegisterView(APIView):
    """
    User registration endpoint.
    POST /api/v1/auth/register/
    """

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Authentication"],
        summary="Register a new user",
        description=(
            "Create a new user account and receive an authentication token. "
            "The user will be assigned the 'student' role by default if not specified."
        ),
        request=UserRegistrationSerializer,
        responses={
            201: OpenApiResponse(
                response=UserProfileSerializer,
                description="User registered successfully",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            "success": True,
                            "message": "User registered successfully",
                            "data": {
                                "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
                                "user": {
                                    "id": 1,
                                    "email": "student@example.com",
                                    "username": "student@example.com",
                                    "first_name": "John",
                                    "last_name": "Doe",
                                    "name": "John Doe",
                                    "avatar": None,
                                    "role": "student",
                                    "status": "active",
                                    "date_joined": "2024-01-15T10:30:00Z",
                                },
                            },
                        },
                    )
                ],
            ),
            400: OpenApiResponse(description="Invalid input data"),
            409: OpenApiResponse(description="Email already registered"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user: User = serializer.save()
            token: Token = get_or_create_token(user)

            # Serialize user data
            user_data: dict[str, Any] = UserProfileSerializer(user).data

            response_data: dict[str, Any] = format_success_response(
                data={"token": token.key, "user": user_data},
                message="User registered successfully",
            )
            return Response(response_data, status=status.HTTP_201_CREATED)

        # Handle validation errors
        errors: dict[str, Any] = serializer.errors

        # Check for email uniqueness error
        if "email" in errors:
            email_error = errors["email"]
            if isinstance(email_error, list) and len(email_error) > 0:
                if "already registered" in str(email_error[0]).lower():
                    return format_error_response(
                        code="EMAIL_TAKEN",
                        message="Email is already registered",
                        status_code=status.HTTP_409_CONFLICT,
                    )

        # Check for password mismatch
        if "password" in errors or "non_field_errors" in errors:
            password_error = errors.get("password", [])
            if password_error and "didn't match" in str(password_error[0]).lower():
                return format_error_response(
                    code="INVALID_INPUT",
                    message="Password fields didn't match",
                    details=errors,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        # Generic validation error
        return format_error_response(
            code="INVALID_INPUT",
            message="Invalid input data",
            details=errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class LoginView(APIView):
    """
    User login endpoint.
    POST /api/v1/auth/login/
    """

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Authentication"],
        summary="User login",
        description=(
            "Authenticate a user with email and password. Returns an authentication token and user profile information."
        ),
        request=UserLoginSerializer,
        responses={
            200: OpenApiResponse(
                response=UserProfileSerializer,
                description="Login successful",
                examples=[
                    OpenApiExample(
                        "Success Response",
                        value={
                            "success": True,
                            "data": {
                                "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
                                "user": {
                                    "id": 1,
                                    "email": "student@example.com",
                                    "username": "student@example.com",
                                    "first_name": "John",
                                    "last_name": "Doe",
                                    "name": "John Doe",
                                    "avatar": None,
                                    "role": "student",
                                    "status": "active",
                                    "date_joined": "2024-01-15T10:30:00Z",
                                },
                            },
                        },
                    )
                ],
            ),
            401: OpenApiResponse(description="Invalid credentials"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = UserLoginSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            user: User = serializer.validated_data["user"]
            token: Token = get_or_create_token(user)

            # Serialize user data
            user_data: dict[str, Any] = UserProfileSerializer(user).data

            # Debug: Print the serialized user data to see actual fields
            import logging

            logger = logging.getLogger(__name__)
            logger.info(f"[Login Debug] Serialized user data: {user_data}")
            logger.info(f"[Login Debug] User role field value: {user_data.get('role', 'NOT_FOUND')}")

            response_data: dict[str, Any] = format_success_response(data={"token": token.key, "user": user_data})
            return Response(response_data, status=status.HTTP_200_OK)

        # Handle validation errors
        errors: dict[str, Any] = serializer.errors

        if "non_field_errors" in errors:
            error_list = errors["non_field_errors"]
            if isinstance(error_list, list) and len(error_list) > 0:
                error_obj = error_list[0]
                if isinstance(error_obj, dict):
                    error_code = error_obj.get("code", "INVALID_CREDENTIALS")
                    error_message = error_obj.get("message", "Invalid email or password")

                    status_code = status.HTTP_401_UNAUTHORIZED
                    if error_code == "ACCOUNT_LOCKED":
                        status_code = status.HTTP_423_LOCKED
                    elif error_code == "INVALID_INPUT":
                        status_code = status.HTTP_400_BAD_REQUEST

                    return format_error_response(code=error_code, message=error_message, status_code=status_code)

        return format_error_response(
            code="INVALID_INPUT",
            message="Email and password are required",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class LogoutView(APIView):
    """
    User logout endpoint.
    POST /api/v1/auth/logout/
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Authentication"],
        summary="User logout",
        description="Invalidate the current user's authentication token.",
        responses={200: OpenApiResponse(description="Logout successful")},
    )
    def post(self, request: Request) -> Response:
        try:
            Token.objects.filter(user=request.user).delete()
        except Exception:
            pass

        return Response(format_success_response(data={}, message="Successfully logged out"))


class PasswordResetView(APIView):
    """
    Reset password endpoint.
    POST /api/v1/auth/password-reset/
    """

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Authentication"],
        summary="Reset password",
        request=PasswordResetSerializer,
        responses={200: OpenApiResponse(description="Password reset successful")},
    )
    def post(self, request: Request) -> Response:
        serializer = PasswordResetSerializer(data=request.data)

        if not serializer.is_valid():
            return format_error_response(
                code="INVALID_INPUT",
                message="Invalid input data",
                details=serializer.errors,
            )

        email = serializer.validated_data["email"]
        new_password = serializer.validated_data["new_password"]

        try:
            user = User.objects.get(user_email=email)
            user.set_password(new_password)
            user.save()
            return Response(format_success_response(data={}, message="Password reset successful"))
        except User.DoesNotExist:
            return format_error_response(
                code="EMAIL_NOT_FOUND",
                message="Email is not registered",
                status_code=404,
            )


class PasswordChangeView(APIView):
    """
    Change password endpoint.
    POST /api/v1/auth/password-change/
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Authentication"],
        summary="Change password",
        request=PasswordChangeSerializer,
        responses={200: OpenApiResponse(description="Password changed successfully")},
    )
    def post(self, request: Request) -> Response:
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data["new_password"]
            user.set_password(new_password)
            user.save()
            return Response(format_success_response(data={}, message="Password changed successfully"))

        return format_error_response(
            code="VALIDATION_ERROR",
            message="Invalid input data",
            details=serializer.errors,
        )


class UserProfileView(APIView):
    """
    User profile view.
    GET /api/v1/auth/me/
    PATCH /api/v1/auth/me/
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Authentication"],
        summary="Get current user profile",
        responses={200: UserProfileSerializer},
    )
    def get(self, request: Request) -> Response:
        serializer = UserProfileSerializer(request.user)
        return Response(format_success_response(data=serializer.data))

    @extend_schema(
        tags=["Authentication"],
        summary="Update current user profile",
        request=UserUpdateSerializer,
        responses={200: UserProfileSerializer},
    )
    def patch(self, request: Request) -> Response:
        serializer = UserUpdateSerializer(instance=request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response(format_success_response(data=UserProfileSerializer(user).data))
        return format_error_response(
            code="VALIDATION_ERROR",
            message="Invalid input data",
            details=serializer.errors,
        )
