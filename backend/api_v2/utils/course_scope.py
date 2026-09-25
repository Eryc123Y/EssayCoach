"""Course and class scope checks shared by API routers."""

from __future__ import annotations

from django.db.models import Q, QuerySet
from ninja.errors import HttpError

from core.models import Class, CourseLeadAssignment, Enrollment, Task, TeachingAssn, User


def visible_classes(user: User) -> QuerySet[Class]:
    if user.user_role == "admin":
        return Class.objects.all()
    if user.user_role == "lecturer":
        return Class.objects.filter(
            Q(teachingassn__user_id_user=user)
            | Q(unit_id_unit__course_lead_assignments__user_id_user=user)
        ).distinct()
    return Class.objects.filter(enrollment__user_id_user=user).distinct()


def can_manage_class(user: User, class_obj: Class) -> bool:
    if user.user_role == "admin":
        return True
    if user.user_role != "lecturer":
        return False
    return (
        TeachingAssn.objects.filter(user_id_user=user, class_id_class=class_obj).exists()
        or CourseLeadAssignment.objects.filter(user_id_user=user, unit_id_unit=class_obj.unit_id_unit).exists()
    )


def can_create_class(user: User, unit_id: str) -> bool:
    return user.user_role == "admin" or (
        user.user_role == "lecturer"
        and CourseLeadAssignment.objects.filter(user_id_user=user, unit_id_unit_id=unit_id).exists()
    )


def require_visible_class(user: User, class_obj: Class) -> None:
    if not visible_classes(user).filter(pk=class_obj.pk).exists():
        raise HttpError(403, "Class is outside your course scope")


def require_manage_class(user: User, class_obj: Class) -> None:
    if not can_manage_class(user, class_obj):
        raise HttpError(403, "Only this class's teaching staff can manage it")


def visible_users(user: User) -> QuerySet[User]:
    if user.user_role == "admin":
        return User.objects.all()
    if user.user_role == "lecturer":
        student_ids = Enrollment.objects.filter(
            class_id_class__in=visible_classes(user)
        ).values_list("user_id_user_id", flat=True)
        return User.objects.filter(Q(pk=user.pk) | Q(pk__in=student_ids)).distinct()
    return User.objects.filter(pk=user.pk)


def require_visible_user(actor: User, target: User) -> None:
    if not visible_users(actor).filter(pk=target.pk).exists():
        raise HttpError(403, "User is outside your course scope")


def visible_tasks(user: User) -> QuerySet[Task]:
    if user.user_role == "admin":
        return Task.objects.all()
    if user.user_role == "lecturer":
        lead_units = CourseLeadAssignment.objects.filter(user_id_user=user).values_list(
            "unit_id_unit_id", flat=True
        )
        return Task.objects.filter(
            Q(class_id_class__in=visible_classes(user))
            | Q(class_id_class__isnull=True, unit_id_unit_id__in=lead_units)
        ).distinct()
    if user.user_role == "student":
        enrolled_units = Enrollment.objects.filter(user_id_user=user).values_list("unit_id_unit_id", flat=True)
        return Task.objects.filter(task_status="published").filter(
            Q(class_id_class__in=visible_classes(user))
            | Q(class_id_class__isnull=True, unit_id_unit_id__in=enrolled_units)
        ).distinct()
    return Task.objects.none()


def can_manage_task(user: User, task: Task) -> bool:
    if user.user_role == "admin":
        return True
    if user.user_role != "lecturer":
        return False
    if task.class_id_class_id is not None:
        return can_manage_class(user, task.class_id_class)
    return CourseLeadAssignment.objects.filter(user_id_user=user, unit_id_unit=task.unit_id_unit).exists()


def require_visible_task(user: User, task: Task) -> None:
    if not visible_tasks(user).filter(pk=task.pk).exists():
        raise HttpError(403, "Assignment is outside your course scope")


def require_manage_task(user: User, task: Task) -> None:
    if not can_manage_task(user, task):
        raise HttpError(403, "Only this assignment's teaching staff can manage it")
