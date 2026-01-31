#!/usr/bin/env python3
"""
Automated Documentation Generator for EssayCoach

Generates API reference documentation by introspecting Django models
and creates output in docs/api-reference/ and docs/backend/models/
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.error import URLError, HTTPError
from urllib.request import urlopen, Request

# Django setup for model introspection
import django
from django.conf import settings
from django.core.management import call_command
from django.db import models

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class DocumentationGenerator:
    """Generates documentation for Django models and API endpoints."""

    # Output directories relative to project root
    OUTPUT_DIRS = {"api_reference": "docs/api-reference", "backend_models": "docs/backend/models"}

    # Cache file for idempotency check
    CACHE_FILE = ".doc_generator_cache.json"

    # Django built-in models that should be marked with warning
    DJANGO_BUILTIN_MODELS = {
        "ContentType",
        "Permission",
        "Group",
        "User",
        "Session",
        "Site",
    }

    # Django built-in apps
    DJANGO_BUILTIN_APPS = {
        "auth",
        "contenttypes",
        "sessions",
        "admin",
    }

    def __init__(self, verbose: bool = False, dry_run: bool = False):
        self.verbose = verbose
        self.dry_run = dry_run
        self.project_root = Path(__file__).parent.parent
        self.cache = self._load_cache()

        # Configure logging level based on verbosity
        if verbose:
            logging.getLogger().setLevel(logging.DEBUG)
            logger.debug("Verbose mode enabled")

    def _load_cache(self) -> dict:
        """Load cache for idempotency check."""
        cache_path = self.project_root / self.CACHE_FILE
        if cache_path.exists():
            try:
                with open(cache_path, "r") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}

    def _save_cache(self):
        """Save cache for idempotency check."""
        if self.dry_run:
            logger.debug("Dry run: skipping cache save")
            return

        cache_path = self.project_root / self.CACHE_FILE
        try:
            with open(cache_path, "w") as f:
                json.dump(self.cache, f, indent=2)
            logger.debug(f"Cache saved to {cache_path}")
        except IOError as e:
            logger.warning(f"Failed to save cache: {e}")

    def _is_current(self, output_file: str) -> bool:
        """Check if output file is current using timestamp comparison."""
        output_path = self.project_root / output_file
        if not output_path.exists():
            return False

        # Get last modification time of output file
        output_mtime = output_path.stat().st_mtime

        # Check if any source files are newer
        source_files = [
            "backend/essay_coach/settings.py",
            "backend/core/models.py",
            "backend/core/views.py",
        ]

        for source_file in source_files:
            source_path = self.project_root / source_file
            if source_path.exists():
                source_mtime = source_path.stat().st_mtime
                if source_mtime > output_mtime:
                    return False

        return True

    def _setup_django(self):
        """Setup Django environment for model introspection."""
        # Add backend to Python path
        backend_path = self.project_root / "backend"
        if str(backend_path) not in sys.path:
            sys.path.insert(0, str(backend_path))

        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "essay_coach.settings")

        # Configure Django settings using the real backend configuration
        if not settings.configured:
            settings.configure(
                DEBUG=False,
                DATABASES={
                    "default": {
                        "ENGINE": "django.db.backends.sqlite3",
                        "NAME": ":memory:",
                    }
                },
                INSTALLED_APPS=[
                    "django.contrib.contenttypes",
                    "django.contrib.auth",
                    "core",
                    "auth",
                    "analytics",
                    "ai_feedback",
                ],
                SECRET_KEY="dummy-key-for-docs-generation",
                USE_TZ=True,
                DEFAULT_AUTO_FIELD="django.db.models.BigAutoField",
            )

        django.setup()

    def _test_django_connection(self) -> bool:
        """Test Django connection and model access."""
        try:
            # Try to setup Django environment
            self._setup_django()

            # Import models to verify connection
            from django.apps import apps

            all_models = apps.get_models()

            logger.debug(f"Successfully connected to Django. Found {len(list(all_models))} models.")
            return True

        except Exception as e:
            logger.error(f"Django connection failed: {e}")
            return False

    def _generate_model_documentation(self) -> str:
        """Generate documentation for Django models."""
        from django.apps import apps
        from django.db import models

        output = []
        output.append("# Backend Model Reference\n")
        output.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        output.append("---\n\n")

        # Get all models from installed apps
        for app_config in apps.get_app_configs():
            app_models = []

            for model in app_config.get_models():
                if hasattr(model, "_meta"):
                    app_models.append(model)

            if app_models:
                output.append(f"## {app_config.name}\n\n")

                for model in app_models:
                    is_builtin = model.__name__ in self.DJANGO_BUILTIN_MODELS

                    if is_builtin:
                        output.append(f"### {model.__name__} ⚠️\n\n")
                        output.append(
                            "> **⚠️ Django Built-in Model**: This model is provided by Django's authentication and contenttypes systems. "
                        )
                        output.append(
                            "For more details, see the [Django documentation](https://docs.djangoproject.com/en/4.2/ref/contrib/auth/).\n\n"
                        )
                    else:
                        output.append(f"### {model.__name__}\n\n")

                    # Model meta options
                    if model._meta.verbose_name:
                        output.append(f"**Verbose Name**: {model._meta.verbose_name}\n\n")
                    if model._meta.verbose_name_plural:
                        output.append(
                            f"**Verbose Name Plural**: {model._meta.verbose_name_plural}\n\n"
                        )

                    # Model constraints (CheckConstraints)
                    constraints = getattr(model._meta, "constraints", [])
                    if constraints:
                        output.append("**Constraints**:\n")
                        for constraint in constraints:
                            output.append(f"- `{constraint.name}`: {constraint}\n")
                        output.append("\n")

                    # Model indexes
                    indexes = getattr(model._meta, "indexes", [])
                    if indexes:
                        output.append("**Indexes**:\n")
                        for index in indexes:
                            output.append(f"- `{index.name}`: {index.fields}\n")
                        output.append("\n")

                    # Model fields
                    output.append("| Field | Type | Blank | Null | Help Text |\n")
                    output.append("|-------|------|-------|------|----------|\n")

                    for field in model._meta.get_fields():
                        # Handle different field types (including reverse relations)
                        if not hasattr(field, "name"):
                            continue

                        field_name = field.name
                        field_type = (
                            field.get_internal_type()
                            if hasattr(field, "get_internal_type")
                            else "relation"
                        )
                        blank = getattr(field, "blank", "N/A")
                        null = getattr(field, "null", "N/A")
                        help_text = getattr(field, "help_text", "") or ""

                        # Add related_name for ForeignKey fields
                        related_name = getattr(field, "related_name", None)
                        if related_name:
                            help_text = f"{help_text} (related_name: {related_name})".strip()

                        output.append(
                            f"| {field_name} | {field_type} | {blank} | {null} | {help_text} |\n"
                        )

                    output.append("\n")

        return "".join(output)

    def _generate_erd_mermaid(self) -> str:
        """Generate Mermaid.js ERD diagram from Django models."""
        from django.apps import apps
        from django.db import models

        output = []
        output.append("```mermaid\n")
        output.append("erDiagram\n")
        output.append("    %% EssayCoach Database Schema\n")
        output.append("    %% Generated: {}\n".format(datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

        # Collect all models and their relationships
        models_info = []
        relationships = []

        for app_config in apps.get_app_configs():
            # Skip Django built-in apps for cleaner diagram
            if app_config.name in self.DJANGO_BUILTIN_APPS:
                continue

            for model in app_config.get_models():
                if not hasattr(model, "_meta"):
                    continue

                model_name = model.__name__
                is_builtin = model_name in self.DJANGO_BUILTIN_MODELS

                # Get model fields
                fields = []
                for field in model._meta.get_fields():
                    if not hasattr(field, "name"):
                        continue

                    field_name = field.name
                    field_type = field.get_internal_type()

                    # Determine field notation based on type
                    if field_type in ["AutoField", "BigAutoField"]:
                        fields.append(f"    {model_name} {{")
                        fields.append(f"        {field_name} {field_type} PK")
                    elif field_type in ["ForeignKey", "OneToOneField"]:
                        related_model = (
                            field.related_model.__name__ if field.related_model else "Unknown"
                        )
                        on_delete = getattr(field, "on_delete", None)
                        on_delete_str = on_delete.__name__ if on_delete else "CASCADE"
                        related_name = getattr(field, "related_name", None)

                        # Add relationship
                        rel_type = "||--" if field_type == "OneToOneField" else "}o--"
                        if related_name:
                            relationships.append(
                                f'    {model_name} {rel_type}|" {related_name} " {related_model}'
                            )
                        else:
                            relationships.append(f'    {model_name} {rel_type}|" " {related_model}')

                        # Add field as foreign key
                        fields.append(f"    {model_name} {{")
                        fields.append(f'        {field_name} {field_type} FK "{related_model}.id"')

                    elif field_type in ["ManyToManyField"]:
                        # Skip M2M fields - they'll be represented as separate tables
                        pass
                    else:
                        # Regular field
                        null = getattr(field, "null", False)
                        blank = getattr(field, "blank", False)
                        field_info = f"{field_name} {field_type}"
                        if null:
                            field_info += " NULL"
                        if blank:
                            field_info += " optional"
                        fields.append(f"    {model_name} {{")
                        fields.append(f"        {field_info}")

                if fields:
                    models_info.extend(fields)

        # Output models
        for line in models_info:
            output.append(line)

        output.append("")

        # Output relationships
        for rel in relationships:
            output.append(rel)

        output.append("```\n")

        return "".join(output)

    def _generate_erd_documentation(self) -> str:
        """Generate complete ERD documentation with Mermaid diagram."""
        output = []
        output.append("# Database ERD Diagram\n")
        output.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        output.append("---\n\n")

        output.append("## 📊 Visual Schema Representation\n\n")
        output.append(
            "The complete entity-relationship diagram for the EssayCoach database system is generated from the Django models.\n\n"
        )

        output.append(
            "> **Note**: This ERD is automatically generated from Django models during documentation build. "
        )
        output.append("Run `make docs-erd` or `make docs-generate` to regenerate.\n\n")

        output.append("## 🖼️ Database Schema Diagram\n\n")
        output.append("```mermaid\n")
        output.append("erDiagram\n")

        # Generate model definitions and relationships
        from django.apps import apps
        from django.db import models

        models_added = set()

        for app_config in apps.get_app_configs():
            # Skip Django built-in apps
            if app_config.name in self.DJANGO_BUILTIN_APPS:
                continue

            for model in app_config.get_models():
                if not hasattr(model, "_meta"):
                    continue

                model_name = model.__name__
                if model_name in models_added:
                    continue
                models_added.add(model_name)

                is_builtin = model_name in self.DJANGO_BUILTIN_MODELS

                output.append(f"    %% {app_config.name} - {model_name}\n")

                # Add model definition
                output.append(f"    {model_name} {{\n")

                # Add primary key
                pk_field = model._meta.pk
                if pk_field:
                    pk_name = pk_field.name
                    pk_type = pk_field.get_internal_type()
                    output.append(f"        {pk_name} {pk_type} PK\n")

                # Add other fields
                for field in model._meta.get_fields():
                    if not hasattr(field, "name"):
                        continue
                    if field.name == pk_name:
                        continue

                    field_type = field.get_internal_type()

                    if field_type in ["ForeignKey", "OneToOneField"]:
                        related_model = (
                            field.related_model.__name__ if field.related_model else "Unknown"
                        )
                        output.append(
                            f'        {field.name} {field_type} FK "{related_model}.id"\n'
                        )
                    elif field_type == "ManyToManyField":
                        # Skip M2M for now
                        pass
                    else:
                        null = getattr(field, "null", False)
                        field_type_str = field_type or "Field"
                        output.append(
                            f"        {field.name} {field_type_str} {'NULL' if null else ''}\n"
                        )

                output.append("    }\n\n")

        # Add relationships
        output.append("    %% Relationships\n")
        relationships_added = set()

        for app_config in apps.get_app_configs():
            if app_config.name in self.DJANGO_BUILTIN_APPS:
                continue

            for model in app_config.get_models():
                if not hasattr(model, "_meta"):
                    continue

                model_name = model.__name__

                for field in model._meta.get_fields():
                    if not hasattr(field, "name"):
                        continue

                    field_type = field.get_internal_type()

                    if field_type in ["ForeignKey", "OneToOneField"]:
                        related_model = (
                            field.related_model.__name__ if field.related_model else None
                        )
                        if not related_model:
                            continue

                        related_name = getattr(field, "related_name", None)
                        on_delete = getattr(field, "on_delete", None)
                        on_delete_str = on_delete.__name__ if on_delete else "CASCADE"

                        # Create unique relationship key
                        rel_key = f"{model_name}-{field.name}-{related_model}"
                        if rel_key in relationships_added:
                            continue
                        relationships_added.add(rel_key)

                        if field_type == "OneToOneField":
                            output.append(
                                f'    {model_name} ||--|| {related_model} : "{field.name}"\n'
                            )
                        else:
                            if related_name:
                                output.append(
                                    f'    {model_name} }}o--|| {related_model} : "{related_name}"\n'
                                )
                            else:
                                output.append(
                                    f'    {model_name} }}o--{{ {related_model} : "{field.name}"\n'
                                )

        output.append("```\n\n")

        output.append("## 🔄 Regenerating the ERD\n\n")
        output.append("To regenerate this diagram:\n\n")
        output.append("```bash\n")
        output.append("# Option 1: Generate ERD only\n")
        output.append("make docs-erd\n\n")
        output.append("# Option 2: Generate all documentation including ERD\n")
        output.append("make docs-generate\n")
        output.append("```\n\n")

        output.append(
            "This will run the documentation generator to create an updated ERD from the current Django models.\n"
        )

        return "".join(output)

    def generate_erd(self) -> bool:
        """Generate ERD documentation."""
        logger.info("Starting ERD documentation generation...")

        # Setup Django environment
        self._setup_django()

        erd_file = "docs/database/erd-diagram.md"
        if self._is_current(erd_file):
            logger.info(f"ERD documentation is current: {erd_file}")
            return True

        logger.info(f"Generating ERD documentation: {erd_file}")

        if not self.dry_run:
            # Ensure output directory exists
            output_dir = self.project_root / "docs/database"
            output_dir.mkdir(parents=True, exist_ok=True)

            # Generate and save documentation
            erd_docs = self._generate_erd_documentation()
            output_path = self.project_root / erd_file

            with open(output_path, "w") as f:
                f.write(erd_docs)

            logger.info(f"ERD documentation generated: {output_path}")

            # Update cache
            self.cache[erd_file] = {
                "timestamp": datetime.now().isoformat(),
                "source": "django_models_erd",
            }
            self._save_cache()

        return True

    def _fetch_openapi_schema(self, schema_url: str) -> tuple[dict | None, bool]:
        """Fetch OpenAPI schema from the backend server."""
        schema = None
        use_template = False

        try:
            logger.debug(f"Fetching OpenAPI schema from {schema_url}")
            req = Request(schema_url, headers={"Accept": "application/json"})
            with urlopen(req, timeout=10) as response:
                schema = json.loads(response.read().decode("utf-8"))
            logger.debug("Successfully fetched OpenAPI schema")
        except (URLError, HTTPError, json.JSONDecodeError, TimeoutError) as e:
            logger.warning(f"Could not fetch OpenAPI schema from backend: {e}")
            logger.info("Using template API documentation")
            use_template = True

        return schema, use_template

    def _resolve_schema_ref(self, schema: dict, ref: str, components: dict) -> dict | None:
        """Resolve a $ref reference to its actual schema definition."""
        if not ref.startswith("#/"):
            return None

        try:
            parts = ref.replace("#/", "").split("/")
            current = components
            for part in parts:
                if part in current:
                    current = current[part]
                else:
                    return None
            return current
        except (KeyError, TypeError):
            return None

    def _extract_request_body_info(self, method_details: dict, components: dict) -> str:
        """Extract request body schema information from method details."""
        request_body = method_details.get("requestBody")
        if not request_body:
            return "None"

        content = request_body.get("content", {})
        if "application/json" in content:
            json_content = content["application/json"]
            schema = json_content.get("schema", {})
            if "$ref" in schema:
                resolved = self._resolve_schema_ref(schema["$ref"], schema["$ref"], components)
                if resolved:
                    return resolved.get("title", schema["$ref"].split("/")[-1])
                return schema["$ref"].split("/")[-1]
            elif "type" in schema:
                schema_type = schema.get("type", "object")
                if schema_type == "object" and "properties" in schema:
                    props = list(schema["properties"].keys())
                    return f"Object ({', '.join(props[:5])}{'...' if len(props) > 5 else ''})"
                return schema_type
        return "See details"

    def _extract_response_info(self, method_details: dict, components: dict) -> list[str]:
        """Extract response schema information from method details."""
        responses = method_details.get("responses", {})
        response_info = []

        for status_code, response in sorted(responses.items()):
            if status_code.startswith("2") or status_code == "201" or status_code == "204":
                description = response.get("description", "")
                content = response.get("content", {})

                if "application/json" in content:
                    json_content = content["application/json"]
                    schema = json_content.get("schema", {})
                    if "$ref" in schema:
                        resolved = self._resolve_schema_ref(
                            schema["$ref"], schema["$ref"], components
                        )
                        if resolved:
                            response_info.append(
                                f"{status_code}: {resolved.get('title', 'Response')}"
                            )
                        else:
                            response_info.append(f"{status_code}: Response")
                    elif "type" in schema:
                        schema_type = schema.get("type", "object")
                        if schema_type == "array":
                            items = schema.get("items", {})
                            if "$ref" in items:
                                item_name = items["$ref"].split("/")[-1]
                                response_info.append(f"{status_code}: Array of {item_name}")
                            else:
                                response_info.append(f"{status_code}: Array")
                        elif schema_type == "object":
                            response_info.append(f"{status_code}: Object")
                        else:
                            response_info.append(f"{status_code}: {schema_type}")
                    else:
                        response_info.append(f"{status_code}: {description[:50]}")
                else:
                    response_info.append(f"{status_code}: {description[:50]}")
            elif (
                status_code == "400"
                or status_code == "401"
                or status_code == "403"
                or status_code == "404"
            ):
                description = response.get("description", "")
                response_info.append(f"{status_code}: {description[:40]}")

        return response_info[:3]

    def _extract_security_requirements(
        self, method_details: dict, security_schemes: dict
    ) -> list[str]:
        """Extract security requirements for an endpoint."""
        security = method_details.get("security", [])
        requirements = []

        for sec_req in security:
            for scheme_name in sec_req.keys():
                if scheme_name in security_schemes:
                    scheme = security_schemes[scheme_name]
                    scheme_type = scheme.get("type", "")
                    if scheme_type == "http":
                        scheme_scheme = scheme.get("scheme", "")
                        if scheme_scheme == "bearer":
                            requirements.append("Bearer Token")
                    elif scheme_type == "apiKey":
                        requirements.append(f"API Key ({scheme.get('name', scheme_name)})")
                    elif scheme_type == "oauth2" or scheme_type == "openIdConnect":
                        requirements.append("OAuth2")

        if not requirements:
            requirements.append("None")

        return list(set(requirements))

    def _generate_endpoint_details(
        self, endpoints: list[dict], components: dict, security_schemes: dict
    ) -> str:
        """Generate detailed documentation for a list of endpoints."""
        output = []

        # Sort endpoints by path and method
        sorted_endpoints = sorted(endpoints, key=lambda x: (x["path"], x["method"]))

        for ep in sorted_endpoints:
            output.append(f"#### {ep['method']} `{ep['path']}`\n\n")

            if ep.get("summary"):
                output.append(f"**{ep['summary']}**\n\n")

            if ep.get("description"):
                output.append(f"{ep['description']}\n\n")

            auth_requirements = ep.get("auth_requirements", ["None"])
            output.append(f"**Authentication**: `{'`, `'.join(auth_requirements)}`\n\n")

            request_schema = ep.get("request_schema", "None")
            output.append(f"**Request Body**: `{request_schema}`\n\n")

            responses = ep.get("responses", [])
            if responses:
                output.append("**Responses**:\n")
                for resp in responses:
                    output.append(f"- `{resp}`\n")
                output.append("\n")

            output.append("---\n\n")

        return "".join(output)

    def _generate_api_documentation(self) -> str:
        """Generate API endpoint documentation from OpenAPI schema."""
        output = []
        output.append("# API Reference\n")
        output.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        output.append("---\n\n")

        # Fetch OpenAPI schema from the backend
        schema_url = "http://127.0.0.1:8000/api/schema/"
        schema, use_template = self._fetch_openapi_schema(schema_url)

        if use_template:
            # Fallback to template structure
            output.append(self._generate_template_documentation())
        elif schema:
            # Parse OpenAPI schema and generate documentation
            output.extend(self._parse_openapi_schema(schema))

        return "".join(output)

    def _generate_template_documentation(self) -> str:
        """Generate template documentation when backend is unavailable."""
        output = []

        output.append("## Authentication\n\n")
        output.append("All API requests require authentication using a Bearer token:\n\n")
        output.append("```bash\n")
        output.append("Authorization: Bearer <your-access-token>\n")
        output.append("```\n\n")
        output.append(
            "**Note**: Backend server is not running. Run `make dev-backend` to generate actual API documentation.\n\n"
        )

        output.append("## Endpoints\n\n")

        # Endpoint groups when backend unavailable
        endpoint_groups = [
            (
                "Authentication",
                [
                    ("GET", "/api/v1/auth/me/", "Get current user info"),
                    ("POST", "/api/v1/auth/login/", "User login"),
                    ("POST", "/api/v1/auth/logout/", "User logout"),
                ],
            ),
            (
                "Users",
                [
                    ("GET", "/api/v1/core/users/me/", "Get current user"),
                    ("PUT", "/api/v1/core/users/me/", "Update current user"),
                ],
            ),
            (
                "Courses",
                [
                    ("GET", "/api/v1/core/courses/", "List courses"),
                    ("POST", "/api/v1/core/courses/", "Create course"),
                    ("GET", "/api/v1/core/courses/{id}/", "Get course details"),
                    ("PUT", "/api/v1/core/courses/{id}/", "Update course"),
                    ("DELETE", "/api/v1/core/courses/{id}/", "Delete course"),
                ],
            ),
            (
                "Rubrics",
                [
                    ("GET", "/api/v1/core/rubrics/", "List rubrics"),
                    ("POST", "/api/v1/core/rubrics/", "Create rubric"),
                    ("GET", "/api/v1/core/rubrics/{id}/", "Get rubric details"),
                    ("PUT", "/api/v1/core/rubrics/{id}/", "Update rubric"),
                    ("DELETE", "/api/v1/core/rubrics/{id}/", "Delete rubric"),
                ],
            ),
            (
                "Tasks",
                [
                    ("GET", "/api/v1/core/tasks/", "List tasks"),
                    ("POST", "/api/v1/core/tasks/", "Create task"),
                    ("GET", "/api/v1/core/tasks/{id}/", "Get task details"),
                    ("PUT", "/api/v1/core/tasks/{id}/", "Update task"),
                    ("DELETE", "/api/v1/core/tasks/{id}/", "Delete task"),
                ],
            ),
            (
                "Submissions",
                [
                    ("GET", "/api/v1/core/submissions/", "List submissions"),
                    ("POST", "/api/v1/core/submissions/", "Create submission"),
                    ("GET", "/api/v1/core/submissions/{id}/", "Get submission details"),
                ],
            ),
            (
                "Feedback",
                [
                    ("POST", "/api/v1/ai-feedback/generate/", "Generate AI feedback"),
                    ("GET", "/api/v1/ai-feedback/status/{id}/", "Check feedback status"),
                ],
            ),
        ]

        for group_name, endpoints in endpoint_groups:
            output.append(f"### {group_name}\n\n")
            output.append("| Method | Endpoint | Summary |\n")
            output.append("|--------|----------|---------|\n")
            for method, path, summary in endpoints:
                output.append(f"| {method} | `{path}` | {summary} |\n")
            output.append("\n")

        output.append("---\n\n")
        output.append(
            "**Note**: This is a template. Start the backend server and run `python scripts/generate-docs.py` to generate actual documentation.\n"
        )

        return "".join(output)

    def _parse_openapi_schema(self, schema: dict) -> list[str]:
        """Parse OpenAPI 3.0 schema and generate comprehensive documentation."""
        output = []

        paths = schema.get("paths", {})
        components = schema.get("components", {})
        security_schemes = components.get("securitySchemes", {})
        tags = schema.get("tags", [])

        # Build tag name mapping
        tag_names = {}
        tag_descriptions = {}
        for tag in tags:
            tag_names[tag.get("name", "")] = tag.get("description", "")
            tag_descriptions[tag.get("name", "")] = tag.get("description", "")

        # Group endpoints by tag
        endpoints_by_tag = {}
        for path, methods in paths.items():
            for method, details in methods.items():
                if method.upper() in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
                    method_upper = method.upper()
                    endpoint_tag = details.get("tags", ["Other"])[0]

                    # Extract additional information
                    request_schema = self._extract_request_body_info(details, components)
                    responses = self._extract_response_info(details, components)
                    auth_requirements = self._extract_security_requirements(
                        details, security_schemes
                    )

                    endpoint_info = {
                        "method": method_upper,
                        "path": path,
                        "summary": details.get("summary", ""),
                        "description": details.get("description", ""),
                        "operation_id": details.get("operationId", ""),
                        "request_schema": request_schema,
                        "responses": responses,
                        "auth_requirements": auth_requirements,
                        "deprecated": details.get("deprecated", False),
                    }

                    if endpoint_tag not in endpoints_by_tag:
                        endpoints_by_tag[endpoint_tag] = []
                    endpoints_by_tag[endpoint_tag].append(endpoint_info)

        # Authentication section first
        output.append("## Authentication\n\n")
        output.append(
            "All API endpoints require authentication. The API uses token-based authentication:\n\n"
        )
        output.append("```bash\n")
        output.append("Authorization: Token <your-access-token>\n")
        output.append("```\n\n")

        # Available security schemes
        if security_schemes:
            output.append("### Supported Authentication Methods\n\n")
            output.append("| Scheme | Type | Description |\n")
            output.append("|--------|------|-------------|\n")
            for name, scheme in security_schemes.items():
                scheme_type = scheme.get("type", "")
                description = scheme.get("description", "")
                if scheme_type == "http":
                    scheme_scheme = scheme.get("scheme", "")
                    if scheme_scheme == "bearer":
                        output.append(f"| {name} | Bearer Token | {description} |\n")
                    else:
                        output.append(f"| {name} | HTTP ({scheme_scheme}) | {description} |\n")
                elif scheme_type == "apiKey":
                    param_name = scheme.get("name", "")
                    param_in = scheme.get("in", "header")
                    output.append(f"| {name} | API Key ({param_in}) | {description} |\n")
                elif scheme_type == "oauth2":
                    output.append(f"| {name} | OAuth2 | {description} |\n")
                else:
                    output.append(f"| {name} | {scheme_type} | {description} |\n")
            output.append("\n")

        output.append("## Endpoints\n\n")

        # Known tags to display in logical order
        tag_order = [
            "Authentication",
            "Users",
            "Courses",
            "Classes",
            "Units",
            "Tasks",
            "Rubrics",
            "Submissions",
            "Feedback",
            "Analytics",
            "Other",
        ]

        # Render endpoints by tag
        rendered_tags = set()
        for tag in tag_order:
            if tag in endpoints_by_tag:
                rendered_tags.add(tag)
                endpoints = endpoints_by_tag[tag]
                output.append(f"### {tag}\n\n")

                tag_description = tag_descriptions.get(tag, "")
                if tag_description:
                    output.append(f"{tag_description}\n\n")

                # Generate summary table
                output.append("| Method | Endpoint | Summary | Auth |\n")
                output.append("|--------|----------|---------|------|\n")
                for ep in sorted(endpoints, key=lambda x: (x["path"], x["method"])):
                    method = ep["method"]
                    path = ep["path"]
                    summary = ep.get("summary", "") or ""
                    auth = ep.get("auth_requirements", ["None"])[0]
                    if ep.get("deprecated"):
                        method = f"~~{method}~~"
                    output.append(f"| {method} | `{path}` | {summary} | {auth} |\n")
                output.append("\n")

                # Detailed endpoint documentation
                output.append("**Endpoint Details**\n\n")
                output.extend(
                    self._generate_endpoint_details(endpoints, components, security_schemes)
                )

        # Handle any remaining tags not in the known order
        for tag, endpoints in sorted(endpoints_by_tag.items()):
            if tag not in rendered_tags:
                output.append(f"### {tag}\n\n")

                tag_description = tag_descriptions.get(tag, "")
                if tag_description:
                    output.append(f"{tag_description}\n\n")

                output.append("| Method | Endpoint | Summary | Auth |\n")
                output.append("|--------|----------|---------|------|\n")
                for ep in sorted(endpoints, key=lambda x: (x["path"], x["method"])):
                    method = ep["method"]
                    path = ep["path"]
                    summary = ep.get("summary", "") or ""
                    auth = ep.get("auth_requirements", ["None"])[0]
                    if ep.get("deprecated"):
                        method = f"~~{method}~~"
                    output.append(f"| {method} | `{path}` | {summary} | {auth} |\n")
                output.append("\n")

                output.append("**Endpoint Details**\n\n")
                output.extend(
                    self._generate_endpoint_details(endpoints, components, security_schemes)
                )

        # Standard error codes section
        output.append("## Error Responses\n\n")
        output.append("All API errors follow this format:\n\n")
        output.append("```json\n")
        output.append(
            '{\n  "error": {\n    "code": "ERROR_CODE",\n    "message": "Human-readable error message"\n  }\n}\n'
        )
        output.append("```\n\n")

        output.append("### Common Error Codes\n\n")
        output.append("| Code | HTTP Status | Description |\n")
        output.append("|------|-------------|-------------|\n")
        output.append("| authentication_failed | 401 | Invalid or missing authentication |\n")
        output.append("| permission_denied | 403 | User lacks permission for this action |\n")
        output.append("| not_found | 404 | Resource not found |\n")
        output.append("| validation_error | 400 | Invalid request data |\n")
        output.append("| rate_limit_exceeded | 429 | Too many requests |\n")
        output.append("\n")

        return output

    def generate(self) -> bool:
        """Main documentation generation workflow."""
        logger.info("Starting documentation generation...")

        # Test Django connection
        if not self._test_django_connection():
            logger.error("Failed to connect to Django. Cannot generate documentation.")
            return False

        success = True

        # Generate model documentation
        model_file = self.OUTPUT_DIRS["backend_models"] + "/models.md"
        if self._is_current(model_file):
            logger.info(f"Model documentation is current: {model_file}")
        else:
            logger.info(f"Generating model documentation: {model_file}")

            if not self.dry_run:
                # Ensure output directory exists
                output_dir = self.project_root / self.OUTPUT_DIRS["backend_models"]
                output_dir.mkdir(parents=True, exist_ok=True)

                # Generate and save documentation
                model_docs = self._generate_model_documentation()
                output_path = self.project_root / model_file

                with open(output_path, "w") as f:
                    f.write(model_docs)

                logger.info(f"Model documentation generated: {output_path}")

                # Update cache
                self.cache[model_file] = {
                    "timestamp": datetime.now().isoformat(),
                    "source": "django_models",
                }

        # Generate API documentation
        api_file = self.OUTPUT_DIRS["api_reference"] + "/endpoints.md"
        if self._is_current(api_file):
            logger.info(f"API documentation is current: {api_file}")
        else:
            logger.info(f"Generating API documentation: {api_file}")

            if not self.dry_run:
                # Ensure output directory exists
                output_dir = self.project_root / self.OUTPUT_DIRS["api_reference"]
                output_dir.mkdir(parents=True, exist_ok=True)

                # Generate and save documentation
                api_docs = self._generate_api_documentation()
                output_path = self.project_root / api_file

                with open(output_path, "w") as f:
                    f.write(api_docs)

                logger.info(f"API documentation generated: {output_path}")

                # Update cache
                self.cache[api_file] = {
                    "timestamp": datetime.now().isoformat(),
                    "source": "drf_endpoints",
                }

        # Save cache after all operations
        self._save_cache()

        # Generate ERD documentation
        erd_file = "docs/database/erd-diagram.md"
        if self._is_current(erd_file):
            logger.info(f"ERD documentation is current: {erd_file}")
        else:
            logger.info(f"Generating ERD documentation: {erd_file}")

            if not self.dry_run:
                # Ensure output directory exists
                output_dir = self.project_root / "docs/database"
                output_dir.mkdir(parents=True, exist_ok=True)

                # Generate and save ERD documentation
                erd_docs = self._generate_erd_documentation()
                output_path = self.project_root / erd_file

                with open(output_path, "w") as f:
                    f.write(erd_docs)

                logger.info(f"ERD documentation generated: {output_path}")

                # Update cache
                self.cache[erd_file] = {
                    "timestamp": datetime.now().isoformat(),
                    "source": "django_models_erd",
                }
                self._save_cache()

        logger.info("Documentation generation completed.")
        return success


def main():
    """CLI entry point with argparse."""
    parser = argparse.ArgumentParser(
        description="Automated documentation generator for EssayCoach",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                    # Generate all documentation
  %(prog)s --dry-run          # Preview what would be generated
  %(prog)s --verbose          # Enable verbose output
        """,
    )

    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose output")

    parser.add_argument(
        "--dry-run",
        "-n",
        action="store_true",
        help="Preview what would be generated without creating files",
    )

    args = parser.parse_args()

    # Create generator and run
    generator = DocumentationGenerator(verbose=args.verbose, dry_run=args.dry_run)

    success = generator.generate()

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
