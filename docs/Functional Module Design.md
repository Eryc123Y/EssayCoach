# EssayCoach Functional Module Design

## 1. Scope
This document decomposes the EssayCoach platform into discrete **functional modules** (microservices, shared libraries, and infrastructure components).  The goal is to provide a clear, implementation-ready reference for developers, DevOps engineers, and QA teams.

## 2. Module Landscape
```mermaid
graph LR
    subgraph "Client Tier"
        Next["Next.js Web App"]
    end

    subgraph "Gateway Tier"
        APIGW["API Gateway"]
    end

    subgraph "Service Tier"
        UMS["User Management Service\n(UMS)"]
        ESS["Essay Submission Service\n(ESS)"]
        AES["AI Evaluation Service\n(AES)"]
        ARS["Analytics & Reporting Service\n(ARS)"]
    end

    subgraph "Async Backbone"
        MQ["Message Queue\n(RabbitMQ/RocketMQ)"]
    end

    subgraph "Data Stores"
        RDS[("PostgreSQL")]
        OSS[("Object Storage\n(OSS)")]
        VS[("Vector Search\n(OpenSearch)")]
    end

    Next --> APIGW
    APIGW -->|REST| UMS
    APIGW -->|REST| ESS
    APIGW -->|REST| ARS

    ESS -- MQ <EssaySubmitted> --> MQ
    MQ -- Consume --> AES
    AES -- MQ <EvaluationCompleted> --> MQ

    UMS <-->|SQL| RDS
    ESS <-->|SQL| RDS
    AES <-->|SQL| RDS
    ARS <-->|SQL| RDS

    ESS <-->|PUT/GET| OSS
    AES <-->|GET| OSS
    AES <-->|Search| VS
```

### Module Responsibilities
| Module | Language | Key Responsibilities | External Dependencies |
|--------|----------|----------------------|-----------------------|
| **UMS** | Python (FastAPI) | Authentication, RBAC, profile CRUD | PostgreSQL |
| **ESS** | Python (FastAPI) | File upload, submission metadata, publish `<EssaySubmitted>` | OSS, MQ, PostgreSQL |
| **AES** | Python (FastAPI Workers) | Ingest queue messages, run grading/fact-check/advice, publish `<EvaluationCompleted>` | OSS, OpenSearch, LLM provider, PostgreSQL |
| **ARS** | Python (FastAPI) | Aggregated metrics, anonymised exports, dashboards APIs | PostgreSQL |
| **API Gateway** | N/A (Managed) | Routing, authZ, rate-limiting, caching | JWT, OAuth2 provider |
| **MQ** | Redis + Celery (future) / Django async (MVP) | Asynchronous processing | — |
| **OSS** | Alibaba OSS | Essay file storage | — |
| **PostgreSQL** | ApsaraDB RDS | Relational data | — |
| **OpenSearch** | ApsaraDB OpenSearch | Vector similarity search | — |

## 3. Sequence: Essay Evaluation Happy Path
```mermaid
sequenceDiagram
    autonumber
    participant F as Frontend
    participant GW as API Gateway
    participant ESS as EssaySubmission
    participant MQ as MessageQueue
    participant AES as AIEvaluation
    participant RDS as PostgreSQL
    participant OSS as ObjectStorage

    F->>GW: POST /essays
    GW->>ESS: Forward request
    ESS->>OSS: Store file
    ESS->>RDS: Persist metadata
    ESS-->>MQ: Publish <EssaySubmitted>
    MQ->>AES: Deliver message
    AES->>OSS: Download essay
    AES->>OpenSearch: Retrieve embeddings
    AES->>LLM: Grade & generate feedback
    AES->>RDS: Persist results
    AES-->>MQ: Publish <EvaluationCompleted>
    MQ-->>F: WebSocket push
```

## 4. Error & Timeout Handling
1. **Submission Timeout** – ESS returns `504 Gateway Timeout`, *but* still retries uploading to OSS up to 3 times.
2. **AI Worker Failure** – AES emits `<EvaluationFailed>`; ESS updates submission status to `FAILED`. Frontend shows red toast.
3. **OpenSearch Unavailable** – AES falls back to heuristic grading and logs a `WARN`.

## 5. Extensibility Guidelines
* New features should be added **vertically** (new microservice) rather than bloating existing ones.
* All inter-service events must be **versioned** (e.g., `v1.EssaySubmitted`).
* Shared code resides in the `packages/shared/` monorepo workspace to avoid duplication.

---
*Document version: 1.0*  
*Last updated: 2025-06-29*                            