from __future__ import annotations

import secrets
import string
import uuid
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


class ClassLeaveRequest(models.Model):
    """Student request for a reviewed class withdrawal."""

    student = models.ForeignKey("User", models.CASCADE, related_name="class_leave_requests")
    class_obj = models.ForeignKey("Class", models.CASCADE, related_name="leave_requests")
    status = models.CharField(
        max_length=12,
        choices=[("pending", "Pending"), ("approved", "Approved"), ("declined", "Declined")],
        default="pending",
    )
    reason = models.TextField(blank=True, default="")
    requested_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    decided_by = models.ForeignKey("User", models.SET_NULL, null=True, blank=True, related_name="leave_decisions")

    class Meta:
        db_table = "class_leave_request"
        constraints = [
            UniqueConstraint(
                fields=["student", "class_obj"],
                condition=Q(status="pending"),
                name="one_pending_class_leave_request",
            )
        ]


class Feedback(models.Model):
    feedback_id = models.AutoField(primary_key=True)
    submission_id_submission = models.OneToOneField("Submission", models.CASCADE, db_column="submission_id_submission")
    user_id_user = models.ForeignKey("User", models.CASCADE, db_column="user_id_user", null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("ai_pending", "AI pending"),
            ("ai_draft", "AI draft"),
            ("lecturer_reviewed", "Lecturer reviewed"),
            ("published", "Published"),
        ],
        default="ai_pending",
    )
    ai_proposal = models.JSONField(null=True, blank=True)
    rubric_snapshot = models.JSONField(null=True, blank=True)
    reviewed_by = models.ForeignKey("User", models.SET_NULL, null=True, blank=True, related_name="reviewed_feedbacks")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey("User", models.SET_NULL, null=True, blank=True, related_name="published_feedbacks")
    published_at = models.DateTimeField(null=True, blank=True)
    final_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    version = models.PositiveIntegerField(default=0)

    class Meta:
        managed = True
        db_table = "feedback"
        constraints = [
            CheckConstraint(
                check=Q(status__in=["ai_pending", "ai_draft", "lecturer_reviewed", "published"]),
                name="feedback_status_ck",
            ),
        ]


class AssessmentAuditEvent(models.Model):
    event_id = models.BigAutoField(primary_key=True)
    feedback = models.ForeignKey(Feedback, models.CASCADE, related_name="audit_events")
    actor = models.ForeignKey("User", models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "assessment_audit_event"
        indexes = [models.Index(fields=["feedback", "created_at"], name="assessment_audit_lookup_idx")]


class SupportTicket(models.Model):
    ticket_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey("User", models.CASCADE, related_name="support_tickets")
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(
        max_length=12,
        choices=[("open", "Open"), ("in_progress", "In progress"), ("resolved", "Resolved"), ("closed", "Closed")],
        default="open",
    )
    priority = models.CharField(
        max_length=10,
        choices=[("low", "Low"), ("normal", "Normal"), ("high", "High"), ("urgent", "Urgent")],
        default="normal",
    )
    staff_reply = models.TextField(blank=True)
    handled_by = models.ForeignKey("User", models.SET_NULL, null=True, blank=True, related_name="handled_tickets")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "support_ticket"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "created_at"], name="support_ticket_owner_idx")]
        constraints = [
            CheckConstraint(check=Q(status__in=["open", "in_progress", "resolved", "closed"]), name="ticket_status_ck"),
            CheckConstraint(check=Q(priority__in=["low", "normal", "high", "urgent"]), name="ticket_priority_ck"),
        ]


class Notification(models.Model):
    notification_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey("User", models.CASCADE, related_name="notifications")
    event_key = models.CharField(max_length=140, unique=True)
    kind = models.CharField(max_length=30)
    title_en = models.CharField(max_length=140)
    title_zh = models.CharField(max_length=140)
    body_en = models.CharField(max_length=300)
    body_zh = models.CharField(max_length=300)
    link = models.CharField(max_length=240)
    in_app_visible = models.BooleanField(default=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "created_at"], name="notification_owner_idx")]


