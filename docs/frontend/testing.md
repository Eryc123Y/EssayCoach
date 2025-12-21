# Testing Patterns

## Overview

Frontend testing uses Jest for unit tests, React Testing Library for component testing, and Playwright for e2e tests.

## Unit Testing

### Component Tests
```typescript
// tests/components/EssayForm.test.tsx
import { render, screen } from '@testing-library/react'
import EssayForm from '@/components/EssayForm'

describe('EssayForm', () => {
  it('renders form fields', () => {
    render(<EssayForm />)
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
  })
})
```

### Store Tests
```typescript
// tests/state/essay.test.ts
import { act } from 'react'
import { useEssayStore } from '@/state/essay'

describe('Essay Store', () => {
  it('sets loading state', () => {
    const store = useEssayStore.getState()
    act(() => store.setLoading(true))
    expect(useEssayStore.getState().isLoading).toBe(true)
  })
})
```

## Integration Testing

### API Mocking
```typescript
// tests/setup.ts
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## E2E Testing

### Playwright Tests
```typescript
// e2e/essay.spec.ts
import { test, expect } from '@playwright/test'

test('creates a new essay', async ({ page }) => {
  await page.goto('/essays/new')
  await page.getByTestId('title-input').fill('Test Essay')
  await page.getByTestId('submit-btn').click()
  await expect(page).toHaveURL(/\/essays\//)
})
```

## Development Notes

[This section will be expanded with actual testing implementation]