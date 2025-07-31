# EssayCoach Developer Documentation

Welcome to the technical documentation for EssayCoach, an AI-powered essay coaching platform built with Vue 3 frontend and Django backend.

## 🏗️ Architecture Overview

EssayCoach is designed as a modern web application with the following architecture:

- **Frontend**: Vue 3 + TypeScript + Vite with Naive UI components
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
- Frontend development tools (Node.js, pnpm, Vite)
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
- **Frontend Architecture**: Vue 3 component structure and state management
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
| Frontend | Vue 3 + TypeScript | Modern reactive UI |
| Backend | Django REST Framework | RESTful API server |
| Database | PostgreSQL | Primary data store |
| Dev Environment | Nix flakes | Reproducible builds |
| Documentation | MkDocs Material | Technical documentation |
| Testing | Pytest + Vitest | Comprehensive test suite |

## 🔗 Useful Links

- [GitHub Repository](https://github.com/your-org/EssayCoach)
- [System Architecture](architecture/system-architecture.md)
- [Database Design](database/schema-overview.md)
- [API Documentation](api/rest-endpoints.md)