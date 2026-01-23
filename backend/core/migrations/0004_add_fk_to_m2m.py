from django.db import migrations

ADD_FKS_SQL = r'''
DO $$
BEGIN
    -- Only proceed if tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'core_user_groups') AND
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auth_group') THEN

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'core_user_groups_group_fk'
        ) THEN
            ALTER TABLE public.core_user_groups
            ADD CONSTRAINT core_user_groups_group_fk
            FOREIGN KEY (group_id)
            REFERENCES public.auth_group(id)
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'core_user_user_permissions') AND
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auth_permission') THEN

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'core_user_user_permissions_perm_fk'
        ) THEN
            ALTER TABLE public.core_user_user_permissions
            ADD CONSTRAINT core_user_user_permissions_perm_fk
            FOREIGN KEY (permission_id)
            REFERENCES public.auth_permission(id)
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END$$;
'''


DROP_FKS_SQL = r'''
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'core_user_groups') THEN
        IF EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'core_user_groups_group_fk'
        ) THEN
            ALTER TABLE public.core_user_groups
            DROP CONSTRAINT core_user_groups_group_fk;
        END IF;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'core_user_user_permissions') THEN
        IF EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'core_user_user_permissions_perm_fk'
        ) THEN
            ALTER TABLE public.core_user_user_permissions
            DROP CONSTRAINT core_user_user_permissions_perm_fk;
        END IF;
    END IF;
END$$;
'''


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0003_default_groups'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunSQL(ADD_FKS_SQL, reverse_sql=DROP_FKS_SQL),
    ]

