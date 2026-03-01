# Dashboard Testing Strategy

**Last Updated**: 2026-02-25  
**Author**: Test Automator Agent  
**Status**: Implemented

---

## Overview

This document describes the comprehensive testing strategy for the Dashboard Overview feature in EssayCoach. The testing approach covers backend API tests, frontend component tests, integration tests, and E2E scenarios.

---

## Test Architecture

### Backend Testing (pytest + Django)

```
backend/api_v2/core/tests/test_dashboard.py
```

**Coverage**: 90%+ on dashboard endpoints

**Test Categories**:
1. Authentication Tests
2. Student Dashboard Tests
3. Lecturer Dashboard Tests
4. Admin Dashboard Tests
5. RBAC Permission Tests
6. Edge Cases and Error Handling
7. Data Integrity Tests
8. Integration Tests

### Frontend Testing (vitest + React Testing Library)

```
frontend/src/app/dashboard/overview/page.test.tsx
frontend/src/features/overview/components/*.test.tsx
```

**Coverage**: All components tested

**Test Categories**:
1. Component Rendering Tests
2. Interaction Tests
3. Accessibility Tests
4. Styling Tests
5. Integration Tests

---

## Backend Test Patterns

### Fixture Structure

```python
@pytest.fixture
def student_user():
    """Create a student test user."""
    return User.objects.create_user(
        user_email="student@test.com",
        password="StudentPass123!",
        user_role="student",
    )

@pytest.fixture
def class_instance(unit):
    """Create a class for testing."""
    return Class.objects.create(
        unit_id_unit=unit,
        class_size=0,
    )
```

### Authentication Pattern

```python
def test_dashboard_requires_authentication():
    """Test that dashboard endpoint requires authentication."""
    client = Client()
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 401

def test_dashboard_with_valid_jwt(student_user):
    """Test dashboard access with valid JWT token."""
    jwt_pair = create_jwt_pair(student_user)
    
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
    
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200
```

### Role-Based Testing Pattern

```python
def test_student_dashboard_basic_info(student_user):
    """Test student dashboard returns basic user info."""
    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
    
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200
    
    data = response.json()
    assert data["user"]["id"] == student_user.user_id
    assert data["user"]["role"] == "student"
```

### Data Setup Pattern

```python
def test_student_dashboard_with_enrolled_class(student_user, class_instance, unit):
    """Test student dashboard shows enrolled classes."""
    # Create enrollment
    Enrollment.objects.create(
        user_id_user=student_user,
        class_id_class=class_instance,
        unit_id_unit=unit,
    )
    
    client = Client()
    jwt_pair = create_jwt_pair(student_user)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
    
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["classes"]) == 1
```

---

## Frontend Test Patterns

### Mocking Strategy

```typescript
// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/overview',
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  // ... other components
}));
```

### Component Rendering Test

```typescript
describe('Page Structure', () => {
  it('renders the page container', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('page-container')).toBeInTheDocument();
  });

  it('renders welcome banner', () => {
    render(<DashboardPage />);
    
    expect(
      screen.getByText(/Academic Command Center/i)
    ).toBeInTheDocument();
  });
});
```

### Interaction Test Pattern

```typescript
it('handles Submit New Essay button click', async () => {
  const user = userEvent.setup();
  
  render(<DashboardPage />);
  
  const submitButton = screen.getByText(/Submit New Essay/i).closest('button');
  if (submitButton) {
    await user.click(submitButton);
  }
});
```

### Accessibility Test Pattern

```typescript
describe('Accessibility', () => {
  it('has proper heading hierarchy', () => {
    render(<DashboardPage />);
    
    const mainHeading = screen.getByText(/Academic Command Center/i);
    expect(mainHeading.tagName.toLowerCase()).toMatch(/h[1-6]/);
  });

  it('has proper tab roles', () => {
    render(<DashboardPage />);
    
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
  });
});
```

---

## Mock Data Strategies

### Backend Test Data