class HelpArticleVote(models.Model):
    vote_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey("User", models.CASCADE, related_name="help_article_votes")
    article_slug = models.CharField(max_length=100)
    helpful = models.BooleanField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "help_article_vote"
        constraints = [models.UniqueConstraint(fields=["user", "article_slug"], name="help_article_user_vote_uq")]


class AdminAuditEvent(models.Model):
    event_id = models.BigAutoField(primary_key=True)
    actor = models.ForeignKey("User", models.SET_NULL, null=True, related_name="admin_actions")
    target = models.ForeignKey("User", models.CASCADE, related_name="admin_history")
    action = models.CharField(max_length=40)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "admin_audit_event"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["target", "created_at"], name="admin_audit_target_idx")]


class PasswordResetGrant(models.Model):
    grant_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey("User", models.CASCADE, related_name="password_reset_grants")
    issued_by = models.ForeignKey("User", models.SET_NULL, null=True, related_name="issued_password_resets")
    token_hash = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "password_reset_grant"
        indexes = [models.Index(fields=["user", "expires_at"], name="password_reset_owner_idx")]


class EmailChangeGrant(models.Model):
    grant_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey("User", models.CASCADE, related_name="email_change_grants")
    old_email = models.EmailField()
    new_email = models.EmailField()
    token_hash = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "email_change_grant"
        indexes = [models.Index(fields=["user", "expires_at"], name="email_change_owner_idx")]


class AIJob(models.Model):
    job_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.OneToOneField("Submission", models.CASCADE, related_name="ai_job")
    status = models.CharField(
        max_length=12,
        choices=[
            ("pending", "Pending"),
            ("running", "Running"),
            ("succeeded", "Succeeded"),
            ("failed", "Failed"),
        ],
        default="pending",
    )
    provider = models.CharField(max_length=40, default="codex")
    model = models.CharField(max_length=80, default="gpt-6-luna")
    attempts = models.PositiveSmallIntegerField(default=0)
    lease_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    result = models.JSONField(null=True, blank=True)
    usage = models.JSONField(null=True, blank=True)
    provider_thread_id = models.CharField(max_length=80, blank=True, default="")
    error_category = models.CharField(max_length=40, blank=True, default="")
    error_message = models.TextField(blank=True, default="")

    class Meta:
        db_table = "ai_job"
        indexes = [models.Index(fields=["status", "lease_expires_at"], name="ai_job_claim_idx")]
        constraints = [
            CheckConstraint(check=Q(status__in=["pending", "running", "succeeded", "failed"]), name="ai_job_status_ck"),
        ]


class PracticeEssay(models.Model):
    essay_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey("User", models.CASCADE, related_name="practice_essays")
    goal = models.TextField()
    content = models.TextField(blank=True)
    language = models.CharField(max_length=2, choices=[("en", "English"), ("zh", "Chinese")], default="en")
    audience = models.CharField(max_length=80, blank=True)
    tone = models.CharField(max_length=80, blank=True)
    rubric = models.ForeignKey("MarkingRubric", models.SET_NULL, null=True, blank=True)
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "practice_essay"
        indexes = [models.Index(fields=["student", "updated_at"], name="practice_essay_owner_idx")]
        constraints = [CheckConstraint(check=Q(language__in=["en", "zh"]), name="practice_essay_lang_ck")]


class PracticeRevision(models.Model):
    revision_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    essay = models.ForeignKey(PracticeEssay, models.CASCADE, related_name="revisions")
    number = models.PositiveIntegerField()
    goal = models.TextField()
    content = models.TextField()
    language = models.CharField(max_length=2)
    audience = models.CharField(max_length=80, blank=True)
    tone = models.CharField(max_length=80, blank=True)
    rubric_snapshot = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "practice_revision"
        constraints = [UniqueConstraint(fields=["essay", "number"], name="practice_revision_number_uq")]
        ordering = ["number"]


