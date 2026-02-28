from __future__ import annotations

import secrets
import string
from datetime import datetime
from typing import TYPE_CHECKING, Any

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.db.models import CheckConstraint, Q, UniqueConstraint


def get_current_year() -> int:
    """Return current year for use as default in model fields."""
    return datetime.now().year


if TYPE_CHECKING:
    pass


class Class(models.Model):
    class_id = models.SmallAutoField(primary_key=True, db_comment="Unique identifier for a class under a unit")
    unit_id_unit = models.ForeignKey("Unit", models.CASCADE, db_column="unit_id_unit")
    class_name = models.CharField(
        max_length=100, blank=False, default="", db_comment="Class name (e.g., CS101 Class A)"
    )
    class_desc = models.TextField(blank=True, null=True, db_comment="Class description")
    class_join_code = models.CharField(
        max_length=10,
        unique=True,
        blank=False,
        default="",
        db_comment="Student self-enrollment code",
    )
    class_term = models.CharField(
        max_length=20,
        choices=[
            ("semester1", "Semester 1"),
            ("semester2", "Semester 2"),
            ("term1", "Term 1"),
            ("term2", "Term 2"),
            ("full_year", "Full Year"),
        ],
        default="full_year",
        db_comment="Academic term",
    )
    class_year = models.PositiveSmallIntegerField(default=get_current_year, db_comment="Academic year")
    class_status = models.CharField(
        max_length=20,
        choices=[("active", "Active"), ("archived", "Archived")],
        default="active",
        db_comment="Class status",
    )
    class_archived_at = models.DateTimeField(null=True, blank=True, db_comment="Archive timestamp")
    class_size = models.SmallIntegerField(default=0, db_comment="current number of students in the class")

    class Meta:
        managed = True
        db_table = "class"
        db_table_comment = "A table for class entity"
        verbose_name = "class"
        verbose_name_plural = "classes"
        constraints = [
            CheckConstraint(check=Q(class_size__gte=0), name="class_size_ck"),
            CheckConstraint(check=Q(class_status__in=["active", "archived"]), name="class_status_ck"),
            CheckConstraint(check=Q(class_year__gte=2000) & Q(class_year__lte=2100), name="class_year_range_ck"),
        ]
        indexes = [
            models.Index(fields=["unit_id_unit"], name="class_unit_idx"),
            models.Index(fields=["class_join_code"], name="class_join_code_idx"),
        ]

    @classmethod
    def _generate_unique_join_code(cls, length: int = 6) -> str:
        """Generate a unique alphanumeric join code."""
        alphabet = string.ascii_uppercase + string.digits
        for _ in range(20):
            code = "".join(secrets.choice(alphabet) for _ in range(length))
            if not cls.objects.filter(class_join_code=code).exists():
                return code
        raise ValueError("Unable to generate a unique class join code")

    def save(self, *args, **kwargs):
        # Normalize provided codes and ensure a unique code always exists.
        if self.class_join_code:
            self.class_join_code = self.class_join_code.strip().upper()
        if not self.class_join_code:
            self.class_join_code = self._generate_unique_join_code()
        super().save(*args, **kwargs)


class Enrollment(models.Model):
    enrollment_id = models.AutoField(primary_key=True, db_comment="Unique identifier for each enrollment")
    user_id_user = models.ForeignKey("User", models.CASCADE, db_column="user_id_user")
    class_id_class = models.ForeignKey("Class", models.CASCADE, db_column="class_id_class")
    unit_id_unit = models.ForeignKey("Unit", models.CASCADE, db_column="unit_id_unit")
    enrollment_time = models.DateTimeField(
        auto_now_add=True,
        db_comment="The time when the student is enrolled in the DBMS",
    )

    class Meta:
        managed = True
        db_table = "enrollment"
        constraints = [
            UniqueConstraint(
                fields=["user_id_user", "class_id_class", "unit_id_unit"],
                name="user_id_class_id_unit_id_uq",
            )
        ]
        db_table_comment = (
            "The enrollment of student to a specific class. A student can only have "
            "one enrollment to one class of one unit anytime."
        )


class Feedback(models.Model):
    feedback_id = models.AutoField(primary_key=True)
    submission_id_submission = models.OneToOneField("Submission", models.CASCADE, db_column="submission_id_submission")
    user_id_user = models.ForeignKey("User", models.CASCADE, db_column="user_id_user")

    class Meta:
        managed = True
        db_table = "feedback"