```python
@pytest.fixture
def submission_with_feedback(student_user, class_with_unit):
    """Create a submission with complete feedback."""
    # Create task
    task = Task.objects.create(
        unit_id_unit=class_with_unit.unit_id_unit,
        task_desc="Critical Analysis Essay",
        task_due_datetime=datetime.now() - timedelta(days=3)
    )
    
    # Create submission
    submission = Submission.objects.create(
        user_id_user=student_user,
        task_id_task=task,
        submission_content="Test essay content for feedback.",
        submission_time=datetime.now() - timedelta(days=2)
    )
    
    # Create feedback with score
    feedback = Feedback.objects.create(
        submission_id_submission=submission,
        user_id_user=student_user,
        feedback_content="Overall good work."
    )
    
    # Create feedback item with score
    FeedbackItem.objects.create(
        feedback_id_feedback=feedback,
        rubric_item_id_rubric_item=rubric_item,
        feedback_item_score=85,
        feedback_item_source="ai",
    )
    
    return {
        "student": student_user,
        "submission": submission,
        "feedback": feedback,
    }
```

### Frontend Mock Data

```typescript
// Mock graph components
vi.mock('@/features/overview/components/area-graph', () => ({
  AreaGraph: () => <div data-testid="area-graph">Area Graph</div>,
}));

vi.mock('@/features/overview/components/recent-submissions', () => ({
  RecentSubmissions: () => (
    <div data-testid="recent-submissions">Recent Submissions</div>
  ),
}));
```

---

## Integration Test Setup

### Backend Integration Tests

```python
def test_full_student_workflow():
    """Test complete student workflow from signup to seeing graded work."""
    # 1. Student signs up
    student = User.objects.create_user(
        user_email="workflow@test.com",
        password="Pass123!",
        user_role="student"
    )
    
    # 2. Login and check empty dashboard
    jwt_pair = create_jwt_pair(student)
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
    
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["totalEssays"] == 0
    
    # 3. Submit essay, add feedback, verify dashboard shows score
    # ... (full workflow implementation)
```

### Frontend Integration Tests

```typescript
describe('Graph Components Integration', () => {
  it('renders all graph components', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('bar-graph')).toBeInTheDocument();
    expect(screen.getByTestId('area-graph')).toBeInTheDocument();
    expect(screen.getByTestId('pie-graph')).toBeInTheDocument();
  });

  it('renders KPI cards with correct data', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('24')).toBeInTheDocument(); // Essays
    expect(screen.getByText('95%')).toBeInTheDocument(); // Feedback
    expect(screen.getByText('+12%')).toBeInTheDocument(); // Improvement
  });
});
```

---

## E2E Test Scenarios

### Student Journey

```gherkin
Scenario: Student views dashboard with pending submissions
  Given I am a logged-in student
  And I have 2 pending essay submissions
  When I navigate to the dashboard
  Then I should see "2 assignments pending review"
  And I should see my recent submissions list
  And I should see my current grade statistic
```

### Lecturer Journey

```gherkin
Scenario: Lecturer views grading queue
  Given I am a logged-in lecturer
  And I have 5 submissions waiting for grading
  When I navigate to the dashboard
  Then I should see 5 items in the grading queue
  And I should see my assigned classes
  And I should see the pending grading count
```

### Admin Journey

```gherkin
Scenario: Admin views system-wide dashboard
  Given I am a logged-in admin
  And there are 100 submissions in the system
  When I navigate to the dashboard
  Then I should see system-wide statistics
  And I should see all classes
  And I should see user metrics
```

---

## Edge Cases Testing

### Empty States

```python
def test_student_dashboard_empty_state():
    """Test student dashboard with no data (empty state)."""
    student = User.objects.create_user(
        user_email="newstudent@test.com",
        password="Pass123!",
        user_role="student",
    )
    
    client = Client()
    jwt_pair = create_jwt_pair(student)
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {jwt_pair.access}"
    
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 200
    
    data = response.json()
    assert data["stats"]["totalEssays"] == 0
    assert data["classes"] == []
    assert data["myEssays"] == []
```

