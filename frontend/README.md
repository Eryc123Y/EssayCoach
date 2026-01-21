# EssayCoach Frontend

Next.js 15 + React 19 + TypeScript application serving as the user interface for EssayCoach.

## 🚀 Quick Start

### Prerequisites

1. **Nix Development Environment** (Required):
   ```bash
   # From project root
   nix develop
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Environment Configuration**:
   Create `frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

### Running the Development Server

**Option 1: Via Overmind (Recommended)**
```bash
# From project root (inside nix develop shell)
dev
```

**Option 2: Direct Execution**
```bash
cd frontend
pnpm dev
```

- **Frontend URL**: http://localhost:5100
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432

## 🏗 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/              # API Route Handlers (proxy to Django)
│   │   │   └── v1/           # /api/v1/* routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/         # Main dashboard area
│   │   │   └── essay-analysis/  # AI essay feedback feature
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Home page
│   ├── components/             # Reusable UI components
│   │   └── ui/               # shadcn/ui components
│   │   └── layout/            # Layout components (Header, Sidebar)
│   │   └── features/           # Feature-specific components
│   ├── service/                 # API service layer
│   │   └── api/               # API endpoint functions
│   │   └── request.ts          # Request utilities
│   ├── lib/                     # Utility functions
│   └── types/                   # TypeScript type definitions
├── public/                     # Static assets
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                # Dependencies
```

## 🛠 Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | Next.js | 15.3.2 (App Router) |
| **UI Library** | React | 19.x |
| **Language** | TypeScript | 5.7 |
| **Styling** | Tailwind CSS | v4 |
| **UI Components** | shadcn/ui | Latest |
| **Icons** | lucide-react | Latest |
| **State Management** | zustand | Latest |
| **Forms** | React Hook Form | Latest |
| **Charts** | Recharts | Latest |
| **Animations** | Framer Motion | Latest |
| **Notifications** | Sonner | Latest |
| **Package Manager** | pnpm | 10.28.0 |

## 🔑 Key Features

### Authentication
- **Hybrid Token Authentication**: HttpOnly cookies + Token-based backend auth
- **API Route Proxy**: Secure token forwarding to Django backend
- **Protected Routes**: Middleware for authenticated-only pages

See: [Authentication Architecture](../docs/architecture/authentication.md)

### AI Essay Analysis
- **Real-time Feedback**: Instant AI grading and writing advice
- **Visual Analytics**: Radar charts for multidimensional scoring
- **Interactive Revision**: Chat-based essay revision assistance
- **Progressive Loading**: Animated states for long-running analyses

**Location**: `src/app/dashboard/essay-analysis/page.tsx`

### Dashboard
- **User Profile**: Manage account settings
- **Essay History**: View past submissions and revisions
- **Analytics**: Track progress over time

## 🔧 Development Commands

### Code Quality
```bash
# Linting
pnpm lint              # Check for issues
pnpm lint:fix          # Auto-fix issues

# Formatting
pnpm format            # Format with Prettier

# Type Checking
pnpm build             # Build checks types
```

### Testing
```bash
# Run tests
pnpm test
```

### Building
```bash
# Production build
pnpm build

# Preview production build
pnpm preview
```

## ⚙ Configuration

### Next.js Config

**File**: `next.config.ts`

**Key Settings**:
```typescript
const nextConfig = {
  // Output export for easier deployment
  output: 'export',
  
  // No rewrites - use API Route Handlers instead
  // This allows custom header injection (Auth tokens)
  // See: docs/architecture/authentication.md
}
```

### TypeScript Config

**File**: `tsconfig.json`

**Key Settings**:
- Strict mode enabled
- Path aliases configured (`@/` for `src/`)
- Next.js types included

### Tailwind Config

**File**: `tailwind.config.ts`

**Key Settings**:
- Dark mode support
- Custom color theme
- shadcn/ui integration

## 🔒 Troubleshooting

### Issue: "next dev" hangs on 'Compiling /'

**Symptoms**:
- Terminal freezes at "Compiling /..."
- No errors displayed
- Process must be killed with Ctrl+C

**Root Cause**: Duplicate `node_modules` directory

**Solution**:
```bash
# From frontend directory
rm -rf node_modules node_modules2
pnpm install
pnpm dev
```

**Prevention**:
- Ensure no `node_modules2` or similar duplicate directories exist
- Use `ls -la | grep node_modules` to check for duplicates

### Issue: "Failed to fetch" 401 Unauthorized

**Symptoms**:
- API requests return 401 status
- Browser console shows authentication errors

**Root Cause**: Missing or invalid `access_token` cookie

**Solution**:
1. Check browser DevTools Application → Cookies
2. Verify `access_token` exists and is httpOnly
3. Try logging out and back in
4. Check Django backend logs for authentication errors

### Issue: "EADDRINUSE" Port already in use

**Symptoms**:
- Error: "Port 5100 is already in use"
- Development server fails to start

**Solution**:
```bash
# Find process using port 5100
lsof -i :5100

