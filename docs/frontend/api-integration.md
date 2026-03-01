# API Integration

## Overview

The frontend integrates with the Django REST API using a lightweight `fetch` wrapper for authentication and error handling.

## API Client Setup

The frontend uses a centralized request utility that reads the base URL from environment variables.

```typescript
// frontend/src/service/request.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
```

### Configuration
Ensure you have a `.env.local` file in the `frontend/` directory with the following:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Service Modules

### Essay Service
```typescript
// services/essay.service.ts
export const essayService = {
  async createEssay(data: CreateEssayDto) {
    return api.post('/api/essays/', data)
  },
  
  async getEssays() {
    return api.get('/api/essays/')
  }
}
```

### Auth Service
```typescript
// frontend/src/service/api/auth.ts
export const fetchLogin = (userName: string, password: string) =>
  request<Api.Auth.LoginToken>({
    url: '/auth/login',
    method: 'POST',
    data: { userName, password }
  })

export const fetchGetUserInfo = () =>
  request<Api.Auth.UserInfo>({
    url: '/auth/getUserInfo',
    method: 'GET'
  })
```

### Next.js API Routes

The frontend uses Next.js API routes as a lightweight proxy layer for auth endpoints:

| Route | Purpose |
|-------|---------|
| `POST /auth/login` | Proxy to `/api/v1/auth/login/` |
| `GET /auth/getUserInfo` | Proxy to `/api/v1/auth/me/` |
| `GET /auth/error` | Frontend error simulation endpoint |

> `refreshToken` is intentionally deferred and not implemented yet.

## Error Handling

- Global error handling with toast notifications
- Network error handling
- Authentication error redirects
- Validation error display

## Development Notes

[This section will be expanded with actual implementation details]
