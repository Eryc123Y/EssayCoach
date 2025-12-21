# Frontend Component Structure

## Overview
The EssayCoach frontend is built with Next.js (React) and follows a modular component architecture organized by feature domains.

## Directory Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Loader/
│   ├── auth/
│   │   ├── LoginForm/
│   │   ├── RegisterForm/
│   │   └── ProtectedRoute/
│   ├── essays/
│   │   ├── EssayEditor/
│   │   ├── EssayList/
│   │   ├── EssayCard/
│   │   └── FeedbackPanel/
│   └── dashboard/
│       ├── DashboardLayout/
│       ├── Navigation/
│       └── UserProfile/
├── hooks/
├── services/
├── utils/
└── styles/
```

## Component Categories

### Common Components
Reusable UI components used throughout the application:
- **Button**: Standardized button with variants
- **Input**: Form input with validation
- **Modal**: Reusable modal dialogs
- **Loader**: Loading states and spinners

### Feature Components
Domain-specific components organized by feature:
- **Auth**: Authentication-related components
- **Essays**: Essay management and editing
- **Dashboard**: Main application layout and navigation

### Higher-Order Components
- **ProtectedRoute**: Route protection for authenticated users
- **ErrorBoundary**: Error handling wrapper
- **LoadingBoundary**: Async loading states

## Component Patterns

### Functional Components
All components use React functional components with hooks.

### Props Interface
TypeScript interfaces for component props ensure type safety.

### Styling Approach
- CSS Modules for component-scoped styles
- Tailwind CSS for utility classes
- Styled-components for dynamic styling

## State Management
- Local state with React hooks
- Global state with Context API
- Server state with React Query/SWR