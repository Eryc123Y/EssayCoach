from drf_spectacular.utils import extend_schema_serializer, OpenApiExample
from rest_framework import serializers
from .models import (
    Class,
    Enrollment,
    Feedback,
    FeedbackItem,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Submission,
    Task,
    TeachingAssn,
    Unit,
    User,
)


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "User Model",
            value={
                "user_id": 1,
                "user_email": "student@example.com",
                "user_fname": "John",
                "user_lname": "Doe",
                "user_role": "student",
                "user_status": "active",
                "is_active": True,
                "is_staff": False,
                "date_joined": "2024-01-15T10:30:00Z",
            },
        )
    ]
)
class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.

    Fields:
    - user_id: Unique identifier (read-only)
    - user_email: Email address (unique, required)
    - user_fname: First name (optional, max 20 chars)
    - user_lname: Last name (optional, max 20 chars)
    - user_role: User role - 'student', 'lecturer', or 'admin' (optional)
    - user_status: Account status - 'active', 'suspended', or 'unregistered' (optional)
    - password: Password (write-only, required for creation)
    - is_active: Active status (default: True)
    - is_staff: Staff status (default: False)
    - date_joined: Account creation timestamp (read-only)
    """

    class Meta:
        model = User
        fields = "__all__"
        extra_kwargs = {"password": {"write_only": True}}


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Unit Model",
            value={
                "unit_id": "CS101",
                "unit_name": "Introduction to Computer Science",
                "unit_desc": "A foundational course covering basic programming concepts and algorithms.",
            },
        )
    ]
)
class UnitSerializer(serializers.ModelSerializer):
    """
    Serializer for Unit model.

    Fields:
    - unit_id: Unique unit code (primary key, max 10 chars, e.g., 'CS101', 'ENG202')
    - unit_name: Full name of the unit (max 50 chars, required)
    - unit_desc: Detailed description of the unit (optional, text field)
    """

    class Meta:
        model = Unit
        fields = "__all__"


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Class Model",
            value={"class_id": 1, "unit_id_unit": "CS101", "class_size": 30},
        )
    ]
)
class ClassSerializer(serializers.ModelSerializer):
    """
    Serializer for Class model.

    Fields:
    - class_id: Unique identifier (read-only, auto-increment)
    - unit_id_unit: Foreign key to Unit (required)
    - class_size: Current number of enrolled students (default: 0, must be >= 0)
    """

    class Meta:
        model = Class
        fields = "__all__"


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Enrollment Model",
            value={
                "enrollment_id": 1,
                "user_id_user": 1,
                "class_id_class": 1,
                "unit_id_unit": "CS101",
                "enrollment_time": "2024-01-15T10:30:00Z",
            },
        )
    ]
)
class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Enrollment model.

    Fields:
    - enrollment_id: Unique identifier (read-only, auto-increment)
    - user_id_user: Foreign key to User (student, required)
    - class_id_class: Foreign key to Class (required)
    - unit_id_unit: Foreign key to Unit (required)
    - enrollment_time: Timestamp when enrollment was created (read-only, auto-generated)

    Constraints: A student can only have one enrollment per class per unit.
    """

    class Meta:
        model = Enrollment
        fields = "__all__"


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Marking Rubric Model",
            value={
                "rubric_id": 1,
                "user_id_user": 2,
                "rubric_create_time": "2024-01-15T10:30:00Z",
                "rubric_desc": "Standard rubric for introductory essays",
            },
        )
    ]
)
class MarkingRubricSerializer(serializers.ModelSerializer):
    """
    Serializer for MarkingRubric model.

    Fields:
    - rubric_id: Unique identifier (read-only, auto-increment)
    - user_id_user: Foreign key to User (lecturer/admin who created it, required)
    - rubric_create_time: Timestamp when rubric was created (read-only, auto-generated)
    - rubric_desc: Description of the rubric (optional, max 100 chars)
    """

    class Meta:
        model = MarkingRubric
        fields = "__all__"


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Rubric Item Model",
            value={
                "rubric_item_id": 1,
                "rubric_id_marking_rubric": 1,
                "rubric_item_name": "Content",
                "rubric_item_weight": "40.0",
            },
        )
    ]
)
class RubricItemSerializer(serializers.ModelSerializer):
    """
    Serializer for RubricItem model.

    Fields:
    - rubric_item_id: Unique identifier (read-only, auto-increment)
    - rubric_id_marking_rubric: Foreign key to MarkingRubric (required)
    - rubric_item_name: Name/title of the rubric item (max 50 chars, required, e.g., 'Content', 'Organization')
    - rubric_item_weight: Weight of the item as percentage (decimal, required, must be > 0, format: xx.x)
    """

    class Meta:
        model = RubricItem
        fields = "__all__"


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Rubric Level Desc Model",
            value={
                "level_desc_id": 1,
                "rubric_item_id_rubric_item": 1,
                "level_min_score": 0,
                "level_max_score": 4,
                "level_desc": "Poor - Lacks clarity and coherence",
            },
        )
    ]
)
class RubricLevelDescSerializer(serializers.ModelSerializer):
    """
    Serializer for RubricLevelDesc model.

    Fields:
    - level_desc_id: Unique identifier (read-only, auto-increment)
    - rubric_item_id_rubric_item: Foreign key to RubricItem (required)
    - level_min_score: Minimum score for this level (required, must be >= 0)
    - level_max_score: Maximum score for this level (required, must be > 0 and > min_score)
    - level_desc: Description of the performance level (required, text field)

    Example levels: 'Poor' (0-4), 'Good' (5-7), 'Excellent' (8-10)
    """

    class Meta:
        model = RubricLevelDesc
        fields = "__all__"


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Task Model",
            value={
                "task_id": 1,
                "unit_id_unit": "CS101",
                "rubric_id_marking_rubric": 1,
                "task_publish_datetime": "2024-01-15T10:30:00Z",
                "task_due_datetime": "2024-02-15T23:59:59Z",
            },
        )
    ]
)
class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Task model.

    Fields:
    - task_id: Unique identifier (read-only, auto-increment)
    - unit_id_unit: Foreign key to Unit (required)
    - rubric_id_marking_rubric: Foreign key to MarkingRubric (required)
    - task_publish_datetime: When the task was published (read-only, auto-generated)
    - task_due_datetime: When the task is due (required, must be after publish time)
    """

    class Meta:
        model = Task
        fields = "__all__"


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Submission Model",
            value={
                "submission_id": 1,
                "submission_time": "2024-02-10T14:30:00Z",
                "task_id_task": 1,
                "user_id_user": 1,
                "submission_txt": "This is the complete essay content submitted by the student...",
            },
        )
    ]
)
class SubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for Submission model.

    Fields:
    - submission_id: Unique identifier (read-only, auto-increment)
    - submission_time: Timestamp when submission was made (read-only, auto-generated)
    - task_id_task: Foreign key to Task (required)
    - user_id_user: Foreign key to User (student who submitted, required)
    - submission_txt: Complete essay content (required, text field)
    """

    class Meta:
        model = Submission
        fields = "__all__"


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Feedback Model",
            value={"feedback_id": 1, "submission_id_submission": 1, "user_id_user": 2},
        )
    ]
)
class FeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer for Feedback model.

    Fields:
    - feedback_id: Unique identifier (read-only, auto-increment)
    - submission_id_submission: One-to-one relationship with Submission (required, unique)
    - user_id_user: Foreign key to User (lecturer/admin who provided feedback, required)
    """

    class Meta:
        model = Feedback
        fields = "__all__"


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Feedback Item Model",
            value={
                "feedback_item_id": 1,
                "feedback_id_feedback": 1,
                "rubric_item_id_rubric_item": 1,
                "feedback_item_score": 8,
                "feedback_item_comment": "Good work on thesis statement and supporting arguments.",
                "feedback_item_source": "human",
            },
        )
    ]
)
class FeedbackItemSerializer(serializers.ModelSerializer):
    """
    Serializer for FeedbackItem model.

    Fields:
    - feedback_item_id: Unique identifier (read-only, auto-increment)
    - feedback_id_feedback: Foreign key to Feedback (required)
    - rubric_item_id_rubric_item: Foreign key to RubricItem (required)
    - feedback_item_score: Actual score for this rubric item (required, integer)
    - feedback_item_comment: Comment on the student's performance (optional, text field)
    - feedback_item_source: Source of feedback - 'ai', 'human', or 'revised' (required, max 10 chars)

    Constraints: One feedback item per rubric item per feedback.
    """

    class Meta:
        model = FeedbackItem
        fields = "__all__"


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Teaching Assignment Model",
            value={"teaching_assn_id": 1, "user_id_user": 2, "class_id_class": 1},
        )
    ]
)
class TeachingAssnSerializer(serializers.ModelSerializer):
    """
    Serializer for TeachingAssn model.

    Fields:
    - teaching_assn_id: Unique identifier (read-only, auto-increment)
    - user_id_user: Foreign key to User (lecturer, required)
    - class_id_class: Foreign key to Class (required)

    Constraints: One lecturer can be assigned to one class (unique constraint on user_id_user + class_id_class).
    """

    class Meta:
        model = TeachingAssn
        fields = "__all__"


class RubricUploadSerializer(serializers.Serializer):
    """Handle PDF file upload for rubric import."""

    file = serializers.FileField(required=True, help_text="PDF file containing rubric")
    rubric_name = serializers.CharField(
        required=False,
        max_length=100,
        help_text="Optional custom name (defaults to AI-extracted name)",
    )


class RubricImportResponseSerializer(serializers.Serializer):
    """Response format for rubric import."""

    success = serializers.BooleanField()
    rubric_id = serializers.IntegerField(required=False)
    rubric_name = serializers.CharField(required=False)
    items_count = serializers.IntegerField(required=False)
    levels_count = serializers.IntegerField(required=False)
    ai_parsed = serializers.BooleanField()
    ai_model = serializers.CharField(required=False)
    detection = serializers.DictField(required=False)
    error = serializers.CharField(required=False)


class RubricItemDetailSerializer(serializers.ModelSerializer):
    """Detailed rubric item with all levels."""

    level_descriptions = RubricLevelDescSerializer(many=True, read_only=True)

    class Meta:
        model = RubricItem
        fields = "__all__"


class RubricDetailSerializer(serializers.ModelSerializer):
    """Detailed rubric with all items and levels."""

    rubric_items = RubricItemDetailSerializer(many=True, read_only=True)

    class Meta:
        model = MarkingRubric
        fields = ["rubric_id", "rubric_desc", "rubric_create_time", "rubric_items"]