class FeedbackItem(models.Model):
    feedback_item_id = models.AutoField(primary_key=True, db_comment="unique identifier for feedback item")
    feedback_id_feedback = models.ForeignKey(Feedback, models.CASCADE, db_column="feedback_id_feedback")
    rubric_item_id_rubric_item = models.ForeignKey("RubricItem", models.CASCADE, db_column="rubric_item_id_rubric_item")
    feedback_item_score = models.SmallIntegerField(db_comment="actual score of the item")
    feedback_item_comment = models.TextField(
        blank=True, null=True, db_comment="short description to the sub-item grade"
    )
    feedback_item_source = models.CharField(
        max_length=10,
        db_comment="the source of feedback: \nai, human, or revised if ai feedback is slightly modifed by human",
    )

    class Meta:
        managed = True
        db_table = "feedback_item"
        constraints = [
            UniqueConstraint(
                fields=["feedback_id_feedback", "rubric_item_id_rubric_item"],
                name="feedback_id_rubric_item_id_uq",
            ),
            CheckConstraint(
                check=Q(feedback_item_source__in=["ai", "human", "revised"]),
                name="feedback_item_source_ck",
            ),
        ]
        db_table_comment = "A section in the feedback as per the rubric"


class MarkingRubric(models.Model):
    rubric_id = models.AutoField(primary_key=True, db_comment="unique identifier for rubrics")
    user_id_user = models.ForeignKey("User", models.CASCADE, db_column="user_id_user")
    rubric_create_time = models.DateTimeField(auto_now_add=True, db_comment="timestamp when the rubirc is created")
    rubric_desc = models.CharField(max_length=100, blank=True, null=True, db_comment="description to the rubrics")
    visibility = models.CharField(
        max_length=10,
        choices=[("public", "Public"), ("private", "Private")],
        default="private",
        db_comment="Whether this rubric is visible to all users (public) or only the creator (private)",
    )

    class Meta:
        managed = True
        db_table = "marking_rubric"
        db_table_comment = "entity for a marking rubric. A marking rubric has many items."
        indexes = [
            models.Index(fields=["visibility"], name="marking_rubric_visibility_idx"),
        ]


class RubricItem(models.Model):
    rubric_item_id = models.AutoField(primary_key=True, db_comment="unique identifier for item")
    rubric_id_marking_rubric = models.ForeignKey(
        MarkingRubric,
        models.CASCADE,
        db_column="rubric_id_marking_rubric",
        related_name="rubric_items",
    )
    rubric_item_name = models.CharField(max_length=50, db_comment="Title(header) name for the item")
    rubric_item_weight = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        db_comment="the weight of the item on a scale of 100%, using xx.x",
    )

    class Meta:
        managed = True
        db_table = "rubric_item"
        db_table_comment = "An item(dimension) under one rubric"
        constraints = [CheckConstraint(check=Q(rubric_item_weight__gt=0), name="item_weight_ck")]


class RubricLevelDesc(models.Model):
    level_desc_id = models.AutoField(
        primary_key=True,
        db_comment="unique identifier for each level desc under one rubric",
    )
    rubric_item_id_rubric_item = models.ForeignKey(
        RubricItem,
        models.CASCADE,
        db_column="rubric_item_id_rubric_item",
        related_name="level_descriptions",
    )
    level_min_score = models.SmallIntegerField(db_comment="min for the item")
    level_max_score = models.SmallIntegerField(db_comment="max for the item")
    level_desc = models.TextField()

    class Meta:
        managed = True
        db_table = "rubric_level_desc"
        db_table_comment = "The detailed description to each of the score range under a rubric item under a rubric."
        constraints = [
            CheckConstraint(
                check=Q(level_min_score__gte=0)
                & Q(level_max_score__gte=0)
                & Q(level_min_score__lte=models.F("level_max_score")),
                name="min_max_ck",
            )
        ]