# Kill process (replace PID with actual process ID)
kill -9 <PID>

# Alternative: Use different port
PORT=3001 pnpm dev
```

### Issue: Module not found errors

**Symptoms**:
- "Module not found: Can't resolve 'package-name'"
- Import errors in TypeScript

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### Issue: CORS policy errors

**Symptoms**:
- "Access to fetch at '...' has been blocked by CORS policy"
- Network tab shows CORS errors

**Root Cause**: Django CORS configuration missing or incorrect

**Solution**:
Ensure backend settings include:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5100",
    "http://127.0.0.1:5100",
]
```

### Issue: "Failed to fetch" (Configuration Conflict)

**Symptoms**:
- API calls fail immediately with `TypeError: Failed to fetch`
- Browser console shows network errors before request completes
- Authentication requests fail silently

**Root Cause**: Sentry `tunnelRoute` in `next.config.ts` conflicting with Next.js API Routes

**Solution**:
```bash
# Check next.config.ts for Sentry configuration
# Disable tunnelRoute if it conflicts with API paths

# next.config.ts
const nextConfig = {
  output: 'export',
  // tunnelRoute: '/api/v1/:path*' // Comment this out
}
```

**Alternative**: Ensure `tunnelRoute` pattern doesn't overlap with `/api/v1/*` paths

### Issue: "net::ERR_TOO_MANY_REDIRECTS" (Proxy Loop)

**Symptoms**:
- Browser console shows infinite redirect loop on API calls
- Requests to `/api/v1/*` endpoints fail with "Too Many Redirects"
- Network tab shows repeated 301/307 status codes

**Root Cause**: API Proxy using `redirect: 'manual'` passes backend redirects to browser, causing a loop

**Solution**:
Update API Route handler to use `redirect: 'follow'`:
```typescript
// src/app/api/v1/[...path]/route.ts
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
  headers: {
    'Authorization': `Token ${token}`,
    ...nextHeaders(req)
  },
  redirect: 'follow' // Critical: Handle redirects server-side
});
```

### Issue: "ECONNREFUSED" (IPv6/IPv4 Resolution)

**Symptoms**:
- Connection refused on `localhost`
- Frontend cannot connect to backend
- Works with `127.0.0.1` but not `localhost`

**Root Cause**: Node.js v24+ defaults to IPv6 for `localhost`, but services bind to IPv4

**Solution**:
Force IPv4 binding in `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -H 127.0.0.1"
  }
}
```

**Alternative**: Use IPv4 in environment variables:
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Issue: Build fails with TypeScript errors

**Symptoms**:
- Type errors in console
- Build process exits with errors

**Solution**:
```bash
# Check TypeScript errors
pnpm build --dry-run

# Fix auto-fixable issues
pnpm lint:fix
```

## 🔐 Environment Variables

### Required

**Frontend** (.env.local):
```bash
# Django backend API URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Optional

```bash
# Analytics (future)
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Feature flags (future)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## 📚 API Integration

### Service Layer

**Location**: `src/service/api/`

**Pattern**: All API calls go through typed service functions

**Example**:
```typescript
// src/service/api/auth.ts
export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch('/api/v1/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return response.json();
}
```

### API Route Proxy

**Location**: `src/app/api/v1/[...path]/route.ts`

**Purpose**: Forwards requests to Django backend with authentication headers

**Pattern**: Catch-all route handling all `/api/v1/*` requests

## 🎨 Styling Guidelines

### Using Tailwind CSS

**Prefer utility classes**:
```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  {/* content */}
</div>
```

### Using shadcn/ui Components

**Import pattern**:
```tsx
import { Button } fromCard '@/components/ui/button'
import { Card } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Click me</Button>
  </CardContent>
</Card>
```

### Merging Classes

**Use `cn()` utility**:
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'base-class',
  isActive && 'active-class',
  variant === 'primary' && 'primary-variant'
)}>
```

## 🧪 Testing

### Component Testing (Planned)

Framework: React Testing Library

```bash
pnpm test
```

### E2E Testing (Planned)

Framework: Playwright

```bash
nix run frontend:playwright
```

## 🚢 Deployment

### Static Export

```bash
# Build for deployment
pnpm build

# Output: .next/out/
# Deploy to any static hosting (Vercel, Netlify, etc.)
```

### Environment-Specific Builds

```bash
# Production
NODE_ENV=production pnpm build

# Development
NODE_ENV=development pnpm build
```

## 📄 Related Documentation

- [Authentication Architecture](../docs/architecture/authentication.md)
- [System Architecture](../docs/architecture/system-architecture.md)
- [Troubleshooting Guide](../docs/troubleshooting/)
- [Project AGENTS.md](../AGENTS.md)

## 🔄 Version History

- **v1.0** (Jan 2026): Initial Next.js 15 + React 19 implementation
  - Hybrid token authentication
  - AI essay analysis feature
  - API route proxy for secure token forwarding
