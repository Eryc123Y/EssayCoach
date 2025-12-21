# State Management

## Overview

The EssayCoach frontend uses a lightweight global state management approach with [Zustand](https://zustand-demo.pmnd.rs/) for React applications built with Next.js.

## Store Structure

### Root Store
```typescript
// state/root.ts
import { create } from 'zustand'

interface RootState {
  user: any
  isAuthenticated: boolean
  theme: 'light' | 'dark'
  setUser: (u: any) => void
}

export const useRootStore = create<RootState>((set) => ({
  user: null,
  isAuthenticated: false,
  theme: 'light',
  setUser: (user) => set({ user, isAuthenticated: !!user })
}))
```

### Essay Store
```typescript
// state/essay.ts
import { create } from 'zustand'

interface EssayState {
  currentEssay: any
  essays: any[]
  isLoading: boolean
  setLoading: (v: boolean) => void
}

export const useEssayStore = create<EssayState>((set) => ({
  currentEssay: null,
  essays: [],
  isLoading: false,
  setLoading: (v) => set({ isLoading: v })
}))
```

## Patterns & Best Practices

- Access stores through React hooks
- Implement proper TypeScript types
- Handle async operations with proper loading states
- Persist critical data via middleware (e.g., localStorage)

## Development Notes

[This section will be expanded with actual implementation details]