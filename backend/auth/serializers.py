"""
Serializers for authentication app.
Contains all validation logic for auth endpoints.
"""
from typing import Dict, Any, Optional, TYPE_CHECKING

from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from drf_spectacular.utils import extend_schema_serializer
from rest_framework import serializers
from rest_framework.request import Request

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


@extend_schema_serializer(
    examples=[
        {
            "email": "student@example.com",
            "password": "SecurePassword123!",
            "password_confirm": "SecurePassword123!",
            "first_name": "John",
            "last_name": "Doe",
            "role": "student"
        }
    ]
)
class UserRegistrationSerializer(serializers.Serializer):
    """
    Serializer for user registration with validation.
    
    Fields:
    - email: Email address (required, max 254 chars, must be unique)
    - password: Password (required, write-only, must pass Django password validation)
    - password_confirm: Password confirmation (required, write-only, must match password)
    - first_name: First name (optional, max 20 chars)
    - last_name: Last name (optional, max 20 chars)
    - role: User role - 'student', 'lecturer', or 'admin' (optional, defaults to 'student')
    
    Validation:
    - Email must be unique
    - Passwords must match
    - Password must meet Django's password validation requirements
    - Role must be one of: 'student', 'lecturer', 'admin'
    """
    email = serializers.EmailField(required=True, max_length=254)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        allow_null=True
    )
    last_name = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        allow_null=True
    )
    role = serializers.CharField(
        max_length=10,
        required=False,
        allow_blank=True,
        allow_null=True
    )

    def validate_email(self, value: str) -> str:
        """Validate email format and uniqueness."""
        if User.objects.filter(user_email=value).exists():
            raise serializers.ValidationError("Email is already registered.")
        return value

    def validate_role(self, value: Optional[str]) -> Optional[str]:
        """Validate role is one of the allowed values."""
        if value:
            allowed_roles = ['student', 'lecturer', 'admin']
            if value not in allowed_roles:
                raise serializers.ValidationError(
                    f"Role must be one of: {', '.join(allowed_roles)}"
                )
        return value

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """Validate password confirmation."""
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({
                'password': 'Password fields didn\'t match.'
            })
        return attrs

    def create(self, validated_data: Dict[str, Any]) -> User:
        """Create a new user."""
        # Remove password_confirm from validated_data
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        
        # Set default role if not provided or empty
        role = validated_data.pop('role', None)
        if role and role.strip():
            validated_data['user_role'] = role.strip()
        else:
            validated_data['user_role'] = 'student'
        
        validated_data['user_status'] = 'active'
        
        # Map API field names to model field names
        if 'first_name' in validated_data:
            validated_data['user_fname'] = validated_data.pop('first_name')
        if 'last_name' in validated_data:
            validated_data['user_lname'] = validated_data.pop('last_name')
        
        # Create user
        user = User.objects.create_user(
            user_email=email,
            password=password,
            **validated_data
        )
        return user


@extend_schema_serializer(
    examples=[
        {
            "email": "student@example.com",
            "password": "SecurePassword123!"
        }
    ]
)
class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login with validation.
    
    Fields:
    - email: Email address (required)
    - password: Password (required, write-only)
    
    Validation:
    - Email and password are required
    - Credentials must be valid
    - Account must be active (not locked)
    
    Returns:
    - user: Authenticated user object (in validated_data)
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """Validate user credentials."""
        email: Optional[str] = attrs.get('email')
        password: Optional[str] = attrs.get('password')

        if email and password:
            # Use email as username since USERNAME_FIELD is user_email
            request: Optional[Request] = self.context.get('request')
            user = authenticate(
                request=request,
                username=email,
                password=password
            )

            if not user:
                # Check if failure is due to inactive account
                try:
                    existing_user = User.objects.get(user_email=email)
                    if existing_user.check_password(password) and not existing_user.is_active:
                        raise serializers.ValidationError({
                            'non_field_errors': [{
                                'code': 'ACCOUNT_LOCKED',
                                'message': 'Account is locked. Please contact administrator.'
                            }]
                        })
                except User.DoesNotExist:
                    pass

                raise serializers.ValidationError({
                    'non_field_errors': [{
                        'code': 'INVALID_CREDENTIALS',
                        'message': 'Invalid email or password'
                    }]
                })

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError({
                'non_field_errors': [{
                    'code': 'INVALID_INPUT',
                    'message': 'Email and password are required'
                }]
            })


