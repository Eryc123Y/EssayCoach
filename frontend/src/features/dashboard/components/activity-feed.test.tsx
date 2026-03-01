/**
 * ActivityFeed Component Tests
 *
 * Tests for the activity feed component covering:
 * - Timeline layout with activity items
 * - Different activity types (submission/feedback/grade/comment)
 * - Loading skeleton state
 * - Error state with retry
 * - Empty state
 * - Activity limiting
 *
 * Run with: pnpm test -- activity-feed.test.tsx
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ActivityFeed,
  ActivityFeedSkeleton,
  ActivityFeedError
} from '@/features/dashboard/components/activity-feed';
import type { DashboardActivityItem } from '@/service/api/v2/types';

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

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick, ...props }: any) => (
    <button className={className} onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Jan 1, 2024'),
  formatDistanceToNow: vi.fn((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  })
}));

// Mock activity data
const mockActivities: DashboardActivityItem[] = [
  {
    id: 1,
    type: 'submission',
    title: 'Essay Submitted',
    description: 'You submitted "Narrative Essay" for grading',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    icon: 'file'
  },
  {
    id: 2,
    type: 'feedback',
    title: 'Feedback Received',
    description: 'AI feedback is ready for "Critical Review"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    icon: 'message'
  },
  {
    id: 3,
    type: 'grade',
    title: 'Essay Graded',
    description: '"Research Proposal" received a score of 88%',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    icon: 'star'
  },
  {
    id: 4,
    type: 'comment',
    title: 'Comment Added',
    description: 'Lecturer commented on your essay',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    icon: 'user-check'
  },
  {
    id: 5,
    type: 'submission',
    title: 'Draft Saved',
    description: 'Your draft "Persuasive Essay" was saved',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    icon: 'file'
  }
];

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the component with default title', () => {
      render(<ActivityFeed activities={mockActivities} />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(
        <ActivityFeed activities={mockActivities} title='My Activity Feed' />
      );

      expect(screen.getByText('My Activity Feed')).toBeInTheDocument();
    });

    it('should render all activity items', () => {
      render(<ActivityFeed activities={mockActivities} />);

      expect(screen.getByText('Essay Submitted')).toBeInTheDocument();
      expect(screen.getByText('Feedback Received')).toBeInTheDocument();
      expect(screen.getByText('Essay Graded')).toBeInTheDocument();
      expect(screen.getByText('Comment Added')).toBeInTheDocument();
      expect(screen.getByText('Draft Saved')).toBeInTheDocument();
    });

    it('should render activity descriptions', () => {
      render(<ActivityFeed activities={mockActivities} />);

      expect(
        screen.getByText('You submitted "Narrative Essay" for grading')
      ).toBeInTheDocument();
      expect(
        screen.getByText('AI feedback is ready for "Critical Review"')
      ).toBeInTheDocument();
      expect(
        screen.getByText('"Research Proposal" received a score of 88%')
      ).toBeInTheDocument();
    });
  });

  describe('Activity Limiting', () => {
    it('should limit activities to default 10', () => {
      const manyActivities = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        type: 'submission' as const,
        title: `Activity ${i + 1}`,
        description: `Description ${i + 1}`,
        timestamp: new Date().toISOString(),
        icon: 'file'
      }));

      render(<ActivityFeed activities={manyActivities} />);

      // Only first 10 should be rendered
      expect(screen.getByText('Activity 1')).toBeInTheDocument();
      expect(screen.getByText('Activity 10')).toBeInTheDocument();
      expect(screen.queryByText('Activity 11')).not.toBeInTheDocument();
    });

    it('should respect custom limit prop', () => {
      render(<ActivityFeed activities={mockActivities} limit={3} />);

      expect(screen.getByText('Essay Submitted')).toBeInTheDocument();
      expect(screen.getByText('Feedback Received')).toBeInTheDocument();
      expect(screen.getByText('Essay Graded')).toBeInTheDocument();
      expect(screen.queryByText('Comment Added')).not.toBeInTheDocument();
    });

    it('should show all activities when limit is higher than count', () => {
      render(<ActivityFeed activities={mockActivities} limit={20} />);

      expect(screen.getByText('Draft Saved')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no activities', () => {
      render(<ActivityFeed activities={[]} />);

      expect(screen.getByText('No recent activity.')).toBeInTheDocument();
    });

    it('should display custom empty message', () => {
      render(
        <ActivityFeed activities={[]} emptyMessage='You have no activity yet' />
      );

      expect(screen.getByText('You have no activity yet')).toBeInTheDocument();
    });

    it('should show file icon in empty state', () => {
      render(<ActivityFeed activities={[]} />);

      // Check for the empty state container
      const emptyState = screen.getByText('No recent activity.').closest('div');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Activity Types', () => {
    it('should render submission activity with correct icon styling', () => {
      const submissionActivity: DashboardActivityItem[] = [
        {
          id: 1,
          type: 'submission',
          title: 'New Submission',
          description: 'Essay submitted',
          timestamp: new Date().toISOString(),
          icon: 'file'
        }
      ];

      render(<ActivityFeed activities={submissionActivity} />);

      expect(screen.getByText('New Submission')).toBeInTheDocument();
      expect(screen.getByText('Essay submitted')).toBeInTheDocument();
    });

    it('should render feedback activity', () => {
      const feedbackActivity: DashboardActivityItem[] = [
        {
          id: 1,
          type: 'feedback',
          title: 'Feedback Ready',
          description: 'Your essay has been graded',
          timestamp: new Date().toISOString(),
          icon: 'message'
        }
      ];

      render(<ActivityFeed activities={feedbackActivity} />);

      expect(screen.getByText('Feedback Ready')).toBeInTheDocument();
    });

    it('should render grade activity', () => {
      const gradeActivity: DashboardActivityItem[] = [
        {
          id: 1,
          type: 'grade',
          title: 'Grade Posted',
          description: 'Score: 92/100',
          timestamp: new Date().toISOString(),
          icon: 'star'
        }
      ];

      render(<ActivityFeed activities={gradeActivity} />);

      expect(screen.getByText('Grade Posted')).toBeInTheDocument();
    });

    it('should render comment activity', () => {
      const commentActivity: DashboardActivityItem[] = [
        {
          id: 1,
          type: 'comment',
          title: 'New Comment',
          description: 'Lecturer left a comment',
          timestamp: new Date().toISOString(),
          icon: 'user-check'
        }
      ];

      render(<ActivityFeed activities={commentActivity} />);

      expect(screen.getByText('New Comment')).toBeInTheDocument();
    });
  });

  describe('Timestamp Display', () => {
    it('should display relative time for each activity', () => {
      render(<ActivityFeed activities={mockActivities} />);

      // Check that timestamps are rendered (formatDistanceToNow returns relative time)
      expect(screen.getByText('30 minutes ago')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      expect(screen.getByText('1 days ago')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should render activity items in vertical list', () => {
      render(<ActivityFeed activities={mockActivities} />);

      // Activities should be in a space-y-4 container
      const activityContainer = document.querySelector('[class*="space-y"]');
      expect(activityContainer).toBeInTheDocument();
    });

    it('should render each activity with icon, content, and timestamp', () => {
      render(<ActivityFeed activities={mockActivities} />);

      // Each activity should have the layout structure
      const activityItems = document.querySelectorAll(
        '[class*="flex items-start gap"]'
      );
      expect(activityItems.length).toBe(5);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading for the feed title', () => {
      render(<ActivityFeed activities={mockActivities} />);

      const title = screen.getByTestId('card-title');
      expect(title.tagName.toLowerCase()).toBe('h4');
    });

    it('has descriptive text for each activity', () => {
      render(<ActivityFeed activities={mockActivities} />);

      mockActivities.forEach((activity) => {
        expect(screen.getByText(activity.title)).toBeInTheDocument();
        expect(screen.getByText(activity.description)).toBeInTheDocument();
      });
    });
  });
});

describe('ActivityFeedSkeleton', () => {
  it('should render skeleton loading state', () => {
    render(<ActivityFeedSkeleton />);

    // Should have multiple skeleton items
    const skeletonItems = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletonItems.length).toBeGreaterThan(5);
  });

  it('should render title placeholder', () => {
    render(<ActivityFeedSkeleton />);

    const titlePlaceholder = document.querySelector('[class*="w-32"]');
    expect(titlePlaceholder).toBeInTheDocument();
  });

  it('should render 5 skeleton activity items', () => {
    render(<ActivityFeedSkeleton />);

    // Count skeleton activity rows
    const activityRows = document.querySelectorAll(
      '[class*="flex items-start gap"]'
    );
    expect(activityRows.length).toBe(5);
  });
});

describe('ActivityFeedError', () => {
  it('should render error state with message', () => {
    const mockError = new Error('Failed to load activity');
    const onRetry = vi.fn();

    render(<ActivityFeedError error={mockError} onRetry={onRetry} />);

    expect(screen.getByText('Failed to Load Activity')).toBeInTheDocument();
    expect(screen.getByText('Failed to load activity')).toBeInTheDocument();
  });

  it('should render with generic message when error message is empty', () => {
    const mockError = new Error('');
    const onRetry = vi.fn();

    render(<ActivityFeedError error={mockError} onRetry={onRetry} />);

    expect(
      screen.getByText('An unexpected error occurred.')
    ).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const mockError = new Error('Network error');
    const onRetry = vi.fn();

    render(<ActivityFeedError error={mockError} onRetry={onRetry} />);

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should have destructive styling for error state', () => {
    const mockError = new Error('Failed');
    const onRetry = vi.fn();

    render(<ActivityFeedError error={mockError} onRetry={onRetry} />);

    const card = screen.getByText('Failed to Load Activity').closest('div');
    expect(card?.className).toContain('destructive');
  });
});
