from django.db import migrations
from django.db import transaction


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
    conn = schema_editor.connection
    try:
        with conn.cursor() as cur:
            # Only proceed if required tables exist.
            cur.execute(
                """
                SELECT
                    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user') AS user_ok,
                    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'core_user_groups') AS m2m_ok,
                    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auth_group') AS group_ok
                """
            )
            user_ok, m2m_ok, group_ok = cur.fetchone()
            if not (user_ok and m2m_ok and group_ok):
                return

            for role in role_names:
                gid = name_to_id[role]
                # Insert missing memberships
                cur.execute(
                    """
                    INSERT INTO core_user_groups (user_id, group_id)
                    SELECT u.user_id, %s
                    FROM "user" u
                    LEFT JOIN core_user_groups cug
                      ON cug.user_id = u.user_id AND cug.group_id = %s
                    WHERE u.user_role = %s AND cug.user_id IS NULL
                    """,
                    [gid, gid, role],
                )
    except Exception:
        # If anything fails (e.g. table doesn't exist), do not poison the
        # connection/transaction for the remainder of `migrate`.
        try:
            conn.rollback()
            transaction.set_rollback(False, using=conn.alias)
        except Exception:
            pass
        return


def noop(apps, schema_editor):
    # No-op reverse; removing groups/memberships is not desired
    pass


class Migration(migrations.Migration):
    # This data migration can be safely skipped on failure; running it outside an
    # atomic transaction avoids leaving the connection in an aborted state.
    atomic = False
    dependencies = [
        ('core', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(create_default_groups_and_map_roles, reverse_code=noop),
    ]

