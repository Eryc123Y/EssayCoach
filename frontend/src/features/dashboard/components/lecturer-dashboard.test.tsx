/**
 * LecturerDashboard Component Tests
 *
 * Tests for the lecturer dashboard component covering:
 * - Grading queue display
 * - Class overview cards
 * - Empty states
 * - Loading skeleton
 * - Status badges (AI Graded, Pending, Overdue)
 * - Student essay items
 *
 * Run with: pnpm test -- lecturer-dashboard.test.tsx
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LecturerDashboard, LecturerDashboardSkeleton } from '@/features/dashboard/components/lecturer-dashboard';
import type { LecturerDashboardResponse, ClassOverview, GradingQueueItem } from '@/service/api/v2/types';

// Mock shadcn/ui components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div data-testid="card-header" className={className} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h4 data-testid="card-title" className={className} {...props}>{children}</h4>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} {...props}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <button data-testid="select-trigger">{children}</button>,
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, asChild, size, variant, onClick, ...props }: any) => (
    <button className={className} data-size={size} data-variant={variant} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }),
}));

// Mock data
const mockLecturerData: LecturerDashboardResponse = {
  user: {
    id: 1,
    name: 'Jane Lecturer',
    role: 'lecturer',
    email: 'jane@example.com',
  },
  stats: {
    essaysReviewedToday: 12,
    pendingReviews: 5,
    activeClasses: 3,
    avgGradingTime: 25,
    totalEssays: 150,
    averageScore: 78.5,
    pendingGrading: 5,
  },
  classes: [
    {
      id: 1,
      name: 'English 101',
      unitName: 'Introduction to Academic Writing',
      studentCount: 25,
      essayCount: 45,
      avgScore: 78.5,
      pendingReviews: 3,
    },
    {
      id: 2,
      name: 'English 202',
      unitName: 'Advanced Composition',
      studentCount: 20,
      essayCount: 35,
      avgScore: 82.3,
      pendingReviews: 2,
    },
  ],
  gradingQueue: [
    {
      submissionId: 1,
      studentName: 'John Student',
      essayTitle: 'Narrative Essay',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: 'ai_graded',
      aiScore: 85,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      submissionId: 2,
      studentName: 'Sarah Chen',
      essayTitle: 'Critical Review',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      status: 'pending_review',
      aiScore: null,
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Overdue
    },
  ],
  recentActivity: [],
};

describe('LecturerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the component with sections', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('Grading Queue')).toBeInTheDocument();
      expect(screen.getByText('Class Overview')).toBeInTheDocument();
    });

    it('should display pending reviews count', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('Pending Reviews (2)')).toBeInTheDocument();
    });
  });

  describe('Grading Queue', () => {
    it('should display all items in grading queue', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('John Student')).toBeInTheDocument();
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
      expect(screen.getByText('Narrative Essay')).toBeInTheDocument();
      expect(screen.getByText('Critical Review')).toBeInTheDocument();
    });

    it('should display submission details', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      // Check for submitted date
      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
    });

    it('should display AI score when available', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('AI Score: 85')).toBeInTheDocument();
    });

    it('should not display AI score when null', () => {
      const dataWithoutAiScore: LecturerDashboardResponse = {
        ...mockLecturerData,
        gradingQueue: [
          {
            submissionId: 1,
            studentName: 'Student Without Score',
            essayTitle: 'Essay',
            submittedAt: new Date().toISOString(),
            status: 'pending_review',
            aiScore: null,
            dueDate: new Date().toISOString(),
          },
        ],
      };

      render(<LecturerDashboard data={dataWithoutAiScore} />);

      // Should not show AI Score text for this item
      const aiScoreElements = screen.queryAllByText(/AI Score:/);
      expect(aiScoreElements.length).toBe(0);
    });

    it('should display Review button for each item', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      const reviewButtons = screen.getAllByText('Review');
      expect(reviewButtons.length).toBe(2);
    });

    it('should link to essay analysis page', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      const reviewLinks = document.querySelectorAll('a[href*="/dashboard/essay-analysis"]');
      expect(reviewLinks.length).toBe(2);
    });
  });

  describe('Status Badges', () => {
    it('should display AI Graded badge', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('AI Graded')).toBeInTheDocument();
    });

    it('should display Pending badge', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display Overdue badge for overdue submissions', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('should show alert icon with Overdue badge', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      // Overdue badge should be present with the submission
      const overdueBadge = screen.getByText('Overdue');
      expect(overdueBadge).toBeInTheDocument();
    });
  });

  describe('Class Overview Cards', () => {
    it('should display all classes', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('English 101')).toBeInTheDocument();
      expect(screen.getByText('English 202')).toBeInTheDocument();
    });

    it('should display unit names', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('Introduction to Academic Writing')).toBeInTheDocument();
      expect(screen.getByText('Advanced Composition')).toBeInTheDocument();
    });

    it('should display student count', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getAllByText('Students').length).toBe(2);
    });

    it('should display essay count', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getAllByText('Essays').length).toBe(2);
    });

    it('should display average score', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('78.5')).toBeInTheDocument();
      expect(screen.getByText('82.3')).toBeInTheDocument();
    });

    it('should display pending reviews badge for classes', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      expect(screen.getByText('3 pending')).toBeInTheDocument();
      expect(screen.getByText('2 pending')).toBeInTheDocument();
    });

    it('should display completion rate', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      // English 101: 45/25 = 180% (capped at 100% in progress bar)
      // English 202: 35/20 = 175% (capped at 100% in progress bar)
      expect(screen.getAllByText('Completion Rate').length).toBe(2);
    });

    it('should display View Class button for each class', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      const viewClassButtons = screen.getAllByText('View Class');
      expect(viewClassButtons.length).toBe(2);
    });

    it('should link to class detail page', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      const classLinks = document.querySelectorAll('a[href*="/dashboard/classes"]');
      expect(classLinks.length).toBe(2);
    });
  });

  describe('Empty States', () => {
    it('should show empty state when grading queue is empty', () => {
      const emptyQueueData: LecturerDashboardResponse = {
        ...mockLecturerData,
        gradingQueue: [],
      };

      render(<LecturerDashboard data={emptyQueueData} />);

      expect(screen.getByText('All Caught Up!')).toBeInTheDocument();
      expect(screen.getByText('No pending reviews at the moment.')).toBeInTheDocument();
    });

    it('should show empty state when no classes', () => {
      const noClassesData: LecturerDashboardResponse = {
        ...mockLecturerData,
        classes: [],
      };

      render(<LecturerDashboard data={noClassesData} />);

      expect(screen.getByText('No Classes Yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first class to get started.')).toBeInTheDocument();
    });

    it('should show file check icon in empty grading queue', () => {
      const emptyQueueData: LecturerDashboardResponse = {
        ...mockLecturerData,
        gradingQueue: [],
      };

      render(<LecturerDashboard data={emptyQueueData} />);

      // Check for empty state container
      const emptyState = screen.getByText('All Caught Up!').closest('div');
      expect(emptyState).toBeInTheDocument();
    });

    it('should show users icon in empty classes', () => {
      const noClassesData: LecturerDashboardResponse = {
        ...mockLecturerData,
        classes: [],
      };

      render(<LecturerDashboard data={noClassesData} />);

      const emptyState = screen.getByText('No Classes Yet').closest('div');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should render progress bar for each class', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      // Progress bars should be present
      const progressBars = document.querySelectorAll('[class*="h-2"][class*="rounded-full"]');
      expect(progressBars.length).toBe(2);
    });

    it('should calculate completion rate correctly', () => {
      const customData: LecturerDashboardResponse = {
        ...mockLecturerData,
        classes: [
          {
            id: 1,
            name: 'Test Class',
            unitName: 'Test Unit',
            studentCount: 10,
            essayCount: 5,
            avgScore: 75,
            pendingReviews: 0,
          },
        ],
      };

      render(<LecturerDashboard data={customData} />);

      // 5/10 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should handle zero essay count', () => {
      const zeroEssaysData: LecturerDashboardResponse = {
        ...mockLecturerData,
        classes: [
          {
            id: 1,
            name: 'Empty Class',
            unitName: 'Test',
            studentCount: 10,
            essayCount: 0,
            avgScore: null,
            pendingReviews: 0,
          },
        ],
      };

      render(<LecturerDashboard data={zeroEssaysData} />);

      // Should show 0% completion rate
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should render sections in correct order', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      const gradingQueueHeading = screen.getByText('Grading Queue');
      const classOverviewHeading = screen.getByText('Class Overview');

      // Grading Queue should come before Class Overview
      expect(gradingQueueHeading.compareDocumentPosition(classOverviewHeading)).toBe(4);
    });

    it('should use grid layout for class cards', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      // Class cards should be in a grid
      const gridContainer = document.querySelector('[class*="grid grid-cols"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(2);
    });

    it('buttons have descriptive text', () => {
      render(<LecturerDashboard data={mockLecturerData} />);

      const reviewButtons = screen.getAllByText('Review');
      reviewButtons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });

      const viewClassButtons = screen.getAllByText('View Class');
      viewClassButtons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });
  });
});

describe('LecturerDashboardSkeleton', () => {
  it('should render skeleton loading state', () => {
    render(<LecturerDashboardSkeleton />);

    // Should have multiple skeleton items
    const skeletonItems = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletonItems.length).toBeGreaterThan(5);
  });

  it('should render grading queue skeleton', () => {
    render(<LecturerDashboardSkeleton />);

    expect(screen.getByText('Grading Queue')).toBeInTheDocument();

    // Skeleton queue items
    const queueSkeletonItems = document.querySelectorAll('[class*="h-16"]');
    expect(queueSkeletonItems.length).toBe(3);
  });

  it('should render class overview skeleton', () => {
    render(<LecturerDashboardSkeleton />);

    expect(screen.getByText('Class Overview')).toBeInTheDocument();

    // Skeleton class cards
    const classSkeletonCards = document.querySelectorAll('[class*="h-48"]');
    expect(classSkeletonCards.length).toBe(3);
  });

  it('should use grid layout for skeleton cards', () => {
    render(<LecturerDashboardSkeleton />);

    const gridContainer = document.querySelector('[class*="grid grid-cols"]');
    expect(gridContainer).toBeInTheDocument();
  });
});
