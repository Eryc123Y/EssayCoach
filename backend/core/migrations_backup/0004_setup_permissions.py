from django.db import migrations


def setup_permissions(apps, schema_editor):
    ContentType = apps.get_model('contenttypes', 'ContentType')
    Permission = apps.get_model('auth', 'Permission')
    Group = apps.get_model('auth', 'Group')

    # Content type for core.User
    ct, _ = ContentType.objects.get_or_create(app_label='core', model='user')

    # Ensure custom permission exists
    view_stats_codename = 'view_student_stats'
    Permission.objects.get_or_create(
        codename=view_stats_codename,
        content_type=ct,
        defaults={'name': 'Can view student stats'},
    )

    # Fetch or create default groups
    admin_g, _ = Group.objects.get_or_create(name='admin')
    lecturer_g, _ = Group.objects.get_or_create(name='lecturer')
    student_g, _ = Group.objects.get_or_create(name='student')

    # Collect relevant permissions for core.user
    perm_codenames = ['add_user', 'change_user', 'delete_user', 'view_user', view_stats_codename]
    perms = {p.codename: p for p in Permission.objects.filter(content_type=ct, codename__in=perm_codenames)}

    # Assign permissions:
    # - admin: full control + view_student_stats
    admin_wanted = ['add_user', 'change_user', 'delete_user', 'view_user', view_stats_codename]
    # - lecturer: can view users + view_student_stats
    lecturer_wanted = ['view_user', view_stats_codename]
    # - student: no model-level user perms (own-data access is enforced in views)
    student_wanted = []

    def ensure_group_perms(group, wanted):
        current = set(group.permissions.filter(content_type=ct).values_list('codename', flat=True))
        add = [perms[c] for c in wanted if c in perms and c not in current]
        if add:
            group.permissions.add(*add)

    ensure_group_perms(admin_g, admin_wanted)
    ensure_group_perms(lecturer_g, lecturer_wanted)
    ensure_group_perms(student_g, student_wanted)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0003_add_fk_to_m2m'),
        ('auth', '0012_alter_user_first_name_max_length'),
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.RunPython(setup_permissions, reverse_code=noop),
    ]

