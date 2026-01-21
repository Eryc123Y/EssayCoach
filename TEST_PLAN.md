# Authentication & E2E Test Plan

## 1. Verified Functionality
- **Backend Login API**: `POST /api/v1/auth/login/` correctly authenticates users and returns a Token.
- **Frontend Proxy**: Next.js route `/api/auth/login` successfully forwards requests to Django (`127.0.0.1:8000`).
- **Session Management**: `access_token` cookies are set correctly, allowing persistence across reloads.
- **Protected Routes**: Middleware correctly redirects unauthenticated users and allows authenticated users.
- **User Identity**: The dashboard correctly displays the logged-in user's name and email.

## 2. Identified Issues & Fixes
- **IPv6 Mismatch**: Next.js defaults to IPv6 (`::1`) while Django runs on IPv4 (`127.0.0.1`).
  - *Fix*: Forced `127.0.0.1` in `frontend/.env.local`.
- **Validation Mismatch**: Frontend required 6-char password, backend admin user had 5-char ("admin").
  - *Fix*: Relaxed Zod schema to `min(1)`.
- **Dependency Corruption**: `node_modules` became corrupted during environment switching.
  - *Fix*: Clean reinstall of `pnpm` dependencies.

## 3. Recommended Manual Test Cases
1.  **Login Flow**:
    *   Go to `/auth/sign-in`.
    *   Enter `admin@example.com` / `admin`.
    *   Click Sign In.
    *   **Pass**: Redirects to `/dashboard/overview`.
2.  **Logout Flow**:
    *   Click User Avatar -> Logout.
    *   **Pass**: Redirects to `/` (Login).
3.  **Essay Submission**:
    *   Go to `/dashboard/essay-analysis`.
    *   Enter a question and essay content (> 50 words).
    *   Click "Start AI Analysis".
    *   **Pass**: Radar chart and feedback appear after ~30s.

## 4. Automated Test Suite (Future Work)
Implement a robust Playwright suite in `frontend/e2e/auth.spec.ts` that:
- Mocks the backend API for pure frontend testing.
- Runs against the real backend for integration testing (as we did manually).
- Handles shadcn/ui components using accessibility selectors (`getByRole`, `getByLabel`) instead of CSS selectors.
