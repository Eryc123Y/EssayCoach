# EssayCoach Platform: Technical Project Summary

## 1. Project Mandate & Vision

The EssayCoach platform aims to revolutionize writing education through an AI-powered evaluation system. Our core objective is to deliver immediate, multi-dimensional feedback to students on their essay submissions, while providing educators with robust analytical tools for pedagogical research and performance tracking. This will be achieved via a scalable, extensible web application. **Mobile clients will be read-only (viewing data, progress, and history); essay submission is performed exclusively via the web app.**

## 2. Architectural Overview

We will implement a **distributed microservices architecture**, designed for high availability, scalability, and independent deployability of services. The system will operate on an **event-driven** paradigm where appropriate (e.g., for AI evaluations). All services will be **containerized** using Docker and orchestrated via **Kubernetes (K8s)** on Alibaba Cloud.

### Key Architectural Principles:
*   **API-First:** All communication between frontend and backend, and between microservices, will be via well-defined RESTful APIs.
*   **Decoupling:** Services are loosely coupled, communicating primarily through APIs and asynchronous message queues.
*   **Stateless Services:** Where possible, services will be stateless to facilitate horizontal scaling.
*   **Asynchronous Processing:** Long-running or resource-intensive tasks (e.g., AI evaluations) will be processed asynchronously via message queues to maintain responsiveness.
*   **Cloud-Native:** Leveraging Alibaba Cloud's managed services for databases, storage, AI inferencing, and container orchestration.

### High-Level Data Flow:
`Student Web App (Next.js)` <--> `Alibaba Cloud CDN/OSS` <--> `Alibaba Cloud API Gateway` <--> `Core Microservices (FastAPI)` <--> `Alibaba Cloud Message Queue` <--> `AI Worker Services (FastAPI/PAI-EAS)` <--> `ApsaraDB for RDS (PostgreSQL)` / `ApsaraDB for OpenSearch (Vector Search)` / `OSS`

## 3. Core Technical Components & Services

### 3.1 Frontend (Next.js Application)
*   **Framework:** Next.js 15 with React 19 and TypeScript.
*   **State Management:** Zustand for lightweight, modular global state.
*   **Routing:** Next.js App Router.
*   **UI Library:** shadcn/ui (Radix + Tailwind) for a modern, theme-able component set.
*   **CSS Utility:** Tailwind CSS for utility-first styling and design tokens.
*   **API Client:** Axios for HTTP requests.
*   **Build & Deployment:** Production builds will be deployed to **Alibaba Cloud OSS** buckets and served via **Alibaba Cloud CDN** for low-latency access within China.

### 3.2 Backend Microservices (Python / Django)
The backend is built using **Django** with a modular app structure. While initially designed as microservices, the current implementation uses Django's built-in app structure for rapid development. Each Django app handles specific domain responsibilities, with the flexibility to extract into separate services later if needed. We use Django's ORM, admin interface, and REST framework for API development.
*   **User Management Service (UMS):**
    *   **Responsibility:** User authentication (login, registration), authorization (RBAC: Student, Teacher, Admin roles), user profile management.
    *   **Authentication:** JWT-based tokens issued upon successful login. Tokens passed in `Authorization` header for subsequent requests. OAuth2/OpenID Connect for future SSO integration.
    *   **Data Store:** ApsaraDB for RDS (PostgreSQL).
*   **Essay Submission Service (ESS):**
    *   **Responsibility:** Handles essay file uploads, stores essay metadata, and manages revision history **while enforcing a "one submission per student per task" rule (unless the teacher explicitly returns the work for resubmission). After a final grade is issued, students can continue to refine the same essay directly on the platform with AI assistance or consult their teacher — no new submission object is created.**
    *   **File Storage:** Raw essay files (e.g., `.docx`, `.txt`, `.pdf`) stored in **Alibaba Cloud OSS**.
    *   **Metadata Storage:** Essay metadata (title, author, submission date, status, OSS URL) in ApsaraDB for RDS (PostgreSQL).
    *   **Event Trigger:** Upon successful submission, publishes a message to **Alibaba Cloud Message Queue (MQ for RabbitMQ/RocketMQ)**, signaling the AI Evaluation Service to process the essay.
