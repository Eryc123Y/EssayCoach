# API Integration

## Overview

The frontend integrates with the Django REST API using Axios with interceptors for authentication and error handling.

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
// services/auth.service.ts
export const authService = {
  async login(credentials: LoginDto) {
    return api.post('/api/auth/login/', credentials)
  }
}
```

## Error Handling

- Global error handling with toast notifications
- Network error handling
- Authentication error redirects
- Validation error display

## Development Notes

[This section will be expanded with actual implementation details]