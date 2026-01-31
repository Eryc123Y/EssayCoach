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
- **Package Management**: uv (Python) and pnpm (Node.js)
- **Database**: PostgreSQL 17 managed via Docker Compose
- **Automation**: Makefile interface for all dev tasks
- **Code Quality**: Ruff, Black, Pyright, Prettier

## 📊 Data Flow Architecture

### Essay Processing Pipeline
```mermaid
flowchart LR
    Start([Student Uploads Essay]) --> Validation[Frontend Validation]
    Validation --> API[Backend API Endpoint]
    API --> Dify[Synchronous Dify Workflow]
    Dify --> Generation[Feedback Generation]
    Generation --> Dashboard[Student Dashboard]
    Dashboard --> Review([Student Reviews Feedback])
```

### AI Integration Architecture (Current)
```mermaid
graph LR
    subgraph "Frontend"
        UI[Essay Analysis Page]
        Service[Dify API Service]
    end
    subgraph "Backend (ai_feedback)"
        View[WorkflowRunView]
        Client[DifyClient]
    end
    subgraph "External"
        DifyPlatform[Dify.ai Workflow]
    end

    UI -- Submit --> Service
    Service -- POST --> View
    View -- Request --> Client
    Client -- Sync Call --> DifyPlatform
    DifyPlatform -- JSON Response --> Client
    Client -- Result --> View
    View -- Response --> Service
    Service -- Display --> UI
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

## 👤 Role-Based Navigation

### Overview

EssayCoach implements role-based navigation to provide users with personalized dashboard experiences based on their role (Student, Lecturer, or Admin). The navigation system filters menu items on the client side using role metadata associated with each navigation item.

### User Roles

| Role      | Description                                  | Typical Users          |
|-----------|----------------------------------------------|------------------------|
| `student` | Can view assignments, submit essays, receive feedback | Enrolled students |
| `lecturer`| Can manage rubrics, view class analytics     | Course instructors, TAs |
| `admin`   | Full system access including user management | System administrators  |

### Navigation Configuration

Navigation items are defined in `frontend/src/constants/data.ts` with a `roles` field that specifies which roles can access each menu item:

```typescript
interface NavItem {
  title: string;
  url: string;
  icon: string;  // Icon identifier from Icons mapping
  isActive: boolean;
  items: NavSubItem[];
  roles?: string[];  // Role-based access control
}

// Example: Rubrics only visible to lecturers and admins
{
  title: 'Rubrics',
  url: '/dashboard/rubrics',
  icon: 'book',
  roles: ['lecturer', 'admin'],
}
```

### Role-Based Menu Matrix

| Menu Item         | Student | Lecturer | Admin |
|-------------------|---------|----------|-------|
| Dashboard         | ✅      | ✅       | ✅    |
| Assignments       | ✅      | ✅       | ✅    |
| Essay Analysis    | ✅      | ✅       | ✅    |
| Rubrics           | ❌      | ✅       | ✅    |
| Library           | ❌      | ✅       | ✅    |
| Analytics         | ❌      | ❌       | ✅    |
| User Management   | ❌      | ❌       | ✅    |

### Backend API: User Classes Endpoint

The frontend retrieves the user's enrolled and assigned classes via a role-aware API endpoint:

**Endpoint**: `GET /api/v1/core/users/me/classes/`

**Response** (Student):
```json
[
  {
    "class_id": 1,
    "unit_name": "Introduction to Computer Science",
    "unit_code": "CS101",
    "class_size": 25
  }
]
```

**Response** (Lecturer):
```json
[
  {
    "class_id": 1,
    "unit_name": "Advanced Essay Writing",
    "unit_code": "ENG301",
    "class_size": 18
  }
]
```

**Response** (Admin):
Returns all classes in the system.

### Implementation Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthContext
    participant Sidebar
    participant Backend

    User->>Frontend: Login
    Frontend->>Backend: POST /api/v1/auth/login/
    Backend-->>Frontend: Tokens + user role
    Frontend->>AuthContext: Set user, role, classes
    
    AuthContext->>Sidebar: user.role, classes
    Sidebar->>Sidebar: Filter navItems by role
    
    Note over Sidebar: Only shows menu items<br/>matching user.role
    
    User->>Sidebar: Navigate to visible menu
    Sidebar->>Frontend: Route change
```

### Class Selection (OrgSwitcher)

Lecturers and students with access to multiple classes can switch between them using the OrgSwitcher component. The selected class context is maintained in the authentication state:

```typescript
// From simple-auth-context.tsx
const { classes, currentClass, setCurrentClass } = useAuth();
// currentClass persists class selection across the session
```

### Related Files

| File                              | Purpose                                      |
|-----------------------------------|----------------------------------------------|
| `frontend/src/constants/data.ts`  | NavItem definitions with roles field         |
| `frontend/src/components/layout/app-sidebar.tsx` | Sidebar with role-based filtering |
| `frontend/src/components/layout/simple-auth-context.tsx` | Auth state management |
| `backend/core/views.py`           | UserClassesViewSet with role-based filtering |
| `backend/core/serializers.py`     | UserClassSerializer for class data           |

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