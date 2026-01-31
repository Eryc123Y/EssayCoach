"""
Django management command to generate OpenAPI schema JSON for static documentation.

Usage:
    python manage.py generate_openapi_schema [--output OUTPUT_PATH]
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Generate OpenAPI schema JSON for static documentation"

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            type=str,
            default="docs/api-reference/openapi-schema.json",
            help="Output path for the JSON schema file (relative to project root)",
        )
        parser.add_argument(
            "--format",
            type=str,
            choices=["json"],
            default="json",
            help="Output format (only JSON supported)",
        )

    def handle(self, *args, **options):
        output_path = Path(options["output"])
        _format = options["format"]

        self.stdout.write(f"Generating OpenAPI schema to {output_path}...")

        try:
            # Import here to avoid startup issues
            from drf_spectacular.generators import SchemaGenerator

            # Generate schema using drf-spectacular
            generator = SchemaGenerator()
            schema = generator.get_schema(request=None, public=True)

            # Convert to dict if needed
            if hasattr(schema, "dict"):
                schema_dict = schema.dict()
            else:
                schema_dict = schema

            # Ensure output directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # Write schema to file
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(schema_dict, f, indent=2, ensure_ascii=False)

            self.stdout.write(self.style.SUCCESS(f"Successfully generated OpenAPI schema: {output_path}"))
            self.stdout.write(f"  - Title: {schema_dict.get('info', {}).get('title', 'N/A')}")
            self.stdout.write(f"  - Version: {schema_dict.get('info', {}).get('version', 'N/A')}")
            self.stdout.write(f"  - Paths: {len(schema_dict.get('paths', {}))}")

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to generate schema: {e}"))
            raise
