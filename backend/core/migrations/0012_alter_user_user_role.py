from django.db import migrations, models


def backfill_roles(apps, schema_editor):
    User = apps.get_model("core", "User")
    User.objects.filter(user_role__isnull=True).update(user_role="student")


class Migration(migrations.Migration):
    dependencies = [("core", "0011_alter_user_user_status")]

    operations = [
        migrations.RunPython(backfill_roles, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="user_role",
            field=models.CharField(db_column="user_role", default="student", max_length=10),
        ),
    ]
