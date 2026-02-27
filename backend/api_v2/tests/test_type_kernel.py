"""
TDD Tests for Type Kernel (Phase 1: Build Type Kernel).

These tests define the expected behavior of the centralized type system
BEFORE implementation. They must FAIL initially (RED phase), then pass
after implementation (GREEN phase).

Tests cover:
1. StrEnum types for all domain-constrained string fields
2. NewType typed IDs for all core entities
3. Enum member completeness (matching Django model constraints)
4. Schema serialization/deserialization with enum-backed fields
5. Common schemas deduplication (PaginationParams, MessageResponse, ErrorResponse)
6. Backward compatibility of re-export facade (api_v2/schemas/base.py)
"""

from __future__ import annotations

import enum

import pytest
from pydantic import ValidationError


# ---------------------------------------------------------------------------
# 1. StrEnum imports -- these modules do not exist yet (RED)
# ---------------------------------------------------------------------------

class TestEnumImports:
    """Verify that all enum types are importable from api_v2.types.enums."""

    def test_user_role_importable(self):
        from api_v2.types.enums import UserRole
        assert issubclass(UserRole, enum.StrEnum)

    def test_user_status_importable(self):
        from api_v2.types.enums import UserStatus
        assert issubclass(UserStatus, enum.StrEnum)

    def test_task_status_importable(self):
        from api_v2.types.enums import TaskStatus
        assert issubclass(TaskStatus, enum.StrEnum)

    def test_class_status_importable(self):
        from api_v2.types.enums import ClassStatus
        assert issubclass(ClassStatus, enum.StrEnum)

    def test_class_term_importable(self):
        from api_v2.types.enums import ClassTerm
        assert issubclass(ClassTerm, enum.StrEnum)

    def test_visibility_importable(self):
        from api_v2.types.enums import Visibility
        assert issubclass(Visibility, enum.StrEnum)

    def test_feedback_source_importable(self):
        from api_v2.types.enums import FeedbackSource
        assert issubclass(FeedbackSource, enum.StrEnum)

    def test_response_mode_importable(self):
        from api_v2.types.enums import ResponseMode
        assert issubclass(ResponseMode, enum.StrEnum)

    def test_workflow_status_importable(self):
        from api_v2.types.enums import WorkflowStatus
        assert issubclass(WorkflowStatus, enum.StrEnum)

    def test_theme_preference_importable(self):
        from api_v2.types.enums import ThemePreference
        assert issubclass(ThemePreference, enum.StrEnum)

    def test_improvement_trend_importable(self):
        from api_v2.types.enums import ImprovementTrend
        assert issubclass(ImprovementTrend, enum.StrEnum)


# ---------------------------------------------------------------------------
# 2. Enum member completeness -- values must match Django constraints
# ---------------------------------------------------------------------------

class TestUserRoleMembers:
    """UserRole enum must have exactly student, lecturer, admin."""

    def test_student(self):
        from api_v2.types.enums import UserRole
        assert UserRole.STUDENT == "student"

    def test_lecturer(self):
        from api_v2.types.enums import UserRole
        assert UserRole.LECTURER == "lecturer"

    def test_admin(self):
        from api_v2.types.enums import UserRole
        assert UserRole.ADMIN == "admin"

    def test_exhaustive(self):
        from api_v2.types.enums import UserRole
        assert set(UserRole) == {UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN}

    def test_str_coercion(self):
        """StrEnum members should compare equal to their string values."""
        from api_v2.types.enums import UserRole
        assert UserRole.STUDENT == "student"
        assert str(UserRole.STUDENT) == "student"


class TestUserStatusMembers:
    """UserStatus enum must have exactly active, suspended, unregistered."""

    def test_active(self):
        from api_v2.types.enums import UserStatus
        assert UserStatus.ACTIVE == "active"

    def test_suspended(self):
        from api_v2.types.enums import UserStatus
        assert UserStatus.SUSPENDED == "suspended"

    def test_unregistered(self):
        from api_v2.types.enums import UserStatus
        assert UserStatus.UNREGISTERED == "unregistered"

    def test_exhaustive(self):
        from api_v2.types.enums import UserStatus
        assert len(UserStatus) == 3


