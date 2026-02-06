from __future__ import annotations

from ninja import Schema
from pydantic import Field, field_validator


class UserRegistrationIn(Schema):
    email: str = Field(..., max_length=254)
    password: str = Field(..., min_length=8)
    password_confirm: str = Field(...)
    first_name: str | None = Field(None, max_length=20)
    last_name: str | None = Field(None, max_length=20)
    role: str | None = Field(None, max_length=10)

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str | None) -> str | None:
        if v is not None:
            allowed_roles = ["student", "lecturer", "admin"]
            if v not in allowed_roles:
                raise ValueError(f"Role must be one of: {', '.join(allowed_roles)}")
        return v


class UserLoginIn(Schema):
    email: str = Field(...)
    password: str = Field(...)


class UserOut(Schema):
    id: int
    email: str
    username: str
    first_name: str | None
    last_name: str | None
    name: str
    avatar: str | None
    role: str
    status: str
    date_joined: str


class AuthResponse(Schema):
    success: bool = True
    data: AuthData
    message: str | None = None


class AuthData(Schema):
    token: str
    user: UserOut


class PasswordChangeIn(Schema):
    current_password: str = Field(...)
    new_password: str = Field(..., min_length=8)
    new_password_confirm: str = Field(...)


class PasswordResetIn(Schema):
    email: str = Field(...)
    new_password: str = Field(..., min_length=8)
    new_password_confirm: str = Field(...)


class UserUpdateIn(Schema):
    first_name: str | None = Field(None, max_length=20)
    last_name: str | None = Field(None, max_length=20)


class MessageResponse(Schema):
    success: bool = True
    message: str
    data: dict = {}


class UserInfoResponse(Schema):
    success: bool = True
    data: UserOut