*   **AI Evaluation Service (AES):**
    *   **Responsibility:** The core intelligence hub. This will be a set of worker services consuming messages from the MQ.
    *   **Deployment:** Best deployed on **Alibaba Cloud PAI-EAS (Elastic Accelerated Service)** for efficient GPU/CPU resource scaling and inference management, or as dedicated worker pods within ACK.
    *   **Sub-Modules/Components:**
        *   **Grading Engine:**
            *   **Mechanism:** Implements the RAG pattern.
            *   **Rubric Storage:** Rubric definitions (criteria, descriptions) stored in ApsaraDB for RDS. Rubric criteria, converted into vector embeddings, stored in **ApsaraDB for OpenSearch (Vector Search Edition)**.
            *   **Workflow:**
                1.  Extract essay content from OSS.
                2.  Segment essay into meaningful chunks.
                3.  For each rubric criterion, perform a vector similarity search in OpenSearch to retrieve relevant essay segments.
                4.  Construct an LLM prompt: `Prompt = {Rubric Criterion} + {Retrieved Essay Segments} + {Grading Instructions}`.
                5.  Invoke an LLM (e.g., internally deployed or via API to a compliant LLM like Alibaba Cloud's Tongyi Qianwen, ZhipuAI, etc.) to generate scores and granular feedback for each criterion.
                6.  Store detailed results in ApsaraDB for RDS.
        *   **Fact-Check Module:**
            *   **Mechanism:** LLM-driven claim extraction and external web search.
            *   **Workflow:**
                1.  LLM identifies verifiable factual claims within the essay.
                2.  Generate search queries based on identified claims.
                3.  Execute real-time web searches using a **third-party search API** (e.g., Baidu API, or a proxy for Google Search API if legally compliant and performant within China).
                4.  Parse search results, identify authoritative sources, and cross-reference with essay claims.
                5.  LLM makes a judgment (verified, disputed, unconfirmed) and provides source links.
                6.  Store fact-check results in ApsaraDB for RDS.
        *   **Writing Advisor Module:**
            *   **Mechanism:** LLM-based linguistic analysis and suggestion generation.
            *   **Workflow:**
                1.  Submit essay segments to LLM for grammar, syntax, vocabulary, and style analysis.
                2.  LLM generates context-aware corrections and improvement suggestions (e.g., rephrase passive voice, suggest stronger synonyms, correct grammatical errors).
                3.  Output is an annotated version of the essay with integrated suggestions.
                4.  Store advice in ApsaraDB for RDS.
*   **Analytics & Reporting (analytics app):**
    *   **Responsibility:** Aggregates and processes essay evaluation data for teacher dashboards and research exports.
    *   **Data Source:** Reads directly from ApsaraDB for RDS (PostgreSQL).
    *   **Features:** Provides APIs for:
        *   Class/student performance metrics (average scores, common errors, progress trends).
        *   Individual revision history access.
        *   **Data Anonymization:** Implements robust PII removal and hashing/tokenization for anonymized dataset export.
    *   **Deployment:** Standard Django service on ACK.

### 3.3 Databases & Storage
*   **Relational Database:** **PostgreSQL (local container for development, Alibaba Cloud ApsaraDB for RDS in production)**.
    *   **Purpose:** Sole data store for structured application data: user accounts, essay metadata, evaluation results, rubric definitions, etc.
    *   **Benefits:** Consistency between environments, rich feature set (JSONB, full-text search), strong ecosystem support.
    *   **Migration Strategy:** The same PostgreSQL schema is used from day one. Developers run a containerized PostgreSQL instance locally; staging/production environments point to managed RDS instances. Schema migrations are handled with **Django's built-in migrations**.
*   **Vector Database:** **Alibaba Cloud ApsaraDB for OpenSearch (Vector Search Edition)**.
    *   **Purpose:** High-performance storage and retrieval of vector embeddings for the RAG-based Grading Engine (rubric criteria embeddings, potentially essay segment embeddings for advanced semantic search).
    *   **Benefits:** Optimized for similarity search, scales horizontally.
*   **Object Storage:** **Alibaba Cloud OSS (Object Storage Service)**.
    *   **Purpose:** Durable and scalable storage for raw essay files submitted by students.
    *   **Benefits:** High availability, cost-effective, easily integrated with other Alibaba Cloud services (e.g., CDN).

### 3.4 API Gateway
*   **Product:** **Alibaba Cloud API Gateway**.
*   **Responsibility:** Single entry point for all external client requests. Handles request routing to appropriate microservices, authentication/authorization enforcement, rate limiting, caching, and request/response transformation.
*   **Benefits:** Centralized API management, security, and traffic control.

### 3.5 Asynchronous Messaging
*   **MVP Strategy:** Skip message queue entirely. Use Django's built-in async views + PostgreSQL for lightweight background processing. This allows rapid development while handling basic AI feedback generation.

*   **Future Cloud Deployment:** **Redis + Celery** (leveraging existing Redis stack)
    *   **Responsibility:** Decoupling of essay submission from AI evaluation, scalable AI processing queue, rate limiting for API calls, real-time notifications via WebSockets, and background report generation.
    *   **Benefits:** Improves responsiveness, handles back-pressure, enables horizontal scaling of AI workers, ensures message delivery guarantees (retries, dead-letter queues), while utilizing existing Redis infrastructure.

## 4. Deployment & Infrastructure on Alibaba Cloud

*   **Containerization:** All microservices will be Dockerized. Docker images will be stored in **Alibaba Cloud Container Registry (ACR)**.
*   **Orchestration:** **Alibaba Cloud Container Service for Kubernetes (ACK)** will manage the deployment, scaling, and lifecycle of our containerized microservices.
*   **Networking:** Services will be deployed within a **Virtual Private Cloud (VPC)** for network isolation. **Server Load Balancer (SLB)** instances will distribute traffic to Kubernetes service endpoints.
*   **CI/CD:** Implement automated CI/CD pipelines (e.g., using Jenkins on ECS or GitLab CI/CD) to build Docker images, run tests, and deploy services to ACK upon code commits to `main` branch.
*   **Monitoring & Logging:**
    *   **Alibaba Cloud CloudMonitor:** For infrastructure and service metrics (CPU, memory, network, API latency).
    *   **Alibaba Cloud Log Service (SLS):** Centralized logging from all containers, enabling aggregation, search, and alerts.
*   **Security:**
    *   **Resource Access Management (RAM):** For fine-grained access control to Alibaba Cloud resources.
    *   **Key Management Service (KMS):** For encryption of sensitive data at rest (e.g., database encryption keys).
    *   **Security Groups/Network ACLs:** For network-level access control.

## 5. Development Workflow & Best Practices

*   **Version Control:** Git (GitLab/GitHub for code hosting).
*   **Branching Strategy:** Git Flow or similar.
*   **Code Quality:** Linting (Flake8, Black), type hinting (MyPy), unit/integration/E2E testing for all services.
*   **Documentation:** API documentation (FastAPI auto-generates OpenAPI specs), architectural diagrams, READMEs for each service.
*   **Observability:** Implement structured logging, expose Prometheus-compatible metrics endpoints, consider distributed tracing (e.g., OpenTelemetry integration).
*   **Reproducible Dev Environment:** The entire toolchain (Python, Django, PostgreSQL CLI, Docker, etc.) is pinned and provisioned via **Nix flakes**. Team members simply run `nix develop` to enter an identical shell across macOS, Linux, and CI environments.
*   **Database Migrations:** Utilize Django's built-in migrations for managing database schema changes in a version-controlled manner, ensuring smooth upgrades.

## 6. Scalability & Extensibility

The chosen architecture inherently supports these principles:
*   **Horizontal Scaling:** Microservices and container orchestration (ACK) allow independent scaling of compute resources for each service based on demand.
*   **Loose Coupling:** Facilitates independent development, deployment, and upgrades of individual services. New features can be added as new microservices without affecting existing ones.
*   **Asynchronous Processing:** Prevents bottlenecks from long-running tasks, maintaining high system throughput.
*   **Managed Cloud Services:** Alibaba Cloud's RDS, OSS, OpenSearch, MQ, and PAI-EAS are fully managed, offering elastic scalability without manual intervention from our team.
*   **ORM Layer (Django ORM):** Decouples application logic from specific database implementations, facilitating potential future database changes if required, beyond the PostgreSQL/OpenSearch pair.

This technical blueprint provides a solid foundation for developing the EssayCoach platform, balancing rapid initial development with robust, scalable, and maintainable cloud-native architecture.