class TestTaskStatusMembers:
    """TaskStatus enum must match Django model choices."""

    def test_draft(self):
        from api_v2.types.enums import TaskStatus
        assert TaskStatus.DRAFT == "draft"

    def test_published(self):
        from api_v2.types.enums import TaskStatus
        assert TaskStatus.PUBLISHED == "published"

    def test_unpublished(self):
        from api_v2.types.enums import TaskStatus
        assert TaskStatus.UNPUBLISHED == "unpublished"

    def test_archived(self):
        from api_v2.types.enums import TaskStatus
        assert TaskStatus.ARCHIVED == "archived"

    def test_exhaustive(self):
        from api_v2.types.enums import TaskStatus
        assert len(TaskStatus) == 4


class TestClassStatusMembers:
    """ClassStatus enum must have active, archived."""

    def test_active(self):
        from api_v2.types.enums import ClassStatus
        assert ClassStatus.ACTIVE == "active"

    def test_archived(self):
        from api_v2.types.enums import ClassStatus
        assert ClassStatus.ARCHIVED == "archived"

    def test_exhaustive(self):
        from api_v2.types.enums import ClassStatus
        assert len(ClassStatus) == 2


class TestClassTermMembers:
    """ClassTerm must match Django model choices."""

    def test_semester1(self):
        from api_v2.types.enums import ClassTerm
        assert ClassTerm.SEMESTER1 == "semester1"

    def test_semester2(self):
        from api_v2.types.enums import ClassTerm
        assert ClassTerm.SEMESTER2 == "semester2"

    def test_term1(self):
        from api_v2.types.enums import ClassTerm
        assert ClassTerm.TERM1 == "term1"

    def test_term2(self):
        from api_v2.types.enums import ClassTerm
        assert ClassTerm.TERM2 == "term2"

    def test_full_year(self):
        from api_v2.types.enums import ClassTerm
        assert ClassTerm.FULL_YEAR == "full_year"

    def test_exhaustive(self):
        from api_v2.types.enums import ClassTerm
        assert len(ClassTerm) == 5


class TestVisibilityMembers:
    """Visibility must have public, private."""

    def test_public(self):
        from api_v2.types.enums import Visibility
        assert Visibility.PUBLIC == "public"

    def test_private(self):
        from api_v2.types.enums import Visibility
        assert Visibility.PRIVATE == "private"

    def test_exhaustive(self):
        from api_v2.types.enums import Visibility
        assert len(Visibility) == 2


class TestFeedbackSourceMembers:
    """FeedbackSource must match Django constraint: ai, human, revised."""

    def test_ai(self):
        from api_v2.types.enums import FeedbackSource
        assert FeedbackSource.AI == "ai"

    def test_human(self):
        from api_v2.types.enums import FeedbackSource
        assert FeedbackSource.HUMAN == "human"

    def test_revised(self):
        from api_v2.types.enums import FeedbackSource
        assert FeedbackSource.REVISED == "revised"

    def test_exhaustive(self):
        from api_v2.types.enums import FeedbackSource
        assert len(FeedbackSource) == 3


class TestResponseModeMembers:
    """ResponseMode must have blocking, streaming."""

    def test_blocking(self):
        from api_v2.types.enums import ResponseMode
        assert ResponseMode.BLOCKING == "blocking"

    def test_streaming(self):
        from api_v2.types.enums import ResponseMode
        assert ResponseMode.STREAMING == "streaming"

    def test_exhaustive(self):
        from api_v2.types.enums import ResponseMode
        assert len(ResponseMode) == 2


class TestWorkflowStatusMembers:
    """WorkflowStatus must have pending, running, succeeded, failed, cancelled."""

    def test_pending(self):
        from api_v2.types.enums import WorkflowStatus
        assert WorkflowStatus.PENDING == "pending"

    def test_running(self):
        from api_v2.types.enums import WorkflowStatus
        assert WorkflowStatus.RUNNING == "running"

    def test_succeeded(self):
        from api_v2.types.enums import WorkflowStatus
        assert WorkflowStatus.SUCCEEDED == "succeeded"

    def test_failed(self):
        from api_v2.types.enums import WorkflowStatus
        assert WorkflowStatus.FAILED == "failed"

    def test_cancelled(self):
        from api_v2.types.enums import WorkflowStatus
        assert WorkflowStatus.CANCELLED == "cancelled"

    def test_exhaustive(self):
        from api_v2.types.enums import WorkflowStatus
        assert len(WorkflowStatus) == 5


