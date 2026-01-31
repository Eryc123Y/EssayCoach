# Backend Testing Strategies

## Testing Framework
- **Primary Framework**: Django's built-in test framework with pytest
- **Test Runner**: pytest-django for enhanced Django-specific features
- **Coverage Tool**: pytest-cov for code coverage reporting

## Test Categories

### Unit Tests
- **Models**: Test model methods, properties, and validations
- **Serializers**: Test data serialization and validation logic
- **Utilities**: Test helper functions and utility methods

### Integration Tests
- **API Endpoints**: Test REST API endpoints with Django REST Framework test client
- **Authentication**: Test JWT authentication flows
- **WebSocket Tests**: Test real-time features using pytest-asyncio

### End-to-End Tests
- **Critical User Flows**: Test complete user journeys (essay creation through submission)
- **Payment Processing**: Test subscription and payment flows
- **Email Integration**: Test email notifications and confirmations

## Test Structure

### Directory Layout
```
backend/
├── tests/
│   ├── unit/
│   │   ├── test_models.py
│   │   ├── test_serializers.py
│   │   └── test_utils.py
│   ├── integration/
│   │   ├── test_api_endpoints.py
│   │   ├── test_authentication.py
│   │   └── test_websockets.py
│   ├── fixtures/
│   │   ├── users.json
│   │   ├── essays.json
│   │   └── feedback.json
│   └── conftest.py
```

### Key Test Files
- **conftest.py**: Pytest configuration and fixtures
- **factories.py**: Factory Boy for test data generation
- **test_models.py**: Model-specific tests
- **test_api.py**: API endpoint integration tests

## Testing Commands

### Run All Tests
```bash
# Via project Makefile
make test

# Directly via uv
cd backend && uv run pytest
```

### Run with Coverage
```bash
cd backend && uv run pytest --cov=. --cov-report=html
```

### Run Specific Tests
```bash
cd backend && uv run pytest path/to/test.py
```

### Run Async Tests
```bash
pytest tests/integration/test_websockets.py -v
```

## Fixtures and Factories
- User factory with different roles (student, coach, admin)
- Essay factory with realistic content
- Feedback factory with various feedback types
- Mock external services (AI analysis, email providers)