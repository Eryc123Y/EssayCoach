# API Integration

## Overview

The frontend integrates with the Django REST API using Axios with interceptors for authentication and error handling.

## API Client Setup

```typescript
// services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000
})

// Request interceptor
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
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