# Database Migrations

## 🔄 Migration Strategy Overview

EssayCoach uses Django's built-in migration system with enhanced practices for educational data integrity and zero-downtime deployments.

## 📋 Migration Principles

### Zero-Downtime Philosophy
- **Backward Compatible**: All migrations maintain API compatibility
- **Reversible**: Every migration includes rollback procedures
- **Data Safe**: No destructive operations without backup verification
- **Gradual**: Complex changes broken into multiple smaller migrations

### Educational Data Considerations
- **Student Records**: Never lose educational progress data
- **Audit Trail**: Complete history preservation for compliance
- **Performance**: Optimized for educational analytics queries
- **Privacy**: GDPR-compliant data handling during migrations

## 🚀 Migration Workflow

### Development Process
```bash
# 1. Model changes
# Edit models.py in your Django app

# 2. Create migration
cd backend && uv run python manage.py makemigrations

# 3. Review migration
uv run python manage.py sqlmigrate core 0001_initial

# 4. Test locally
make migrate

# 5. Run tests
make test
```

### Production Deployment
```bash
# 1. Backup database
python manage.py dbbackup --database=default

# 2. Deploy with migration
python manage.py migrate --database=default

# 3. Verify deployment
python manage.py check --deploy

# 4. Monitor application
python manage.py monitor_performance
```

## 📊 Migration Types

### Schema Migrations

#### Adding New Fields
```python
# ai_feedback/migrations/0004_add_confidence_score.py
class Migration(migrations.Migration):
    dependencies = [
        ('ai_feedback', '0003_auto_add_feedback_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='feedback',
            name='confidence_score',
            field=models.FloatField(
                default=0.8,
                validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
                help_text="AI confidence level in this feedback"
            ),
        ),
    ]
```

#### Creating New Models
```python
# essay_submission/migrations/0005_add_essay_version.py
class Migration(migrations.Migration):
    dependencies = [
        ('essay_submission', '0004_auto_add_word_count'),
    ]

    operations = [
        migrations.CreateModel(
            name='EssayVersion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('version_number', models.PositiveIntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('essay', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='essay_submission.essay')),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': [('essay', 'version_number')],
            },
        ),
    ]
```

### Data Migrations

#### Complex Data Transformations
```python
# analytics/migrations/0006_migrate_old_analytics.py
from django.db import migrations

def migrate_old_analytics(apps, schema_editor):
    """Migrate old analytics format to new structure"""
    OldAnalytics = apps.get_model('analytics', 'OldAnalytics')
    NewAnalytics = apps.get_model('analytics', 'Analytics')
    
    for old_record in OldAnalytics.objects.all():
        NewAnalytics.objects.create(
            user=old_record.user,
            metric_type='essay_submission',
            value=old_record.submission_count,
            created_at=old_record.created_at,
            metadata={
                'old_id': old_record.id,
                'migration_source': 'old_analytics'
            }
        )

class Migration(migrations.Migration):
    dependencies = [
        ('analytics', '0005_create_new_analytics_model'),
    ]

    operations = [
        migrations.RunPython(migrate_old_analytics, reverse_code=migrations.RunPython.noop),
    ]
```

#### Educational Data Seeding
```python
# core/migrations/0007_seed_feedback_types.py
from django.db import migrations

def seed_feedback_types(apps, schema_editor):
    """Seed initial feedback types for AI system"""
    FeedbackType = apps.get_model('core', 'FeedbackType')
    
    feedback_types = [
        {
            'name': 'grammar',
            'description': 'Grammar and syntax corrections',
            'weight': 0.25,
            'is_active': True
        },
        {
            'name': 'structure',
            'description': 'Essay structure and organization',
            'weight': 0.30,
            'is_active': True
        },
        {
            'name': 'content',
            'description': 'Content quality and relevance',
            'weight': 0.35,
            'is_active': True
        },
        {
            'name': 'style',
            'description': 'Writing style and clarity',
            'weight': 0.10,
            'is_active': True
        }
    ]
    
    for feedback_type in feedback_types:
        FeedbackType.objects.create(**feedback_type)

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0006_create_feedback_type_model'),
    ]

    operations = [
        migrations.RunPython(seed_feedback_types, reverse_code=migrations.RunPython.noop),
    ]
```

