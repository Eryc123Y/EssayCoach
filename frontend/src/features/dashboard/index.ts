// Dashboard Feature Exports
// Usage: import { useDashboardData, DashboardHeader, ... } from '@/features/dashboard';

// Hooks
export { useDashboardData } from './hooks/useDashboardData';
export type { UseDashboardDataReturn } from './hooks/useDashboardData';

// Components - Shared
export { DashboardHeader } from './components/dashboard-header';
export { ActivityFeed } from './components/activity-feed';

// Components - Role Specific
export { LecturerDashboard } from './components/lecturer-dashboard';
export { StudentDashboard } from './components/student-dashboard';
export { AdminDashboard } from './components/admin-dashboard';

// Types
export * from './types/dashboard';
