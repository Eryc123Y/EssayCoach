# EssayCoach

EssayCoach is a future-oriented intelligent education platform designed to leverage cutting-edge artificial intelligence technology to provide students with instant, in-depth, multi-dimensional essay feedback, while offering teachers and educational researchers powerful data analysis tools.

## 🚀 Features

### For Students
- **Instant AI Feedback**: ✅ Get comprehensive evaluation reports covering grading, fact-checking, and writing advice immediately after submission.
- **Intelligent Grading**: ✅ Automated, objective scoring based on teacher-uploaded rubrics using RAG (Retrieval-Augmented Generation).
- **Fact Verification**: AI-driven identification and verification of factual claims against authoritative sources.
- **Writing Advisor**: ✅ Specific, actionable suggestions for grammar, syntax, vocabulary enrichment, and logical flow.
- **Revision History**: Track progress through multiple drafts with version-specific AI feedback.

### For Educators
- **Teacher Dashboard**: Centralized view of class performance, common error types, and progress trends.
- **Rubric Management**: Flexibly create and manage scoring rubrics to guide the AI grading process.
- **In-depth Analysis**: Detailed views of individual student essays and their revision histories.
- **Data Export**: Anonymized data export for academic research and pedagogical evaluation.

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 15 + React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **State Management** | Zustand |
| **Backend** | Python 3.12 + Django 4.x + DRF |
| **Database** | PostgreSQL 17 (Primary), Redis (Cache/Queue) |
| **AI/ML** | RAG Architecture, LangChain (Planned) |
| **Dev Environment** | uv + Docker Compose (PostgreSQL 17) + Makefile |
| **Infrastructure** | Docker + Kubernetes (Alibaba Cloud ACK) |

### 🔑 Environment Variables

The project requires several environment variables to be set for full functionality.

1. **Backend Secrets**: Create a `.env` file in **root** directory (copied from `.env.example`).
   ```bash
   # Django Settings
   DEBUG=True
   SECRET_KEY=your-secret-key-here
   
   # Database (Docker Compose)
   POSTGRES_DB=essaycoach
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_HOST=127.0.0.1
   POSTGRES_PORT=5432

   # Dify AI Integration
   DIFY_API_KEY=your_dify_api_key_here
   DIFY_BASE_URL=https://api.dify.ai/v1
   ```

2. **Frontend Configuration**: Create a `.env.local` file in `frontend/` directory.
   ```bash
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

## ⚡ Quick Start

### Prerequisites

- Python 3.12+
- Node.js 22+
- [uv](https://github.com/astral-sh/uv) (Modern Python package manager)
- Docker and Docker Compose (for PostgreSQL 17)
- pnpm

### Installation & Setup

1. **Install uv**:
```bash
pip install uv
```

2. **Run the one-step installation**:
```bash
# Installs Python/Node dependencies and sets up virtual environments
make install
```

3. **Database Setup**:
```bash
make db        # Start PostgreSQL 17 in Docker
make migrate   # Run Django migrations
make seed-db   # Create admin user and initial test students
```

4. **Launch Development Environment**:
```bash
# Starts both Backend (8000) and Frontend (5100)
make dev
```

### URLs

- **Frontend**: http://127.0.0.1:5100
- **Backend API**: http://127.0.0.1:8000
- **Admin Dashboard**: http://127.0.0.1:8000/admin/


### Common Commands

| Command        | Description                      |
| -------------- | ---------------------------------- |
| `make install`  | Install all dependencies           |
| `make dev`      | Start backend and frontend          |
| `make dev-backend` | Start Django backend only          |
| `make dev-frontend` | Start Next.js frontend only        |
| `make db`       | Start PostgreSQL (Docker)         |
| `make migrate`   | Run Django migrations              |
| `make seed-db`   | Seed database with initial data   |
| `make test`     | Run all tests                     |
| `make lint`     | Run linters                      |
| `make format`   | Format code                       |

## 📂 Project Structure

```
EssayCoach/
├── backend/            # Django backend application
│   ├── essay_coach/    # Project settings
│   ├── core/           # Core functionality & User management
│   └── ...
├── frontend/           # Next.js frontend application
│   ├── src/app/        # App router pages
│   ├── src/components/ # UI components (shadcn/ui)
│   └── ...
├── docker/             # Docker configurations
├── docs/               # Comprehensive documentation
├── scripts/            # Development scripts
├── Makefile            # Project commands
└── docker-compose.yml  # Docker Compose for local development
```

## 🏗 Architecture

EssayCoach follows a **distributed microservices-ready architecture**:

- **Frontend**: A Next.js application served via CDN/Node.js, communicating with backend via RESTful APIs.
- **Backend**: A Django-based core service handling business logic, data persistence, and API orchestration.
- **AI Engine**: Asynchronous workers (planned: Celery + Redis) processing essay analysis tasks using LLMs and Vector Search.
- **Database**: PostgreSQL for relational data (local dev: Docker Compose, production: Cloud).

For more details, see [System Architecture](docs/architecture/system-architecture.md).

## 🧪 Testing

```bash
# Run all tests
make test

# Backend only
cd backend && uv run pytest

# Frontend only
cd frontend && pnpm test
```

## 🤝 Contributing

1. Fork repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under MIT License. See `LICENSE` for more information.