## 🔄 Rollback Procedures

### Safe Rollback Strategy
```bash
# 1. Check current migration state
python manage.py showmigrations

# 2. Backup before rollback
python manage.py dbbackup --database=default

# 3. Rollback specific migration
python manage.py migrate ai_feedback 0002_previous_migration

# 4. Verify data integrity
python manage.py check_integrity

# 5. Test critical functionality
python manage.py test critical_tests/
```

### Rollback Data Migration
```python
# analytics/migrations/0008_rollback_data_cleanup.py
from django.db import migrations

def rollback_analytics_cleanup(apps, schema_editor):
    """Restore accidentally deleted analytics data"""
    Analytics = apps.get_model('analytics', 'Analytics')
    
    # Restore from backup table
    BackupAnalytics = apps.get_model('analytics', 'BackupAnalytics')
    for backup in BackupAnalytics.objects.filter(restore_flag=True):
        Analytics.objects.create(
            user=backup.user,
            metric_type=backup.metric_type,
            value=backup.value,
            created_at=backup.original_created_at
        )

class Migration(migrations.Migration):
    dependencies = [
        ('analytics', '0007_cleanup_old_analytics'),
    ]

    operations = [
        migrations.RunPython(rollback_analytics_cleanup, reverse_code=migrations.RunPython.noop),
    ]
```

## User Model Alignment (Aug 2025)

To align our existing `public."user"` table with Django’s auth expectations and avoid admin/login errors:

- Added Django-compatible columns to `user`: `is_superuser`, `is_staff`, `is_active`, `last_login`, `date_joined` (cold-start via `docker/db/init/00_init.sql`).
- Created M2M join tables for groups and permissions: `core_user_groups`, `core_user_user_permissions`.
- Widened `user_email` to `varchar(254)` for `EmailField` compatibility.
- Bootstrapped default groups and a custom permission `core.view_student_stats`.

Migrations introduced:

- `core/0001_initial.py` – Register `core.User` in migration state (managed=False), enabling `AUTH_USER_MODEL` resolution.
- `core/0002_default_groups.py` – Create default groups and map users by `user_role` into `core_user_groups`.
- `core/0003_add_fk_to_m2m.py` – Add FKs from join tables to `auth_group` and `auth_permission`.
- `core/0004_setup_permissions.py` – Create custom permission and assign group permissions:
  - admin: add/change/delete/view user + view_student_stats
  - lecturer: view user + view_student_stats
  - student: no model-level user perms (own-data enforced in views)
- `core/0005_widen_user_email_len.py` – Safe ALTER to widen `user_email` to 254 if needed.

Startup safeguards:

- `scripts/dev-env/start-backend.sh` ensures admin user, groups, and permissions exist and are properly assigned (idempotent), providing a robust local dev experience.


## 📈 Performance Considerations

### Large Table Migrations

#### Background Processing
```python
# essay_submission/migrations/0009_add_processed_content.py
from django.db import migrations
import django.contrib.postgres.fields

class Migration(migrations.Migration):
    dependencies = [
        ('essay_submission', '0008_essay_processed_flags'),
    ]

    operations = [
        migrations.AddField(
            model_name='essay',
            name='processed_content',
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.TextField(),
                size=None,
                null=True,
                help_text="Tokenized essay content for AI processing"
            ),
        ),
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_essay_processed_content ON essay_submission_essay USING GIN (processed_content);",
            reverse_sql="DROP INDEX IF EXISTS idx_essay_processed_content;"
        ),
    ]
```

