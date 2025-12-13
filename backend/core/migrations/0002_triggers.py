from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=r'''
            CREATE OR REPLACE FUNCTION public.increase_class_size ()
                RETURNS trigger
                LANGUAGE plpgsql
                VOLATILE 
                CALLED ON NULL INPUT
                SECURITY INVOKER
                PARALLEL UNSAFE
                COST 1
                AS 
            $function$
            BEGIN
              UPDATE class
              SET class_size = class_size + 1
              WHERE class_id = NEW.class_id_class;
              RETURN NEW;
            END;
            $function$;

            CREATE OR REPLACE FUNCTION public.decrease_class_size ()
                RETURNS trigger
                LANGUAGE plpgsql
                VOLATILE
                CALLED ON NULL INPUT
                SECURITY INVOKER
                PARALLEL UNSAFE
                COST 1
                AS 
            $function$
            BEGIN
              UPDATE class
              SET class_size = class_size - 1
              WHERE class_id = OLD.class_id_class;
              RETURN OLD;
            END;
            $function$;

            CREATE OR REPLACE TRIGGER trg_increment_class_size
                AFTER INSERT 
                ON public.enrollment
                FOR EACH ROW
                EXECUTE PROCEDURE public.increase_class_size();

            CREATE OR REPLACE TRIGGER trg_decrement_class_size
                AFTER DELETE
                ON public.enrollment
                FOR EACH ROW
                EXECUTE PROCEDURE public.decrease_class_size();
            ''',
            reverse_sql=r'''
            DROP TRIGGER IF EXISTS trg_increment_class_size ON public.enrollment;
            DROP TRIGGER IF EXISTS trg_decrement_class_size ON public.enrollment;
            DROP FUNCTION IF EXISTS public.increase_class_size();
            DROP FUNCTION IF EXISTS public.decrease_class_size();
            '''
        ),
    ]

