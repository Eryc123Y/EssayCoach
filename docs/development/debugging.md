# Debugging Guide

## Overview

Comprehensive debugging tools and techniques for EssayCoach development.

## Frontend Debugging

### React DevTools
- Install React DevTools browser extension
- Inspect component tree, state, and props
- Debug Zustand store updates
- Performance profiling

### Console Debugging
```javascript
// Enable debug logging
localStorage.setItem('debug', 'essays:*')

// Component debugging
import React from 'react'

function Example() {
  const state = useExampleStore()
  console.log('Component state:', state)
  return <div />
}
```

### Network Debugging
- Use browser Network tab
- Inspect API requests and responses
- Check CORS and authentication headers

## Backend Debugging

### Django Debug Toolbar
```python
# settings.py
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

### Database Query Debugging
```python
# Log SQL queries
from django.db import connection
print(connection.queries)

# Use django-extensions shell_plus
python manage.py shell_plus --print-sql
```

### Logging Configuration
```python
# settings.py
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Common Issues

### CORS Issues
- Check ALLOWED_HOSTS settings
- Verify CORS_ALLOWED_ORIGINS (should include frontend URL)
- Check preflight OPTIONS requests

### 404 Error on API Calls
If the frontend receives a 404 error when calling `/api/v1/...`, it is likely due to a proxy or rewrite misconfiguration.

**Fix:**
1. **Next.js Rewrites**: Ensure `frontend/next.config.ts` has the correct rewrite rules to proxy requests to the backend.
   ```typescript
   async rewrites() {
     return [
       {
         source: '/api/v1/:path*',
         destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/:path*`,
       },
     ];
   }
   ```
2. **Django CORS**: Ensure `backend/essay_coach/settings.py` allows the frontend origin and that `CorsMiddleware` is at the top of the middleware list.
   ```python
   CORS_ALLOWED_ORIGINS = ["http://localhost:3000"] # Match your frontend port
   MIDDLEWARE = [
       "corsheaders.middleware.CorsMiddleware",
       # ...
   ]
   ```

### 500 Error on Essay Submission
If you encounter a `500 Internal Server Error` when submitting an essay, it is likely due to missing or misconfigured Dify environment variables.

**Symptoms:**
- Frontend error: `Request to /api/v1/ai-feedback/agent/workflows/run/ failed with status 500`
- Backend logs show error related to `DIFY_WORKFLOW_ID` or `DifyClientError`.

**Fix:**
1. Check your `.env` file (at project root or `backend/.env`).
2. Ensure the following variables are set:
   ```bash
   DIFY_API_KEY=your-api-key
   DIFY_WORKFLOW_ID=your-workflow-id
   ```
   *Note: `DIFY_API` is also supported as a fallback for `DIFY_API_KEY`.*
3. Verify that `rubric.pdf` exists in the project root.
4. Run `python backend/verify_env.py` to check your configuration.

### Database Connection
- Verify PostgreSQL is running
- Check DATABASE_URL environment variable
- Ensure migrations are applied

## IDE Debugging

### VS Code Setup
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Frontend",
  "url": "http://localhost:5173"
}
```

## Development Notes

[This section will be expanded with actual debugging scenarios]