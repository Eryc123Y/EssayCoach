# API Specification

## 🚀 API Overview

EssayCoach provides a comprehensive RESTful API built with Django REST Framework, designed for educational applications with AI-powered essay feedback capabilities.

## 📋 Authentication

### JWT Token Authentication
```http
POST /api/auth/token/
Content-Type: application/json

{
  "username": "student@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "student@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Token Refresh
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## 📊 Core Endpoints

### Essay Management

#### List User Essays
```http
GET /api/essays/
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `status` (optional): pending, processing, completed, failed
- `category` (optional): essay category ID
- `page` (optional): pagination page number
- `page_size` (optional): items per page (default: 20)

**Response:**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/essays/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "The Impact of Technology on Education",
      "content": "Essay content here...",
      "category": {
        "id": 1,
        "name": "Technology",
        "description": "Essays about technology and its impact"
      },
      "status": "completed",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:35:00Z",
      "feedback_count": 3,
      "overall_score": 85.5
    }
  ]
}
```

#### Create Essay Submission
```http
POST /api/essays/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "The Future of AI in Education",
  "content": "Full essay content here...",
  "category": 1,
  "word_count": 1200,
  "academic_level": "undergraduate"
}
```

#### Get Essay Details
```http
GET /api/essays/{id}/
Authorization: Bearer {access_token}
```

#### Update Essay
```http
PUT /api/essays/{id}/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Updated Essay Title",
  "content": "Updated content...",
  "category": 2
}
```

### Feedback System

#### Get Essay Feedback
```http
GET /api/essays/{essay_id}/feedback/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "type": "grammar",
      "score": 8.5,
      "max_score": 10,
      "feedback": "Good grammar overall, but watch for comma splices...",
      "suggestions": [
        {
          "original": "However the results were significant.",
          "suggested": "However, the results were significant.",
          "explanation": "Add comma after introductory word"
        }
      ],
      "highlighted_text": "However the results were significant.",
      "start_index": 156,
      "end_index": 189,
      "created_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

#### Request New AI Feedback
```http
POST /api/essays/{essay_id}/analyze/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "message": "AI analysis started",
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "estimated_completion": "2024-01-15T10:40:00Z"
}
```

### Analytics Dashboard

#### User Analytics
```http
GET /api/analytics/user/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total_essays": 25,
  "average_score": 82.3,
  "essays_this_month": 5,
  "improvement_trend": "+5.2",
  "categories": {
    "technology": 10,
    "literature": 8,
    "science": 7
  },
  "recent_activity": [
    {
      "date": "2024-01-15",
      "essays_submitted": 2,
      "average_score": 85.5
    }
  ]
}
```

#### Educator Reports
```http
GET /api/analytics/educator/
Authorization: Bearer {access_token}
```

*(Admin/Educator users only)*

## 🔄 API Architecture Flow

### Request Lifecycle
```mermaid
sequenceDiagram
    participant Client as Next.js Client
    participant API as Django REST API
    participant JWT as JWT Authentication
    participant Models as Django Models
    participant DB as PostgreSQL
    participant Cache as Redis Cache
    participant Async as Celery Worker
    participant AI as External AI Service
    
    Client->>API: HTTP Request + JWT Token
    API->>JWT: Validate Token
    JWT->>Cache: Check Cache
    alt Cache Hit
        Cache-->>API: Cached Response
    else Cache Miss
        API->>Models: ORM Query
        Models->>DB: SQL Query
        DB-->>Models: Data
        Models->>Async: Trigger Async Task (if needed)
        Async->>AI: Send to AI Service
        AI-->>Async: AI Results
        Async->>DB: Store Results
        Models-->>API: Processed Data
        API->>Cache: Cache Response
    end
    API-->>Client: JSON Response
```

### Authentication Flow
```mermaid
flowchart TD
    subgraph "Authentication Process"
        Login[User Login] --> Validate[Validate Credentials]
        Validate --> Generate[Generate JWT Token]
        Generate --> Store[Store Token Securely]
        Store --> Access[Access Protected Resources]
    end
    subgraph "Token Management"
        Access --> Check{Token Valid?}
        Check -- Yes --> Proceed[Proceed with Request]
        Check -- No --> Refresh[Refresh Token]
        Refresh --> NewToken[New Access Token]
    end
```

### Essay Submission Flow
```mermaid
sequenceDiagram
    participant Student
    participant Frontend
    participant API as API Gateway
    participant EssaySvc as Essay Service
    participant Storage as File Storage
    participant Queue as Message Queue
    participant Worker as Async Worker
    participant AI as AI Service
    participant Notifier as Notification Service
    
    Student->>Frontend: Upload Essay
    Frontend->>Frontend: Client-side Validation
    Frontend->>API: POST /api/essays/
    API->>EssaySvc: Create Essay Submission
    EssaySvc->>Storage: Upload File
    EssaySvc->>Storage: Store Metadata
    EssaySvc->>Queue: Publish EssaySubmitted Event
    EssaySvc-->>Frontend: 202 Accepted
    Frontend-->>Student: Show Processing
    Queue->>Worker: Consume EssaySubmitted
    Worker->>AI: Send Essay for Analysis
    AI->>Worker: Return AI Analysis
    Worker->>Storage: Store AI Results
    Worker->>Queue: Publish AnalysisCompleted
    Queue->>Notifier: Notify Completion
    Notifier->>Frontend: WebSocket Update
    Frontend-->>Student: Display Results
```