@extend_schema_serializer(
    examples=[
        {
            "email": "student@example.com",
            "new_password": "NewSecurePassword123!",
            "new_password_confirm": "NewSecurePassword123!"
        }
    ]
)
class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for password reset (MVP: simple email + password reset).
    
    Fields:
    - email: Email address (required, must exist in system)
    - new_password: New password (required, write-only, must pass Django password validation)
    - new_password_confirm: New password confirmation (required, write-only, must match new_password)
    
    Validation:
    - Email must be registered
    - Passwords must match
    - New password must meet Django's password validation requirements
    """
    email = serializers.EmailField(required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(write_only=True, required=True)

    def validate_email(self, value: str) -> str:
        """Validate email exists."""
        if not User.objects.filter(user_email=value).exists():
            raise serializers.ValidationError("Email is not registered.")
        return value

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """Validate password confirmation."""
        if attrs.get('new_password') != attrs.get('new_password_confirm'):
            raise serializers.ValidationError({
                'new_password': 'Password fields didn\'t match.'
            })
        return attrs


@extend_schema_serializer(
    examples=[
        {
            "current_password": "OldPassword123!",
            "new_password": "NewSecurePassword123!",
            "new_password_confirm": "NewSecurePassword123!"
        }
    ]
)
class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change (authenticated user).
    
    Fields:
    - current_password: Current password (required, write-only)
    - new_password: New password (required, write-only, must pass Django password validation)
    - new_password_confirm: New password confirmation (required, write-only, must match new_password)
    
    Validation:
    - Current password must be correct
    - Passwords must match
    - New password must meet Django's password validation requirements
    """
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """Validate password confirmation and current password."""
        request: Request = self.context['request']
        user: User = request.user
        
        # Check current password
        if not user.check_password(attrs.get('current_password')):
            raise serializers.ValidationError({
                'current_password': 'Current password is incorrect'
            })
        
        # Check password match
        if attrs.get('new_password') != attrs.get('new_password_confirm'):
            raise serializers.ValidationError({
                'new_password': 'Password fields didn\'t match.'
            })
        
        return attrs


@extend_schema_serializer(
    examples=[
        {
            "id": 1,
            "email": "student@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "student",
            "status": "active",
            "date_joined": "2024-01-15T10:30:00Z"
        }
    ]
)
class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile information (read-only).
    
    Fields (all read-only):
    - id: User ID (mapped from user_id)
    - email: Email address (mapped from user_email)
    - first_name: First name (mapped from user_fname)
    - last_name: Last name (mapped from user_lname)
    - role: User role - 'student', 'lecturer', or 'admin' (mapped from user_role)
    - status: Account status - 'active', 'suspended', or 'unregistered' (mapped from user_status)
    - date_joined: Account creation timestamp
    """
    id = serializers.IntegerField(source='user_id', read_only=True)
    email = serializers.EmailField(source='user_email', read_only=True)
    first_name = serializers.CharField(source='user_fname', read_only=True)
    last_name = serializers.CharField(source='user_lname', read_only=True)
    role = serializers.CharField(source='user_role', read_only=True)
    status = serializers.CharField(source='user_status', read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'status', 'date_joined']


@extend_schema_serializer(
    examples=[
        {
            "first_name": "Jane",
            "last_name": "Smith"
        }
    ]
)
class UserUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating user profile (only first_name and last_name).
    
    Fields (all optional):
    - first_name: First name (optional, max 20 chars, can be blank/null)
    - last_name: Last name (optional, max 20 chars, can be blank/null)
    
    Note: Only first_name and last_name can be updated via this serializer.
    Other fields (email, role, status) require different endpoints or admin access.
    """
    first_name = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        allow_null=True
    )
    last_name = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        allow_null=True
    )

    def update(self, instance: User, validated_data: Dict[str, Any]) -> User:
        """Update user profile fields."""
        # Map API field names to model field names
        if 'first_name' in validated_data:
            instance.user_fname = validated_data['first_name']
        if 'last_name' in validated_data:
            instance.user_lname = validated_data['last_name']
        
        instance.save()
        return instance