class PracticeRun(models.Model):
    run_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    revision = models.OneToOneField(PracticeRevision, models.CASCADE, related_name="run")
    status = models.CharField(max_length=12, default="pending")
    provider = models.CharField(max_length=40, default="codex")
    model = models.CharField(max_length=80, default="gpt-6-luna")
    attempts = models.PositiveSmallIntegerField(default=0)
    lease_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    report = models.JSONField(null=True, blank=True)
    usage = models.JSONField(null=True, blank=True)
    provider_thread_id = models.CharField(max_length=80, blank=True, default="")
    error_category = models.CharField(max_length=40, blank=True, default="")
    error_message = models.TextField(blank=True, default="")

    class Meta:
        db_table = "practice_run"
        indexes = [models.Index(fields=["status", "lease_expires_at"], name="practice_run_claim_idx")]
        constraints = [
            CheckConstraint(
                check=Q(status__in=["pending", "running", "succeeded", "failed"]), name="practice_run_status_ck"
            ),
        ]


class PracticeEvidence(models.Model):
    evidence_id = models.BigAutoField(primary_key=True)
    run = models.ForeignKey(PracticeRun, models.CASCADE, related_name="evidence")
    claim = models.TextField()
    query = models.CharField(max_length=200)
    verdict = models.CharField(max_length=15, default="unresolved")
    rationale = models.TextField(blank=True)
    source_title = models.CharField(max_length=300, blank=True)
    source_url = models.URLField(max_length=600, blank=True)
    source_excerpt = models.TextField(blank=True)
    supporting_quote = models.TextField(blank=True)
    retrieved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "practice_evidence"
        constraints = [
            CheckConstraint(
                check=Q(verdict__in=["supported", "contradicted", "unresolved"]), name="practice_evidence_verdict_ck"
            ),
        ]


