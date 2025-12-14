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
- Verify CORS_ALLOWED_ORIGINS
- Check preflight OPTIONS requests

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