# EssayCoach Deployment Guide

This document provides comprehensive guidance for deploying EssayCoach to production environments.

## 🚀 Overview

EssayCoach is a modern web application with the following components:

| Component      | Technology        | Description                        |
|----------------|-------------------|------------------------------------|
| Frontend       | Next.js 15        | React-based web UI                 |
| Backend        | Django 4.2        | REST API server                    |
| Database       | PostgreSQL 17     | Primary data store                 |
| AI Engine      | Dify/LangChain    | Essay feedback generation          |
| Web Server     | Nginx             | Reverse proxy and static files     |
| Containerization | Docker/Kubernetes | Application packaging              |

---

## 🐳 Docker Deployment

### Prerequisites

- Docker Engine 24+
- Docker Compose v2
- At least 4GB RAM available
- 10GB disk space

### Docker Compose Configuration

Create a `docker-compose.prod.yml` file:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: essaycoach-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-essaycoach}
      POSTGRES_USER: ${POSTGRES_USER:-essayadmin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-securepassword}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-essayadmin}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: essaycoach-backend
    restart: unless-stopped
    environment:
      DEBUG: "false"
      SECRET_KEY: ${SECRET_KEY}
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: ${POSTGRES_DB:-essaycoach}
      POSTGRES_USER: ${POSTGRES_USER:-essayadmin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-securepassword}
      DIFY_API_KEY: ${DIFY_API_KEY}
      DIFY_BASE_URL: ${DIFY_BASE_URL:-https://api.dify.ai/v1}
    depends_on:
      postgres:
        condition: service_healthy
    command: >
      sh -c "python manage.py migrate --noinput &&
             gunicorn essay_coach.wsgi:application --bind 0.0.0.0:8000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: essaycoach-frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    container_name: essaycoach-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - frontend_dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  frontend_dist:

networks:
  default:
    name: essaycoach-network
```

### Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name essaycoach.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name essaycoach.com;

        # SSL configuration (use Let's Encrypt in production)
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

        # Frontend static files
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health/ {
            proxy_pass http://backend/health/;
        }
    }
}
```

---

## ☁️ Cloud Deployment (Kubernetes)

### Helm Chart Structure

```
essaycoach-chart/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── namespace.yaml
│   ├── postgres StatefulSet.yaml
│   ├── postgres Service.yaml
│   ├── backend Deployment.yaml
│   ├── backend Service.yaml
│   ├── frontend Deployment.yaml
│   ├── frontend Service.yaml
│   ├── nginx Ingress.yaml
│   └── configmap.yaml
```

### values.yaml Example

```yaml
global:
  imageRegistry: docker.io
  imagePullSecrets: regcred

postgres:
  enabled: true
  storageSize: 20Gi
  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 1Gi
      cpu: 500m

backend:
  replicaCount: 2
  resources:
    requests:
      memory: 512Mi
      cpu: 500m
    limits:
      memory: 1Gi
      cpu: 1000m
  env:
    DIFY_API_KEY: "your-api-key"
    DIFY_BASE_URL: "https://api.dify.ai/v1"

frontend:
  replicaCount: 3
  resources:
    requests:
      memory: 256Mi
      cpu: 100m
    limits:
      memory: 512Mi
      cpu: 250m

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: essaycoach.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: essaycoach-tls
      hosts:
        - essaycoach.com
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

EssayCoach uses GitHub Actions for continuous integration and deployment.

#### Main CI Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_USER: postgres
          POSTGRES_DB: test_essaycoach
        ports:
          - 5432:5432
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5 with: python-version: "3.12"
      - name: Install uv
        run: pip install uv
      - name: Cache uv
        uses: actions/cache@v4 with:
          path: ~/.cache/uv, .venv
          key: ${{ runner.os }}-uv-${{ hashFiles('backend/pyproject.toml') }}
      - name: Install dependencies
        run: cd backend && uv venv && uv pip install -e .
      - name: Run migrations
        env:
          POSTGRES_HOST: localhost
          POSTGRES_PORT: ${{ job.services.postgres.ports[5432] }}
        run: cd backend && uv run python manage.py migrate --noinput
      - name: Run tests
        env:
          POSTGRES_HOST: localhost
          POSTGRES_PORT: ${{ job.services.postgres.ports[5432] }}
        run: cd backend && uv run pytest
      - name: Run type checking
        run: cd backend && uv run pyright .
      - name: Run linting
        run: cd backend && uv run ruff check .

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 with:
          node-version: "22"
          cache: "pnpm"
      - uses: pnpm/action-setup@v2 with:
          version: 10
      - name: Install dependencies
        run: cd frontend && pnpm install
      - name: Run linter
        run: cd frontend && pnpm lint
      - name: Run tests
        run: cd frontend && pnpm test
      - name: Build
        run: cd frontend && pnpm build
```

#### Type Checking Workflow (`.github/workflows/pyright-check.yml`)

```yaml
name: pyright Type Checking

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  pyright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4 with:
          enable-cache: true
      - name: Install dependencies
        run: uv sync && uv sync --no-dev
      - name: Run pyright type checking
        run: uv run pyright .
```

#### Documentation Deployment (`.github/workflows/deploy-docs-on-main.yml`)

```yaml
name: Deploy Documentation

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  deploy-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5 with:
          python-version: "3.12"
      - name: Install MkDocs
        run: pip install mkdocs mkdocs-material
      - name: Deploy docs
        run: mkdocs gh-deploy --force
```

---

## 🔐 Environment Variables

### Required Variables

| Variable           | Description                          | Example                          |
|--------------------|--------------------------------------|----------------------------------|
| `SECRET_KEY`       | Django secret key (keep secure)      | `django-insecure-abc123...`      |
| `POSTGRES_PASSWORD`| Database password                    | `secure-password-here`           |
| `DIFY_API_KEY`     | Dify AI API key                      | `sk-...`                         |
| `DIFY_BASE_URL`    | Dify API endpoint                    | `https://api.dify.ai/v1`         |

### Optional Variables

| Variable           | Description                          | Default                          |
|--------------------|--------------------------------------|----------------------------------|
| `DEBUG`            | Django debug mode                    | `false`                          |
| `POSTGRES_HOST`    | Database host                        | `localhost`                      |
| `POSTGRES_PORT`    | Database port                        | `5432`                           |
| `POSTGRES_DB`      | Database name                        | `essaycoach`                     |
| `POSTGRES_USER`    | Database user                        | `essayadmin`                     |
| `ALLOWED_HOSTS`    | comma-separated allowed hosts        | `*` (configure for production)   |

---

## 📊 Health Checks

### Backend Health Endpoint

```
GET /health/
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected"
}
```

### Database Health

```bash
# Check PostgreSQL connection
pg_isready -h localhost -p 5432 -U postgres
```

---

## 🔒 Security Checklist

- [ ] Use HTTPS in production (SSL/TLS certificates)
- [ ] Set `DEBUG=false` in production
- [ ] Use strong `SECRET_KEY` (at least 50 characters)
- [ ] Configure `ALLOWED_HOSTS` with actual domain names
- [ ] Use secure password for PostgreSQL
- [ ] Enable CORS only for trusted origins
- [ ] Set up rate limiting for API endpoints
- [ ] Configure firewall rules (block unnecessary ports)
- [ ] Set up regular database backups
- [ ] Enable audit logging
- [ ] Use secrets management (Vault, AWS Secrets Manager, etc.)

---

## 📈 Monitoring

### Recommended Monitoring Stack

| Tool              | Purpose                              |
|-------------------|--------------------------------------|
| Prometheus        | Metrics collection                   |
| Grafana           | Metrics visualization                |
| ELK Stack         | Log aggregation                      |
| Sentry            | Error tracking                       |
| Uptime Robot      | Uptime monitoring                    |

### Key Metrics to Monitor

- API response times (p95, p99)
- Error rates (5xx, 4xx)
- Database connection pool usage
- CPU and memory utilization
- Queue length (if using async processing)
- AI feedback generation latency

---

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check PostgreSQL logs
docker logs essaycoach-db

# Verify connection
psql -h localhost -U postgres -d essaycoach
```

#### 502 Bad Gateway (Nginx)

```bash
# Check backend container logs
docker logs essaycoach-backend

# Check if backend is responding
curl http://localhost:8000/health/
```

#### CORS Errors

Ensure the backend CORS configuration includes the frontend origin:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
]
```

---

## 📚 Related Documentation

- [System Architecture](../architecture/system-architecture.md)
- [Environment Setup](../development/environment-setup.md)
- [Configuration Guide](../development/configuration.md)
- [API Endpoints](API_ENDPOINTS.md)
- [Troubleshooting](../troubleshooting/2026-01-fixes.md)