class TestThemePreferenceMembers:
    """ThemePreference must have light, dark, system."""

    def test_light(self):
        from api_v2.types.enums import ThemePreference
        assert ThemePreference.LIGHT == "light"

    def test_dark(self):
        from api_v2.types.enums import ThemePreference
        assert ThemePreference.DARK == "dark"

    def test_system(self):
        from api_v2.types.enums import ThemePreference
        assert ThemePreference.SYSTEM == "system"

    def test_exhaustive(self):
        from api_v2.types.enums import ThemePreference
        assert len(ThemePreference) == 3


class TestImprovementTrendMembers:
    """ImprovementTrend must have up, down, stable."""

    def test_up(self):
        from api_v2.types.enums import ImprovementTrend
        assert ImprovementTrend.UP == "up"

    def test_down(self):
        from api_v2.types.enums import ImprovementTrend
        assert ImprovementTrend.DOWN == "down"

    def test_stable(self):
        from api_v2.types.enums import ImprovementTrend
        assert ImprovementTrend.STABLE == "stable"

    def test_exhaustive(self):
        from api_v2.types.enums import ImprovementTrend
        assert len(ImprovementTrend) == 3


# ---------------------------------------------------------------------------
# 3. NewType IDs -- must be importable from api_v2.types.ids
# ---------------------------------------------------------------------------

class TestNewTypeIds:
    """All entity IDs must be defined as NewType wrappers."""

    def test_user_id(self):
        from api_v2.types.ids import UserId
        uid = UserId(42)
        assert uid == 42
        assert isinstance(uid, int)

    def test_class_id(self):
        from api_v2.types.ids import ClassId
        cid = ClassId(7)
        assert cid == 7

    def test_task_id(self):
        from api_v2.types.ids import TaskId
        tid = TaskId(99)
        assert tid == 99

    def test_submission_id(self):
        from api_v2.types.ids import SubmissionId
        sid = SubmissionId(123)
        assert sid == 123

    def test_feedback_id(self):
        from api_v2.types.ids import FeedbackId
        fid = FeedbackId(55)
        assert fid == 55

    def test_rubric_id(self):
        from api_v2.types.ids import RubricId
        rid = RubricId(8)
        assert rid == 8

    def test_rubric_item_id(self):
        from api_v2.types.ids import RubricItemId
        riid = RubricItemId(12)
        assert riid == 12

    def test_enrollment_id(self):
        from api_v2.types.ids import EnrollmentId
        eid = EnrollmentId(3)
        assert eid == 3

    def test_badge_id(self):
        from api_v2.types.ids import BadgeId
        bid = BadgeId(5)
        assert bid == 5

    def test_unit_id_is_str(self):
        """UnitId is str-based (primary key is CharField)."""
        from api_v2.types.ids import UnitId
        uid = UnitId("CS101")
        assert uid == "CS101"
        assert isinstance(uid, str)


# ---------------------------------------------------------------------------
# 4. Convenience re-exports from api_v2.types package __init__
# ---------------------------------------------------------------------------

class TestPackageReExports:
    """api_v2.types.__init__ should re-export all enums and IDs."""

    def test_enums_from_package(self):
        from api_v2.types import (
            ClassStatus,
            ClassTerm,
            FeedbackSource,
            ImprovementTrend,
            ResponseMode,
            ThemePreference,
            UserRole,
            UserStatus,
            TaskStatus,
            Visibility,
            WorkflowStatus,
        )
        assert UserRole.STUDENT == "student"
        assert TaskStatus.DRAFT == "draft"

    def test_ids_from_package(self):
        from api_v2.types import (
            BadgeId,
            ClassId,
            EnrollmentId,
            FeedbackId,
            RubricId,
            RubricItemId,
            SubmissionId,
            TaskId,
            UnitId,
            UserId,
        )
        assert UserId(1) == 1
        assert UnitId("X") == "X"


