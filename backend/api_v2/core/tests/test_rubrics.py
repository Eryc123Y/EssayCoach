"""
Tests for MarkingRubric visibility functionality.

Tests cover:
- Public/private rubric filtering
- Visibility toggle permissions
- Student view restrictions

Run with: uv run pytest api_v2/core/tests/test_rubrics.py -v
"""

import pytest
from django.test import Client

from api_v2.utils.jwt_auth import create_jwt_pair
from core.models import MarkingRubric, User

# =============================================================================
# Test Fixtures
# =============================================================================


@pytest.fixture
def admin_user():
    """Create admin user."""
    return User.objects.create_user(
        user_email="admin_rubric@example.com",
        password="admin123",
        user_fname="Admin",
        user_lname="User",
        user_role="admin",
        user_status="active",
    )


@pytest.fixture
def lecturer_user():
    """Create lecturer user."""
    return User.objects.create_user(
        user_email="lecturer_rubric@example.com",
        password="lecturer123",
        user_fname="Lecturer",
        user_lname="User",
        user_role="lecturer",
        user_status="active",
    )


@pytest.fixture
def student_user():
    """Create student user."""
    return User.objects.create_user(
        user_email="student_rubric@example.com",
        password="student123",
        user_fname="Student",
        user_lname="User",
        user_role="student",
        user_status="active",
    )


@pytest.fixture
def public_rubric(lecturer_user):
    """Create a public rubric."""
    return MarkingRubric.objects.create(
        user_id_user=lecturer_user,
        rubric_desc="Public Rubric Description",
        visibility="public",
    )


@pytest.fixture
def private_rubric(lecturer_user):
    """Create a private rubric."""
    return MarkingRubric.objects.create(
        user_id_user=lecturer_user,
        rubric_desc="Private Rubric Description",
        visibility="private",
    )


@pytest.fixture
def student_private_rubric(student_user):
    """Create a private rubric owned by student."""
    return MarkingRubric.objects.create(
        user_id_user=student_user,
        rubric_desc="Student Private Rubric",
        visibility="private",
    )


# =============================================================================
# Visibility Filtering Tests
# =============================================================================


@pytest.mark.django_db
class TestRubricVisibilityFiltering:
    """Test public/private rubric filtering logic."""

    def test_list_rubrics_student_sees_only_public(self, student_user, public_rubric, private_rubric):
        """Students can only see public rubrics."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get("/api/v2/core/rubrics/")
        assert response.status_code == 200
        data = response.json()

        # Response is a list directly (from paginate()["results"])
        assert len(data) == 1
        assert data[0]["rubric_id"] == public_rubric.rubric_id
        assert data[0]["visibility"] == "public"

    def test_list_rubrics_lecturer_sees_own_and_public(self, lecturer_user, student_user, public_rubric, private_rubric):
        """Lecturers see their own private rubrics + all public rubrics."""
        # Create another lecturer's private rubric
        other_lecturer = User.objects.create_user(
            user_email="other_lecturer@example.com",
            password="lecturer123",
            user_role="lecturer",
        )
        other_private = MarkingRubric.objects.create(
            user_id_user=other_lecturer,
            rubric_desc="Other Lecturer Private Rubric",
            visibility="private",
        )

        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get("/api/v2/core/rubrics/")
        assert response.status_code == 200
        data = response.json()

        # Should see: public_rubric + private_rubric (own), but NOT other_private
        assert len(data) == 2
        rubric_ids = {r["rubric_id"] for r in data}
        assert public_rubric.rubric_id in rubric_ids
        assert private_rubric.rubric_id in rubric_ids
        assert other_private.rubric_id not in rubric_ids

    def test_list_rubrics_admin_sees_all(self, admin_user, lecturer_user, student_user):
        """Admins see all rubrics (public and private)."""
        # Create various rubrics
        admin_public = MarkingRubric.objects.create(
            user_id_user=admin_user,
            rubric_desc="Admin Public",
            visibility="public",
        )
        admin_private = MarkingRubric.objects.create(
            user_id_user=admin_user,
            rubric_desc="Admin Private",
            visibility="private",
        )
        lecturer_private = MarkingRubric.objects.create(
            user_id_user=lecturer_user,
            rubric_desc="Lecturer Private",
            visibility="private",
        )
        student_private = MarkingRubric.objects.create(
            user_id_user=student_user,
            rubric_desc="Student Private",
            visibility="private",
        )

        client = Client()
        jwt_pair = create_jwt_pair(admin_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get("/api/v2/core/rubrics/")
        assert response.status_code == 200
        data = response.json()

        # Admin sees all rubrics
        assert len(data) == 4
        rubric_ids = {r["rubric_id"] for r in data}
        assert admin_public.rubric_id in rubric_ids
        assert admin_private.rubric_id in rubric_ids
        assert lecturer_private.rubric_id in rubric_ids
        assert student_private.rubric_id in rubric_ids

    def test_list_rubrics_filter_by_visibility(self, lecturer_user, public_rubric, private_rubric):
        """Test filtering rubrics by visibility parameter."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        # Filter by public
        response = client.get("/api/v2/core/rubrics/?visibility=public")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["rubric_id"] == public_rubric.rubric_id

        # Filter by private
        response = client.get("/api/v2/core/rubrics/?visibility=private")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["rubric_id"] == private_rubric.rubric_id


