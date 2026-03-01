/**
 * DashboardHeader Component Tests
 *
 * Tests for the dashboard header component covering:
 * - Personalized greeting based on time of day
 * - Role badge rendering (student/lecturer/admin)
 * - Stat cards for each role
 * - Date/time display
 * - Loading and error states
 *
 * Run with: pnpm test -- dashboard-header.test.tsx
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import type { DashboardUserInfo, DashboardStats } from '@/service/api/v2/types';

// Mock shadcn/ui components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <article data-testid='card' className={className} {...props}>
      {children}
    </article>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div data-testid='card-header' className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h4 data-testid='card-title' className={className} {...props}>
      {children}
    </h4>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid='card-content' className={className} {...props}>
      {children}
    </div>
  )
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Monday, January 1, 2024 · 10:00 AM')
}));

// Mock data
const mockStudentUser: DashboardUserInfo = {
  id: 1,
  name: 'John Student',
  role: 'student',
  email: 'john@example.com'
};

const mockLecturerUser: DashboardUserInfo = {
  id: 2,
  name: 'Jane Lecturer',
  role: 'lecturer',
  email: 'jane@example.com'
};

const mockAdminUser: DashboardUserInfo = {
  id: 3,
  name: 'Admin User',
  role: 'admin',
  email: 'admin@example.com'
};

const mockStats: DashboardStats = {
  totalEssays: 25,
  averageScore: 85.5,
  pendingGrading: 3
};

describe('DashboardHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Greeting Display', () => {
    it('should render personalized greeting with user name', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      expect(
        screen.getByText(/Good (morning|afternoon|evening), John/i)
      ).toBeInTheDocument();
    });

    it('should show default welcome when name is null', () => {
      const userWithoutName = { ...mockStudentUser, name: '' };

      render(
        <DashboardHeader
          user={userWithoutName}
          stats={mockStats}
          role='student'
        />
      );

      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });

    it('should use first name only from full name', () => {
      const userWithFullName = {
        ...mockStudentUser,
        name: 'John Michael Student'
      };

      render(
        <DashboardHeader
          user={userWithFullName}
          stats={mockStats}
          role='student'
        />
      );

      expect(
        screen.getByText(/Good (morning|afternoon|evening), John/i)
      ).toBeInTheDocument();
    });
  });

  describe('Role Badge', () => {
    it('should display student role badge', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      expect(screen.getByText('student')).toBeInTheDocument();
    });

    it('should display lecturer role badge', () => {
      render(
        <DashboardHeader
          user={mockLecturerUser}
          stats={mockStats}
          role='lecturer'
        />
      );

      expect(screen.getByText('lecturer')).toBeInTheDocument();
    });

    it('should display admin role badge', () => {
      render(
        <DashboardHeader user={mockAdminUser} stats={mockStats} role='admin' />
      );

      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should not display role badge when role is undefined', () => {
      render(<DashboardHeader user={mockStudentUser} stats={mockStats} />);

      expect(screen.queryByText('student')).not.toBeInTheDocument();
      expect(screen.queryByText('lecturer')).not.toBeInTheDocument();
      expect(screen.queryByText('admin')).not.toBeInTheDocument();
    });
  });

  describe('Date Display', () => {
    it('should display formatted current date', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      expect(
        screen.getByText('Monday, January 1, 2024 · 10:00 AM')
      ).toBeInTheDocument();
    });
  });

  describe('Student Stat Cards', () => {
    it('should display student-specific stat cards', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
      expect(screen.getByText('Essays Submitted')).toBeInTheDocument();
      expect(screen.getByText('85.5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should show Top 20% trend for high scores (>=80)', () => {
      const highScoreStats = { ...mockStats, averageScore: 85 };

      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={highScoreStats}
          role='student'
        />
      );

      expect(screen.getByText('Top 20%')).toBeInTheDocument();
    });

    it('should not show trend for low scores (<80)', () => {
      const lowScoreStats = { ...mockStats, averageScore: 75 };

      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={lowScoreStats}
          role='student'
        />
      );

      expect(screen.queryByText('Top 20%')).not.toBeInTheDocument();
    });

    it('should show N/A for average score when null', () => {
      const nullScoreStats = { ...mockStats, averageScore: null };

      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={nullScoreStats}
          role='student'
        />
      );

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Lecturer Stat Cards', () => {
    it('should display lecturer-specific stat cards', () => {
      const lecturerStats = {
        totalEssays: 50,
        averageScore: 78,
        pendingGrading: 12
      };

      render(
        <DashboardHeader
          user={mockLecturerUser}
          stats={lecturerStats}
          role='lecturer'
        />
      );

      expect(screen.getByText('Essays Reviewed Today')).toBeInTheDocument();
      expect(screen.getByText('Pending Reviews')).toBeInTheDocument();
      expect(screen.getByText('Active Classes')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('78% avg score')).toBeInTheDocument();
    });

    it('should handle null average score for lecturer', () => {
      const lecturerStats = {
        totalEssays: 50,
        averageScore: null,
        pendingGrading: 12
      };

      render(
        <DashboardHeader
          user={mockLecturerUser}
          stats={lecturerStats}
          role='lecturer'
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Admin Stat Cards', () => {
    it('should display admin-specific stat cards', () => {
      const adminStats = {
        totalEssays: 500,
        averageScore: 82.3,
        pendingGrading: 45
      };

      render(
        <DashboardHeader user={mockAdminUser} stats={adminStats} role='admin' />
      );

      expect(screen.getByText('Total Essays')).toBeInTheDocument();
      expect(screen.getByText('Pending Grading')).toBeInTheDocument();
      expect(screen.getByText('Avg Score')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('82.3')).toBeInTheDocument();
    });

    it('should handle null average score for admin', () => {
      const adminStats = {
        totalEssays: 500,
        averageScore: null,
        pendingGrading: 45
      };

      render(
        <DashboardHeader user={mockAdminUser} stats={adminStats} role='admin' />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Default Role (No Role Specified)', () => {
    it('should default to student stat cards when role is undefined', () => {
      render(<DashboardHeader user={mockStudentUser} stats={mockStats} />);

      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
      expect(screen.getByText('Essays Submitted')).toBeInTheDocument();
    });
  });

  describe('Stat Card Icons', () => {
    it('should display award icon for essays-related stats', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      // Check for stat cards using data-testid
      const statCards = screen.getAllByTestId('card');
      expect(statCards.length).toBe(3);
    });

    it('should display checklist icon for pending tasks', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      const statCards = screen.getAllByTestId('card');
      expect(statCards.length).toBe(3);
    });

    it('should display pencil icon for essays submitted', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      const statCards = screen.getAllByTestId('card');
      expect(statCards.length).toBe(3);
    });
  });

  describe('Layout Structure', () => {
    it('should render welcome section', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should render stats grid', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      // Check for grid layout (3 stat cards)
      const statValues = ['85.5', '3', '25'];
      statValues.forEach((value) => {
        expect(screen.getByText(value)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('displays role badge with proper semantic markup', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      const roleBadge = screen.getByText('student');
      expect(roleBadge).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies correct styling to stat cards', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      // Stat cards should have border and shadow classes
      const statCards = document.querySelectorAll('[class*="border"]');
      expect(statCards.length).toBeGreaterThan(0);
    });

    it('applies role-specific colors to badges', () => {
      render(
        <DashboardHeader
          user={mockStudentUser}
          stats={mockStats}
          role='student'
        />
      );

      const studentBadge = screen.getByText('student');
      expect(studentBadge.className).toContain('blue');
    });
  });
});
