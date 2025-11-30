"""
Comprehensive tests for authentication API endpoints.
"""
from typing import Optional, Dict, Any
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import models, connection
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

User = get_user_model()


class AuthAPITestCase(TestCase):
    """Base test case for authentication endpoints."""
    
    def setUp(self) -> None:
        """Set up test client and base URL."""
        self.client: APIClient = APIClient()
        self.base_url: str = '/api/v1/auth/'
    
    def _create_test_user(
        self,
        email: str = 'test@example.com',
        password: str = 'TestPassword123!',
        first_name: str = 'Test',
        last_name: str = 'User',
        role: str = 'student',
        is_active: bool = True,
        **kwargs: Any
    ) -> User:
        """Helper method to create a test user."""
        # Get the next available user_id
        max_id: Optional[int] = User.objects.aggregate(max_id=models.Max('user_id'))['max_id'] or 0
        user_id: int = max_id + 1
        
        # Determine user status based on is_active if not provided
        user_status = kwargs.pop('user_status', None)
        if user_status is None:
            user_status = 'active' if is_active else 'suspended'

        user: User = User.objects.create_user(
            user_email=email,
            password=password,
            user_id=user_id,
            user_fname=first_name,
            user_lname=last_name,
            user_role=role,
            user_status=user_status,
            is_active=is_active,
            **kwargs
        )
        return user


