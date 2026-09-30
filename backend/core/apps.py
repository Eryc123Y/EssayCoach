from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        import sys

        if "pytest" not in sys.modules and "test" not in sys.argv:
            from core.observability import setup_tracing

            setup_tracing()
