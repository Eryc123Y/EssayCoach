# Auth App Documentation

## Overview

The Auth app handles all authentication and authorization functionality for the EssayCoach platform. This includes user management, role-based permissions, and secure API authentication.

## Features

### User Management
- **User Registration**: New user account creation with email verification
- **User Authentication**: Secure login/logout with session management
- **Password Management**: Password reset, change, and strength validation
- **Profile Management**: User profile information and preferences

### Role-Based Access Control
- **Students**: Can submit essays, view feedback, track progress
- **Teachers**: Can create rubrics, grade essays, manage classrooms
- **Administrators**: Full platform access and user management

### Security Features
- JWT token authentication for API endpoints
- CSRF protection for web forms
- Rate limiting for authentication endpoints
- Secure password hashing with Django's built-in tools

## Models

### CustomUser
Extended Django User model with additional fields:
- `user_type`: Student, Teacher, or Administrator
- `email_verified`: Email verification status
- `created_at`: Account creation timestamp
- `last_login_ip`: Security tracking

### UserProfile
Additional user information:
- `bio`: User biography
- `avatar`: Profile picture
- `preferences`: JSON field for user settings
- `notification_settings`: Email and app notification preferences

### Role
Permission management:
- `name`: Role name (Student, Teacher, Admin)
- `permissions`: Associated permissions
- `description`: Role description

## API Endpoints

### Authentication
```
POST /auth/register/          # User registration
POST /auth/login/             # User login
POST /auth/logout/            # User logout
GET  /auth/me/                # Current user profile
```

### Password Management
```
POST /auth/password-reset/    # Request password reset
POST /auth/password-confirm/  # Confirm password reset
PUT  /auth/password-change/   # Change password (authenticated)
```

### Profile Management
```
GET  /auth/me/                # Get user profile
PUT  /auth/me/                # Update user profile
GET  /auth/users/             # List users (admin only)
```

## Configuration

### Settings Required
Add to your Django settings:

```python
INSTALLED_APPS = [
    # ... other apps
    'auth',
]

# Token authentication (no refresh token endpoint yet)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ]
}

# Email Configuration for verification
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'your-smtp-server.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
```

### URL Configuration
Add to your main `urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    # ... other URLs
    path('auth/', include('auth.urls')),
]
```

## Testing

Run tests for the auth app:

```bash
python manage.py test auth
```

### Test Coverage
- User registration flow
- Login/logout functionality
- Password reset process
- Permission checks
- API endpoint security

## Security Considerations

1. **Password Policy**: Enforce strong passwords with minimum requirements
2. **Rate Limiting**: Implement rate limiting on authentication endpoints
3. **Email Verification**: Require email verification for new accounts
4. **Session Security**: Configure secure session settings
5. **HTTPS Only**: Ensure all authentication happens over HTTPS in production

## Development

### Adding New Permissions
1. Create new permission in Django admin or through code
2. Add permission check in views using `@permission_required` decorator
3. Update role definitions to include new permissions

### Custom Authentication Backend
The app supports custom authentication backends for integration with external systems (LDAP, OAuth, etc.).

## Troubleshooting

### Common Issues
- **Email not sending**: Check EMAIL_BACKEND and SMTP settings
- **JWT tokens not working**: Verify JWT_SETTINGS configuration
- **Permission denied**: Check user roles and permissions
- **Session issues**: Verify session middleware and settings

### Debug Mode
Enable debug logging for authentication:

```python
LOGGING = {
    'loggers': {
        'auth': {
            'level': 'DEBUG',
            'handlers': ['console'],
        },
    },
}
```

## Dependencies

- Django >= 4.2
- djangorestframework
- PyJWT (for JWT tokens)
- django-cors-headers (for frontend integration)

## Contributing

When contributing to the auth app:
1. Write tests for new functionality
2. Follow Django security best practices
3. Update this documentation for any new features
4. Ensure compatibility with existing user roles
