# Profile & Settings Functional Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sync the existing frontend code for Profile and Settings with the functional requirements and layouts specified in the Pencil design file (`pencil-shadcn.pen`), ensuring robust feature completion and correct role-based rendering.

**Architecture:** Single-page applications (`/dashboard/settings` and `/dashboard/profile`) with role-based component rendering. We will use existing `useProfile` and `useSettings` hooks, and implement basic layout structures that match the Pencil wireframes without over-polishing the UI yet.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, shadcn/ui, Zustand, React Hook Form.

---

### Task 1: Setup Settings Page Structure & Roles

**Files:**
- Modify: `frontend/src/app/dashboard/settings/page.tsx`
- Modify: `frontend/src/features/settings/components/settings-sidebar.tsx`

**Step 1: Write the failing test**
Create a test to verify the settings page renders role-specific sidebar items.
Create: `frontend/src/features/settings/__tests__/settings-sidebar.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { SettingsSidebar } from '../components/settings-sidebar';

describe('SettingsSidebar', () => {
  it('shows Organization tab only for admins', () => {
    render(<SettingsSidebar currentTab="account" onTabChange={() => {}} userRole="admin" />);
    expect(screen.getByText('Organization')).toBeInTheDocument();

    render(<SettingsSidebar currentTab="account" onTabChange={() => {}} userRole="student" />);
    expect(screen.queryByText('Organization')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `cd frontend && pnpm exec vitest run src/features/settings/__tests__/settings-sidebar.test.tsx`
Expected: FAIL because `userRole` prop doesn't exist yet.

**Step 3: Write minimal implementation**
Update `settings-sidebar.tsx` to accept and use `userRole`.

```tsx
// frontend/src/features/settings/components/settings-sidebar.tsx
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/components/layout/simple-auth-context';

interface SettingsSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole?: UserRole; // Added prop
}

export function SettingsSidebar({ currentTab, onTabChange, userRole }: SettingsSidebarProps) {
  const tabs = [
    { id: 'account', label: 'Account' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ];

  if (userRole === 'admin') {
    tabs.push({ id: 'organization', label: 'Organization' });
  }

  return (
    <nav className="flex flex-col gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={currentTab === tab.id ? 'secondary' : 'ghost'}
          className="justify-start"
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </nav>
  );
}
```

**Step 4: Run test to verify it passes**
Run: `cd frontend && pnpm exec vitest run src/features/settings/__tests__/settings-sidebar.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/settings/__tests__/settings-sidebar.test.tsx frontend/src/features/settings/components/settings-sidebar.tsx
git commit -m "feat: add role-based rendering to settings sidebar"
```

---

### Task 2: Implement Profile Role Variants

**Files:**
- Modify: `frontend/src/features/profile/components/profile-view-page.tsx`
- Modify: `frontend/src/features/profile/components/tab-navigation.tsx`

**Step 1: Write the failing test**
Create: `frontend/src/features/profile/__tests__/tab-navigation.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { TabNavigation } from '../components/tab-navigation';

describe('TabNavigation', () => {
  it('hides Achievements tab for non-students', () => {
    render(<TabNavigation activeTab="essays" onTabChange={() => {}} userRole="lecturer" />);
    expect(screen.queryByText('Achievements')).not.toBeInTheDocument();

    render(<TabNavigation activeTab="essays" onTabChange={() => {}} userRole="student" />);
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `cd frontend && pnpm exec vitest run src/features/profile/__tests__/tab-navigation.test.tsx`
Expected: FAIL because `userRole` prop doesn't exist.

**Step 3: Write minimal implementation**
Update `tab-navigation.tsx` to handle `userRole`.

```tsx
// frontend/src/features/profile/components/tab-navigation.tsx
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/components/layout/simple-auth-context';

export type TabId = 'essays' | 'achievements' | 'progress';

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  userRole?: UserRole;
}

export function TabNavigation({ activeTab, onTabChange, userRole }: TabNavigationProps) {
  return (
    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
      <Button
        variant={activeTab === 'essays' ? 'secondary' : 'ghost'}
        onClick={() => onTabChange('essays')}
      >
        Activity
      </Button>

      {userRole === 'student' && (
        <Button
          variant={activeTab === 'achievements' ? 'secondary' : 'ghost'}
          onClick={() => onTabChange('achievements')}
        >
          Achievements
        </Button>
      )}

      <Button
        variant={activeTab === 'progress' ? 'secondary' : 'ghost'}
        onClick={() => onTabChange('progress')}
      >
        Progress
      </Button>
    </div>
  );
}
```

Update `profile-view-page.tsx` to pass the `user.role` down.

**Step 4: Run test to verify it passes**
Run: `cd frontend && pnpm exec vitest run src/features/profile/__tests__/tab-navigation.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/profile/__tests__/tab-navigation.test.tsx frontend/src/features/profile/components/tab-navigation.tsx frontend/src/features/profile/components/profile-view-page.tsx
git commit -m "feat: add role-based tabs to profile view"
```

---

### Task 3: Complete Settings Forms Integration

**Files:**
- Modify: `frontend/src/features/settings/components/account-section.tsx`
- Modify: `frontend/src/features/settings/components/notifications-section.tsx`

**Step 1: Write the failing test**
Create: `frontend/src/features/settings/__tests__/account-section.test.tsx`
Verify that `useSettings` hook is called when the form is submitted.

**Step 2: Run test to verify it fails**
Run: `cd frontend && pnpm exec vitest run src/features/settings/__tests__/account-section.test.tsx`

**Step 3: Write minimal implementation**
Connect the existing `account-section.tsx` inputs to the `updatePreferences` function from the `useSettings` hook. Add `sonner` toast notifications on success/error.

**Step 4: Run test to verify it passes**
Run: `cd frontend && pnpm exec vitest run src/features/settings/__tests__/account-section.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/settings/__tests__/account-section.test.tsx frontend/src/features/settings/components/account-section.tsx
git commit -m "feat: integrate settings forms with API hooks"
```