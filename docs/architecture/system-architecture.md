# System Architecture

EssayCoach is built as a modern microservices-ready web application with a clear separation between frontend and backend concerns.

## 🏗️ High-Level Architecture

```mermaid
graph LR
    subgraph "Frontend Layer"
        Client[Next.js Web App]
        DevServer[Next.js Dev Server]
    end
    
    subgraph "Backend Layer"
        API[Django REST API]
        Async[Celery Async Tasks]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL Database)]
        Cache[(Redis Cache)]
    end
    
    Client -- REST API --> API
    API -- Read/Write --> DB
    API -- Queue Tasks --> Async
    API -- Cache Data --> Cache
    Async -- Process --> DB
    DevServer -- Fast Refresh --> Client
```

## 🔧 Technology Stack

### Frontend Architecture
- **Framework**: Next.js 15 with React 19
- **Build Tool**: Next.js (Turbopack) for fast development and optimized builds
- **UI Library**: shadcn/ui (Radix + Tailwind) for consistent design system
- **State Management**: Zustand for predictable state
- **Routing**: Next.js App Router with nested routes
- **HTTP Client**: Axios with interceptors
- **Testing**: Jest for unit tests, Playwright for E2E

### Backend Architecture
- **Framework**: Django 4.x with Django REST Framework
- **Database**: PostgreSQL 14+ with advanced features
- **Async Processing**: Celery + Redis for background tasks
- **Authentication**: JWT tokens with refresh mechanism
- **API**: RESTful endpoints following OpenAPI 3.0
- **Testing**: Pytest with factory-boy for fixtures

### Development Environment
- **Package Management**: Nix flakes for reproducible environments
- **Database**: Local PostgreSQL with automatic setup
- **Process Management**: Overmind for concurrent services
- **Code Quality**: Black, Flake8, MyPy, Prettier

## 📊 Data Flow Architecture

### Essay Processing Pipeline
```mermaid
flowchart LR
    Start([Student Uploads Essay]) --> Validation[Frontend Validation]
    Validation --> API[Backend API Endpoint]
    API --> Storage[Database Storage]
    Storage --> Async[Async AI Analysis]
    Async --> Generation[Feedback Generation]
    Generation --> Updates[Real-time Updates]
    Updates --> Dashboard[Student Dashboard]
    Dashboard --> Review([Student Reviews Feedback])
```

### AI Integration Architecture
```mermaid
graph LR
    subgraph "AI Processing Flow"
        ExtAI[External AI Service]
        Queue[Celery Queue]
        Cache[Redis Cache]
        WS[WebSocket Server]
        Worker[Celery Worker]
    end
    subgraph "Data Storage"
        DB[(PostgreSQL)]
        FileStore[File Storage]
    end
    Queue -- Tasks --> Worker
    Worker -- Process --> ExtAI
    ExtAI -- Results --> Worker
    Worker -- Store --> DB
    Worker -- Cache --> Cache
    WS -- Real-time Updates --> Cache
    DB -- Read Cached --> Cache
    Cache -- Serve --> WS
```

## 🚀 Scalability Considerations

### Horizontal Scaling
```mermaid
graph LR
    subgraph "Frontend Layer"
        CDN[CDN / CloudFront]
        Static[Static Assets]
    end
    subgraph "Backend Layer"
        LB[Load Balancer]
        API1[API Instance 1]
        API2[API Instance 2]
        APIN[API Instance N]
    end
    subgraph "Data Layer"
        Master[(PostgreSQL Master)]
        Replica1[(Read Replica 1)]
        Replica2[(Read Replica 2)]
        Redis[(Redis Cluster)]
    end
    CDN -- Serve --> Static
    LB -- Distribute --> API1
    LB -- Distribute --> API2
    LB -- Distribute --> APIN
    API1 -- Write --> Master
    API1 -- Read --> Replica1
    API2 -- Read --> Replica2
    API1 -- Cache --> Redis
    API2 -- Cache --> Redis
```

### Performance Optimizations
```mermaid
graph TD
    subgraph "Optimization Strategies"
        DBOpt[Database Optimization]
        APIOpt[API Optimization]
        FrontOpt[Frontend Optimization]
        CacheOpt[Caching Strategy]
    end
    subgraph "Implementation"
        Indexes[Database Indexes]
        Pagination[API Pagination]
        CodeSplit[Code Splitting]
        RedisCache[Redis Caching]
    end
    DBOpt --> Indexes
    APIOpt --> Pagination
    FrontOpt --> CodeSplit
    CacheOpt --> RedisCache
```

