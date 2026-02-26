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

// Mock shadcn/ui components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} {...props}>
      {children}
    </span>
  ),
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

    expect(screen.getByText(/Recent Submissions/i)).toBeInTheDocument();
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

      // Check for emerald color (graded status)
      gradedBadges.forEach((badge) => {
        expect(badge.className).toContain('emerald');
      });
    });

    it('shows Pending badge with correct styling', () => {
      render(<RecentSubmissions />);

      const pendingBadges = screen.getAllByText('Pending');
      expect(pendingBadges.length).toBeGreaterThan(0);

      // Check for amber color (pending status)
      pendingBadges.forEach((badge) => {
        expect(badge.className).toContain('amber');
      });
    });

    it('shows Late badge with correct styling', () => {
      render(<RecentSubmissions />);

      const lateBadge = screen.getByText('Late');
      expect(lateBadge).toBeInTheDocument();

      // Check for red color (late status)
      expect(lateBadge.className).toContain('red');
    });
  });

  describe('AI Status Badges', () => {
    it('shows Feedback Ready badge with correct styling', () => {
      render(<RecentSubmissions />);

      const feedbackReadyBadges = screen.getAllByText('Feedback Ready');
      expect(feedbackReadyBadges.length).toBeGreaterThan(0);

      // Check for indigo color
      feedbackReadyBadges.forEach((badge) => {
        expect(badge.className).toContain('indigo');
      });
    });

    it('shows Processing badge with correct styling', () => {
      render(<RecentSubmissions />);

      const processingBadge = screen.getByText('Processing');
      expect(processingBadge).toBeInTheDocument();

      // Check for pulse animation
      expect(processingBadge.className).toContain('animate-pulse');
    });

    it('shows Draft badge', () => {
      render(<RecentSubmissions />);

      const draftBadge = screen.getByText('Draft');
      expect(draftBadge).toBeInTheDocument();
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
      expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
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

      const images = document.querySelectorAll('img');
      expect(images.length).toBeGreaterThan(0);

      // Check that images have correct src
      const alexImage = Array.from(images).find(
        (img) => img.alt === 'Avatar' && img.src.includes('Alex')
      );
      expect(alexImage).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('renders submissions as list items', () => {
      render(<RecentSubmissions />);

      // Should have multiple submission items
      const submissionItems = document.querySelectorAll('[class*="flex items-center gap-4"]');
      expect(submissionItems.length).toBe(5);
    });

    it('has correct flex layout for each submission', () => {
      render(<RecentSubmissions />);

      // Each submission should have avatar, info, and score sections
      expect(screen.getByText('Alex Johnson').closest('div')).toHaveClass('flex-1');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<RecentSubmissions />);

      const title = screen.getByText(/Recent Submissions/i);
      expect(title.tagName.toLowerCase()).toMatch(/h[1-6]/);
    });

    it('avatars have alt text', () => {
      render(<RecentSubmissions />);

      const avatars = document.querySelectorAll('img[alt="Avatar"]');
      expect(avatars.length).toBe(5);
    });

    it('badges have descriptive text', () => {
      render(<RecentSubmissions />);

      // All badges should have text content
      const badges = document.querySelectorAll('[data-variant]');
      badges.forEach((badge) => {
        expect(badge.textContent).toBeTruthy();
      });
    });
  });

  describe('Styling', () => {
    it('has correct card styling', () => {
      render(<RecentSubmissions />);

      const card = screen.getByText(/Recent Submissions/i).closest('div');
      expect(card).toHaveClass('border-none');
      expect(card).toHaveClass('bg-transparent');
    });

    it('has hover effect on submission items', () => {
      render(<RecentSubmissions />);

      const submissionItems = document.querySelectorAll('[class*="hover:bg-slate-50"]');
      expect(submissionItems.length).toBeGreaterThan(0);
    });

    it('has responsive layout', () => {
      render(<RecentSubmissions />);

      // Check for flex-wrap on name/status container
      const flexContainers = document.querySelectorAll('[class*="flex-wrap"]');
      expect(flexContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Score Display', () => {
    it('shows graded scores with bold styling', () => {
      render(<RecentSubmissions />);

      const scores = screen.getAllByText(/(\d+\/\d+)/);
      scores.forEach((score) => {
        expect(score.className).toContain('font-bold');
      });
    });

    it('shows pending scores with amber color', () => {
      render(<RecentSubmissions />);

      // Find pending score elements
      const pendingScores = Array.from(
        document.querySelectorAll('[class*="text-amber-600"]')
      );
      expect(pendingScores.length).toBeGreaterThan(0);
    });
  });

  describe('Icon Display', () => {
    it('shows sparkles icon for Feedback Ready', () => {
      render(<RecentSubmissions />);

      // Check for sparkles icon SVG
      const sparklesIcons = Array.from(document.querySelectorAll('svg')).filter(
        (svg) => svg.parentElement?.textContent?.includes('Feedback Ready')
      );
      expect(sparklesIcons.length).toBeGreaterThan(0);
    });

    it('shows clock icon for Processing', () => {
      render(<RecentSubmissions />);

      // Check for clock icon SVG
      const clockIcons = Array.from(document.querySelectorAll('svg')).filter(
        (svg) => svg.parentElement?.textContent?.includes('Processing')
      );
      expect(clockIcons.length).toBeGreaterThan(0);
    });

    it('shows edit icon for Draft', () => {
      render(<RecentSubmissions />);

      // Check for edit icon SVG
      const editIcons = Array.from(document.querySelectorAll('svg')).filter(
        (svg) => svg.parentElement?.textContent?.includes('Draft')
      );
      expect(editIcons.length).toBeGreaterThan(0);
    });
  });
});