# =============================================================================
# GET Rubric Permission Tests
# =============================================================================


@pytest.mark.django_db
class TestRubricGetPermissions:
    """Test GET single rubric permissions."""

    def test_get_public_rubric_any_user(self, student_user, lecturer_user, admin_user, public_rubric):
        """Any authenticated user can get public rubric."""
        client = Client()

        for user in [student_user, lecturer_user, admin_user]:
            jwt_pair = create_jwt_pair(user)
            client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

            response = client.get(f"/api/v2/core/rubrics/{public_rubric.rubric_id}/")
            assert response.status_code == 200
            assert response.json()["rubric_id"] == public_rubric.rubric_id

    def test_get_private_rubric_creator(self, lecturer_user, private_rubric):
        """Creator can get their own private rubric."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/rubrics/{private_rubric.rubric_id}/")
        assert response.status_code == 200
        assert response.json()["rubric_id"] == private_rubric.rubric_id

    def test_get_private_rubric_other_lecturer_forbidden(self, admin_user, private_rubric):
        """Other lecturers cannot view private rubric (only admin can)."""
        other_lecturer = User.objects.create_user(
            user_email="other_lecturer2@example.com",
            password="lecturer123",
            user_role="lecturer",
        )
        client = Client()
        jwt_pair = create_jwt_pair(other_lecturer)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/rubrics/{private_rubric.rubric_id}/")
        assert response.status_code == 403
        # Ninja uses 'detail' key for error messages

    def test_get_private_rubric_admin_allowed(self, admin_user, private_rubric):
        """Admin can view any private rubric."""
        client = Client()
        jwt_pair = create_jwt_pair(admin_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/rubrics/{private_rubric.rubric_id}/")
        assert response.status_code == 200
        assert response.json()["rubric_id"] == private_rubric.rubric_id

    def test_get_private_rubric_student_forbidden(self, student_user, private_rubric):
        """Students cannot view private rubrics they don't own."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/rubrics/{private_rubric.rubric_id}/")
        assert response.status_code == 403


# =============================================================================
# Visibility Toggle Tests
# =============================================================================


@pytest.mark.django_db
class TestRubricVisibilityToggle:
    """Test PATCH /rubrics/{id}/visibility/ endpoint."""

    def test_toggle_visibility_creator(self, lecturer_user, private_rubric):
        """Creator can toggle their own rubric visibility."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.patch(
            f"/api/v2/core/rubrics/{private_rubric.rubric_id}/visibility/",
            content_type="application/json",
            data={"visibility": "public"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["visibility"] == "public"

        # Verify in database
        private_rubric.refresh_from_db()
        assert private_rubric.visibility == "public"

    def test_toggle_visibility_admin(self, admin_user, private_rubric):
        """Admin can toggle any rubric visibility."""
        client = Client()
        jwt_pair = create_jwt_pair(admin_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.patch(
            f"/api/v2/core/rubrics/{private_rubric.rubric_id}/visibility/",
            content_type="application/json",
            data={"visibility": "public"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["visibility"] == "public"

    def test_toggle_visibility_other_lecturer_forbidden(self, private_rubric):
        """Other lecturers cannot toggle visibility."""
        other_lecturer = User.objects.create_user(
            user_email="other_lecturer3@example.com",
            password="lecturer123",
            user_role="lecturer",
        )
        client = Client()
        jwt_pair = create_jwt_pair(other_lecturer)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.patch(
            f"/api/v2/core/rubrics/{private_rubric.rubric_id}/visibility/",
            content_type="application/json",
            data={"visibility": "public"},
        )
        assert response.status_code == 403
        # Ninja uses 'detail' key for error messages

    def test_toggle_visibility_student_forbidden(self, student_user, private_rubric):
        """Students cannot toggle visibility."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.patch(
            f"/api/v2/core/rubrics/{private_rubric.rubric_id}/visibility/",
            content_type="application/json",
            data={"visibility": "public"},
        )
        assert response.status_code == 403

    def test_toggle_visibility_invalid_value(self, lecturer_user, private_rubric):
        """Invalid visibility value returns 422 (Pydantic validation)."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.patch(
            f"/api/v2/core/rubrics/{private_rubric.rubric_id}/visibility/",
            content_type="application/json",
            data={"visibility": "invalid"},
        )
        assert response.status_code == 422
        # Ninja returns 422 for Pydantic enum validation errors

    def test_toggle_visibility_not_found(self, lecturer_user):
        """Non-existent rubric returns 404."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.patch(
            "/api/v2/core/rubrics/99999/visibility/",
            content_type="application/json",
            data={"visibility": "public"},
        )
        assert response.status_code == 404


