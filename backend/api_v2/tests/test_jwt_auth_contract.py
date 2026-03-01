from __future__ import annotations

import jwt
import pytest
from django.conf import settings

from api_v2.utils.jwt_auth import create_jwt_pair, get_jwt_algorithm, get_jwt_secret, verify_jwt_token
from core.models import User


@pytest.mark.django_db
def test_create_jwt_pair_uses_consistent_role_claims() -> None:
    user = User.objects.create_user(
        user_email="jwt-contract@example.com",
        password="SecurePass123!",
        user_role="student",
    )

    jwt_pair = create_jwt_pair(user)
    payload = verify_jwt_token(jwt_pair.access)

    assert payload is not None
    assert payload["role"] == "student"
    assert payload["user_role"] == "student"
    assert payload["iss"] == settings.JWT_ISSUER

    audience = payload["aud"]
    if isinstance(audience, list):
        assert settings.JWT_AUDIENCE in audience
    else:
        assert audience == settings.JWT_AUDIENCE


@pytest.mark.django_db
def test_verify_jwt_token_rejects_wrong_issuer() -> None:
    user = User.objects.create_user(
        user_email="jwt-issuer@example.com",
        password="SecurePass123!",
        user_role="student",
    )

    jwt_pair = create_jwt_pair(user)
    original_payload = jwt.decode(
        jwt_pair.access,
        get_jwt_secret(),
        algorithms=[get_jwt_algorithm()],
        options={"verify_signature": False},
    )
    original_payload["iss"] = "wrong-issuer"

    tampered_token = jwt.encode(
        original_payload,
        get_jwt_secret(),
        algorithm=get_jwt_algorithm(),
    )

    assert verify_jwt_token(tampered_token) is None
