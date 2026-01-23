from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0010_alter_class_options_alter_enrollment_options_and_more"),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE rubric_level_desc DROP CONSTRAINT IF EXISTS min_max_ck;",
            reverse_sql="ALTER TABLE rubric_level_desc ADD CONSTRAINT min_max_ck CHECK (level_min_score >= 0 AND level_max_score > 0 AND level_min_score < level_max_score);",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE rubric_level_desc ADD CONSTRAINT min_max_ck CHECK (level_min_score >= 0 AND level_max_score >= 0 AND level_min_score <= level_max_score);",
            reverse_sql="ALTER TABLE rubric_level_desc DROP CONSTRAINT IF EXISTS min_max_ck;",
        ),
    ]