# ---------------------------------------------------------------------------
# 5. Common schemas in api_v2.types.common
# ---------------------------------------------------------------------------

class TestCommonSchemas:
    """Verify PaginationParams, MessageResponse, ErrorResponse live in common."""

    def test_pagination_params_defaults(self):
        from api_v2.types.common import PaginationParams
        p = PaginationParams()
        assert p.page == 1
        assert p.page_size == 50

    def test_pagination_params_validation(self):
        from api_v2.types.common import PaginationParams
        with pytest.raises(ValidationError):
            PaginationParams(page=0)  # page must be >= 1

    def test_pagination_params_max_page_size(self):
        from api_v2.types.common import PaginationParams
        with pytest.raises(ValidationError):
            PaginationParams(page_size=101)  # max 100

    def test_message_response(self):
        from api_v2.types.common import MessageResponse
        r = MessageResponse(message="ok")
        assert r.message == "ok"

    def test_error_response(self):
        from api_v2.types.common import ErrorResponse
        e = ErrorResponse(error="something went wrong")
        assert e.error == "something went wrong"


# ---------------------------------------------------------------------------
# 6. Backward compatibility -- base.py re-exports
# ---------------------------------------------------------------------------

class TestBaseReExports:
    """api_v2/schemas/base.py must still export all existing names."""

    def test_pagination_params_from_base(self):
        from api_v2.schemas.base import PaginationParams
        p = PaginationParams()
        assert p.page == 1

    def test_message_response_from_base(self):
        from api_v2.schemas.base import MessageResponse
        r = MessageResponse(message="hi")
        assert r.message == "hi"

    def test_error_response_from_base(self):
        from api_v2.schemas.base import ErrorResponse
        # ErrorResponse from base already has its own shape (success + error detail)
        # We verify it is still importable
        assert ErrorResponse is not None

    def test_success_response_from_base(self):
        from api_v2.schemas.base import SuccessResponse
        s = SuccessResponse()
        assert s.success is True

    def test_paginated_response_from_base(self):
        from api_v2.schemas.base import PaginatedResponse
        assert PaginatedResponse is not None


# ---------------------------------------------------------------------------
# 7. Schema fields use enum types (after migration)
# ---------------------------------------------------------------------------