class PracticeChatTurn(models.Model):
    turn_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run = models.ForeignKey(PracticeRun, models.CASCADE, related_name="chat_turns")
    question = models.TextField()
    answer = models.TextField(blank=True)
    status = models.CharField(max_length=12, default="pending")
    model = models.CharField(max_length=80, default="gpt-6-luna")
    attempts = models.PositiveSmallIntegerField(default=0)
    lease_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    usage = models.JSONField(null=True, blank=True)
    provider_thread_id = models.CharField(max_length=80, blank=True, default="")
    error_category = models.CharField(max_length=40, blank=True, default="")
    error_message = models.TextField(blank=True, default="")

    class Meta:
        db_table = "practice_chat_turn"
        indexes = [models.Index(fields=["status", "lease_expires_at"], name="practice_chat_claim_idx")]
        constraints = [
            CheckConstraint(
                check=Q(status__in=["pending", "running", "succeeded", "failed"]), name="practice_chat_status_ck"
            ),
        ]
        ordering = ["created_at"]


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
        max_digits=4,
        decimal_places=1,
        db_comment="the weight of the item on a scale of 100%, using xx.x",
    )
    exemplar_text = models.TextField(blank=True, default="")

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
    task_id_task = models.ForeignKey(
        "Task",
        models.CASCADE,
        db_column="task_id_task",
        related_name="deadline_extensions",
    )
    user_id_user = models.ForeignKey(
        "User", models.CASCADE, db_column="user_id_user", related_name="deadline_extensions"
    )
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
    rubric_snapshot = models.JSONField(null=True, blank=True)
    rubric_version = models.PositiveIntegerField(default=0)
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
    task_allow_resubmission = models.BooleanField(default=False, db_comment="Allow one immutable revised submission")

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
        extra_fields.setdefault("user_role", "student")
        user: User = self.model(user_email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, user_email: str, password: str, **extra_fields: Any) -> User:
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("user_role", "admin")
        extra_fields.setdefault("user_status", "active")
        if extra_fields["is_staff"] is not True or extra_fields["is_superuser"] is not True:
            raise ValueError("Superusers must have staff and superuser privileges")
        if extra_fields["user_role"] != "admin":
            raise ValueError("Superusers must have the admin account role")
        return self.create_user(user_email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    user_id: models.AutoField = models.AutoField(primary_key=True, db_column="user_id")
    user_email: models.EmailField = models.EmailField(unique=True, db_column="user_email")
    user_fname: models.CharField = models.CharField(max_length=20, blank=True, null=True, db_column="user_fname")
    user_lname: models.CharField = models.CharField(max_length=20, blank=True, null=True, db_column="user_lname")
    user_role: models.CharField = models.CharField(max_length=10, default="student", db_column="user_role")
    user_status: models.CharField = models.CharField(max_length=15, default="active", db_column="user_status")
    auth_version = models.PositiveIntegerField(default=0)
    password: models.CharField = models.CharField(max_length=255, db_column="user_credential")
    is_active: models.BooleanField = models.BooleanField(default=True)
    is_staff: models.BooleanField = models.BooleanField(default=False)
    date_joined: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    bio = models.CharField(max_length=300, blank=True, default="")
    avatar_url = models.CharField(max_length=240, blank=True, default="")
    profile_visibility = models.CharField(
        max_length=12,
        choices=[("private", "Private"), ("classmates", "Classmates"), ("institution", "Institution")],
        default="classmates",
    )
    profile_show_essays = models.BooleanField(default=False)
    profile_show_scores = models.BooleanField(default=False)
    preferences: models.JSONField = models.JSONField(
        default=dict,
        blank=True,
        db_comment=(
            "User preferences: email_notifications, in_app_notifications, "
            "submission_alerts, grading_alerts, weekly_digest, language, theme"
        ),
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
            "social_alerts": True,
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


class SharedEssay(models.Model):
    share_id = models.BigAutoField(primary_key=True)
    submission = models.OneToOneField("Submission", models.PROTECT, related_name="social_share")
    owner = models.ForeignKey("User", models.PROTECT, related_name="shared_essays")
    class_obj = models.ForeignKey("Class", models.PROTECT, related_name="shared_essays")
    visibility = models.CharField(
        max_length=12, choices=[("public", "Public"), ("class", "Class"), ("anonymous", "Anonymous")]
    )
    caption = models.CharField(max_length=300, blank=True)
    tags = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=12, choices=[("visible", "Visible"), ("hidden", "Hidden"), ("removed", "Removed")], default="visible"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "shared_essay"
        indexes = [models.Index(fields=["status", "created_at"], name="shared_essay_feed_idx")]
        constraints = [
            CheckConstraint(
                check=Q(visibility__in=["public", "class", "anonymous"]), name="shared_essay_visibility_ck"
            ),
            CheckConstraint(check=Q(status__in=["visible", "hidden", "removed"]), name="shared_essay_status_ck"),
        ]


class SocialInteraction(models.Model):
    interaction_id = models.BigAutoField(primary_key=True)
    share = models.ForeignKey(SharedEssay, models.CASCADE, related_name="interactions")
    user = models.ForeignKey("User", models.CASCADE, related_name="social_interactions")
    interaction_type = models.CharField(
        max_length=12,
        choices=[("like", "Like"), ("bookmark", "Bookmark"), ("comment", "Comment"), ("feedback", "Feedback")],
    )
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "social_interaction"
        constraints = [
            CheckConstraint(
                check=Q(interaction_type__in=["like", "bookmark", "comment", "feedback"]),
                name="social_interaction_type_ck",
            ),
            UniqueConstraint(
                fields=["share", "user", "interaction_type"],
                condition=Q(interaction_type__in=["like", "bookmark"]),
                name="social_toggle_unique_ck",
            ),
        ]


class ContentReport(models.Model):
    report_id = models.BigAutoField(primary_key=True)
    share = models.ForeignKey(SharedEssay, models.PROTECT, related_name="reports")
    interaction = models.ForeignKey(SocialInteraction, models.SET_NULL, null=True, blank=True)
    reporter = models.ForeignKey("User", models.PROTECT, related_name="social_reports")
    reason = models.CharField(
        max_length=20,
        choices=[("spam", "Spam"), ("offensive", "Offensive"), ("inappropriate", "Inappropriate"), ("other", "Other")],
    )
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=16,
        choices=[
            ("open", "Open"),
            ("investigating", "Investigating"),
            ("resolved", "Resolved"),
            ("dismissed", "Dismissed"),
        ],
        default="open",
    )
    decision = models.CharField(max_length=20, blank=True)
    resolved_by = models.ForeignKey(
        "User", models.SET_NULL, null=True, blank=True, related_name="resolved_social_reports"
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "social_content_report"
        constraints = [
            CheckConstraint(
                check=Q(reason__in=["spam", "offensive", "inappropriate", "other"]), name="social_report_reason_ck"
            ),
            CheckConstraint(
                check=Q(status__in=["open", "investigating", "resolved", "dismissed"]), name="social_report_status_ck"
            ),
        ]


class SocialPostingBan(models.Model):
    ban_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey("User", models.CASCADE, related_name="posting_bans")
    class_obj = models.ForeignKey("Class", models.CASCADE, related_name="posting_bans")
    expires_at = models.DateTimeField()
    reason = models.CharField(max_length=300)
    created_by = models.ForeignKey("User", models.SET_NULL, null=True, related_name="issued_posting_bans")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "social_posting_ban"
        indexes = [models.Index(fields=["user", "class_obj", "expires_at"], name="social_ban_lookup_idx")]


class OrganizationSettings(models.Model):
    """Single local institution; account creation is always invitation only."""

    setting_id = models.PositiveSmallIntegerField(primary_key=True, default=1)
    name = models.CharField(max_length=120, default="EssayCoach")
    logo_url = models.URLField(blank=True)
    primary_color = models.CharField(max_length=7, default="#0f766e")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey("User", models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = "organization_settings"
        constraints = [CheckConstraint(check=Q(setting_id=1), name="single_organization_ck")]


class AuthSession(models.Model):
    """Persisted JWT session and refresh rotation state."""

    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey("User", models.CASCADE, related_name="auth_sessions")
    refresh_jti = models.CharField(max_length=100, blank=True)
    device = models.CharField(max_length=200, default="Unknown device")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "auth_session"
        indexes = [models.Index(fields=["user", "expires_at"], name="auth_session_user_idx")]


class WorkerHeartbeat(models.Model):
    worker_id = models.PositiveSmallIntegerField(primary_key=True, default=1)
    last_seen_at = models.DateTimeField()
    processed_jobs = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "worker_heartbeat"
        constraints = [CheckConstraint(check=Q(worker_id=1), name="single_ai_worker_heartbeat_ck")]


class CourseLeadAssignment(models.Model):
    """A lecturer's authority to confirm and publish results for one unit."""

    user_id_user = models.ForeignKey("User", models.CASCADE, related_name="course_lead_assignments")
    unit_id_unit = models.ForeignKey("Unit", models.CASCADE, related_name="course_lead_assignments")
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey("User", models.SET_NULL, null=True, related_name="assigned_course_leads")

    class Meta:
        db_table = "course_lead_assignment"
        constraints = [
            UniqueConstraint(fields=["user_id_user", "unit_id_unit"], name="course_lead_user_unit_uq"),
        ]


class Invitation(models.Model):
    """Single-use invitation; only the SHA-256 token digest is stored."""

    token_hash = models.CharField(max_length=64, unique=True)
    email = models.EmailField()
    role = models.CharField(max_length=10, choices=[("student", "Student"), ("lecturer", "Lecturer")])
    class_id_class = models.ForeignKey("Class", models.CASCADE, null=True, blank=True)
    lead_unit = models.ForeignKey("Unit", models.CASCADE, null=True, blank=True)
    invited_by = models.ForeignKey("User", models.CASCADE, related_name="issued_invitations")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "invitation"
        indexes = [models.Index(fields=["email", "role"], name="invitation_email_role_idx")]


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
