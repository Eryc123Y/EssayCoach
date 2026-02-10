"""
URL configuration for authentication app.
"""

from django.urls import path

from . import views

app_name = "auth"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("password-reset/", views.PasswordResetView.as_view(), name="password-reset"),
    path("password-change/", views.PasswordChangeView.as_view(), name="password-change"),
    path("me/", views.UserProfileView.as_view(), name="me"),
]
