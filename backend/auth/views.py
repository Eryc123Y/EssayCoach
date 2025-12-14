"""
API views for authentication endpoints.
"""
from typing import Dict, Any, List, Union
from typing import TYPE_CHECKING

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    PasswordResetSerializer,
    PasswordChangeSerializer,
    UserProfileSerializer,
    UserUpdateSerializer
)
from .utils import (
    format_success_response,
    format_error_response,
    get_or_create_token
)

# Use TYPE_CHECKING to provide type hints while maintaining runtime flexibility.
# This pattern allows type checkers (mypy/pyright) to see the concrete User model
# for accurate type checking, while Python runtime uses get_user_model() to support
# custom user models as per Django best practices.
if TYPE_CHECKING:
    # Type checkers will see this import and know the exact User model type
    from ..core.models import User
else:
    # Python runtime will execute this, maintaining flexibility for custom user models
    User = get_user_model()


@extend_schema(
    tags=["Authentication"],
    summary="Register a new user",
    description="Create a new user account and receive an authentication token. The user will be assigned the 'student' role by default if not specified.",
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
                                "first_name": "John",
                                "last_name": "Doe",
                                "role": "student",
                                "status": "active",
                                "date_joined": "2024-01-15T10:30:00Z"
                            }
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Invalid input data",
            examples=[
                OpenApiExample(
                    "Validation Error",
                    value={
                        "success": False,
                        "error": {
                            "code": "INVALID_INPUT",
                            "message": "Password fields didn't match",
                            "details": {"password": ["Password fields didn't match."]}
                        }
                    }
                )
            ]
        ),
        409: OpenApiResponse(
            description="Email already registered",
            examples=[
                OpenApiExample(
                    "Email Taken",
                    value={
                        "success": False,
                        "error": {
                            "code": "EMAIL_TAKEN",
                            "message": "Email is already registered"
                        }
                    }
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Registration Request",
            value={
                "email": "student@example.com",
                "password": "SecurePassword123!",
                "password_confirm": "SecurePassword123!",
                "first_name": "John",
                "last_name": "Doe",
                "role": "student"
            }
        )
    ]
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request: Request) -> Response:
    """
    User registration endpoint.
    POST /api/v1/auth/register
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user: User = serializer.save()
        token: Token = get_or_create_token(user)
        
        # Serialize user data
        user_data: Dict[str, Any] = UserProfileSerializer(user).data
        
        response_data: Dict[str, Any] = format_success_response(
            data={
                'token': token.key,
                'user': user_data
            },
            message='User registered successfully'
        )
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    # Handle validation errors
    errors: Dict[str, Any] = serializer.errors
    
    # Check for email uniqueness error
    if 'email' in errors:
        email_error: Union[List[Any], str] = errors['email']
        if isinstance(email_error, list) and len(email_error) > 0:
            if 'already registered' in str(email_error[0]).lower():
                return format_error_response(
                    code='EMAIL_TAKEN',
                    message='Email is already registered',
                    status_code=status.HTTP_409_CONFLICT
                )
    
    # Check for password mismatch
    if 'password' in errors or 'non_field_errors' in errors:
        password_error: Union[List[Any], str] = errors.get('password', [])
        if password_error and 'didn\'t match' in str(password_error[0]).lower():
            return format_error_response(
                code='INVALID_INPUT',
                message='Password fields didn\'t match',
                details=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    # Generic validation error
    return format_error_response(
        code='INVALID_INPUT',
        message='Invalid input data',
        details=errors,
        status_code=status.HTTP_400_BAD_REQUEST
    )


@extend_schema(
    tags=["Authentication"],
    summary="User login",
    description="Authenticate a user with email and password. Returns an authentication token and user profile information.",
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
                                "first_name": "John",
                                "last_name": "Doe",
                                "role": "student",
                                "status": "active",
                                "date_joined": "2024-01-15T10:30:00Z"
                            }
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Invalid input",
            examples=[
                OpenApiExample(
                    "Missing Fields",
                    value={
                        "success": False,
                        "error": {
                            "code": "INVALID_INPUT",
                            "message": "Email and password are required"
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(
            description="Invalid credentials",
            examples=[
                OpenApiExample(
                    "Invalid Credentials",
                    value={
                        "success": False,
                        "error": {
                            "code": "INVALID_CREDENTIALS",
                            "message": "Invalid email or password"
                        }
                    }
                )
            ]
        ),
        423: OpenApiResponse(
            description="Account locked",
            examples=[
                OpenApiExample(
                    "Account Locked",
                    value={
                        "success": False,
                        "error": {
                            "code": "ACCOUNT_LOCKED",
                            "message": "Account is locked. Please contact administrator."
                        }
                    }
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Login Request",
            value={
                "email": "student@example.com",
                "password": "SecurePassword123!"
            }
        )
    ]
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request: Request) -> Response:
    """
    User login endpoint.
    POST /api/v1/auth/login
    """
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user: User = serializer.validated_data['user']
        token: Token = get_or_create_token(user)
        
        # Serialize user data
        user_data: Dict[str, Any] = UserProfileSerializer(user).data
        
        response_data: Dict[str, Any] = format_success_response(
            data={
                'token': token.key,
                'user': user_data
            }
        )
        return Response(response_data, status=status.HTTP_200_OK)
    
    # Handle validation errors
    errors: Dict[str, Any] = serializer.errors
    
    # Extract error code and message from non_field_errors
    if 'non_field_errors' in errors:
        error_list: Union[List[Any], str] = errors['non_field_errors']
        if isinstance(error_list, list) and len(error_list) > 0:
            error_obj: Any = error_list[0]
            if isinstance(error_obj, dict):
                error_code: str = error_obj.get('code', 'INVALID_CREDENTIALS')
                error_message: str = error_obj.get('message', 'Invalid email or password')
                
                status_code: int = status.HTTP_401_UNAUTHORIZED
                if error_code == 'ACCOUNT_LOCKED':
                    status_code = status.HTTP_423_LOCKED
                elif error_code == 'INVALID_INPUT':
                    status_code = status.HTTP_400_BAD_REQUEST
                
                return format_error_response(
                    code=error_code,
                    message=error_message,
                    status_code=status_code
                )
    
    # Generic error
    return format_error_response(
        code='INVALID_INPUT',
        message='Email and password are required',
        status_code=status.HTTP_400_BAD_REQUEST
    )


@extend_schema(
    tags=["Authentication"],
    summary="User logout",
    description="Invalidate the current user's authentication token. Requires authentication.",
    request=None,
    responses={
        200: OpenApiResponse(
            description="Logout successful",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "success": True,
                        "message": "Successfully logged out",
                        "data": {}
                    }
                )
            ]
        ),
        401: OpenApiResponse(
            description="Authentication required",
            examples=[
                OpenApiExample(
                    "Unauthorized",
                    value={
                        "detail": "Authentication credentials were not provided."
                    }
                )
            ]
        )
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request: Request) -> Response:
    """
    User logout endpoint.
    POST /api/v1/auth/logout
    """
    try:
        # Delete the user's token
        Token.objects.filter(user=request.user).delete()
    except Exception:
        # Token might not exist, which is fine
        pass
    
    response_data: Dict[str, Any] = format_success_response(
        data={},
        message='Successfully logged out'
    )
    return Response(response_data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["Authentication"],
    summary="Reset password",
    description="Reset a user's password using their email address. No authentication required. This is a simple MVP implementation.",
    request=PasswordResetSerializer,
    responses={
        200: OpenApiResponse(
            description="Password reset successful",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "success": True,
                        "message": "Password has been reset successfully",
                        "data": {}
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Invalid input",
            examples=[
                OpenApiExample(
                    "Password Mismatch",
                    value={
                        "success": False,
                        "error": {
                            "code": "INVALID_INPUT",
                            "message": "Password fields didn't match",
                            "details": {"new_password": ["Password fields didn't match."]}
                        }
                    }
                )
            ]
        ),
        404: OpenApiResponse(
            description="Email not found",
            examples=[
                OpenApiExample(
                    "Email Not Found",
                    value={
                        "success": False,
                        "error": {
                            "code": "EMAIL_NOT_FOUND",
                            "message": "Email is not registered"
                        }
                    }
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Password Reset Request",
            value={
                "email": "student@example.com",
                "new_password": "NewSecurePassword123!",
                "new_password_confirm": "NewSecurePassword123!"
            }
        )
    ]
)
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset(request: Request) -> Response:
    """
    Reset password with email and new password (MVP: simple verification).
    POST /api/v1/auth/password-reset
    """
    serializer = PasswordResetSerializer(data=request.data)
    
    if not serializer.is_valid():
        errors: Dict[str, Any] = serializer.errors
        
        # Check for email not found
        if 'email' in errors:
            email_error: Union[List[Any], str] = errors['email']
            if isinstance(email_error, list) and len(email_error) > 0:
                if 'not registered' in str(email_error[0]).lower():
                    return format_error_response(
                        code='EMAIL_NOT_FOUND',
                        message='Email is not registered',
                        status_code=status.HTTP_404_NOT_FOUND
                    )
        
        # Check for password mismatch
        if 'new_password' in errors or 'non_field_errors' in errors:
            password_error: Union[List[Any], str] = errors.get('new_password', [])
            if password_error and 'didn\'t match' in str(password_error[0]).lower():
                return format_error_response(
                    code='INVALID_INPUT',
                    message='Password fields didn\'t match',
                    details=errors,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        
        return format_error_response(
            code='INVALID_INPUT',
            message='Invalid input data',
            details=errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    email: str = serializer.validated_data['email']
    new_password: str = serializer.validated_data['new_password']
    
    # Get user and reset password
    try:
        user: User = User.objects.get(user_email=email)
        user.set_password(new_password)
        user.save()
        
        response_data: Dict[str, Any] = format_success_response(
            data={},
            message='Password has been reset successfully'
        )
        return Response(response_data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return format_error_response(
            code='EMAIL_NOT_FOUND',
            message='Email is not registered',
            status_code=status.HTTP_404_NOT_FOUND
        )


@extend_schema(
    tags=["Authentication"],
    summary="Change password",
    description="Change the password for the currently authenticated user. Requires current password verification.",
    request=PasswordChangeSerializer,
    responses={
        200: OpenApiResponse(
            description="Password changed successfully",
            examples=[
                OpenApiExample(
                    "Success Response",
                    value={
                        "success": True,
                        "message": "Password changed successfully",
                        "data": {}
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Invalid input or incorrect current password",
            examples=[
                OpenApiExample(
                    "Incorrect Current Password",
                    value={
                        "success": False,
                        "error": {
                            "code": "INVALID_PASSWORD",
                            "message": "Current password is incorrect"
                        }
                    }
                ),
                OpenApiExample(
                    "Password Mismatch",
                    value={
                        "success": False,
                        "error": {
                            "code": "INVALID_INPUT",
                            "message": "Password fields didn't match",
                            "details": {"new_password": ["Password fields didn't match."]}
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(
            description="Authentication required",
            examples=[
                OpenApiExample(
                    "Unauthorized",
                    value={
                        "detail": "Authentication credentials were not provided."
                    }
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Password Change Request",
            value={
                "current_password": "OldPassword123!",
                "new_password": "NewSecurePassword123!",
                "new_password_confirm": "NewSecurePassword123!"
            }
        )
    ]
)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def password_change(request: Request) -> Response:
    """
    Change password for authenticated user.
    PUT /api/v1/auth/password-change
    """
    serializer = PasswordChangeSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        user: User = request.user
        password: str = serializer.validated_data['current_password']
        new_password: str = serializer.validated_data['new_password']
        
        # Double check password (defensive programming)
        if not user.check_password(password):
            return format_error_response(
                code='INVALID_PASSWORD',
                message='Current password is incorrect',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Update password
        user.set_password(new_password)
        user.save()
        
        response_data: Dict[str, Any] = format_success_response(
            data={},
            message='Password changed successfully'
        )
        return Response(response_data, status=status.HTTP_200_OK)
    
    # Handle validation errors
    errors: Dict[str, Any] = serializer.errors
    
    # Check for current password error
    if 'current_password' in errors:
        current_password_error: Union[List[Any], str] = errors['current_password']
        if isinstance(current_password_error, list) and len(current_password_error) > 0:
            if 'incorrect' in str(current_password_error[0]).lower():
                return format_error_response(
                    code='INVALID_PASSWORD',
                    message='Current password is incorrect',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
    
    # Check for password mismatch
    if 'new_password' in errors or 'non_field_errors' in errors:
        password_error: Union[List[Any], str] = errors.get('new_password', [])
        if password_error and 'didn\'t match' in str(password_error[0]).lower():
            return format_error_response(
                code='INVALID_INPUT',
                message='Password fields didn\'t match',
                details=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    # Generic validation error
    return format_error_response(
        code='VALIDATION_ERROR',
        message='Invalid input data',
        details=errors,
        status_code=status.HTTP_400_BAD_REQUEST
    )


@extend_schema(
    tags=["Authentication"],
    summary="Get or update current user profile",
    description="Retrieve or update the profile information of the currently authenticated user.",
    request=UserUpdateSerializer,
    responses={
        200: OpenApiResponse(
            response=UserProfileSerializer,
            description="User profile retrieved or updated successfully",
            examples=[
                OpenApiExample(
                    "GET Response",
                    value={
                        "success": True,
                        "data": {
                            "id": 1,
                            "email": "student@example.com",
                            "first_name": "John",
                            "last_name": "Doe",
                            "role": "student",
                            "status": "active",
                            "date_joined": "2024-01-15T10:30:00Z"
                        }
                    }
                ),
                OpenApiExample(
                    "PATCH Response",
                    value={
                        "success": True,
                        "data": {
                            "id": 1,
                            "email": "student@example.com",
                            "first_name": "Jane",
                            "last_name": "Smith",
                            "role": "student",
                            "status": "active",
                            "date_joined": "2024-01-15T10:30:00Z"
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            description="Validation error",
            examples=[
                OpenApiExample(
                    "Validation Error",
                    value={
                        "success": False,
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "Invalid input data",
                            "details": {"first_name": ["This field may not be blank."]}
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(
            description="Authentication required",
            examples=[
                OpenApiExample(
                    "Unauthorized",
                    value={
                        "detail": "Authentication credentials were not provided."
                    }
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "PATCH Request",
            value={
                "first_name": "Jane",
                "last_name": "Smith"
            }
        )
    ]
)
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_current_user(request: Request) -> Response:
    """
    Get or update current authenticated user's profile.
    GET /api/v1/auth/me - Get user profile
    PATCH /api/v1/auth/me - Update user profile
    """
    if request.method == 'GET':
        profile_serializer: UserProfileSerializer = UserProfileSerializer(request.user)
        profile_data: Dict[str, Any] = format_success_response(data=profile_serializer.data)
        return Response(profile_data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        update_serializer: UserUpdateSerializer = UserUpdateSerializer(
            instance=request.user,
            data=request.data,
            partial=True
        )
        
        if update_serializer.is_valid():
            user: User = update_serializer.save()
            user_data: Dict[str, Any] = UserProfileSerializer(user).data
            patch_data: Dict[str, Any] = format_success_response(data=user_data)
            return Response(patch_data, status=status.HTTP_200_OK)
        
        # Handle validation errors
        return format_error_response(
            code='VALIDATION_ERROR',
            message='Invalid input data',
            details=update_serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )
