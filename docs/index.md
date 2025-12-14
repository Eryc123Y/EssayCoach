# EssayCoach Developer Documentation

Welcome to the technical documentation for EssayCoach, an AI-powered essay coaching platform built with a Next.js frontend and Django backend.

## 🏗️ Architecture Overview

EssayCoach is designed as a modern web application with the following architecture:

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS with shadcn/ui components
- **Backend**: Django REST Framework with PostgreSQL database
- **Development Environment**: Nix flakes for reproducible builds
- **Deployment**: Docker containers with CI/CD pipelines

## 🚀 Quick Start for Developers

### Environment Setup
Enter the development environment:
```bash
nix develop
```

This sets up:
- PostgreSQL database with schema and mock data
- Django development environment
- Frontend development tools (Node.js, pnpm, Next.js)
- All documentation tools (MkDocs, material theme)

### Start Documentation Server
```bash
mkdocs serve --dev-addr=0.0.0.0:8000
```
Visit http://localhost:8000 to view the documentation locally.

## 📁 Documentation Structure

This documentation is organized for developers and contributors:

- **Architecture & Design**: System design decisions and technical specifications
- **Database Schema**: Complete database design with relationships and constraints
- **Backend Deep Dive**: Django models, serializers, views, and async processing
- **Frontend Architecture**: Next.js component structure and state management
- **API Reference**: REST endpoints and WebSocket events
- **Development Guide**: Setup instructions and contribution guidelines

## 🔄 Development Workflow

1. Make changes to documentation in the `docs/` directory
2. Test locally with `mkdocs serve`
3. Submit PR to main branch
4. Documentation automatically deploys to GitHub Pages on merge

## 📊 Technical Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js + React + TypeScript | Server-rendered React UI |
| Backend | Django REST Framework | RESTful API server |
| Database | PostgreSQL | Primary data store |
| Dev Environment | Nix flakes | Reproducible builds |
| Documentation | MkDocs Material | Technical documentation |
| Testing | Pytest + Jest | Comprehensive test suite |

## 🔗 Useful Links

- [GitHub Repository](https://github.com/your-org/EssayCoach)
- [System Architecture](architecture/system-architecture.md)
- [Database Design](database/schema-overview.md)
- [Database Configuration](database/configuration.md)
- [API Documentation](api/rest-endpoints.md)