# Settings & Profile Functional Sync Design

> **Date:** 2026-02-27
> **Context:** Syncing the functional implementation of PRD-07 (Settings) and PRD-08 (Profile) with the Pencil design file (`pencil-shadcn.pen`) using a "Functional Wireframe" approach. Priority is feature completion over pixel-perfect UI.

## 1. Architectural Approach
We will maintain the single-page architecture (`/dashboard/settings` and `/dashboard/profile`) but render role-specific content based on the user's role, satisfying the explicit variants defined in the Pencil file (Student, Lecturer, Admin).

## 2. Settings View Structure (`JBtMH`)
The Settings page will be organized into distinct sections to match the Pencil definitions:
- **Account Settings**: Avatar upload, name, email (All Roles)
- **Preferences**: Theme toggle, language, timezone (All Roles)
- **Security**: Password change, active sessions (All Roles)
- **Notifications**: Email/push toggles (Role-specific content: e.g., "New submissions" for Lecturers, "Grade posted" for Students)
- **Organization**: System-wide settings (Admin Only)

## 3. Profile View Structure (`BaORp`)
The Profile view will update its tabs to match the `v2` role variants:
- **Header**: Avatar, Name, Role Badge, Join Date
- **Overview/Stats Tab**: Role-specific stats (Essays submitted vs. Graded vs. Active users)
- **Activity/Essays Tab**: History of user actions or submissions
- **Achievements/Progress Tab**: Badges earned and skill mastery (Student focused)

## 4. Data Flow & Interaction States
- **State Management**: Utilize the existing `useProfile` and `useSettings` custom hooks.
- **Form State**: Managed locally with React state and `react-hook-form` where applicable.
- **Feedback**: Use shadcn/ui `sonner` toasts to satisfy the "Settings Toast States" defined in the Pencil file.
- **Modals**: Implementation of explicit "Settings Modal States" for destructive actions (e.g., Revoke Session).

## 5. Agent Team Composition
This design will be executed by two parallel `frontend-developer` agents:
1. **Agent 1**: Responsible for the Settings View (PRD-07 / `JBtMH`)
2. **Agent 2**: Responsible for the Profile View (PRD-08 / `BaORp`)