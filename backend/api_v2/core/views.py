from __future__ import annotations

from django.conf import settings
from ninja import Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from api_v1.core.models import (
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
from api_v1.core.models import RubricLevelDesc as RubricLevelDescModel

from django.http import HttpRequest

from ..utils.auth import TokenAuth
from .schemas import (
    ClassDetailOut,
    ClassIn,
    ClassOut,
    EnrollmentIn,
    EnrollmentOut,
    FeedbackIn,
    FeedbackItemIn,
    FeedbackItemOut,
    FeedbackOut,
    MarkingRubricIn,
    MarkingRubricOut,
    PaginationParams,
    RubricDetailOut,
    RubricImportOut,
    RubricItemDetailOut,
    RubricItemIn,
    RubricItemOut,
    RubricLevelDescIn,
    RubricLevelDescOut,
    SubmissionIn,
    SubmissionOut,
    TaskIn,
    TaskOut,
    TeachingAssnIn,
    TeachingAssnOut,
    UnitIn,
    UnitOut,
    UserIn,
    UserOut,
)

router = Router(tags=["Core"], auth=TokenAuth())


def paginate(queryset, params: PaginationParams):
    total = queryset.count()
    start = (params.page - 1) * params.page_size
    end = start + params.page_size
    return {
        "count": total,
        "results": list(queryset[start:end]),
    }


# =============================================================================
# Users
# =============================================================================


@router.get("/users/", response=list[UserOut])
def list_users(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = User.objects.all()
    return paginate(qs, params)["results"]


@router.post("/users/", response=UserOut)
def create_user(request: HttpRequest, data: UserIn):
    user = User.objects.create_user(
        user_email=data.user_email,
        password=data.password,
        user_fname=data.user_fname,
        user_lname=data.user_lname,
        user_role=data.user_role,
        user_status=data.user_status,
        is_active=data.is_active,
        is_staff=data.is_staff,
    )
    return user


@router.get("/users/{user_id}/", response=UserOut)
def get_user(request: HttpRequest, user_id: int):
    try:
        return User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")


@router.put("/users/{user_id}/", response=UserOut)
def update_user(request: HttpRequest, user_id: int, data: UserIn):
    try:
        user = User.objects.get(user_id=user_id)
        for key, value in data.dict().items():
            if key != "password":
                setattr(user, key, value)
        if data.password:
            user.set_password(data.password)
        user.save()
        return user
    except User.DoesNotExist:
        raise HttpError(404, "User not found")


@router.delete("/users/{user_id}/")
def delete_user(request: HttpRequest, user_id: int):
    try:
        user = User.objects.get(user_id=user_id)
        user.delete()
        return {"success": True}
    except User.DoesNotExist:
        raise HttpError(404, "User not found")


# =============================================================================
# Units
# =============================================================================


@router.get("/units/", response=list[UnitOut])
def list_units(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = Unit.objects.all()
    return paginate(qs, params)["results"]


@router.post("/units/", response=UnitOut)
def create_unit(request: HttpRequest, data: UnitIn):
    unit = Unit.objects.create(**data.dict())
    return unit


@router.get("/units/{unit_id}/", response=UnitOut)
def get_unit(request: HttpRequest, unit_id: str):
    try:
        return Unit.objects.get(unit_id=unit_id)
    except Unit.DoesNotExist:
        raise HttpError(404, "Unit not found")


@router.put("/units/{unit_id}/", response=UnitOut)
def update_unit(request: HttpRequest, unit_id: str, data: UnitIn):
    try:
        unit = Unit.objects.get(unit_id=unit_id)
        for key, value in data.dict().items():
            setattr(unit, key, value)
        unit.save()
        return unit
    except Unit.DoesNotExist:
        raise HttpError(404, "Unit not found")


@router.delete("/units/{unit_id}/")
def delete_unit(request: HttpRequest, unit_id: str):
    try:
        unit = Unit.objects.get(unit_id=unit_id)
        unit.delete()
        return {"success": True}
    except Unit.DoesNotExist:
        raise HttpError(404, "Unit not found")


# =============================================================================
# Classes
# =============================================================================


@router.get("/classes/", response=list[ClassOut])
def list_classes(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = Class.objects.all()
    return paginate(qs, params)["results"]


@router.post("/classes/", response=ClassOut)
def create_class(request: HttpRequest, data: ClassIn):
    unit = Unit.objects.get(unit_id=data.unit_id_unit)
    class_obj = Class.objects.create(unit_id_unit=unit, class_size=data.class_size)
    return class_obj


@router.get("/classes/{class_id}/", response=ClassOut)
def get_class(request: HttpRequest, class_id: int):
    try:
        return Class.objects.get(class_id=class_id)
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.put("/classes/{class_id}/", response=ClassOut)
def update_class(request: HttpRequest, class_id: int, data: ClassIn):
    try:
        class_obj = Class.objects.get(class_id=class_id)
        if data.unit_id_unit:
            class_obj.unit_id_unit = Unit.objects.get(unit_id=data.unit_id_unit)
        class_obj.class_size = data.class_size
        class_obj.save()
        return class_obj
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


@router.delete("/classes/{class_id}/")
def delete_class(request: HttpRequest, class_id: int):
    try:
        class_obj = Class.objects.get(class_id=class_id)
        class_obj.delete()
        return {"success": True}
    except Class.DoesNotExist:
        raise HttpError(404, "Class not found")


# =============================================================================
# Enrollments
# =============================================================================


@router.get("/enrollments/", response=list[EnrollmentOut])
def list_enrollments(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = Enrollment.objects.all()
    return paginate(qs, params)["results"]


@router.post("/enrollments/", response=EnrollmentOut)
def create_enrollment(request: HttpRequest, data: EnrollmentIn):
    enrollment = Enrollment.objects.create(**data.dict())
    return enrollment


@router.get("/enrollments/{enrollment_id}/", response=EnrollmentOut)
def get_enrollment(request: HttpRequest, enrollment_id: int):
    try:
        return Enrollment.objects.get(enrollment_id=enrollment_id)
    except Enrollment.DoesNotExist:
        raise HttpError(404, "Enrollment not found")


@router.delete("/enrollments/{enrollment_id}/")
def delete_enrollment(request: HttpRequest, enrollment_id: int):
    try:
        enrollment = Enrollment.objects.get(enrollment_id=enrollment_id)
        enrollment.delete()
        return {"success": True}
    except Enrollment.DoesNotExist:
        raise HttpError(404, "Enrollment not found")


# =============================================================================
# MarkingRubrics
# =============================================================================


@router.get("/rubrics/", response=list[MarkingRubricOut])
def list_rubrics(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = MarkingRubric.objects.filter(user_id_user=request.auth)
    return paginate(qs, params)["results"]


@router.post("/rubrics/", response=MarkingRubricOut)
def create_rubric(request: HttpRequest, data: MarkingRubricIn):
    rubric = MarkingRubric.objects.create(
        user_id_user=request.auth,
        rubric_desc=data.rubric_desc,
    )
    return rubric


@router.post("/rubrics/import_from_pdf_with_ai/", response=RubricImportOut)
def import_rubric_from_pdf_with_ai(request: HttpRequest, file: UploadedFile, rubric_name: str | None = None):
    from api_v1.ai_feedback.rubric_parser import RubricParseError, SiliconFlowRubricParser
    from api_v1.core.rubric_manager import RubricImportError, RubricManager

    if not file:
        raise HttpError(400, "PDF file is required")

    if file.content_type and file.content_type != "application/pdf":
        raise HttpError(400, "Only PDF files are supported")

    try:
        parser = SiliconFlowRubricParser(api_key=settings.SILICONFLOW_API_KEY)
        manager = RubricManager(parser)

        result = manager.import_rubric_with_ai(file, request.auth, rubric_name)

        if not result.get("detection", {}).get("is_rubric", False):
            return (
                400,
                RubricImportOut(
                    success=False,
                    error="This PDF does not appear to be a rubric. Please upload a proper rubric PDF file.",
                    detection=result.get("detection"),
                    ai_parsed=result.get("ai_parsed", False),
                    ai_model=result.get("ai_model"),
                ),
            )

        return (201, RubricImportOut(**result))
    except (RubricParseError, RubricImportError, ValueError) as exc:
        return (400, RubricImportOut(success=False, error=str(exc)))


@router.get("/rubrics/{rubric_id}/", response=MarkingRubricOut)
def get_rubric(request: HttpRequest, rubric_id: int):
    try:
        return MarkingRubric.objects.get(rubric_id=rubric_id, user_id_user=request.auth)
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.get("/rubrics/{rubric_id}/detail/", response=RubricDetailOut)
def get_rubric_detail(request: HttpRequest, rubric_id: int):
    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id, user_id_user=request.auth)
        rubric_items = list(RubricItem.objects.filter(rubric_id_marking_rubric=rubric))

        rubric_item_ids = [item.rubric_item_id for item in rubric_items]
        levels = RubricLevelDescModel.objects.filter(rubric_item_id_rubric_item_id__in=rubric_item_ids)
        levels_by_item: dict[int, list[RubricLevelDescModel]] = {}
        for level in levels:
            levels_by_item.setdefault(level.rubric_item_id_rubric_item_id, []).append(level)

        rubric_item_out = []
        for item in rubric_items:
            rubric_item_out.append(
                RubricItemDetailOut(
                    rubric_item_id=item.rubric_item_id,
                    rubric_id_marking_rubric=item.rubric_id_marking_rubric_id,
                    rubric_item_name=item.rubric_item_name,
                    rubric_item_weight=item.rubric_item_weight,
                    level_descriptions=[
                        RubricLevelDescOut(
                            level_desc_id=level.level_desc_id,
                            rubric_item_id_rubric_item=level.rubric_item_id_rubric_item_id,
                            level_min_score=level.level_min_score,
                            level_max_score=level.level_max_score,
                            level_desc=level.level_desc,
                        )
                        for level in levels_by_item.get(item.rubric_item_id, [])
                    ],
                )
            )

        return RubricDetailOut(
            rubric_id=rubric.rubric_id,
            user_id_user=rubric.user_id_user_id,
            rubric_create_time=rubric.rubric_create_time,
            rubric_desc=rubric.rubric_desc,
            rubric_items=rubric_item_out,
        )
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.get("/rubrics/{rubric_id}/detail_with_items/", response=RubricDetailOut)
def get_rubric_detail_with_items(request: HttpRequest, rubric_id: int):
    return get_rubric_detail(request, rubric_id)


@router.put("/rubrics/{rubric_id}/", response=MarkingRubricOut)
def update_rubric(request: HttpRequest, rubric_id: int, data: MarkingRubricIn):
    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id, user_id_user=request.auth)
        rubric.rubric_desc = data.rubric_desc
        rubric.save()
        return rubric
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


@router.delete("/rubrics/{rubric_id}/")
def delete_rubric(request: HttpRequest, rubric_id: int):
    try:
        rubric = MarkingRubric.objects.get(rubric_id=rubric_id, user_id_user=request.auth)
        rubric.delete()
        return {"success": True}
    except MarkingRubric.DoesNotExist:
        raise HttpError(404, "Rubric not found")


# =============================================================================
# RubricItems
# =============================================================================


@router.get("/rubric-items/", response=list[RubricItemOut])
def list_rubric_items(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = RubricItem.objects.all()
    return paginate(qs, params)["results"]


@router.post("/rubric-items/", response=RubricItemOut)
def create_rubric_item(request: HttpRequest, data: RubricItemIn):
    rubric = MarkingRubric.objects.get(rubric_id=data.rubric_id_marking_rubric)
    item = RubricItem.objects.create(
        rubric_id_marking_rubric=rubric,
        rubric_item_name=data.rubric_item_name,
        rubric_item_weight=data.rubric_item_weight,
    )
    return item


@router.get("/rubric-items/{item_id}/", response=RubricItemOut)
def get_rubric_item(request: HttpRequest, item_id: int):
    try:
        return RubricItem.objects.get(rubric_item_id=item_id)
    except RubricItem.DoesNotExist:
        raise HttpError(404, "Rubric item not found")


@router.put("/rubric-items/{item_id}/", response=RubricItemOut)
def update_rubric_item(request: HttpRequest, item_id: int, data: RubricItemIn):
    try:
        item = RubricItem.objects.get(rubric_item_id=item_id)
        item.rubric_item_name = data.rubric_item_name
        item.rubric_item_weight = data.rubric_item_weight
        item.save()
        return item
    except RubricItem.DoesNotExist:
        raise HttpError(404, "Rubric item not found")


@router.delete("/rubric-items/{item_id}/")
def delete_rubric_item(request: HttpRequest, item_id: int):
    try:
        item = RubricItem.objects.get(rubric_item_id=item_id)
        item.delete()
        return {"success": True}
    except RubricItem.DoesNotExist:
        raise HttpError(404, "Rubric item not found")


# =============================================================================
# RubricLevelDescs
# =============================================================================


@router.get("/rubric-levels/", response=list[RubricLevelDescOut])
def list_rubric_levels(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = RubricLevelDesc.objects.all()
    return paginate(qs, params)["results"]


@router.post("/rubric-levels/", response=RubricLevelDescOut)
def create_rubric_level(request: HttpRequest, data: RubricLevelDescIn):
    item = RubricItem.objects.get(rubric_item_id=data.rubric_item_id_rubric_item)
    level = RubricLevelDesc.objects.create(
        rubric_item_id_rubric_item=item,
        level_min_score=data.level_min_score,
        level_max_score=data.level_max_score,
        level_desc=data.level_desc,
    )
    return level


@router.get("/rubric-levels/{level_id}/", response=RubricLevelDescOut)
def get_rubric_level(request: HttpRequest, level_id: int):
    try:
        return RubricLevelDesc.objects.get(level_desc_id=level_id)
    except RubricLevelDesc.DoesNotExist:
        raise HttpError(404, "Rubric level not found")


@router.put("/rubric-levels/{level_id}/", response=RubricLevelDescOut)
def update_rubric_level(request: HttpRequest, level_id: int, data: RubricLevelDescIn):
    try:
        level = RubricLevelDesc.objects.get(level_desc_id=level_id)
        level.level_min_score = data.level_min_score
        level.level_max_score = data.level_max_score
        level.level_desc = data.level_desc
        level.save()
        return level
    except RubricLevelDesc.DoesNotExist:
        raise HttpError(404, "Rubric level not found")


@router.delete("/rubric-levels/{level_id}/")
def delete_rubric_level(request: HttpRequest, level_id: int):
    try:
        level = RubricLevelDesc.objects.get(level_desc_id=level_id)
        level.delete()
        return {"success": True}
    except RubricLevelDesc.DoesNotExist:
        raise HttpError(404, "Rubric level not found")


# =============================================================================
# Tasks
# =============================================================================


@router.get("/tasks/", response=list[TaskOut])
def list_tasks(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = Task.objects.all()
    return paginate(qs, params)["results"]


@router.post("/tasks/", response=TaskOut)
def create_task(request: HttpRequest, data: TaskIn):
    unit = Unit.objects.get(unit_id=data.unit_id_unit)
    rubric = MarkingRubric.objects.get(rubric_id=data.rubric_id_marking_rubric)
    task = Task.objects.create(
        unit_id_unit=unit,
        rubric_id_marking_rubric=rubric,
        task_due_datetime=data.task_due_datetime,
    )
    return task


@router.get("/tasks/{task_id}/", response=TaskOut)
def get_task(request: HttpRequest, task_id: int):
    try:
        return Task.objects.get(task_id=task_id)
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.put("/tasks/{task_id}/", response=TaskOut)
def update_task(request: HttpRequest, task_id: int, data: TaskIn):
    try:
        task = Task.objects.get(task_id=task_id)
        if data.unit_id_unit:
            task.unit_id_unit = Unit.objects.get(unit_id=data.unit_id_unit)
        if data.rubric_id_marking_rubric:
            task.rubric_id_marking_rubric = MarkingRubric.objects.get(rubric_id=data.rubric_id_marking_rubric)
        task.task_due_datetime = data.task_due_datetime
        task.save()
        return task
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


@router.delete("/tasks/{task_id}/")
def delete_task(request: HttpRequest, task_id: int):
    try:
        task = Task.objects.get(task_id=task_id)
        task.delete()
        return {"success": True}
    except Task.DoesNotExist:
        raise HttpError(404, "Task not found")


# =============================================================================
# Submissions
# =============================================================================


@router.get("/submissions/", response=list[SubmissionOut])
def list_submissions(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = Submission.objects.all()
    return paginate(qs, params)["results"]


@router.post("/submissions/", response=SubmissionOut)
def create_submission(request: HttpRequest, data: SubmissionIn):
    task = Task.objects.get(task_id=data.task_id_task)
    user = User.objects.get(user_id=data.user_id_user)
    submission = Submission.objects.create(
        task_id_task=task,
        user_id_user=user,
        submission_txt=data.submission_txt,
    )
    return submission


@router.get("/submissions/{submission_id}/", response=SubmissionOut)
def get_submission(request: HttpRequest, submission_id: int):
    try:
        return Submission.objects.get(submission_id=submission_id)
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


@router.put("/submissions/{submission_id}/", response=SubmissionOut)
def update_submission(request: HttpRequest, submission_id: int, data: SubmissionIn):
    try:
        submission = Submission.objects.get(submission_id=submission_id)
        submission.submission_txt = data.submission_txt
        submission.save()
        return submission
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


@router.delete("/submissions/{submission_id}/")
def delete_submission(request: HttpRequest, submission_id: int):
    try:
        submission = Submission.objects.get(submission_id=submission_id)
        submission.delete()
        return {"success": True}
    except Submission.DoesNotExist:
        raise HttpError(404, "Submission not found")


# =============================================================================
# Feedbacks
# =============================================================================


@router.get("/feedbacks/", response=list[FeedbackOut])
def list_feedbacks(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = Feedback.objects.all()
    return paginate(qs, params)["results"]


@router.post("/feedbacks/", response=FeedbackOut)
def create_feedback(request: HttpRequest, data: FeedbackIn):
    submission = Submission.objects.get(submission_id=data.submission_id_submission)
    user = User.objects.get(user_id=data.user_id_user)
    feedback = Feedback.objects.create(
        submission_id_submission=submission,
        user_id_user=user,
    )
    return feedback


@router.get("/feedbacks/{feedback_id}/", response=FeedbackOut)
def get_feedback(request: HttpRequest, feedback_id: int):
    try:
        return Feedback.objects.get(feedback_id=feedback_id)
    except Feedback.DoesNotExist:
        raise HttpError(404, "Feedback not found")


@router.delete("/feedbacks/{feedback_id}/")
def delete_feedback(request: HttpRequest, feedback_id: int):
    try:
        feedback = Feedback.objects.get(feedback_id=feedback_id)
        feedback.delete()
        return {"success": True}
    except Feedback.DoesNotExist:
        raise HttpError(404, "Feedback not found")


# =============================================================================
# FeedbackItems
# =============================================================================


@router.get("/feedback-items/", response=list[FeedbackItemOut])
def list_feedback_items(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = FeedbackItem.objects.all()
    return paginate(qs, params)["results"]


@router.post("/feedback-items/", response=FeedbackItemOut)
def create_feedback_item(request: HttpRequest, data: FeedbackItemIn):
    feedback = Feedback.objects.get(feedback_id=data.feedback_id_feedback)
    rubric_item = RubricItem.objects.get(rubric_item_id=data.rubric_item_id_rubric_item)
    item = FeedbackItem.objects.create(
        feedback_id_feedback=feedback,
        rubric_item_id_rubric_item=rubric_item,
        feedback_item_score=data.feedback_item_score,
        feedback_item_comment=data.feedback_item_comment,
        feedback_item_source=data.feedback_item_source,
    )
    return item


@router.get("/feedback-items/{item_id}/", response=FeedbackItemOut)
def get_feedback_item(request: HttpRequest, item_id: int):
    try:
        return FeedbackItem.objects.get(feedback_item_id=item_id)
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


@router.put("/feedback-items/{item_id}/", response=FeedbackItemOut)
def update_feedback_item(request: HttpRequest, item_id: int, data: FeedbackItemIn):
    try:
        item = FeedbackItem.objects.get(feedback_item_id=item_id)
        item.feedback_item_score = data.feedback_item_score
        item.feedback_item_comment = data.feedback_item_comment
        item.feedback_item_source = data.feedback_item_source
        item.save()
        return item
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


@router.delete("/feedback-items/{item_id}/")
def delete_feedback_item(request: HttpRequest, item_id: int):
    try:
        item = FeedbackItem.objects.get(feedback_item_id=item_id)
        item.delete()
        return {"success": True}
    except FeedbackItem.DoesNotExist:
        raise HttpError(404, "Feedback item not found")


# =============================================================================
# TeachingAssignments
# =============================================================================


@router.get("/teaching-assignments/", response=list[TeachingAssnOut])
def list_teaching_assignments(request: HttpRequest, params: PaginationParams = PaginationParams()):
    qs = TeachingAssn.objects.all()
    return paginate(qs, params)["results"]


@router.post("/teaching-assignments/", response=TeachingAssnOut)
def create_teaching_assignment(request: HttpRequest, data: TeachingAssnIn):
    user = User.objects.get(user_id=data.user_id_user)
    class_obj = Class.objects.get(class_id=data.class_id_class)
    assignment = TeachingAssn.objects.create(
        user_id_user=user,
        class_id_class=class_obj,
    )
    return assignment


@router.get("/teaching-assignments/{assignment_id}/", response=TeachingAssnOut)
def get_teaching_assignment(request: HttpRequest, assignment_id: int):
    try:
        return TeachingAssn.objects.get(teaching_assn_id=assignment_id)
    except TeachingAssn.DoesNotExist:
        raise HttpError(404, "Teaching assignment not found")


@router.delete("/teaching-assignments/{assignment_id}/")
def delete_teaching_assignment(request: HttpRequest, assignment_id: int):
    try:
        assignment = TeachingAssn.objects.get(teaching_assn_id=assignment_id)
        assignment.delete()
        return {"success": True}
    except TeachingAssn.DoesNotExist:
        raise HttpError(404, "Teaching assignment not found")


# =============================================================================
# User Classes (Role-based)
# =============================================================================


@router.get("/users/me/classes/", response=list[ClassDetailOut])
def get_my_classes(request):
    user = request.auth
    user_role = getattr(user, "user_role", None) or "student"

    if user_role == "admin":
        classes = Class.objects.all().select_related("unit_id_unit")
    elif user_role == "lecturer":
        class_ids = TeachingAssn.objects.filter(user_id_user=user).values_list("class_id_class_id", flat=True)
        classes = Class.objects.filter(class_id__in=class_ids).select_related("unit_id_unit")
    else:
        class_ids = Enrollment.objects.filter(user_id_user=user).values_list("class_id_class_id", flat=True)
        classes = Class.objects.filter(class_id__in=class_ids).select_related("unit_id_unit")

    result = []
    for class_obj in classes:
        result.append(
            ClassDetailOut(
                class_id=class_obj.class_id,
                unit_id_unit=class_obj.unit_id_unit_id,
                class_size=class_obj.class_size,
                unit_name=class_obj.unit_id_unit.unit_name if class_obj.unit_id_unit else None,
            )
        )
    return result