#### Batch Processing
```python
# utils/management/commands/migrate_large_table.py
from django.core.management.base import BaseCommand
from django.db import transaction
from essay.models import Essay

class Command(BaseCommand):
    help = 'Migrate large essay table in batches'

    def handle(self, *args, **options):
        batch_size = 1000
        essays = Essay.objects.all()
        total = essays.count()
        
        for i in range(0, total, batch_size):
            batch = essays[i:i+batch_size]
            with transaction.atomic():
                for essay in batch:
                    # Process each essay
                    essay.computed_word_count = len(essay.content.split())
                    essay.save()
            
            self.stdout.write(f"Processed {i+batch_size}/{total} essays")
```

## 🧪 Testing Migrations

### Migration Testing Strategy
```python
# tests/test_migrations.py
from django.test import TestCase, TransactionTestCase
from django.db.migrations.executor import MigrationExecutor
from django.db import connection

class MigrationTestCase(TransactionTestCase):
    def test_feedback_type_migration(self):
        """Test feedback type data migration"""
        executor = MigrationExecutor(connection)
        
        # Migrate to one before target
        executor.migrate([('ai_feedback', '0002_initial')])
        
        # Apply target migration
        executor.migrate([('ai_feedback', '0003_add_feedback_types')])
        
        # Verify data
        from ai_feedback.models import FeedbackType
        self.assertEqual(FeedbackType.objects.count(), 4)
        self.assertTrue(FeedbackType.objects.filter(name='grammar').exists())
```

### Data Integrity Tests
```python
# tests/test_data_integrity.py
from django.test import TestCase
from essay.models import Essay
from users.models import User

class DataIntegrityTestCase(TestCase):
    def test_essay_user_relationship(self):
        """Ensure essay-user relationships are maintained after migrations"""
        user = User.objects.create(username='testuser')
        essay = Essay.objects.create(
            title='Test Essay',
            content='Test content',
            user=user
        )
        
        # Run migrations
        from django.core.management import call_command
        call_command('migrate', verbosity=0)
        
        # Verify relationship
        essay.refresh_from_db()
        self.assertEqual(essay.user, user)
```

## 📊 Monitoring & Alerts

### Migration Health Checks
```python
# monitoring/management/commands/check_migrations.py
from django.core.management.base import BaseCommand
from django.db.migrations.loader import MigrationLoader
from django.db import connections

class Command(BaseCommand):
    help = 'Check migration health and consistency'

    def handle(self, *args, **options):
        connection = connections['default']
        loader = MigrationLoader(connection)
        
        # Check for unapplied migrations
        unapplied = loader.unapplied_migrations
        if unapplied:
            self.stdout.write(
                self.style.ERROR(f'Unapplied migrations: {len(unapplied)}')
            )
            for app, migration in unapplied:
                self.stdout.write(f'  {app}: {migration}')
        else:
            self.stdout.write(self.style.SUCCESS('All migrations applied'))
```

### Database Monitoring
```sql
-- Monitor migration performance
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_tup_upd DESC;
```

## 🔍 Best Practices

### Migration Naming
- Use descriptive names: `0003_add_feedback_confidence_score`
- Include purpose: `0004_populate_default_categories`
- Date-based for complex changes: `20240115_refactor_analytics`

### Code Review Checklist
- [ ] Migration is reversible
- [ ] Data migration has backup strategy
- [ ] Performance impact assessed
- [ ] Educational data integrity maintained
- [ ] Rollback procedure documented
- [ ] Tests updated/added
- [ ] Monitoring alerts configured

### Production Deployment
1. **Staging Verification**
   - Test with production-like data
   - Verify rollback procedures
   - Performance testing

2. **Gradual Rollout**
   - Deploy during low-traffic periods
   - Monitor application metrics
   - Have rollback plan ready

3. **Post-Deployment**
   - Verify data integrity
   - Monitor performance metrics
   - Update documentation
