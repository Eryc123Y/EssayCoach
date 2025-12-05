# Database Configuration

## 🗄️ Development Database Setup

### PostgreSQL Configuration

The EssayCoach development environment uses PostgreSQL with simplified authentication for development purposes:

#### Database Connection
- **Database Name**: `essaycoach`
- **User**: `postgres` (superuser)
- **Password**: `postgres`
- **Host**: `localhost`
- **Port**: `5432`
- **Connection URL**: `postgresql://postgres:postgres@localhost:5432/essaycoach`

#### Why Use PostgreSQL Superuser?

Using the `postgres` superuser in development provides several benefits:

1. **Simplified Setup**: No need to create separate database users
2. **Full Permissions**: Complete access for schema modifications and migrations
3. **Development Efficiency**: Eliminates permission-related issues during development
4. **Consistent Environment**: All developers use the same database configuration

#### Production Considerations

⚠️ **Important**: The superuser configuration is intended for development only. In production:

- Use dedicated application users with limited privileges
- Implement proper role-based access control
- Use strong, randomly generated passwords
- Configure SSL/TLS for database connections
- Implement connection pooling and monitoring

### Database Initialization

The development environment automatically:

1. **Starts PostgreSQL**: Using the nix-provided PostgreSQL service
2. **Creates Database**: Creates the `essaycoach` database if it doesn't exist
3. **Applies Migrations**: Runs Django migrations to create/update the schema (`python manage.py migrate`)
4. **Seeds Data**: Populates the database with mock data using the seed command (`python manage.py seed_db`)

### Manual Database Operations

#### Accessing the Database
```bash
# Connect to PostgreSQL using psql
nix develop --command psql -d essaycoach

# Or using the full connection string
psql postgresql://postgres:postgres@localhost:5432/essaycoach
```

#### Database Maintenance
```bash
# Restart PostgreSQL
nix develop --command postgres-restart

# Reset database (drops and recreates)
nix develop --command db-reset

# Check database status
nix develop --command pg_isready
```

### Environment Variables

The following environment variables are configured for database access:

```bash
# Database connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/essaycoach
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=essaycoach
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# PostgreSQL data directory
PGDATA=/path/to/project/.dev_pg
PGHOST=localhost
```

### Migration Strategy

#### Django Migrations
- **Automatic**: Django handles schema changes via migrations
- **Safe**: Migrations are applied in controlled manner
- **Reversible**: All migrations can be rolled back if needed
- **Database Trigger Management**: Custom migrations (e.g., `0002_triggers.py`) handle database triggers and functions.

#### Manual Schema Changes
Schema changes should primarily be done through Django models and migrations. Direct SQL modifications are discouraged to maintain consistency between the code and the database.

### Troubleshooting

#### Common Database Issues

**Connection Refused**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Restart PostgreSQL if needed
nix develop --command postgres-restart
```

**Permission Denied**
```bash
# Ensure you're using the postgres superuser
psql -U postgres -d essaycoach
```

**Database Already Exists**
```bash
# Drop and recreate database
dropdb -U postgres essaycoach
createdb -U postgres essaycoach
```

#### Database Logs

PostgreSQL logs are available in the development environment:

```bash
# View PostgreSQL logs
nix develop --command tail-pg-logs
```

### Backup and Recovery

#### Development Backups
```bash
# Create a backup
pg_dump -U postgres -d essaycoach > backup.sql

# Restore from backup
psql -U postgres -d essaycoach < backup.sql
```

#### Schema Documentation
- Current schema: `docs/database/schema-overview.md`
- Migration files: `backend/core/migrations/`
- Seed data logic: `backend/core/management/commands/seed_db.py`