# =============================================================================
# Create/Update Rubric Tests
# =============================================================================


@pytest.mark.django_db
class TestRubricCreateUpdate:
    """Test rubric creation and update with visibility."""

    def test_create_rubric_with_visibility(self, lecturer_user):
        """Create rubric with explicit visibility."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.post(
            "/api/v2/core/rubrics/",
            content_type="application/json",
            data={"rubric_desc": "Test Rubric", "visibility": "public"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rubric_desc"] == "Test Rubric"
        assert data["visibility"] == "public"

    def test_create_rubric_default_visibility(self, lecturer_user):
        """Create rubric defaults to private visibility."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.post(
            "/api/v2/core/rubrics/",
            content_type="application/json",
            data={"rubric_desc": "Test Rubric Default"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["visibility"] == "private"

    def test_create_rubric_student_forbidden(self, student_user):
        """Students cannot create rubrics."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.post(
            "/api/v2/core/rubrics/",
            content_type="application/json",
            data={"rubric_desc": "Student Rubric", "visibility": "private"},
        )
        assert response.status_code == 403

    def test_update_rubric_visibility(self, lecturer_user, private_rubric):
        """Update rubric can change visibility via PUT."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.put(
            f"/api/v2/core/rubrics/{private_rubric.rubric_id}/",
            content_type="application/json",
            data={"rubric_desc": "Updated Description", "visibility": "public"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rubric_desc"] == "Updated Description"
        assert data["visibility"] == "public"

    def test_update_rubric_other_lecturer_forbidden(self, private_rubric):
        """Other lecturers cannot update rubric."""
        other_lecturer = User.objects.create_user(
            user_email="other_lecturer4@example.com",
            password="lecturer123",
            user_role="lecturer",
        )
        client = Client()
        jwt_pair = create_jwt_pair(other_lecturer)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.put(
            f"/api/v2/core/rubrics/{private_rubric.rubric_id}/",
            content_type="application/json",
            data={"rubric_desc": "Hacked"},
        )
        assert response.status_code == 403


# =============================================================================
# Delete Rubric Permission Tests
# =============================================================================


@pytest.mark.django_db
class TestRubricDeletePermissions:
    """Test rubric deletion permissions."""

    def test_delete_rubric_creator(self, lecturer_user, private_rubric):
        """Creator can delete their own rubric."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.delete(f"/api/v2/core/rubrics/{private_rubric.rubric_id}/")
        assert response.status_code == 200
        assert response.json()["success"] is True
        assert not MarkingRubric.objects.filter(rubric_id=private_rubric.rubric_id).exists()

    def test_delete_rubric_admin(self, admin_user, private_rubric):
        """Admin can delete any rubric."""
        client = Client()
        jwt_pair = create_jwt_pair(admin_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.delete(f"/api/v2/core/rubrics/{private_rubric.rubric_id}/")
        assert response.status_code == 200
        assert not MarkingRubric.objects.filter(rubric_id=private_rubric.rubric_id).exists()

    def test_delete_rubric_other_lecturer_forbidden(self, private_rubric):
        """Other lecturers cannot delete rubric."""
        other_lecturer = User.objects.create_user(
            user_email="other_lecturer5@example.com",
            password="lecturer123",
            user_role="lecturer",
        )
        client = Client()
        jwt_pair = create_jwt_pair(other_lecturer)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.delete(f"/api/v2/core/rubrics/{private_rubric.rubric_id}/")
        assert response.status_code == 403

    def test_delete_rubric_student_forbidden(self, student_user, private_rubric):
        """Students cannot delete rubrics."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.delete(f"/api/v2/core/rubrics/{private_rubric.rubric_id}/")
        assert response.status_code == 403


# =============================================================================
# Rubric Detail Permission Tests
# =============================================================================


@pytest.mark.django_db
class TestRubricDetailPermissions:
    """Test rubric detail endpoint with nested items."""

    def test_get_rubric_detail_public(self, student_user, public_rubric):
        """Students can get detail of public rubrics."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/rubrics/{public_rubric.rubric_id}/detail/")
        assert response.status_code == 200
        data = response.json()
        assert data["rubric_id"] == public_rubric.rubric_id
        assert data["visibility"] == "public"

    def test_get_rubric_detail_private_student_forbidden(self, student_user, private_rubric):
        """Students cannot get detail of private rubrics."""
        client = Client()
        jwt_pair = create_jwt_pair(student_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/rubrics/{private_rubric.rubric_id}/detail/")
        assert response.status_code == 403

    def test_get_rubric_detail_private_creator(self, lecturer_user, private_rubric):
        """Creator can get detail of their private rubric."""
        client = Client()
        jwt_pair = create_jwt_pair(lecturer_user)
        client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"

        response = client.get(f"/api/v2/core/rubrics/{private_rubric.rubric_id}/detail/")
        assert response.status_code == 200
        data = response.json()
        assert data["rubric_id"] == private_rubric.rubric_id
        assert data["visibility"] == "private"
