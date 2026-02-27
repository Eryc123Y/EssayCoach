"""
NewType typed IDs for EssayCoach core entities.

Using NewType gives static type checkers (pyright, mypy) the ability to
distinguish e.g. UserId from TaskId even though both are ``int`` at runtime.
This prevents accidental ID mixups across entity boundaries.

Usage:
    from api_v2.types.ids import UserId, TaskId

    def get_submissions(user_id: UserId, task_id: TaskId) -> ...:
        ...
"""

from __future__ import annotations

from typing import NewType

# Integer-keyed entities
UserId = NewType("UserId", int)
ClassId = NewType("ClassId", int)
TaskId = NewType("TaskId", int)
SubmissionId = NewType("SubmissionId", int)
FeedbackId = NewType("FeedbackId", int)
RubricId = NewType("RubricId", int)
RubricItemId = NewType("RubricItemId", int)
EnrollmentId = NewType("EnrollmentId", int)
BadgeId = NewType("BadgeId", int)

# String-keyed entity (Unit PK is CharField)
UnitId = NewType("UnitId", str)