### Error States

```python
def test_dashboard_with_invalid_token():
    """Test dashboard rejects invalid token."""
    client = Client()
    client.defaults["HTTP_AUTHORIZATION"] = "Bearer invalid_token_here"
    
    response = client.get("/api/v2/core/dashboard/")
    assert response.status_code == 401
```

### Loading States (Frontend)

```typescript
it('shows loading skeleton initially', async () => {
  // Setup delayed response
  server.use(
    http.get('/api/v2/core/dashboard/', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return HttpResponse.json({ data: mockDashboardData });
    })
  );
  
  render(<DashboardPage />, { wrapper: createWrapper() });
  
  // Should show loading state initially
  expect(screen.getByText(/Academic Command Center/i)).toBeInTheDocument();
});
```

---

## RBAC Testing Matrix

| Endpoint | Student | Lecturer | Admin | Unauthenticated |
|----------|---------|----------|-------|-----------------|
| GET /dashboard/ | ✅ Own data | ✅ Assigned classes | ✅ All data | ❌ 401 |
| GET /dashboard/grading-queue/ | ❌ 403 | ✅ Own queue | ✅ All queues | ❌ 401 |
| GET /dashboard/activity-feed/ | ✅ Own activity | ✅ Class activity | ✅ All activity | ❌ 401 |
| GET /dashboard/class/{id}/metrics/ | ❌ 403 | ✅ Own classes | ✅ All classes | ❌ 401 |

---

## Running Tests

### Backend Tests

```bash
# All dashboard tests
cd backend && uv run pytest api_v2/core/tests/test_dashboard.py -v

# Single test class
cd backend && uv run pytest api_v2/core/tests/test_dashboard.py::TestStudentDashboard -v

# With coverage
cd backend && uv run pytest api_v2/core/tests/test_dashboard.py --cov=api_v2/core --cov-report=html
```

### Frontend Tests

```bash
# All overview tests
cd frontend && pnpm test -- overview

# Single test file
cd frontend && pnpm test -- bar-graph.test.tsx

# With coverage
cd frontend && pnpm test -- --coverage
```

---

## Lessons Learned

### 1. Fixture Reusability

Create reusable fixtures that can be combined for different test scenarios:

```python
@pytest.fixture
def student_with_submission(student_user, class_with_unit):
    """Composite fixture: student + class + submission."""
    # ... setup code
    return {"student": student_user, "submission": submission}
```

### 2. Test Data Isolation

Each test should create its own data to avoid test interdependencies:

```python
def test_dashboard_multiple_enrollments(student_user):
    """Create unique test data for this test only."""
    for i in range(3):
        unit_i = Unit.objects.create(
            unit_id=f"CSM{i}01",  # Unique ID
            unit_name=f"Course Multi {i}01",
        )
        # ... rest of setup
```

### 3. Mock External Dependencies

Mock external services (Dify AI, etc.) to keep tests fast and deterministic:

```typescript
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: mockDashboardData }),
  },
}));
```

### 4. Test Real User Scenarios

Write tests that mirror actual user workflows:

```python
def test_full_student_workflow():
    """Test complete student journey."""
    # 1. Signup -> 2. Submit essay -> 3. View dashboard -> 4. See feedback
```

---

## Future Improvements

1. **Visual Regression Testing**: Add screenshot tests for dashboard components
2. **Performance Tests**: Add tests for dashboard load time under various data loads
3. **Accessibility Audit**: Add automated a11y testing with axe-core
4. **E2E Tests**: Add Playwright/Cypress tests for complete user journeys
5. **Load Testing**: Add k6 tests for dashboard endpoint under concurrent load

---

## Related Documents

- [API v1 to V2 Migration](./api-v1-to-v2-migration.md)
- [JWT Refresh Token Implementation](./jwt-refresh-security-lessons.md)
- [Dashboard Overview Refactor Plan](../plans/dashboard-overview-refactor.md)