class DeadlineExtension(models.Model):
    extension_id = models.AutoField(primary_key=True, db_comment="Unique identifier for deadline extension")
    task_id_task = models.ForeignKey("Task", models.CASCADE, db_column="task_id_task", related_name="deadline_extensions")
    user_id_user = models.ForeignKey("User", models.CASCADE, db_column="user_id_user", related_name="deadline_extensions")
    original_deadline = models.DateTimeField(db_comment="Original task deadline at time of extension")
    extended_deadline = models.DateTimeField(db_comment="New extended deadline for this student")
    reason = models.TextField(blank=True, default="", db_comment="Reason for extension")
    granted_by = models.ForeignKey("User", models.CASCADE, db_column="granted_by", related_name="granted_extensions")
    created_at = models.DateTimeField(auto_now_add=True, db_comment="When extension was granted")

    class Meta:
        managed = True
        db_table = "deadline_extension"
        db_table_comment = "Per-student deadline extensions for tasks"
        constraints = [
            models.UniqueConstraint(
                fields=["task_id_task", "user_id_user"],
                name="task_user_extension_uq",
            ),
            models.CheckConstraint(
                check=models.Q(extended_deadline__gt=models.F("original_deadline")),
                name="extension_after_original_ck",
            ),
        ]
        indexes = [
            models.Index(fields=["task_id_task"], name="extension_task_idx"),
            models.Index(fields=["user_id_user"], name="extension_user_idx"),
        ]

class Submission(models.Model):
    submission_id = models.AutoField(primary_key=True, db_comment="unique identifier for submission")
    submission_time = models.DateTimeField(auto_now_add=True, db_comment="time/date of submission")
    task_id_task = models.ForeignKey("Task", models.CASCADE, db_column="task_id_task")
    user_id_user = models.ForeignKey("User", models.CASCADE, db_column="user_id_user")
    submission_txt = models.TextField(db_comment="complete content of the essay submission")

    class Meta:
        managed = True
        db_table = "submission"
        db_table_comment = "A weak entity for task submissions."


class Task(models.Model):
    task_id = models.AutoField(primary_key=True, db_comment="Unique identifier for task.")
    unit_id_unit = models.ForeignKey("Unit", models.CASCADE, db_column="unit_id_unit")
    rubric_id_marking_rubric = models.ForeignKey(MarkingRubric, models.CASCADE, db_column="rubric_id_marking_rubric")
    task_publish_datetime = models.DateTimeField(auto_now_add=True, db_comment="time/date when the task is published")
    task_due_datetime = models.DateTimeField(db_comment="time/date when the task is due")
    task_title = models.CharField(max_length=200, blank=False, db_comment="Task title")
    task_desc = models.TextField(blank=True, null=True, db_comment="Short description")
    task_instructions = models.TextField(blank=False, db_comment="Submission instructions")
    class_id_class = models.ForeignKey(
        "Class", models.CASCADE, db_column="class_id_class", db_comment="Link to class", blank=True, null=True
    )
    task_status = models.CharField(
        max_length=20,
        choices=[
            ("draft", "Draft"),
            ("published", "Published"),
            ("unpublished", "Unpublished"),
            ("archived", "Archived"),
        ],
        default="draft",
        db_comment="Task status",
    )
    task_allow_late_submission = models.BooleanField(default=False, db_comment="Allow late submissions")

    class Meta:
        managed = True
        db_table = "task"
        db_table_comment = "Task created by lecturer/admin for students in some classes/units to complete"
        constraints = [
            CheckConstraint(
                check=Q(task_publish_datetime__lt=models.F("task_due_datetime")),
                name="task_publish_time_task_due_time_ck",
            ),
            CheckConstraint(
                check=Q(task_status__in=["draft", "published", "unpublished", "archived"]),
                name="task_status_ck",
            ),
        ]


class TeachingAssn(models.Model):
    teaching_assn_id = models.SmallAutoField(primary_key=True, db_comment="unique identifier")
    user_id_user = models.ForeignKey("User", models.CASCADE, db_column="user_id_user")
    class_id_class = models.ForeignKey("Class", models.CASCADE, db_column="class_id_class")

    class Meta:
        managed = True
        db_table = "teaching_assn"
        constraints = [
            UniqueConstraint(
                fields=["user_id_user", "class_id_class"],
                name="lecturer_id_class_id_uq",
            )
        ]
        db_table_comment = "A weak entity for assignment of teacher to classes"


class Unit(models.Model):
    unit_id = models.CharField(
        primary_key=True,
        max_length=10,
        db_comment="Unique identifier for each unit, same as the unit code",
    )
    unit_name = models.CharField(max_length=50, db_comment="Full name of the unit")
    unit_desc = models.TextField(blank=True, null=True, db_comment="details of the unit")

    class Meta:
        managed = True
        db_table = "unit"
        db_table_comment = "A table for unit entity"


