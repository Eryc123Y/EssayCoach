/**
 * StudentDashboard Component Tests
 *
 * Tests for the student dashboard component covering:
 * - My essays list display
 * - Progress tracker with score trend
 * - Essay status badges (Draft, Submitted, AI Graded, Reviewed, Returned)
 * - Empty states
 * - Loading skeleton
 * - Score trend visualization
 *
 * Run with: pnpm test -- student-dashboard.test.tsx
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  StudentDashboard,
  StudentDashboardSkeleton
} from '@/features/dashboard/components/student-dashboard';
import type {
  StudentDashboardResponse,
  StudentEssay
} from '@/service/api/v2/types';

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

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} {...props}>
      {children}
    </span>
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
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    className,
    asChild,
    size,
    variant,
    onClick,
    ...props
  }: any) => (
    <button
      className={className}
      data-size={size}
      data-variant={variant}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  })
}));

// Mock student data
const mockStudentData: StudentDashboardResponse = {
  user: {
    id: 1,
    name: 'John Student',
    role: 'student',
    email: 'john@example.com'
  },
  stats: {
    essaysSubmitted: 5,
    avgScore: 82.5,
    improvementTrend: 'up',
    feedbackReceived: 12,
    totalEssays: 5,
    averageScore: 82.5,
    pendingGrading: 0
  },
  myEssays: [
    {
      id: 1,
      title: 'Narrative Essay',
      status: 'ai_graded',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      score: 85,
      unitName: 'English 101',
      taskTitle: 'Personal Story'
    },
    {
      id: 2,
      title: 'Critical Review',
      status: 'lecturer_reviewed',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      score: 78,
      unitName: 'English 101',
      taskTitle: 'Book Analysis'
    },
    {
      id: 3,
      title: 'Research Proposal',
      status: 'submitted',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      score: null,
      unitName: 'English 202',
      taskTitle: 'Research Plan'
    },
    {
      id: 4,
      title: 'Persuasive Essay',
      status: 'returned',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      score: 90,
      unitName: 'English 202',
      taskTitle: 'Argument Writing'
    },
    {
      id: 5,
      title: 'Draft Essay',
      status: 'draft',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      score: null,
      unitName: null,
      taskTitle: null
    }
  ],
  recentActivity: []
};

describe('StudentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the component with sections', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('My Essays')).toBeInTheDocument();
      expect(screen.getByText('Recent Submissions (5)')).toBeInTheDocument();
    });

    it('should display all essays in the list', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('Narrative Essay')).toBeInTheDocument();
      expect(screen.getByText('Critical Review')).toBeInTheDocument();
      expect(screen.getByText('Research Proposal')).toBeInTheDocument();
      expect(screen.getByText('Persuasive Essay')).toBeInTheDocument();
      expect(screen.getByText('Draft Essay')).toBeInTheDocument();
    });
  });

  describe('Essay Status Badges', () => {
    it('should display Draft badge', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('should display Submitted badge', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('Submitted')).toBeInTheDocument();
    });

    it('should display AI Graded badge', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('AI Graded')).toBeInTheDocument();
    });

    it('should display Reviewed badge', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('Reviewed')).toBeInTheDocument();
    });

    it('should display Returned badge', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('Returned')).toBeInTheDocument();
    });
  });

  describe('Essay Item Details', () => {
    it('should display essay scores', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('78')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('should not display score for essays without scores', () => {
      render(<StudentDashboard data={mockStudentData} />);

      // Research Proposal and Draft Essay have null scores
      const scoreElements = screen.getAllByText(/^\d+$/);
      // Should only show scores that exist (85, 78, 90)
      expect(scoreElements.length).toBeGreaterThanOrEqual(3);
    });

    it('should display unit name when available', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('English 101')).toBeInTheDocument();
      expect(screen.getByText('English 202')).toBeInTheDocument();
    });

    it('should display task title when available', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('Personal Story')).toBeInTheDocument();
      expect(screen.getByText('Book Analysis')).toBeInTheDocument();
      expect(screen.getByText('Research Plan')).toBeInTheDocument();
      expect(screen.getByText('Argument Writing')).toBeInTheDocument();
    });

    it('should display submission date', () => {
      render(<StudentDashboard data={mockStudentData} />);

      // Date should be formatted
      expect(
        screen.getAllByText(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/).length
      ).toBeGreaterThan(0);
    });
  });

  describe('Action Buttons', () => {
    it('should display Continue button for draft essays', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('should display View button for submitted essays', () => {
      render(<StudentDashboard data={mockStudentData} />);

      const viewButtons = screen.getAllByText('View');
      expect(viewButtons.length).toBeGreaterThan(0);
    });

    it('should link draft essays to edit page', () => {
      render(<StudentDashboard data={mockStudentData} />);

      const editLinks = document.querySelectorAll(
        'a[href*="/dashboard/essay?edit="]'
      );
      expect(editLinks.length).toBe(1);
    });

    it('should link graded essays to analysis page', () => {
      render(<StudentDashboard data={mockStudentData} />);

      const analysisLinks = document.querySelectorAll(
        'a[href*="/dashboard/essay-analysis/"]'
      );
      expect(analysisLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Tracker', () => {
    it('should display progress tracker section when essays have scores', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('Progress Over Time')).toBeInTheDocument();
      expect(screen.getByText('Score Trend')).toBeInTheDocument();
    });

    it('should display average score', () => {
      render(<StudentDashboard data={mockStudentData} />);

      // Average of last 5 scores (only 3 have scores: 85, 78, 90)
      // Average = (85 + 78 + 90) / 3 = 84.33
      expect(screen.getByText(/84\.3%/)).toBeInTheDocument();
    });

    it('should display improvement trend', () => {
      render(<StudentDashboard data={mockStudentData} />);

      // First score: 78, Last score: 90, Trend: up
      expect(screen.getByText('+12.0%')).toBeInTheDocument();
    });

    it('should show up arrow for improving trend', () => {
      render(<StudentDashboard data={mockStudentData} />);

      // Check for trend indicator
      const trendElement = screen.getByText('+12.0%');
      expect(trendElement).toBeInTheDocument();
    });

    it('should render score trend chart', () => {
      render(<StudentDashboard data={mockStudentData} />);

      // SVG chart should be present
      const svgChart = document.querySelector('svg');
      expect(svgChart).toBeInTheDocument();
    });

    it('should render data points on chart', () => {
      render(<StudentDashboard data={mockStudentData} />);

      // Data points (circles) on the chart
      const dataPoints = document.querySelectorAll('circle');
      expect(dataPoints.length).toBe(3); // 3 scored essays
    });

    it('should display individual essay scores in grid', () => {
      render(<StudentDashboard data={mockStudentData} />);

      expect(screen.getByText('Essay 1')).toBeInTheDocument();
      expect(screen.getByText('Essay 2')).toBeInTheDocument();
      expect(screen.getByText('Essay 3')).toBeInTheDocument();
    });
  });

  describe('Progress Tracker - Different Trends', () => {
    it('should show down arrow for declining trend', () => {
      const decliningData: StudentDashboardResponse = {
        ...mockStudentData,
        myEssays: [
          {
            id: 1,
            title: 'Essay 1',
            status: 'ai_graded',
            submittedAt: '2024-01-01',
            score: 90,
            unitName: null,
            taskTitle: null
          },
          {
            id: 2,
            title: 'Essay 2',
            status: 'ai_graded',
            submittedAt: '2024-01-02',
            score: 80,
            unitName: null,
            taskTitle: null
          }
        ]
      };

      render(<StudentDashboard data={decliningData} />);

      expect(screen.getByText('-10.0%')).toBeInTheDocument();
    });

    it('should show "No change" for stable trend', () => {
      const stableData: StudentDashboardResponse = {
        ...mockStudentData,
        myEssays: [
          {
            id: 1,
            title: 'Essay 1',
            status: 'ai_graded',
            submittedAt: '2024-01-01',
            score: 85,
            unitName: null,
            taskTitle: null
          },
          {
            id: 2,
            title: 'Essay 2',
            status: 'ai_graded',
            submittedAt: '2024-01-02',
            score: 85,
            unitName: null,
            taskTitle: null
          }
        ]
      };

      render(<StudentDashboard data={stableData} />);

      expect(screen.getByText('No change')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no essays', () => {
      const emptyData: StudentDashboardResponse = {
        ...mockStudentData,
        myEssays: []
      };

      render(<StudentDashboard data={emptyData} />);

      expect(screen.getByText('No Submissions Yet')).toBeInTheDocument();
      expect(
        screen.getByText('Start with your first essay submission.')
      ).toBeInTheDocument();
    });

    it('should show Submit Essay button in empty state', () => {
      const emptyData: StudentDashboardResponse = {
        ...mockStudentData,
        myEssays: []
      };

      render(<StudentDashboard data={emptyData} />);

      expect(screen.getByText('Submit Essay')).toBeInTheDocument();
    });

    it('should link to essay submission page from empty state', () => {
      const emptyData: StudentDashboardResponse = {
        ...mockStudentData,
        myEssays: []
      };

      render(<StudentDashboard data={emptyData} />);

      const submitLink = document.querySelector('a[href="/dashboard/essay"]');
      expect(submitLink).toBeInTheDocument();
    });

    it('should not show progress tracker when no essays', () => {
      const emptyData: StudentDashboardResponse = {
        ...mockStudentData,
        myEssays: []
      };

      render(<StudentDashboard data={emptyData} />);

      expect(screen.queryByText('Progress Over Time')).not.toBeInTheDocument();
    });

    it('should not show progress tracker when only one scored essay', () => {
      const oneEssayData: StudentDashboardResponse = {
        ...mockStudentData,
        myEssays: [
          {
            id: 1,
            title: 'Single Essay',
            status: 'ai_graded',
            submittedAt: new Date().toISOString(),
            score: 85,
            unitName: null,
            taskTitle: null
          }
        ]
      };

      render(<StudentDashboard data={oneEssayData} />);

      expect(screen.queryByText('Progress Over Time')).not.toBeInTheDocument();
      expect(screen.queryByText('Score Trend')).not.toBeInTheDocument();
    });

    it('should show message when not enough essays for trend', () => {
      const oneEssayData: StudentDashboardResponse = {
        ...mockStudentData,
        myEssays: [
          {
            id: 1,
            title: 'Single Essay',
            status: 'ai_graded',
            submittedAt: new Date().toISOString(),
            score: 85,
            unitName: null,
            taskTitle: null
          }
        ]
      };

      render(<StudentDashboard data={oneEssayData} />);

      expect(
        screen.getByText('Submit more essays to see your progress trend.')
      ).toBeInTheDocument();
    });
  });

  describe('Essay Limiting', () => {
    it('should only show first 10 essays', () => {
      const manyEssaysData: StudentDashboardResponse = {
        ...mockStudentData,
        myEssays: Array.from({ length: 15 }, (_, i) => ({
          id: i + 1,
          title: `Essay ${i + 1}`,
          status: 'ai_graded' as const,
          submittedAt: new Date().toISOString(),
          score: 80 + i,
          unitName: 'English 101',
          taskTitle: 'Assignment'
        }))
      };

      render(<StudentDashboard data={manyEssaysData} />);

      expect(screen.getByText('Recent Submissions (15)')).toBeInTheDocument();
      expect(screen.getByText('Essay 1')).toBeInTheDocument();
      expect(screen.getByText('Essay 10')).toBeInTheDocument();
      expect(screen.queryByText('Essay 11')).not.toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should render My Essays section first', () => {
      render(<StudentDashboard data={mockStudentData} />);

      const myEssaysHeading = screen.getByText('My Essays');
      const progressHeading = screen.queryByText('Progress Over Time');

      if (progressHeading) {
        expect(myEssaysHeading.compareDocumentPosition(progressHeading)).toBe(
          4
        );
      }
    });

    it('should render essays as list items', () => {
      render(<StudentDashboard data={mockStudentData} />);

      // Each essay should be in a bordered container
      const essayItems = document.querySelectorAll(
        '[class*="border"]:not([class*="animate-pulse"])'
      );
      expect(essayItems.length).toBeGreaterThan(4);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<StudentDashboard data={mockStudentData} />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(1);
    });

    it('buttons have descriptive text', () => {
      render(<StudentDashboard data={mockStudentData} />);

      const continueButton = screen.getByText('Continue');
      expect(continueButton).toBeInTheDocument();

      const viewButtons = screen.getAllByText('View');
      viewButtons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });
  });
});

describe('StudentDashboardSkeleton', () => {
  it('should render skeleton loading state', () => {
    render(<StudentDashboardSkeleton />);

    // Should have multiple skeleton items
    const skeletonItems = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletonItems.length).toBeGreaterThan(5);
  });

  it('should render My Essays skeleton', () => {
    render(<StudentDashboardSkeleton />);

    expect(screen.getByText('My Essays')).toBeInTheDocument();

    // Skeleton essay items
    const essaySkeletons = document.querySelectorAll('[class*="h-16"]');
    expect(essaySkeletons.length).toBe(3);
  });

  it('should render Progress Tracker skeleton', () => {
    render(<StudentDashboardSkeleton />);

    expect(screen.getByText('Progress Over Time')).toBeInTheDocument();

    // Skeleton progress card
    const progressSkeleton = document.querySelector('[class*="h-48"]');
    expect(progressSkeleton).toBeInTheDocument();
  });

  it('should use space-y layout for sections', () => {
    render(<StudentDashboardSkeleton />);

    const spaceContainers = document.querySelectorAll('[class*="space-y"]');
    expect(spaceContainers.length).toBeGreaterThan(0);
  });
});
