# EssayCoach

EssayCoach is a future-oriented intelligent education platform designed to leverage cutting-edge artificial intelligence technology to provide students with instant, in-depth, multi-dimensional essay feedback, while offering teachers and educational researchers powerful data analysis tools.

## 🚀 Features

### For Students
- **Instant AI Feedback**: Get comprehensive evaluation reports covering grading, fact-checking, and writing advice immediately after submission.
- **Intelligent Grading**: Automated, objective scoring based on teacher-uploaded rubrics using RAG (Retrieval-Augmented Generation).
- **Fact Verification**: AI-driven identification and verification of factual claims against authoritative sources.
- **Writing Advisor**: Specific, actionable suggestions for grammar, syntax, vocabulary enrichment, and logical flow.
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
| **Database** | PostgreSQL 14+ (Primary), Redis (Cache/Queue) |
| **AI/ML** | RAG Architecture, LangChain (Planned) |
| **Dev Environment** | Nix flakes + Overmind |
| **Infrastructure** | Docker + Kubernetes (Alibaba Cloud ACK) |

## ⚡ Quick Start

**Zero-config development with Nix:**

This project uses [Nix](https://nixos.org/) to provide a reproducible development environment.

1. **Enter the development shell:**
   ```bash
   nix develop
   # This automatically sets up Python, Node.js, PostgreSQL, and all dependencies.
   # It also initializes the database and starts the PostgreSQL server.
   ```

2. **Start the application:**
   ```bash
   dev
   # This starts both the Django backend and Next.js frontend using Overmind.
   ```

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - PostgreSQL: localhost:5432

### Alternative: Manual Start

If you prefer to run services individually (must be inside `nix develop` shell):

**Backend:**
```bash
cd backend
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
pnpm install
pnpm dev
```

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
├── scripts/            # Development scripts & Nix hooks
├── flake.nix           # Nix environment definition
└── docker-compose.yml  # Docker Compose for containerized deployment
```

## 🏗 Architecture

EssayCoach follows a **distributed microservices-ready architecture**:

- **Frontend**: A Next.js application served via CDN/Node.js, communicating with the backend via RESTful APIs.
- **Backend**: A Django-based core service handling business logic, data persistence, and API orchestration.
- **AI Engine**: Asynchronous workers (planned: Celery + Redis) processing essay analysis tasks using LLMs and Vector Search.
- **Data Layer**: PostgreSQL for relational data and Vector Database (e.g., OpenSearch) for RAG operations.

For more details, see [System Architecture](docs/architecture/system-architecture.md).

## 🧪 Testing

- **Frontend:**
  ```bash
  cd frontend
  pnpm test
  ```
- **Backend:**
  ```bash
  cd backend
  pytest
  ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.