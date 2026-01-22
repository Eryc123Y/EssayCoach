# Docker Setup

## Local Development

### Prerequisites
- Docker
- Docker Compose

### Start PostgreSQL

From project root:
```bash
make db
```

Or directly:
```bash
docker compose up -d postgres
```

### Check Status

```bash
make db-status
```

Or:
```bash
docker compose ps
```

### Access Database Shell

```bash
make db-shell
```

Or:
```bash
docker compose exec postgres psql -U postgres -d essaycoach
```

### Reset Database

```bash
make db-reset
```

Or:
```bash
docker compose down -v
docker compose up -d postgres
```

### View Logs

```bash
make docker-logs-pg
```

Or:
```bash
docker compose logs -f postgres
```

### Configuration

PostgreSQL settings in `docker-compose.yml`:
- Image: postgres:17
- Port: 5432
- Database: essaycoach
- User: postgres
- Password: postgres

Data is persisted in Docker volume `pg_data`.

### Production Note

In production, this project will use cloud PostgreSQL. This Docker configuration is for local development only.
