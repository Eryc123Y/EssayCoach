import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "essay_coach.settings")
django.setup()
from core.models import MarkingRubric, RubricItem
rubric = MarkingRubric.objects.get(rubric_id=5)
print(f"Rubric: {rubric.rubric_desc}")
try:
    print(f"rubric_items attr: {hasattr(rubric, 'rubric_items')}")
    print(f"rubricitem_set attr: {hasattr(rubric, 'rubricitem_set')}")
    items = rubric.rubricitem_set.all()
    print(f"Items count via rubricitem_set: {items.count()}")
    for item in items:
        print(f"  Item: {item.rubric_item_name}")
        print(f"    level_descriptions attr: {hasattr(item, 'level_descriptions')}")
        print(f"    rubricleveldesc_set attr: {hasattr(item, 'rubricleveldesc_set')}")
except Exception as e:
    print(f"Error: {e}")
