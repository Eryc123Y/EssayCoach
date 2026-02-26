# Generated manually for missing Task fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0004_alter_submission_table_comment_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="class_id_class",
            field=models.ForeignKey(
                blank=True,
                db_column="class_id_class",
                db_comment="Link to class",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="core.class",
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="task_instructions",
            field=models.TextField(
                blank=True,
                db_comment="Submission instructions",
                default="",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="task",
            name="task_title",
            field=models.CharField(
                blank=True,
                db_comment="Task title",
                default="",
                max_length=200,
            ),
            preserve_default=False,
        ),
    ]