class TestCoreSchemaEnumFields:
    """After migration, core schema fields should accept enum values."""

    def test_user_in_accepts_enum_role(self):
        from api_v2.core.schemas import UserIn
        from api_v2.types.enums import UserRole
        u = UserIn(
            user_email="test@test.com",
            password="secret123",
            user_role=UserRole.STUDENT,
        )
        assert u.user_role == "student"
        assert u.user_role == UserRole.STUDENT

    def test_user_in_accepts_string_role(self):
        """Backward compat: plain strings should still work."""
        from api_v2.core.schemas import UserIn
        u = UserIn(
            user_email="test@test.com",
            password="secret123",
            user_role="lecturer",
        )
        assert u.user_role == "lecturer"

    def test_user_in_rejects_invalid_role(self):
        """After migration, invalid roles should be rejected."""
        from api_v2.core.schemas import UserIn
        with pytest.raises(ValidationError):
            UserIn(
                user_email="test@test.com",
                password="secret123",
                user_role="superadmin",
            )

    def test_user_in_rejects_invalid_status(self):
        from api_v2.core.schemas import UserIn
        with pytest.raises(ValidationError):
            UserIn(
                user_email="test@test.com",
                password="secret123",
                user_status="banned",
            )

    def test_task_in_accepts_enum_status(self):
        from datetime import datetime, timezone
        from api_v2.core.schemas import TaskIn
        from api_v2.types.enums import TaskStatus
        t = TaskIn(
            unit_id_unit="CS101",
            rubric_id_marking_rubric=1,
            task_due_datetime=datetime(2026, 12, 31, tzinfo=timezone.utc),
            task_title="Essay 1",
            task_status=TaskStatus.DRAFT,
        )
        assert t.task_status == "draft"

    def test_task_in_rejects_invalid_status(self):
        from datetime import datetime, timezone
        from api_v2.core.schemas import TaskIn
        with pytest.raises(ValidationError):
            TaskIn(
                unit_id_unit="CS101",
                rubric_id_marking_rubric=1,
                task_due_datetime=datetime(2026, 12, 31, tzinfo=timezone.utc),
                task_title="Essay 1",
                task_status="deleted",
            )

    def test_class_in_accepts_enum_term(self):
        from api_v2.core.schemas import ClassIn
        from api_v2.types.enums import ClassTerm
        c = ClassIn(
            unit_id_unit="CS101",
            class_name="Class A",
            class_term=ClassTerm.SEMESTER1,
        )
        assert c.class_term == "semester1"

    def test_class_in_rejects_invalid_term(self):
        from api_v2.core.schemas import ClassIn
        with pytest.raises(ValidationError):
            ClassIn(
                unit_id_unit="CS101",
                class_name="Class A",
                class_term="quarter1",
            )

    def test_feedback_item_in_accepts_enum_source(self):
        from api_v2.core.schemas import FeedbackItemIn
        from api_v2.types.enums import FeedbackSource
        fi = FeedbackItemIn(
            feedback_id_feedback=1,
            rubric_item_id_rubric_item=2,
            feedback_item_score=85,
            feedback_item_source=FeedbackSource.AI,
        )
        assert fi.feedback_item_source == "ai"

    def test_feedback_item_in_rejects_invalid_source(self):
        from api_v2.core.schemas import FeedbackItemIn
        with pytest.raises(ValidationError):
            FeedbackItemIn(
                feedback_id_feedback=1,
                rubric_item_id_rubric_item=2,
                feedback_item_score=85,
                feedback_item_source="machine",
            )

    def test_marking_rubric_in_accepts_enum_visibility(self):
        from api_v2.core.schemas import MarkingRubricIn
        from api_v2.types.enums import Visibility
        r = MarkingRubricIn(visibility=Visibility.PUBLIC)
        assert r.visibility == "public"

    def test_marking_rubric_in_rejects_invalid_visibility(self):
        from api_v2.core.schemas import MarkingRubricIn
        with pytest.raises(ValidationError):
            MarkingRubricIn(visibility="hidden")

    def test_rubric_visibility_update_rejects_invalid(self):
        from api_v2.core.schemas import RubricVisibilityUpdate
        with pytest.raises(ValidationError):
            RubricVisibilityUpdate(visibility="hidden")


class TestAuthSchemaEnumFields:
    """Auth schemas should use enum types after migration."""

    def test_registration_accepts_enum_role(self):
        from api_v2.auth.schemas import UserRegistrationIn
        from api_v2.types.enums import UserRole
        u = UserRegistrationIn(
            email="a@b.com",
            password="12345678",
            password_confirm="12345678",
            role=UserRole.STUDENT,
        )
        assert u.role == "student"

    def test_registration_rejects_invalid_role(self):
        from api_v2.auth.schemas import UserRegistrationIn
        with pytest.raises(ValidationError):
            UserRegistrationIn(
                email="a@b.com",
                password="12345678",
                password_confirm="12345678",
                role="superadmin",
            )

    def test_preferences_accepts_enum_theme(self):
        from api_v2.auth.schemas import UserPreferencesIn
        from api_v2.types.enums import ThemePreference
        p = UserPreferencesIn(theme=ThemePreference.DARK)
        assert p.theme == "dark"

    def test_preferences_rejects_invalid_theme(self):
        from api_v2.auth.schemas import UserPreferencesIn
        with pytest.raises(ValidationError):
            UserPreferencesIn(theme="neon")


class TestAIFeedbackSchemaEnumFields:
    """AI feedback schemas should use enum types after migration."""

    def test_workflow_run_in_accepts_enum_response_mode(self):
        from api_v2.ai_feedback.schemas import WorkflowRunIn
        from api_v2.types.enums import ResponseMode
        w = WorkflowRunIn(
            essay_question="Discuss AI",
            essay_content="AI is...",
            response_mode=ResponseMode.BLOCKING,
        )
        assert w.response_mode == "blocking"

    def test_workflow_run_in_rejects_invalid_response_mode(self):
        from api_v2.ai_feedback.schemas import WorkflowRunIn
        with pytest.raises(ValidationError):
            WorkflowRunIn(
                essay_question="Discuss AI",
                essay_content="AI is...",
                response_mode="batch",
            )


