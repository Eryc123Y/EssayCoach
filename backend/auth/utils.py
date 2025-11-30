"""
Utility functions for authentication app.
"""
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token


def format_success_response(data, message=None):
    """
    Format a successful API response.
    
    Args:
        data: Response data dictionary
        message: Optional success message
    
    Returns:
        dict: Formatted response
    """
    response = {
        "success": True,
        "data": data
    }
    if message:
        response["message"] = message
    return response


def format_error_response(code, message, details=None, status_code=400):
    """
    Format an error API response.
    
    Args:
        code: Error code string
        message: Error message
        details: Optional error details dictionary
        status_code: HTTP status code
    
    Returns:
        Response: DRF Response object with error format
    """
    error = {
        "code": code,
        "message": message
    }
    if details:
        error["details"] = details
    
    return Response(
        {
            "success": False,
            "error": error
        },
        status=status_code
    )


def get_or_create_token(user):
    """
    Get or create a token for a user.
    
    Args:
        user: User instance
    
    Returns:
        Token: Token object
    """
    token, created = Token.objects.get_or_create(user=user)
    return token