class CoreUserManager(BaseUserManager):
    def create_user(self, user_email: str, password: str | None = None, **extra_fields: Any) -> User:
        if not user_email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(user_email)
        user: User = self.model(user_email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, user_email: str, password: str, **extra_fields: Any) -> User:
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(user_email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    user_id: models.AutoField = models.AutoField(primary_key=True, db_column="user_id")
    user_email: models.EmailField = models.EmailField(unique=True, db_column="user_email")
    user_fname: models.CharField = models.CharField(max_length=20, blank=True, null=True, db_column="user_fname")
    user_lname: models.CharField = models.CharField(max_length=20, blank=True, null=True, db_column="user_lname")
    user_role: models.CharField = models.CharField(max_length=10, blank=True, null=True, db_column="user_role")
    user_status: models.CharField = models.CharField(max_length=15, blank=True, null=True, db_column="user_status")
    password: models.CharField = models.CharField(max_length=255, db_column="user_credential")
    is_active: models.BooleanField = models.BooleanField(default=True)
    is_staff: models.BooleanField = models.BooleanField(default=False)
    date_joined: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    preferences: models.JSONField = models.JSONField(
        default=dict,
        blank=True,
        db_comment="User preferences: email_notifications, in_app_notifications, submission_alerts, grading_alerts, weekly_digest, language, theme",
    )

    objects = CoreUserManager()

    USERNAME_FIELD = "user_email"
    EMAIL_FIELD = "user_email"
    REQUIRED_FIELDS = []

    def save(self, *args, **kwargs):
        """Initialize preferences if not set."""
        if not self.preferences:
            self.preferences = self.get_default_preferences()
        super().save(*args, **kwargs)

    @staticmethod
    def get_default_preferences() -> dict:
        """Return default user preferences."""
        return {
            "email_notifications": True,
            "in_app_notifications": True,
            "submission_alerts": True,
            "grading_alerts": False,
            "weekly_digest": False,
            "language": "en",
            "theme": "system",
        }

    class Meta:
        db_table = "user"
        managed = True
        db_table_comment = "A table for all user entities, including student, teacher, and admins."
        constraints = [
            CheckConstraint(
                check=Q(user_role__in=["student", "lecturer", "admin"]),
                name="user_role_ck",
            ),
            CheckConstraint(
                check=Q(user_status__in=["active", "suspended", "unregistered"]),
                name="user_status_ck",
            ),
        ]

    def __str__(self):
        if self.user_fname or self.user_lname:
            return f"{self.user_fname or ''} {self.user_lname or ''} <{self.user_email}>".strip()
        return self.user_email

    def get_full_name(self):
        return f"{self.user_fname or ''} {self.user_lname or ''}".strip()

    def get_short_name(self):
        return self.user_fname or self.user_email


class Badge(models.Model):
    """Badge/Achievement model for user accomplishments."""

    badge_id = models.AutoField(primary_key=True, db_comment="Unique identifier for badge")
    name = models.CharField(max_length=100, db_comment="Badge name")
    description = models.CharField(max_length=200, db_comment="Badge description")
    icon = models.CharField(max_length=50, db_comment="Icon name for display")
    criteria = models.JSONField(default=dict, db_comment="Criteria to earn this badge")
    created_at = models.DateTimeField(auto_now_add=True, db_comment="Badge creation time")

    class Meta:
        managed = True
        db_table = "badge"
        db_table_comment = "Achievement badges for users"
        verbose_name = "badge"
        verbose_name_plural = "badges"

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    """UserBadge model linking users to earned badges."""

    user_badge_id = models.AutoField(primary_key=True, db_comment="Unique identifier for user badge")
    user_id_user = models.ForeignKey("User", models.CASCADE, db_column="user_id_user")
    badge_id_badge = models.ForeignKey("Badge", models.CASCADE, db_column="badge_id_badge")
    earned_at = models.DateTimeField(auto_now_add=True, db_comment="Time when badge was earned")

    class Meta:
        managed = True
        db_table = "user_badge"
        db_table_comment = "User earned badges"
        constraints = [
            UniqueConstraint(
                fields=["user_id_user", "badge_id_badge"],
                name="user_badge_unique",
            )
        ]
        indexes = [
            models.Index(fields=["user_id_user"], name="user_badge_user_idx"),
        ]

    def __str__(self):
        return f"{self.user_id_user} - {self.badge_id_badge}"
