from django.db import migrations


def create_default_groups_and_map_roles(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    # Ensure default groups exist
    role_names = ['admin', 'lecturer', 'student']
    name_to_id = {}
    for name in role_names:
        group, _ = Group.objects.get_or_create(name=name)
        name_to_id[name] = group.id

    # Map existing users by user_role to corresponding group
    # Use raw SQL to avoid model managed=False issues
    try:
        with schema_editor.connection.cursor() as cur:
            # Check if user table exists first
            cur.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user')"
            )
            if not cur.fetchone()[0]:
                return

            for role in role_names:
                gid = name_to_id[role]
                # Insert missing memberships
                cur.execute(
                    '''
                    INSERT INTO core_user_groups (user_id, group_id)
                    SELECT u.user_id, %s
                    FROM "user" u
                    LEFT JOIN core_user_groups cug
                      ON cug.user_id = u.user_id AND cug.group_id = %s
                    WHERE u.user_role = %s AND cug.user_id IS NULL
                    ''',
                    [gid, gid, role]
                )
    except Exception:
        # If anything fails (e.g. table doesn't exist), we skip this data migration
        pass


def noop(apps, schema_editor):
    # No-op reverse; removing groups/memberships is not desired
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(create_default_groups_and_map_roles, reverse_code=noop),
    ]

