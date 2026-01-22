# Database Configuration

## 🗄️ Development Database Setup

### PostgreSQL Configuration

The EssayCoach development environment uses PostgreSQL 17 managed via **Docker Compose**.

#### Database Connection
- **Database Name**: `essaycoach`
- **User**: `postgres` (superuser)
- **Password**: `postgres`
- **Host**: `127.0.0.1`
- **Port**: `5432`
- **Connection URL**: `postgresql://postgres:postgres@127.0.0.1:5432/essaycoach`

### Database Initialization

The development environment setup involves:

1. **Starting PostgreSQL**: Run `make db` to start the Docker container.
2. **Applying Migrations**: Run `make migrate` to create/update the schema.
3. **Seeding Data**: Run `make seed-db` to populate mock data.

### Manual Database Operations

#### Accessing the Database
```bash
# Connect to PostgreSQL using project Makefile
make db-shell

# Or using standard psql client
psql -h 127.0.0.1 -U postgres -d essaycoach
```

#### Database Maintenance
```bash
# Restart PostgreSQL container
make db-stop && make db

# Reset database (drops all data and volumes)
make db-reset

# Check database status
make db-status
```

### Environment Variables

The following environment variables are configured for database access in `.env`:

```bash
# Database connection
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=essaycoach
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

### Troubleshooting

#### Common Database Issues

**Connection Refused**
1. Check if Docker is running.
2. Run `make db-status` to verify the container is healthy.
3. Ensure no other service is using port `5432`.

**Permission Denied**
Ensure your `.env` file matches the Docker Compose environment variables. Default user is `postgres`.

**Resetting Data**
If the database state becomes inconsistent, use `make db-reset` to start fresh. **Warning**: This deletes all data in the database.

#### Database Logs
View real-time PostgreSQL logs:
```bash
make docker-logs-pg
```