### Feedback System Flow
```mermaid
flowchart TD
    subgraph "Feedback Generation"
        Essay[Essay Submitted] --> Validate[Validate Essay]
        Validate --> Process[Process with AI]
        Process --> Generate[Generate Feedback]
        Generate --> Store[Store Feedback]
        Store --> Notify[Notify User]
    end
    subgraph "Feedback Types"
        Store --> Grammar[Grammar Feedback]
        Store --> Structure[Structure Feedback]
        Store --> Content[Content Feedback]
        Store --> Overall[Overall Score]
    end
```

### Real-time Updates Flow
```mermaid
graph LR
    subgraph "WebSocket Architecture"
        Client[Next.js Client]
        WS1[WebSocket Connection 1]
        WS2[WebSocket Connection 2]
        Redis[Redis PubSub]
        Backend[Django Channels]
    end
    subgraph "Event Sources"
        AI[AI Processing]
        Teacher[Teacher Actions]
        System[System Events]
    end
    AI -- Event --> Backend
    Teacher -- Event --> Backend
    System -- Event --> Backend
    Backend -- Publish --> Redis
    Redis -- Broadcast --> WS1
    Redis -- Broadcast --> WS2
    WS1 -- Update --> Client
```

## 🎯 Error Handling Flow

### Error Resolution Flow
```mermaid
flowchart TD
    subgraph "Error Handling Process"
        Error[API Error] --> Identify{Identify Error Type}
        Identify -- Validation --> ValidationError[Validation Error]
        Identify -- Auth --> AuthError[Authentication Error]
        Identify -- Server --> ServerError[Server Error]
        Identify -- Rate --> RateError[Rate Limit Error]
    end
    subgraph "Error Response"
        ValidationError --> FieldErrors[Field-level Errors]
        AuthError --> LoginRedirect[Redirect to Login]
        ServerError --> RetryLogic[Retry with Backoff]
        RateError --> WaitRetry[Wait and Retry]
    end
```

### Rate Limiting Flow
```mermaid
sequenceDiagram
    participant Client
    participant RateLimit as Rate Limiter
    participant API as API Gateway
    participant Cache as Redis Cache
    
    Client->>RateLimit: API Request
    RateLimit->>Cache: Check Request Count
    alt Within Limit
        Cache-->>RateLimit: Allow Request
        RateLimit->>API: Process Request
        API-->>RateLimit: Increment Counter
        RateLimit-->>Client: Success Response
    else Limit Exceeded
        Cache-->>RateLimit: Rate Limit Exceeded
        RateLimit-->>Client: 429 Too Many Requests
    end
```

## 📊 Pagination & Filtering Flow

### Pagination Architecture
```mermaid
graph TD
    subgraph "Pagination Process"
        Request[Paginated Request] --> Parse{Parse Parameters}
        Parse --> Validate[Validate Page/Size]
        Validate --> Query[Database Query]
        Query --> Count[Count Total Records]
        Count --> Slice[Slice Results]
        Slice --> Serialize[Serialize Response]
        Serialize --> Response[Paginated Response]
    end
    subgraph "Response Structure"
        Serialize --> Results[Results Array]
        Serialize --> Meta[Metadata]
        Meta --> Count[Total Count]
        Meta --> Next[Next URL]
        Meta --> Prev[Previous URL]
    end
```

### Filtering Flow
```mermaid
flowchart TD
    subgraph "Filtering Process"
        Filters[Query Parameters] --> ParseFilters[Parse Filters]
        ParseFilters --> BuildQuery[Build SQL Query]
        BuildQuery --> ApplyFilters[Apply WHERE clauses]
        ApplyFilters --> Execute[Execute Query]
        Execute --> Return[Return Filtered Results]
    end
    subgraph "Filter Types"
        Equals[Exact Match]
        Contains[Partial Match]
        Range[Date/Number Ranges]
        Sort[Sorting Options]
        Search[Full-text Search]
    end
```

## 🔍 API Documentation Flow

### OpenAPI Generation Flow
```mermaid
graph LR
    subgraph "Documentation Generation"
        Code[Django Views] --> Serializer[Django REST Serializers]
        Serializer --> Schema[OpenAPI Schema]
        Schema --> Swagger[Swagger UI]
        Schema --> Redoc[ReDoc]
    end
    subgraph "Interactive Documentation"
        Swagger --> TryAPI[Try API Endpoints]
        Redoc --> ReadDocs[Read Documentation]
        TryAPI --> Test[Live Testing]
    end
```

### Testing Workflow
```mermaid
flowchart TD
    subgraph "API Testing Process"
        Spec[OpenAPI Spec] --> Generate[Generate Test Cases]
        Generate --> Run[Run Tests]
        Run --> Validate[Validate Responses]
        Validate --> Report[Test Report]
    end
    subgraph "Testing Tools"
        Spec --> Postman[Postman Collection]
        Spec --> Newman[Newman CLI]
        Spec --> PyTest[PyTest Integration]
    end
```

## 🚀 Deployment Flow

### CI/CD Pipeline
```mermaid
graph TD
    subgraph "Development Workflow"
        Code[Code Changes] --> Test[Run Tests]
        Test -- Pass --> Build[Build Docker Images]
        Build --> Deploy[Deploy to Staging]
        Deploy --> Validate[Validate APIs]
        Validate -- Success --> Production[Deploy to Production]
    end
    subgraph "Deployment Environments"
        Staging[Staging Environment]
        Production[Production Environment]
        Monitoring[Post-deployment Monitoring]
    end
```