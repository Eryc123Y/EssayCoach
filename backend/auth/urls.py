"""
URL configuration for authentication app.
"""
from django.urls import path
from . import views

app_name = 'auth'

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('password-reset/', views.password_reset, name='password-reset'),
    path('password-change/', views.password_change, name='password-change'),
    path('me/', views.get_current_user, name='me'),  # Handles both GET and PATCH
]

