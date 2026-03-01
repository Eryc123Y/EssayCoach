// Dashboard type re-exports from API v2 types
// Source: frontend/src/service/api/v2/types.ts

export type {
  // Role types
  DashboardRole,

  // Shared types
  DashboardUserInfo,
  DashboardStats,
  DashboardActivityItem,

  // Lecturer types
  LecturerStats,
  ClassOverview,
  GradingQueueItem,
  LecturerDashboardResponse,

  // Student types
  StudentStats,
  StudentEssay,
  StudentDashboardResponse,

  // Admin types
  AdminStats,
  SystemStatus,
  AdminDashboardResponse,

  // Union type
  DashboardResponse
} from '@/service/api/v2/types';

// Local dashboard-specific types
export interface DashboardConfig {
  role: 'student' | 'lecturer' | 'admin';
  refreshInterval?: number; // ms, default 60000
  enableNotifications?: boolean;
}

export interface DashboardSection {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}