class UserRegistrationTests(AuthAPITestCase):
    """Tests for user registration endpoint."""
    
    def test_registration_success(self):
        """Test successful user registration with all fields."""
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'student'
        }
        response = self.client.post(f'{self.base_url}register/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'User registered successfully')
        self.assertIn('token', response.data['data'])
        self.assertIn('user', response.data['data'])
        
        # Verify user data
        user_data = response.data['data']['user']
        self.assertEqual(user_data['email'], 'newuser@example.com')
        self.assertEqual(user_data['first_name'], 'John')
        self.assertEqual(user_data['last_name'], 'Doe')
        self.assertEqual(user_data['role'], 'student')
        self.assertEqual(user_data['status'], 'active')
        
        # Verify user was created in database
        self.assertTrue(User.objects.filter(user_email='newuser@example.com').exists())
        
        # Verify token was created
        user = User.objects.get(user_email='newuser@example.com')
        self.assertTrue(Token.objects.filter(user=user).exists())
    
    def test_registration_minimal_fields(self):
        """Test registration with only required fields."""
        data = {
            'email': 'minimal@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!'
        }
        response = self.client.post(f'{self.base_url}register/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        # Verify default role is set
        user_data = response.data['data']['user']
        self.assertEqual(user_data['role'], 'student')
    
    def test_registration_email_taken(self):
        """Test registration with existing email."""
        # Create existing user
        self._create_test_user(email='existing@example.com')
        
        data = {
            'email': 'existing@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!'
        }
        response = self.client.post(f'{self.base_url}register/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'EMAIL_TAKEN')
        self.assertEqual(response.data['error']['message'], 'Email is already registered')
    
    def test_registration_password_mismatch(self):
        """Test registration with mismatched passwords."""
        data = {
            'email': 'mismatch@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'DifferentPassword123!'
        }
        response = self.client.post(f'{self.base_url}register/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'INVALID_INPUT')
        self.assertIn('didn\'t match', response.data['error']['message'].lower())
    
    def test_registration_weak_password(self):
        """Test registration with weak password."""
        data = {
            'email': 'weak@example.com',
            'password': '123',  # Too short
            'password_confirm': '123'
        }
        response = self.client.post(f'{self.base_url}register/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'INVALID_INPUT')
        self.assertIn('details', response.data['error'])
    
    def test_registration_invalid_email(self):
        """Test registration with invalid email format."""
        data = {
            'email': 'invalid-email',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!'
        }
        response = self.client.post(f'{self.base_url}register/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_registration_missing_fields(self):
        """Test registration with missing required fields."""
        data = {
            'email': 'missing@example.com'
            # Missing password fields
        }
        response = self.client.post(f'{self.base_url}register/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])


class UserLoginTests(AuthAPITestCase):
    """Tests for user login endpoint."""
    
    def setUp(self):
        """Set up test user for login tests."""
        super().setUp()
        self.user = self._create_test_user(
            email='login@example.com',
            password='LoginPassword123!'
        )
    
    def test_login_success(self):
        """Test successful login."""
        data = {
            'email': 'login@example.com',
            'password': 'LoginPassword123!'
        }
        response = self.client.post(f'{self.base_url}login/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data['data'])
        self.assertIn('user', response.data['data'])
        
        # Verify user data
        user_data = response.data['data']['user']
        self.assertEqual(user_data['email'], 'login@example.com')
        
        # Verify token was created
        token = response.data['data']['token']
        self.assertTrue(Token.objects.filter(key=token).exists())
    
    def test_login_invalid_credentials(self):
        """Test login with invalid password."""
        data = {
            'email': 'login@example.com',
            'password': 'WrongPassword123!'
        }
        response = self.client.post(f'{self.base_url}login/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'INVALID_CREDENTIALS')
        self.assertEqual(response.data['error']['message'], 'Invalid email or password')
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email."""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'SomePassword123!'
        }
        response = self.client.post(f'{self.base_url}login/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'INVALID_CREDENTIALS')
    
    def test_login_inactive_account(self):
        """Test login with inactive account."""
        inactive_user = self._create_test_user(
            email='inactive@example.com',
            password='Password123!',
            is_active=False,
            role='student',
            user_status='suspended'  # Use a valid status allowed by constraints
        )
        
        data = {
            'email': 'inactive@example.com',
            'password': 'Password123!'
        }
        response = self.client.post(f'{self.base_url}login/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_423_LOCKED)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'ACCOUNT_LOCKED')
        self.assertIn('locked', response.data['error']['message'].lower())
    
    def test_login_missing_fields(self):
        """Test login with missing fields."""
        # Missing password
        data = {
            'email': 'login@example.com'
        }
        response = self.client.post(f'{self.base_url}login/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'INVALID_INPUT')
    
    def test_login_invalid_email_format(self):
        """Test login with invalid email format."""
        data = {
            'email': 'invalid-email',
            'password': 'Password123!'
        }
        response = self.client.post(f'{self.base_url}login/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])


class UserLogoutTests(AuthAPITestCase):
    """Tests for user logout endpoint."""
    
    def setUp(self):
        """Set up authenticated user for logout tests."""
        super().setUp()
        self.user = self._create_test_user(
            email='logout@example.com',
            password='Password123!'
        )
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
    
    def test_logout_success(self):
        """Test successful logout."""
        response = self.client.post(f'{self.base_url}logout/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Successfully logged out')
        
        # Verify token was deleted
        self.assertFalse(Token.objects.filter(user=self.user).exists())
    
    def test_logout_unauthenticated(self):
        """Test logout without authentication."""
        self.client.credentials()  # Remove authentication
        response = self.client.post(f'{self.base_url}logout/')
        
        # Expect 403 Forbidden or 401 Unauthorized depending on DRF settings
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_logout_multiple_times(self):
        """Test logout when token doesn't exist."""
        # Delete token first
        Token.objects.filter(user=self.user).delete()
        
        # Try to logout again
        response = self.client.post(f'{self.base_url}logout/')
        
        # Should fail because authentication is required
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class PasswordResetTests(AuthAPITestCase):
    """Tests for password reset endpoint."""
    
    def setUp(self):
        """Set up test user for password reset tests."""
        super().setUp()
        self.user = self._create_test_user(
            email='reset@example.com',
            password='OldPassword123!'
        )
    
    def test_password_reset_success(self):
        """Test successful password reset."""
        data = {
            'email': 'reset@example.com',
            'new_password': 'NewPassword123!',
            'new_password_confirm': 'NewPassword123!'
        }
        response = self.client.post(f'{self.base_url}password-reset/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Password has been reset successfully')
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPassword123!'))
        self.assertFalse(self.user.check_password('OldPassword123!'))
    
    def test_password_reset_email_not_found(self):
        """Test password reset with non-existent email."""
        data = {
            'email': 'nonexistent@example.com',
            'new_password': 'NewPassword123!',
            'new_password_confirm': 'NewPassword123!'
        }
        response = self.client.post(f'{self.base_url}password-reset/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'EMAIL_NOT_FOUND')
        self.assertEqual(response.data['error']['message'], 'Email is not registered')
    
    def test_password_reset_password_mismatch(self):
        """Test password reset with mismatched passwords."""
        data = {
            'email': 'reset@example.com',
            'new_password': 'NewPassword123!',
            'new_password_confirm': 'DifferentPassword123!'
        }
        response = self.client.post(f'{self.base_url}password-reset/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'INVALID_INPUT')
        self.assertIn('didn\'t match', response.data['error']['message'].lower())
    
    def test_password_reset_weak_password(self):
        """Test password reset with weak password."""
        data = {
            'email': 'reset@example.com',
            'new_password': '123',  # Too short
            'new_password_confirm': '123'
        }
        response = self.client.post(f'{self.base_url}password-reset/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'INVALID_INPUT')
    
    def test_password_reset_invalid_email(self):
        """Test password reset with invalid email format."""
        data = {
            'email': 'invalid-email',
            'new_password': 'NewPassword123!',
            'new_password_confirm': 'NewPassword123!'
        }
        response = self.client.post(f'{self.base_url}password-reset/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])


class PasswordChangeTests(AuthAPITestCase):
    """Tests for password change endpoint (authenticated)."""
    
    def setUp(self):
        """Set up authenticated user for password change tests."""
        super().setUp()
        self.user = self._create_test_user(
            email='change@example.com',
            password='OldPassword123!'
        )
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
    
    def test_password_change_success(self):
        """Test successful password change."""
        data = {
            'current_password': 'OldPassword123!',
            'new_password': 'NewPassword123!',
            'new_password_confirm': 'NewPassword123!'
        }
        response = self.client.put(f'{self.base_url}password-change/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Password changed successfully')
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPassword123!'))
        self.assertFalse(self.user.check_password('OldPassword123!'))
    
    def test_password_change_wrong_current_password(self):
        """Test password change with incorrect current password."""
        data = {
            'current_password': 'WrongPassword123!',
            'new_password': 'NewPassword123!',
            'new_password_confirm': 'NewPassword123!'
        }
        response = self.client.put(f'{self.base_url}password-change/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'INVALID_PASSWORD')
        self.assertIn('incorrect', response.data['error']['message'].lower())
        
        # Verify password was NOT changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('OldPassword123!'))
    
    def test_password_change_password_mismatch(self):
        """Test password change with mismatched new passwords."""
        data = {
            'current_password': 'OldPassword123!',
            'new_password': 'NewPassword123!',
            'new_password_confirm': 'DifferentPassword123!'
        }
        response = self.client.put(f'{self.base_url}password-change/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'INVALID_INPUT')
        self.assertIn('didn\'t match', response.data['error']['message'].lower())
    
    def test_password_change_unauthenticated(self):
        """Test password change without authentication."""
        self.client.credentials()  # Remove authentication
        data = {
            'current_password': 'OldPassword123!',
            'new_password': 'NewPassword123!',
            'new_password_confirm': 'NewPassword123!'
        }
        response = self.client.put(f'{self.base_url}password-change/', data, format='json')
        
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_password_change_weak_password(self):
        """Test password change with weak new password."""
        data = {
            'current_password': 'OldPassword123!',
            'new_password': '123',  # Too short
            'new_password_confirm': '123'
        }
        response = self.client.put(f'{self.base_url}password-change/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])


class CurrentUserTests(AuthAPITestCase):
    """Tests for current user endpoints (GET and PATCH /me/)."""
    
    def setUp(self):
        """Set up authenticated user for current user tests."""
        super().setUp()
        self.user = self._create_test_user(
            email='me@example.com',
            password='Password123!',
            first_name='Original',
            last_name='Name',
            role='student'
        )
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
    
    def test_get_current_user_success(self):
        """Test successful retrieval of current user."""
        response = self.client.get(f'{self.base_url}me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        
        user_data = response.data['data']
        self.assertEqual(user_data['email'], 'me@example.com')
        self.assertEqual(user_data['first_name'], 'Original')
        self.assertEqual(user_data['last_name'], 'Name')
        self.assertEqual(user_data['role'], 'student')
        self.assertEqual(user_data['status'], 'active')
        self.assertIn('id', user_data)
        self.assertIn('date_joined', user_data)
    
    def test_get_current_user_unauthenticated(self):
        """Test getting current user without authentication."""
        self.client.credentials()  # Remove authentication
        response = self.client.get(f'{self.base_url}me/')
        
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_update_current_user_success(self):
        """Test successful update of current user profile."""
        data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        response = self.client.patch(f'{self.base_url}me/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        user_data = response.data['data']
        self.assertEqual(user_data['first_name'], 'Updated')
        self.assertEqual(user_data['last_name'], 'Name')
        # Email and role should remain unchanged
        self.assertEqual(user_data['email'], 'me@example.com')
        self.assertEqual(user_data['role'], 'student')
        
        # Verify database was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.user_fname, 'Updated')
        self.assertEqual(self.user.user_lname, 'Name')
    
    def test_update_current_user_partial(self):
        """Test partial update of current user (only first_name)."""
        data = {
            'first_name': 'OnlyFirst'
        }
        response = self.client.patch(f'{self.base_url}me/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        user_data = response.data['data']
        self.assertEqual(user_data['first_name'], 'OnlyFirst')
        # last_name should remain unchanged
        self.assertEqual(user_data['last_name'], 'Name')
    
    def test_update_current_user_unauthenticated(self):
        """Test updating current user without authentication."""
        self.client.credentials()  # Remove authentication
        data = {
            'first_name': 'Updated'
        }
        response = self.client.patch(f'{self.base_url}me/', data, format='json')
        
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_update_current_user_invalid_field_length(self):
        """Test update with field exceeding max length."""
        data = {
            'first_name': 'A' * 21  # Exceeds max_length=20
        }
        response = self.client.patch(f'{self.base_url}me/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 'VALIDATION_ERROR')


class TokenManagementTests(AuthAPITestCase):
    """Tests for token creation and management."""
    
    def test_token_created_on_registration(self):
        """Test that token is created when user registers."""
        data = {
            'email': 'token@example.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!'
        }
        response = self.client.post(f'{self.base_url}register/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        token_key = response.data['data']['token']
        
        user = User.objects.get(user_email='token@example.com')
        self.assertTrue(Token.objects.filter(user=user, key=token_key).exists())
    
    def test_token_created_on_login(self):
        """Test that token is created when user logs in."""
        user = self._create_test_user(
            email='logintoken@example.com',
            password='Password123!'
        )
        
        data = {
            'email': 'logintoken@example.com',
            'password': 'Password123!'
        }
        response = self.client.post(f'{self.base_url}login/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token_key = response.data['data']['token']
        
        self.assertTrue(Token.objects.filter(user=user, key=token_key).exists())
    
    def test_token_reused_on_multiple_logins(self):
        """Test that same token is reused on multiple logins."""
        user = self._create_test_user(
            email='reuse@example.com',
            password='Password123!'
        )
        
        # First login
        data = {
            'email': 'reuse@example.com',
            'password': 'Password123!'
        }
        response1 = self.client.post(f'{self.base_url}login/', data, format='json')
        token1 = response1.data['data']['token']
        
        # Second login
        response2 = self.client.post(f'{self.base_url}login/', data, format='json')
        token2 = response2.data['data']['token']
        
        # Should be the same token
        self.assertEqual(token1, token2)
        self.assertEqual(Token.objects.filter(user=user).count(), 1)
    
    def test_token_deleted_on_logout(self):
        """Test that token is deleted when user logs out."""
        user = self._create_test_user(
            email='logouttoken@example.com',
            password='Password123!'
        )
        token, _ = Token.objects.get_or_create(user=user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        response = self.client.post(f'{self.base_url}logout/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(user=user).exists())
