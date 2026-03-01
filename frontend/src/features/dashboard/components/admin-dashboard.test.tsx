/**
 * AdminDashboard Component Tests
 *
 * Tests for the admin dashboard component covering:
 * - Platform stats display
 * - System health monitoring
 * - User metrics visualization
 * - Health status variants (healthy/degraded/critical)
 * - Activity statistics
 * - Loading skeleton
 *
 * Run with: pnpm test -- admin-dashboard.test.tsx
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AdminDashboard,
  AdminDashboardSkeleton
} from '@/features/dashboard/components/admin-dashboard';
import type { AdminDashboardResponse } from '@/service/api/v2/types';

// Mock shadcn/ui components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid='card' className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div data-testid='card-header' className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 data-testid='card-title' className={className} {...props}>
      {children}
    </h3>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid='card-content' className={className} {...props}>
      {children}
    </div>
  )
}));

// Mock icons
vi.mock('@tabler/icons-react', () => ({
  IconUsers: () => <svg data-testid='icon-users' />,
  IconDatabase: () => <svg data-testid='icon-database' />,
  IconServer: () => <svg data-testid='icon-server' />,
  IconActivity: () => <svg data-testid='icon-activity' />,
  IconCheck: () => <svg data-testid='icon-check' />,
  IconAlertTriangle: () => <svg data-testid='icon-alert-triangle' />,
  IconAlertCircle: () => <svg data-testid='icon-alert-circle' />,
  IconExternalLink: () => <svg data-testid='icon-external-link' />
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }: any) => (
    <button className={className} {...props}>
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid='select'>{children}</div>,
  SelectContent: ({ children }: any) => (
    <div data-testid='select-content'>{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid='select-item' data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => (
    <button data-testid='select-trigger'>{children}</button>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid='select-value'>{placeholder}</span>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} {...props}>
      {children}
    </span>
  )
}));

// Mock data
const mockAdminData: AdminDashboardResponse = {
  user: {
    id: 1,
    name: 'Admin User',
    role: 'admin',
    email: 'admin@example.com'
  },
  stats: {
    totalUsers: 1500,
    activeStudents: 1200,
    activeLecturers: 300,
    totalClasses: 45,
    totalEssays: 5000,
    averageScore: 82.5,
    pendingGrading: 120,
    systemHealth: 'healthy'
  },
  recentActivity: [],
  systemStatus: {
    database: 'healthy',
    submissionsLast24h: 125,
    feedbacksLast24h: 98,
    activeUsers: 450
  }
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the component with sections', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('Platform Overview')).toBeInTheDocument();
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('User Metrics')).toBeInTheDocument();
    });
  });

  describe('Platform Stats', () => {
    it('should display total users', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    it('should display active students and lecturers breakdown', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(
        screen.getByText('1200 students, 300 lecturers')
      ).toBeInTheDocument();
    });

    it('should display total essays', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('Total Essays')).toBeInTheDocument();
    });

    it('should display submissions in last 24h', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getAllByText('125')[0]).toBeInTheDocument();
      expect(screen.getByText('Last 24h')).toBeInTheDocument();
      expect(screen.getByText('Essay submissions')).toBeInTheDocument();
    });

    it('should display active classes', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('Active Classes')).toBeInTheDocument();
      expect(screen.getByText('This semester')).toBeInTheDocument();
    });

    it('should format large numbers with commas', () => {
      const largeNumbersData: AdminDashboardResponse = {
        ...mockAdminData,
        stats: {
          ...mockAdminData.stats,
          totalUsers: 125000,
          activeStudents: 100000,
          activeLecturers: 25000
        }
      };

      render(<AdminDashboard data={largeNumbersData} />);

      expect(screen.getByText('125,000')).toBeInTheDocument();
    });
  });

  describe('System Health', () => {
    it('should display system status card', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('System Status')).toBeInTheDocument();
    });

    it('should display overall health badge', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('should display database health', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getAllByText('healthy')[0]).toBeInTheDocument();
    });

    it('should display API server health', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('API Server')).toBeInTheDocument();
    });

    it('should display feedback processing status', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('Feedback Processing')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should show idle status when no feedbacks in 24h', () => {
      const idleData: AdminDashboardResponse = {
        ...mockAdminData,
        systemStatus: {
          ...mockAdminData.systemStatus,
          feedbacksLast24h: 0
        }
      };

      render(<AdminDashboard data={idleData} />);

      expect(screen.getByText('idle')).toBeInTheDocument();
    });

    it('should display activity stats card', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('Activity (24h)')).toBeInTheDocument();
    });

    it('should display submissions count in activity', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('Submissions')).toBeInTheDocument();
      expect(screen.getAllByText('125')[0]).toBeInTheDocument();
    });

    it('should display feedback generated count', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('Feedback Generated')).toBeInTheDocument();
      expect(screen.getByText('98')).toBeInTheDocument();
    });

    it('should display active users count', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
    });
  });

  describe('Health Status Variants', () => {
    it('should show healthy status with emerald styling', () => {
      const healthyData: AdminDashboardResponse = {
        ...mockAdminData,
        stats: {
          ...mockAdminData.stats,
          systemHealth: 'healthy'
        },
        systemStatus: {
          ...mockAdminData.systemStatus,
          database: 'healthy'
        }
      };

      render(<AdminDashboard data={healthyData} />);

      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('should show degraded status with amber styling', () => {
      const degradedData: AdminDashboardResponse = {
        ...mockAdminData,
        stats: {
          ...mockAdminData.stats,
          systemHealth: 'degraded'
        }
      };

      render(<AdminDashboard data={degradedData} />);

      expect(screen.getByText('Degraded')).toBeInTheDocument();
    });

    it('should show critical status with red styling', () => {
      const criticalData: AdminDashboardResponse = {
        ...mockAdminData,
        stats: {
          ...mockAdminData.stats,
          systemHealth: 'critical'
        },
        systemStatus: {
          ...mockAdminData.systemStatus,
          database: 'critical'
        }
      };

      render(<AdminDashboard data={criticalData} />);

      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
  });

  describe('User Metrics', () => {
    it('should display user distribution section', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('User Distribution')).toBeInTheDocument();
    });

    it('should display active students count', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('1,200')).toBeInTheDocument();
      expect(screen.getByText('Active Students')).toBeInTheDocument();
    });

    it('should display active lecturers count', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('Active Lecturers')).toBeInTheDocument();
    });

    it('should display student percentage', () => {
      render(<AdminDashboard data={mockAdminData} />);

      // 1200 / (1200 + 300) = 80%
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('should display lecturer percentage', () => {
      render(<AdminDashboard data={mockAdminData} />);

      // 300 / (1200 + 300) = 20%
      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    it('should render progress bars for user distribution', () => {
      render(<AdminDashboard data={mockAdminData} />);

      // Progress bars should be present
      const progressBars = document.querySelectorAll(
        '[class*="h-2"][class*="rounded-full"]'
      );
      expect(progressBars.length).toBe(2);
    });

    it('should handle zero total users', () => {
      const zeroUsersData: AdminDashboardResponse = {
        ...mockAdminData,
        stats: {
          ...mockAdminData.stats,
          activeStudents: 0,
          activeLecturers: 0
        }
      };

      render(<AdminDashboard data={zeroUsersData} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Health Item Status', () => {
    it('should show good status with green indicator', () => {
      render(<AdminDashboard data={mockAdminData} />);

      // Database healthy should have green indicator
      const healthItems = document.querySelectorAll(
        '[class*="bg-emerald-500"]'
      );
      expect(healthItems.length).toBeGreaterThan(0);
    });

    it('should show non-good status with amber indicator', () => {
      const degradedData: AdminDashboardResponse = {
        ...mockAdminData,
        systemStatus: {
          ...mockAdminData.systemStatus,
          database: 'critical'
        }
      };

      render(<AdminDashboard data={degradedData} />);

      // Database critical should have amber indicator
      const healthItems = document.querySelectorAll('[class*="bg-amber-500"]');
      expect(healthItems.length).toBeGreaterThan(0);
    });
  });

  describe('Layout Structure', () => {
    it('should use grid layout for platform stats', () => {
      render(<AdminDashboard data={mockAdminData} />);

      const gridContainer = document.querySelector('[class*="grid grid-cols"]');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should use grid layout for system health cards', () => {
      render(<AdminDashboard data={mockAdminData} />);

      // Find grid with 2 columns for system health
      const healthGrids = document.querySelectorAll(
        '[class*="md:grid-cols-2"]'
      );
      expect(healthGrids.length).toBeGreaterThan(0);
    });

    it('should render sections in correct order', () => {
      render(<AdminDashboard data={mockAdminData} />);

      const platformHeading = screen.getByText('Platform Overview');
      const systemHealthHeading = screen.getByText('System Health');
      const userMetricsHeading = screen.getByText('User Metrics');

      // Platform should come before System Health
      expect(platformHeading.compareDocumentPosition(systemHealthHeading)).toBe(
        4
      );
      // System Health should come before User Metrics
      expect(
        systemHealthHeading.compareDocumentPosition(userMetricsHeading)
      ).toBe(4);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<AdminDashboard data={mockAdminData} />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(3);
    });

    it('has descriptive labels for stats', () => {
      render(<AdminDashboard data={mockAdminData} />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Total Essays')).toBeInTheDocument();
      expect(screen.getByText('Active Classes')).toBeInTheDocument();
    });

    it('health items have status indicators', () => {
      render(<AdminDashboard data={mockAdminData} />);

      // Status indicators (colored dots)
      const statusIndicators = document.querySelectorAll(
        '[class*="rounded-full"][class*="bg-"]'
      );
      expect(statusIndicators.length).toBeGreaterThan(2);
    });
  });

  describe('Styling', () => {
    it('applies correct icon colors for stats', () => {
      render(<AdminDashboard data={mockAdminData} />);

      // Check for icon color classes
      const blueIcons = document.querySelectorAll('[class*="text-blue-500"]');
      expect(blueIcons.length).toBeGreaterThan(0);

      const emeraldIcons = document.querySelectorAll(
        '[class*="text-emerald-500"]'
      );
      expect(emeraldIcons.length).toBeGreaterThan(0);

      const violetIcons = document.querySelectorAll(
        '[class*="text-violet-500"]'
      );
      expect(violetIcons.length).toBeGreaterThan(0);

      const amberIcons = document.querySelectorAll('[class*="text-amber-500"]');
      expect(amberIcons.length).toBeGreaterThan(0);
    });

    it('applies progress bar colors for user distribution', () => {
      render(<AdminDashboard data={mockAdminData} />);

      // Student progress bar (blue)
      const blueBars = document.querySelectorAll('[class*="bg-blue-500"]');
      expect(blueBars.length).toBeGreaterThan(0);

      // Lecturer progress bar (violet)
      const violetBars = document.querySelectorAll('[class*="bg-violet-500"]');
      expect(violetBars.length).toBeGreaterThan(0);
    });
  });
});

describe('AdminDashboardSkeleton', () => {
  it('should render skeleton loading state', () => {
    render(<AdminDashboardSkeleton />);

    // Should have multiple skeleton items
    const skeletonItems = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletonItems.length).toBeGreaterThan(5);
  });

  it('should render Platform Overview skeleton', () => {
    render(<AdminDashboardSkeleton />);

    expect(screen.getByText('Platform Overview')).toBeInTheDocument();

    // 4 stat card skeletons
    const cardSkeletons = document.querySelectorAll('[class*="h-32"]');
    expect(cardSkeletons.length).toBe(4);
  });

  it('should render System Health skeleton', () => {
    render(<AdminDashboardSkeleton />);

    expect(screen.getByText('System Health')).toBeInTheDocument();

    // 2 health card skeletons
    const healthSkeletons = document.querySelectorAll('[class*="h-48"]');
    expect(healthSkeletons.length).toBeGreaterThan(1);
  });

  it('should render User Metrics skeleton', () => {
    render(<AdminDashboardSkeleton />);

    expect(screen.getByText('User Metrics')).toBeInTheDocument();

    // User metrics card skeleton
    const metricsSkeleton = document.querySelector('[class*="h-40"]');
    expect(metricsSkeleton).toBeInTheDocument();
  });

  it('should use grid layout for skeleton cards', () => {
    render(<AdminDashboardSkeleton />);

    const gridContainers = document.querySelectorAll(
      '[class*="grid grid-cols"]'
    );
    expect(gridContainers.length).toBeGreaterThan(0);
  });
});
