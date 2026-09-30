"""Award durable writing milestones after a formal submission is accepted."""

from __future__ import annotations

from core.models import Badge, Submission, User, UserBadge

MILESTONES = (
    (1, "First Essay", "Submitted your first formal essay", "first-essay"),
    (3, "Building Momentum", "Submitted three formal essays", "momentum"),
    (5, "Five Essays", "Submitted five formal essays", "five-essays"),
    (10, "Ten Essays", "Submitted ten formal essays", "ten-essays"),
)


def award_submission_milestones(user: User) -> None:
    count = Submission.objects.filter(user_id_user=user).count()
    for threshold, name, description, icon in MILESTONES:
        if count < threshold:
            continue
        badge, _ = Badge.objects.get_or_create(
            name=name,
            defaults={
                "description": description,
                "icon": icon,
                "criteria": {"type": "submission_count", "threshold": threshold},
            },
        )
        UserBadge.objects.get_or_create(user_id_user=user, badge_id_badge=badge)
