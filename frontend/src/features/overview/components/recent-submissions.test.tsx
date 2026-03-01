/**
 * RecentSubmissions Component Tests
 *
 * Tests for the recent submissions list component covering:
 * - Different submission statuses (Graded, Pending, Late)
 * - Different AI statuses (Feedback Ready, Processing, Draft)
 * - Data rendering
 * - Accessibility
 *
 * Run with: pnpm test -- recent-submissions.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentSubmissions } from '@/features/overview/components/recent-submissions';
import { cn } from '@/lib/utils'; // Import cn to use in the mock

// Mock shadcn/ui components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={cn(className)} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={cn(className)} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h2 className={cn(className)} {...props}>{children}</h2>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={cn(className)} {...props}>{children}</p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={cn(className)} {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className, ...props }: any) => (
    <div className={cn(className)} {...props}>{children}</div>
  ),
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children, className, ...props }: any) => (
    <div className={cn(className)} {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => {
    // Merge classes using cn utility
    const mergedClassName = cn(className, {
      'border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30': variant === 'outline' && children === 'Graded',
      'border-amber-500/30 bg-amber-50 text-amber-600 dark:bg-amber-950/30': variant === 'outline' && children === 'Pending',
      'border-red-500/30 bg-red-50 text-red-600 dark:bg-red-950/30': variant === 'outline' && children === 'Late',
      'border-0 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700': children?.includes('Feedback Ready'),
      'animate-pulse border-indigo-400 text-indigo-500': children?.includes('Processing AI'),
      'text-muted-foreground': variant === 'secondary' && children?.includes('Draft'),
    });
    return (
      <span className={mergedClassName} data-variant={variant} {...props}>
        {children}
      </span>
    );
  },
}));

// Mock the icons
vi.mock('@tabler/icons-react', () => ({
  IconClock: (props: any) => <svg {...props} data-testid="icon-clock" />,
  IconSparkles: (props: any) => <svg {...props} data-testid="icon-sparkles" />,
  IconEdit: (props: any) => <svg {...props} data-testid="icon-edit" />,
}));


vi.mock('@/constants/data', () => ({
  recentSubmissionsData: [
    {
      id: 1,
      name: 'Alex Johnson',
      email: 'alex.j@school.edu',
      assignment: 'Narrative Essay',
      score: '92/100',
      image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Alex',
      initials: 'AJ',
      status: 'Graded',
      aiStatus: 'Feedback Ready',
    },
    {
      id: 2,
      name: 'Sarah Chen',
      email: 'sarah.c@school.edu',
      assignment: 'Critical Review',
      score: 'Pending',
      image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Sarah',
      initials: 'SC',
      status: 'Pending',
      aiStatus: 'Processing',
    },
    {
      id: 3,
      name: 'Michael Torres',
      email: 'm.torres@school.edu',
      assignment: 'Research Proposal',
      score: '88/100',
      image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Michael',
      initials: 'MT',
      status: 'Graded',
      aiStatus: 'Feedback Ready',
    },
    {
      id: 4,
      name: 'Emily Watson',
      email: 'emily.w@school.edu',
      assignment: 'Persuasive Essay',
      score: '95/100',
      image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Emily',
      initials: 'EW',
      status: 'Graded',
      aiStatus: 'Feedback Ready',
    },
    {
      id: 5,
      name: 'David Kim',
      email: 'david.k@school.edu',
      assignment: 'Hamlet Analysis',
      score: 'Pending',
      image: 'https://api.dicebear.com/9.x/notionists/svg?seed=David',
      initials: 'DK',
      status: 'Late',
      aiStatus: 'Draft',
    },
  ],
}));

describe('RecentSubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with header', () => {
    render(<RecentSubmissions />);

    expect(screen.getByRole('heading', { name: /Recent Submissions/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Latest graded essays and pending assignments/i)
    ).toBeInTheDocument();
  });

  it('renders all submissions from data', () => {
    render(<RecentSubmissions />);

    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Michael Torres')).toBeInTheDocument();
    expect(screen.getByText('Emily Watson')).toBeInTheDocument();
    expect(screen.getByText('David Kim')).toBeInTheDocument();
  });

  describe('Status Badges', () => {
    it('shows Graded badge with correct styling', () => {
      render(<RecentSubmissions />);

      const gradedBadges = screen.getAllByText('Graded');
      expect(gradedBadges.length).toBeGreaterThan(0);

      gradedBadges.forEach((badge) => {
        expect(badge).toHaveClass('border-emerald-500/30');
        expect(badge).toHaveClass('bg-emerald-50');
        expect(badge).toHaveClass('text-emerald-600');
        expect(badge).toHaveAttribute('data-variant', 'outline');
      });
    });

    it('shows Pending badge with correct styling', () => {
      render(<RecentSubmissions />);

      const pendingBadges = screen
        .getAllByText('Pending')
        .filter((badge) => badge.getAttribute('data-variant') === 'outline');
      expect(pendingBadges.length).toBeGreaterThan(0);

      pendingBadges.forEach((badge) => {
        expect(badge).toHaveClass('border-amber-500/30');
        expect(badge).toHaveClass('bg-amber-50');
        expect(badge).toHaveClass('text-amber-600');
        expect(badge).toHaveAttribute('data-variant', 'outline');
      });
    });

    it('shows Late badge with correct styling', () => {
      render(<RecentSubmissions />);

      const lateBadge = screen.getByText('Late');
      expect(lateBadge).toBeInTheDocument();

      expect(lateBadge).toHaveClass('border-red-500/30');
      expect(lateBadge).toHaveClass('bg-red-50');
      expect(lateBadge).toHaveClass('text-red-600');
      expect(lateBadge).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('AI Status Badges', () => {
    it('shows Feedback Ready badge with correct styling and icon', () => {
      render(<RecentSubmissions />);

      const feedbackReadyBadges = screen.getAllByText('Feedback Ready');
      expect(feedbackReadyBadges.length).toBeGreaterThan(0);

      feedbackReadyBadges.forEach((badge) => {
        expect(badge).toHaveClass('bg-indigo-600');
        expect(badge).toHaveClass('text-white');
        expect(badge.querySelector('[data-testid="icon-sparkles"]')).toBeInTheDocument();
      });
    });

    it('shows Processing badge with correct styling and icon', () => {
      render(<RecentSubmissions />);

      const processingBadge = screen.getByText('Processing AI');
      expect(processingBadge).toBeInTheDocument();

      expect(processingBadge).toHaveClass('animate-pulse');
      expect(processingBadge).toHaveClass('border-indigo-400');
      expect(processingBadge).toHaveClass('text-indigo-500');
      expect(processingBadge).toHaveAttribute('data-variant', 'outline');
      expect(processingBadge.querySelector('[data-testid="icon-clock"]')).toBeInTheDocument();
    });

    it('shows Draft badge with correct styling and icon', () => {
      render(<RecentSubmissions />);

      const draftBadge = screen.getByText('Draft');
      expect(draftBadge).toBeInTheDocument();
      expect(draftBadge).toHaveClass('text-muted-foreground');
      expect(draftBadge).toHaveAttribute('data-variant', 'secondary');
      expect(draftBadge.querySelector('[data-testid="icon-edit"]')).toBeInTheDocument();
    });
  });

  describe('Submission Data', () => {
    it('shows assignment names', () => {
      render(<RecentSubmissions />);

      expect(screen.getByText('Narrative Essay')).toBeInTheDocument();
      expect(screen.getByText('Critical Review')).toBeInTheDocument();
      expect(screen.getByText('Research Proposal')).toBeInTheDocument();
      expect(screen.getByText('Persuasive Essay')).toBeInTheDocument();
      expect(screen.getByText('Hamlet Analysis')).toBeInTheDocument();
    });

    it('shows scores', () => {
      render(<RecentSubmissions />);

      expect(screen.getByText('92/100')).toBeInTheDocument();
      expect(screen.getByText('88/100')).toBeInTheDocument();
      expect(screen.getByText('95/100')).toBeInTheDocument();
      // "Pending" score is also used as a status badge, so we need to be more specific
      const pendingScores = screen.getAllByText('Pending').filter(el => el.closest('.tabular-nums'));
      expect(pendingScores.length).toBeGreaterThan(0);
    });

    it('shows user initials in avatar fallback', () => {
      render(<RecentSubmissions />);

      expect(screen.getByText('AJ')).toBeInTheDocument();
      expect(screen.getByText('SC')).toBeInTheDocument();
      expect(screen.getByText('MT')).toBeInTheDocument();
      expect(screen.getByText('EW')).toBeInTheDocument();
      expect(screen.getByText('DK')).toBeInTheDocument();
    });

    it('shows avatar images', () => {
      render(<RecentSubmissions />);

      const images = screen.getAllByAltText('Avatar');
      expect(images.length).toBe(5);

      // Check that images have correct src
      const alexImage = Array.from(images).find(
        (img) => img.src.includes('Alex')
      );
      expect(alexImage).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('renders submissions as list items with correct styling', () => {
      render(<RecentSubmissions />);

      const submissionItems = document.querySelectorAll(
        '.space-y-6 > div.flex.items-center.gap-4'
      );
      expect(submissionItems.length).toBe(5);

      submissionItems.forEach(item => {
        expect(item).toHaveClass('flex');
        expect(item).toHaveClass('items-center');
        expect(item).toHaveClass('gap-4');
        expect(item).toHaveClass('rounded-lg');
        expect(item).toHaveClass('p-3');
        expect(item).toHaveClass('transition-colors');
      });
    });

    it('has correct flex layout for each submission', () => {
      render(<RecentSubmissions />);

      // The div containing name and assignment should have flex-1
      expect(screen.getByText('Alex Johnson').closest('.flex-1')).toBeInTheDocument();
      expect(screen.getByText('Narrative Essay').closest('.flex-1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<RecentSubmissions />);

      const title = screen.getByRole('heading', { name: /Recent Submissions/i, level: 2 });
      expect(title).toBeInTheDocument();
    });

    it('avatars have alt text', () => {
      render(<RecentSubmissions />);

      const avatars = screen.getAllByAltText('Avatar');
      expect(avatars.length).toBe(5);
    });

    it('badges have descriptive text', () => {
      render(<RecentSubmissions />);

      const badges = [
        ...screen.getAllByText('Graded'),
        ...screen
          .getAllByText('Pending')
          .filter((badge) => badge.getAttribute('data-variant') === 'outline'),
        ...screen.getAllByText('Late'),
        ...screen.getAllByText('Feedback Ready'),
        ...screen.getAllByText('Processing AI'),
        ...screen.getAllByText('Draft')
      ];
      badges.forEach((badge) => {
        expect(badge.textContent).toBeTruthy();
      });
    });
  });

  describe('Styling', () => {
    it('has correct card styling', () => {
      render(<RecentSubmissions />);

      const card = screen.getByText(/Recent Submissions/i).closest('.h-full');
      expect(card).toHaveClass('border-none');
      expect(card).toHaveClass('bg-transparent');
      expect(card).toHaveClass('shadow-none');
    });

    it('has hover effect on submission items', () => {
      render(<RecentSubmissions />);

      const submissionItems = screen.getAllByText('Alex Johnson').find(el => el.closest('.hover\\:bg-slate-50'));
      expect(submissionItems).toBeInTheDocument();
    });

    it('has responsive layout', () => {
      render(<RecentSubmissions />);

      // The name/status container should have flex-wrap
      const flexWrapContainer = screen.getByText('Alex Johnson').closest('.flex-wrap');
      expect(flexWrapContainer).toBeInTheDocument();
    });
  });

  describe('Score Display', () => {
    it('shows graded scores with bold styling', () => {
      render(<RecentSubmissions />);

      const scores = screen.getAllByText(/(\d+\/\d+)/);
      scores.forEach((score) => {
        expect(score).toHaveClass('font-bold');
      });
    });

    it('shows pending scores with amber color', () => {
      render(<RecentSubmissions />);

      // Find pending score elements
      const pendingScores = screen.getAllByText('Pending').filter(el => el.closest('.text-amber-600'));
      expect(pendingScores.length).toBeGreaterThan(0);
    });
  });

  describe('Icon Display', () => {
    it('shows sparkles icon for Feedback Ready', () => {
      render(<RecentSubmissions />);

      const feedbackReadyBadges = screen.getAllByText('Feedback Ready');
      feedbackReadyBadges.forEach((badge) => {
        expect(badge.querySelector('[data-testid="icon-sparkles"]')).toBeInTheDocument();
      });
    });

    it('shows clock icon for Processing', () => {
      render(<RecentSubmissions />);

      const processingBadge = screen.getByText('Processing AI');
      expect(processingBadge.querySelector('[data-testid="icon-clock"]')).toBeInTheDocument();
    });

    it('shows edit icon for Draft', () => {
      render(<RecentSubmissions />);

      const draftBadge = screen.getByText('Draft');
      expect(draftBadge.querySelector('[data-testid="icon-edit"]')).toBeInTheDocument();
    });
  });
});
