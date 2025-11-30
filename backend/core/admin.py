"""
This file is used to register the models in the admin interface.
We have overridden the built-in UserAdmin and User entity to add additional fields from
our own database schema. For more information, see:

Substituting a custom User model
https://docs.djangoproject.com/en/stable/topics/auth/customizing/#substituting-a-custom-user-model


UserAdmin reference (describes fieldsets, add_fieldsets, etc.)
https://docs.djangoproject.com/en/stable/ref/contrib/auth/#django.contrib.auth.admin.UserAdmin


General ModelAdmin options (list_display, list_filter, search_fields, ordering, filter_horizontal)
https://docs.djangoproject.com/en/stable/ref/contrib/admin/#modeladmin-options


Details on fieldsets option
https://docs.djangoproject.com/en/stable/ref/contrib/admin/#django.contrib.admin.ModelAdmin.fieldsets
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import (
    User,
    Unit,
    Class,
    Enrollment,
    TeachingAssn,
    MarkingRubric,
    RubricItem,
    RubricLevelDesc,
    Task,
    Submission,
    Feedback,
    FeedbackItem,
)


class CustomUserAdmin(BaseUserAdmin):
    # Fields to display in the admin interface.
    fieldsets = (
        (None, {'fields': ('user_email', 'password')}),
        (_('Personal info'), {'fields': ('user_fname', 'user_lname', 'user_role', 'user_status')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields to add when create a new user.
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('user_email', 'password1', 'password2'),
        }),
    )
    
    # To display in the admin interface.
    list_display = ('user_email', 'user_fname', 'user_lname', 'user_role', 'user_status', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'user_role', 'user_status')
    
    # Searching field.
    search_fields = ('user_email', 'user_fname', 'user_lname')
    
    # Ordering of the user list.
    ordering = ('user_email',)
    
    # To display the user groups and permissions in a horizontal filter.
    filter_horizontal = ('groups', 'user_permissions')

# Register your models here.
admin.site.register(User, CustomUserAdmin)


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("unit_id", "unit_name")
    search_fields = ("unit_id", "unit_name")
    ordering = ("unit_id",)


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ("class_id", "unit_id_unit", "class_size")
    list_filter = ("unit_id_unit",)
    search_fields = ("unit_id_unit__unit_id", "unit_id_unit__unit_name")
    list_select_related = ("unit_id_unit",)
    ordering = ("class_id",)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("enrollment_id", "user_id_user", "class_id_class", "unit_id_unit", "enrollment_time")
    list_filter = ("unit_id_unit", "class_id_class", "enrollment_time")
    search_fields = (
        "user_id_user__user_email",
        "user_id_user__user_fname",
        "user_id_user__user_lname",
        "unit_id_unit__unit_id",
        "unit_id_unit__unit_name",
    )
    list_select_related = ("user_id_user", "class_id_class", "unit_id_unit")
    date_hierarchy = "enrollment_time"
    ordering = ("-enrollment_time",)
    autocomplete_fields = ("user_id_user", "class_id_class", "unit_id_unit")


class FeedbackItemInline(admin.TabularInline):
    model = FeedbackItem
    extra = 0
    fields = (
        "rubric_item_id_rubric_item",
        "feedback_item_score",
        "feedback_item_source",
        "comment_short",
        "feedback_item_id",
    )
    readonly_fields = ("feedback_item_id", "comment_short")

    @admin.display(description="Comment")
    def comment_short(self, obj):
        if not obj.feedback_item_comment:
            return ""
        text = str(obj.feedback_item_comment)
        return (text[:60] + "…") if len(text) > 60 else text


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("feedback_id", "submission_id_submission", "user_id_user")
    list_filter = ("user_id_user",)
    search_fields = (
        "=submission_id_submission__submission_id",
        "user_id_user__user_email",
        "user_id_user__user_fname",
        "user_id_user__user_lname",
    )
    list_select_related = ("submission_id_submission", "user_id_user")
    autocomplete_fields = ("submission_id_submission", "user_id_user")
    inlines = [FeedbackItemInline]


@admin.register(FeedbackItem)
class FeedbackItemAdmin(admin.ModelAdmin):
    list_display = (
        "feedback_item_id",
        "feedback_id_feedback",
        "rubric_item_id_rubric_item",
        "feedback_item_score",
        "feedback_item_source",
        "comment_short",
    )
    list_filter = ("feedback_item_source", "rubric_item_id_rubric_item")
    search_fields = (
        "=feedback_id_feedback__feedback_id",
        "rubric_item_id_rubric_item__rubric_item_name",
        "feedback_item_comment",
    )
    list_select_related = ("feedback_id_feedback", "rubric_item_id_rubric_item")
    autocomplete_fields = ("feedback_id_feedback", "rubric_item_id_rubric_item")

    @admin.display(description="Comment")
    def comment_short(self, obj):
        if not obj.feedback_item_comment:
            return ""
        text = str(obj.feedback_item_comment)
        return (text[:60] + "…") if len(text) > 60 else text


class RubricLevelDescInline(admin.TabularInline):
    model = RubricLevelDesc
    extra = 0
    fields = ("level_min_score", "level_max_score", "level_desc")


@admin.register(RubricItem)
class RubricItemAdmin(admin.ModelAdmin):
    list_display = ("rubric_item_id", "rubric_id_marking_rubric", "rubric_item_name", "rubric_item_weight")
    list_filter = ("rubric_id_marking_rubric",)
    search_fields = ("rubric_item_name", "rubric_id_marking_rubric__rubric_desc")
    list_select_related = ("rubric_id_marking_rubric",)
    autocomplete_fields = ("rubric_id_marking_rubric",)
    inlines = [RubricLevelDescInline]


class RubricItemInline(admin.TabularInline):
    model = RubricItem
    extra = 0
    fields = ("rubric_item_name", "rubric_item_weight")


@admin.register(MarkingRubric)
class MarkingRubricAdmin(admin.ModelAdmin):
    list_display = ("rubric_id", "user_id_user", "rubric_create_time", "rubric_desc")
    list_filter = ("user_id_user", "rubric_create_time")
    search_fields = (
        "rubric_desc",
        "user_id_user__user_email",
        "user_id_user__user_fname",
        "user_id_user__user_lname",
    )
    list_select_related = ("user_id_user",)
    date_hierarchy = "rubric_create_time"
    ordering = ("-rubric_create_time",)
    autocomplete_fields = ("user_id_user",)
    inlines = [RubricItemInline]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("task_id", "unit_id_unit", "rubric_id_marking_rubric", "task_publish_datetime", "task_due_datetime")
    list_filter = ("unit_id_unit", "task_publish_datetime", "task_due_datetime")
    search_fields = ("unit_id_unit__unit_id", "unit_id_unit__unit_name")
    list_select_related = ("unit_id_unit", "rubric_id_marking_rubric")
    date_hierarchy = "task_publish_datetime"
    ordering = ("-task_publish_datetime",)
    autocomplete_fields = ("unit_id_unit", "rubric_id_marking_rubric")


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "submission_id",
        "submission_time",
        "task_id_task",
        "user_id_user",
        "word_count",
    )
    list_filter = ("task_id_task", "submission_time")
    search_fields = (
        "user_id_user__user_email",
        "user_id_user__user_fname",
        "user_id_user__user_lname",
        "=task_id_task__task_id",
    )
    list_select_related = ("task_id_task", "user_id_user")
    date_hierarchy = "submission_time"
    ordering = ("-submission_time",)
    autocomplete_fields = ("task_id_task", "user_id_user")

    @admin.display(description="Words")
    def word_count(self, obj):
        text = obj.submission_txt or ""
        return len(text.split()) if text else 0


@admin.register(TeachingAssn)
class TeachingAssnAdmin(admin.ModelAdmin):
    list_display = ("teaching_assn_id", "user_id_user", "class_id_class")
    list_filter = ("class_id_class",)
    search_fields = (
        "user_id_user__user_email",
        "user_id_user__user_fname",
        "user_id_user__user_lname",
        "=class_id_class__class_id",
    )
    list_select_related = ("user_id_user", "class_id_class")
    autocomplete_fields = ("user_id_user", "class_id_class")


@admin.register(RubricLevelDesc)
class RubricLevelDescAdmin(admin.ModelAdmin):
    list_display = (
        "level_desc_id",
        "rubric_item_id_rubric_item",
        "level_min_score",
        "level_max_score",
        "desc_short",
    )
    list_filter = ("rubric_item_id_rubric_item",)
    search_fields = (
        "rubric_item_id_rubric_item__rubric_item_name",
        "level_desc",
    )
    list_select_related = ("rubric_item_id_rubric_item",)
    autocomplete_fields = ("rubric_item_id_rubric_item",)

    @admin.display(description="Description")
    def desc_short(self, obj):
        if not obj.level_desc:
            return ""
        text = str(obj.level_desc)
        return (text[:60] + "…") if len(text) > 60 else text