# ---------------------------------------------------------------------------
# 8. Enum serialization round-trip via Pydantic
# ---------------------------------------------------------------------------

class TestEnumSerialization:
    """Enum values must serialize to plain strings in JSON output."""

    def test_user_in_serializes_role_as_string(self):
        from api_v2.core.schemas import UserIn
        from api_v2.types.enums import UserRole
        u = UserIn(
            user_email="x@y.com",
            password="pass1234",
            user_role=UserRole.ADMIN,
        )
        data = u.model_dump()
        assert data["user_role"] == "admin"
        assert isinstance(data["user_role"], str)

    def test_user_in_json_round_trip(self):
        from api_v2.core.schemas import UserIn
        from api_v2.types.enums import UserRole
        u = UserIn(
            user_email="x@y.com",
            password="pass1234",
            user_role=UserRole.LECTURER,
        )
        json_str = u.model_dump_json()
        assert '"lecturer"' in json_str

    def test_task_in_serializes_status_as_string(self):
        from datetime import datetime, timezone
        from api_v2.core.schemas import TaskIn
        from api_v2.types.enums import TaskStatus
        t = TaskIn(
            unit_id_unit="CS101",
            rubric_id_marking_rubric=1,
            task_due_datetime=datetime(2026, 12, 31, tzinfo=timezone.utc),
            task_title="Essay 1",
            task_status=TaskStatus.PUBLISHED,
        )
        data = t.model_dump()
        assert data["task_status"] == "published"

    def test_deserialization_from_plain_string(self):
        """Schemas constructed from plain string data should still work."""
        from api_v2.core.schemas import UserIn
        u = UserIn.model_validate({
            "user_email": "a@b.com",
            "password": "test1234",
            "user_role": "student",
            "user_status": "active",
        })
        assert u.user_role == "student"


# ---------------------------------------------------------------------------
# 9. Filter schema enum fields
# ---------------------------------------------------------------------------

class TestFilterSchemaEnumFields:
    """Filter schemas should accept enum values."""

    def test_class_filter_accepts_enum_status(self):
        from api_v2.core.schemas import ClassFilterParams
        from api_v2.types.enums import ClassStatus
        f = ClassFilterParams(class_status=ClassStatus.ACTIVE)
        assert f.class_status == "active"

    def test_task_filter_accepts_enum_status(self):
        from api_v2.core.schemas import TaskFilterParams
        from api_v2.types.enums import TaskStatus
        f = TaskFilterParams(task_status=TaskStatus.PUBLISHED)
        assert f.task_status == "published"

    def test_user_filter_accepts_enum_role(self):
        from api_v2.core.schemas import UserFilterParams
        from api_v2.types.enums import UserRole
        f = UserFilterParams(user_role=UserRole.LECTURER)
        assert f.user_role == "lecturer"

    def test_rubric_filter_accepts_enum_visibility(self):
        from api_v2.core.schemas import RubricFilterParams
        from api_v2.types.enums import Visibility
        f = RubricFilterParams(visibility=Visibility.PUBLIC)
        assert f.visibility == "public"


# ---------------------------------------------------------------------------
# 10. Dashboard schema enum fields
# ---------------------------------------------------------------------------

class TestDashboardSchemaEnumFields:
    """Dashboard schemas should use enum types."""

    def test_student_stats_improvement_trend(self):
        from api_v2.core.schemas import StudentStatsOut
        from api_v2.types.enums import ImprovementTrend
        s = StudentStatsOut(
            totalEssays=10,
            averageScore=85.0,
            pendingGrading=2,
            essaysSubmitted=10,
            avgScore=85.0,
            improvementTrend=ImprovementTrend.UP,
            feedbackReceived=8,
        )
        assert s.improvementTrend == "up"

    def test_dashboard_user_info_role(self):
        from api_v2.core.schemas import DashboardUserInfoOut
        from api_v2.types.enums import UserRole
        d = DashboardUserInfoOut(
            id=1,
            name="Test User",
            role=UserRole.STUDENT,
            email="test@test.com",
        )
        assert d.role == "student"