## 🔐 Security Architecture

### Authentication Flow
```mermaid
sequenceDiagram
    participant User as Student/Teacher
    participant Frontend as Next.js App
    participant API as Django REST API
    participant Auth as JWT Auth
    participant DB as PostgreSQL
    
    User->>Frontend: Login Credentials
    Frontend->>API: POST /auth/token/
    API->>Auth: Validate Credentials
    Auth->>DB: Verify User
    DB-->>Auth: User Data
    Auth-->>API: JWT Token + Refresh
    API-->>Frontend: Access + Refresh Tokens
    Frontend->>Frontend: Store Securely
    
    loop Every 15 minutes
        Frontend->>API: POST /auth/refresh/
        API->>Auth: Validate Refresh
        Auth-->>Frontend: New Access Token
    end
```

### Data Protection
```mermaid
graph TB
    subgraph "Security Layers"
        HTTPS[HTTPS/TLS]
        Encryption[Encryption at Rest]
        Validation[Input Validation]
        RateLimit[Rate Limiting]
    end
    subgraph "Implementation"
        SSL[SSL Certificates]
        PGCrypto[PostgreSQL Crypto]
        DRFValidation[Django DRF Validation]
        Throttle[API Throttling]
    end
    HTTPS --> SSL
    Encryption --> PGCrypto
    Validation --> DRFValidation
    RateLimit --> Throttle
```

## 🧪 Testing Strategy

### Testing Architecture
```mermaid
graph TD
    subgraph "Testing Pyramid"
        Unit[Unit Tests]
        Integration[Integration Tests]
        E2E[E2E Tests]
    end
    subgraph "Backend"
        Pytest[Pytest 90%+ Coverage]
        APITest[API Endpoint Tests]
        LoadTest[Load Tests]
        Locust[Locust Load Testing]
    end
    subgraph "Frontend"
        Jest[Jest + Testing Library]
        Playwright[Playwright E2E]
        PerfTest[Performance Tests]
        Lighthouse[Lighthouse Performance]
    end
    Unit --> Pytest
    Unit --> Jest
    Integration --> APITest
    E2E --> Playwright
    LoadTest --> Locust
    PerfTest --> Lighthouse
```

### Performance Testing
```mermaid
graph LR
    subgraph "Testing Tools"
        Locust[Locust Load Testing]
        K6[K6 Stress Testing]
        APM[Application Performance Monitoring]
    end
    subgraph "Monitoring"
        Prometheus[Prometheus Metrics]
        Grafana[Grafana Dashboards]
        Alerts[Automated Alerts]
    end
    Locust --> APM
    K6 --> APM
    Prometheus --> Grafana
    Grafana --> Alerts
```

## 📈 Monitoring & Observability

### Monitoring Architecture
```mermaid
graph TB
    subgraph "Observability Stack"
        Logging[Structured Logging]
        Metrics[Application Metrics]
        Tracing[Distributed Tracing]
    end
    subgraph "Tools"
        ELK[ELK Stack]
        Prometheus[Prometheus]
        Jaeger[Jaeger Tracing]
    end
    subgraph "Visualization"
        Grafana[Grafana Dashboards]
        Kibana[Kibana Logs]
        Alerts[Alert Manager]
    end
    Logging --> ELK
    Metrics --> Prometheus
    Tracing --> Jaeger
    Prometheus --> Grafana
    ELK --> Kibana
    Grafana --> Alerts
```

### Infrastructure Monitoring
```mermaid
graph LR
    subgraph "Infrastructure"
        K8s[Kubernetes]
        Health[Health Checks]
        Backup[Automated Backups]
        Recovery[Disaster Recovery]
    end
    subgraph "Auto-Scaling"
        HPA[Horizontal Pod Autoscaler]
        VPA[Vertical Pod Autoscaler]
        Cluster[Cluster Autoscaler]
        AutoScale[Auto-Scaling Actions]
    end
    K8s --> Health
    Health --> HPA
    HPA --> AutoScale
    Backup --> Recovery
```