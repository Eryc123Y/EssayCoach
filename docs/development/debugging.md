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
If the frontend receives a 404 error when calling `/api/v2/...`, it is usually a proxy path or backend route mismatch.

**Fix:**
1. **Use API Route Handler Proxy**: Ensure requests go through `frontend/src/app/api/v2/[...path]/route.ts`.
2. **Check Backend API Prefix**: Ensure backend routes are mounted under `/api/v2/`.
3. **Django CORS**: Ensure `backend/essay_coach/settings.py` allows the frontend origin and `CorsMiddleware` is near the top of middleware.
   ```python
   CORS_ALLOWED_ORIGINS = ["http://127.0.0.1:5100", "http://localhost:5100"]
   MIDDLEWARE = [
       "corsheaders.middleware.CorsMiddleware",
       # ...
   ]
   ```

### 500 Error on Essay Submission
If you encounter a `500 Internal Server Error` when submitting an essay, it is likely due to missing or misconfigured Dify environment variables.

**Symptoms:**
- Frontend error: `Request to /api/v2/ai-feedback/agent/workflows/run/ failed with status 500`
- Backend logs show error related to `DifyClientError`.

**Fix:**
1. Check your `.env` file (at project root or `backend/.env`).
2. Ensure the following variables are set:
   ```bash
   DIFY_API_KEY=your-api-key
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
  "url": "http://127.0.0.1:5100"
}
```

## Development Notes

[This section will be expanded with actual debugging scenarios]
