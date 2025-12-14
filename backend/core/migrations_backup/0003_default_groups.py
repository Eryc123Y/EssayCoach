from django.db import migrations

def create_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    role_names = ['admin', 'lecturer', 'student']
    for name in role_names:
        Group.objects.get_or_create(name=name)

def noop(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_triggers'),
        ('auth', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_groups, reverse_code=noop),
    ]

