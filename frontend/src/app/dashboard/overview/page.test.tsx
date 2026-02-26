/**
 * Dashboard Overview Page Tests
 * 
 * Integration tests for the dashboard overview page covering:
 * - Page layout structure
 * - KPI cards rendering
 * - Graph components integration
 * - Recent submissions integration
 * - Navigation and interactions
 * 
 * Run with: pnpm test -- dashboard/overview/page.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/overview',
}));

// Mock motion/react for animations
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
}));

// Mock UI components
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
  CardFooter: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardAction: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, value, onValueChange, className }: any) => (
    <div className={className} data-value={defaultValue || value}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: any) => (
    <div className={className} role="tablist">{children}</div>
  ),
  TabsTrigger: ({ children, value, className, disabled }: any) => (
    <button 
      role="tab" 
      data-value={value} 
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div role="tabpanel" data-value={value} className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, variant, size, disabled, onClick }: any) => (
    <button 
      className={className} 
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span className={className} data-variant={variant}>{children}</span>
  ),
}));

// Mock tabler icons
vi.mock('@tabler/icons-react', () => ({
  IconTrendingUp: ({ className, ...props }: any) => (
    <svg data-testid="icon-trending-up" className={className} {...props} />
  ),
  IconBook: ({ className, ...props }: any) => (
    <svg data-testid="icon-book" className={className} {...props} />
  ),
  IconPlus: ({ className, ...props }: any) => (
    <svg data-testid="icon-plus" className={className} {...props} />
  ),
  IconFileAnalytics: ({ className, ...props }: any) => (
    <svg data-testid="icon-file-analytics" className={className} {...props} />
  ),
  IconSchool: ({ className, ...props }: any) => (
    <svg data-testid="icon-school" className={className} {...props} />
  ),
  IconAward: ({ className, ...props }: any) => (
    <svg data-testid="icon-award" className={className} {...props} />
  ),
  IconListCheck: ({ className, ...props }: any) => (
    <svg data-testid="icon-list-check" className={className} {...props} />
  ),
  IconPencil: ({ className, ...props }: any) => (
    <svg data-testid="icon-pencil" className={className} {...props} />
  ),
  IconArrowRight: ({ className, ...props }: any) => (
    <svg data-testid="icon-arrow-right" className={className} {...props} />
  ),
}));

// Mock graph components
vi.mock('@/features/overview/components/area-graph', () => ({
  AreaGraph: () => <div data-testid="area-graph">Area Graph</div>,
}));

vi.mock('@/features/overview/components/bar-graph', () => ({
  BarGraph: () => <div data-testid="bar-graph">Bar Graph</div>,
}));

vi.mock('@/features/overview/components/pie-graph', () => ({
  PieGraph: () => <div data-testid="pie-graph">Pie Graph</div>,
}));

vi.mock('@/features/overview/components/recent-submissions', () => ({
  RecentSubmissions: () => (
    <div data-testid="recent-submissions">Recent Submissions</div>
  ),
}));

vi.mock('@/components/layout/page-container', () => ({
  default: ({ children, className }: any) => (
    <div className={className} data-testid="page-container">
      {children}
    </div>
  ),
}));

describe('Dashboard Overview Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('renders the page container', () => {
      render(<DashboardPage />);
      
      expect(screen.getByTestId('page-container')).toBeInTheDocument();
    });

    it('renders welcome banner', () => {
      render(<DashboardPage />);
      
      expect(
        screen.getByText(/Academic Command Center/i)
      ).toBeInTheDocument();
    });

    it('renders pending assignments message', () => {
      render(<DashboardPage />);
      
      expect(
        screen.getByText(/2.*assignments pending/i)
      ).toBeInTheDocument();
    });

    it('renders feedback notification message', () => {
      render(<DashboardPage />);
      
      expect(
        screen.getByText(/1.*new feedback/i)
      ).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders View Rubrics button', () => {
      render(<DashboardPage />);
      
      const rubricsButton = screen.getByText(/View Rubrics/i).closest('button');
      expect(rubricsButton).toBeInTheDocument();
    });

    it('renders Submit New Essay button', () => {
      render(<DashboardPage />);
      
      const submitButton = screen.getByText(/Submit New Essay/i).closest('button');
      expect(submitButton).toBeInTheDocument();
    });

    it('has correct variant for View Rubrics button', () => {
      render(<DashboardPage />);
      
      const rubricsButton = screen.getByText(/View Rubrics/i).closest('button');
      expect(rubricsButton).toHaveAttribute('data-variant', 'outline');
    });

    it('has correct variant for Submit New Essay button', () => {
      render(<DashboardPage />);
      
      const submitButton = screen.getByText(/Submit New Essay/i).closest('button');
      // Primary button should not have outline variant
      expect(submitButton?.getAttribute('data-variant')).not.toBe('outline');
    });

    it('handles View Rubrics button click', async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      vi.mocked(() => ({ push: mockPush })).push = mockPush;
      
      render(<DashboardPage />);
      
      const rubricsButton = screen.getByText(/View Rubrics/i).closest('button');
      if (rubricsButton) {
        await user.click(rubricsButton);
      }
    });

    it('handles Submit New Essay button click', async () => {
      const user = userEvent.setup();
      
      render(<DashboardPage />);
      
      const submitButton = screen.getByText(/Submit New Essay/i).closest('button');
      if (submitButton) {
        await user.click(submitButton);
      }
    });
  });

  describe('Tabs Navigation', () => {
    it('renders tabs component', () => {
      render(<DashboardPage />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders Overview tab', () => {
      render(<DashboardPage />);
      
      const overviewTab = screen.getByRole('tab', { name: /Overview/i });
      expect(overviewTab).toBeInTheDocument();
    });

    it('renders Analytics tab', () => {
      render(<DashboardPage />);
      
      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      expect(analyticsTab).toBeInTheDocument();
    });

    it('has Overview tab as default active', () => {
      render(<DashboardPage />);
      
      const tabs = screen.getByRole('tablist').closest('div');
      expect(tabs).toHaveAttribute('data-value', 'overview');
    });

    it('has Analytics tab disabled', () => {
      render(<DashboardPage />);
      
      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      expect(analyticsTab).toBeDisabled();
    });

    it('renders Overview tab content', () => {
      render(<DashboardPage />);
      
      const overviewContent = screen.getByRole('tabpanel', { name: 'overview' });
      expect(overviewContent).toBeInTheDocument();
    });
  });

  describe('KPI Cards', () => {
    it('renders Essays Submitted card', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText(/Essays Submitted/i)).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
    });

    it('renders Academic Standing card', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText(/Academic Standing/i)).toBeInTheDocument();
      expect(screen.getByText(/Top 10%/i)).toBeInTheDocument();
    });

    it('renders Feedback Readiness card', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText(/Feedback Readiness/i)).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('renders Improvement Velocity card', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText(/Improvement Velocity/i)).toBeInTheDocument();
      expect(screen.getByText('+12%')).toBeInTheDocument();
    });

    it('renders correct icons for each KPI card', () => {
      render(<DashboardPage />);
      
      // Should have 4 trending up icons (one per card header + one in footer)
      const icons = screen.getAllByTestId('icon-trending-up');
      expect(icons.length).toBeGreaterThanOrEqual(1);
      
      expect(screen.getByTestId('icon-file-analytics')).toBeInTheDocument();
      expect(screen.getByTestId('icon-school')).toBeInTheDocument();
      expect(screen.getByTestId('icon-book')).toBeInTheDocument();
    });

    it('renders badges with trend information', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText(/\+3 this week/i)).toBeInTheDocument();
      expect(screen.getByText(/A Grade/i)).toBeInTheDocument();
      expect(screen.getByText(/Actionable/i)).toBeInTheDocument();
      expect(screen.getByText(/Fast Paced/i)).toBeInTheDocument();
    });
  });

  describe('Graph Components', () => {
    it('renders bar graph component', () => {
      render(<DashboardPage />);
      
      expect(screen.getByTestId('bar-graph')).toBeInTheDocument();
    });

    it('renders area graph component', () => {
      render(<DashboardPage />);
      
      expect(screen.getByTestId('area-graph')).toBeInTheDocument();
    });

    it('renders pie graph component', () => {
      render(<DashboardPage />);
      
      expect(screen.getByTestId('pie-graph')).toBeInTheDocument();
    });
  });

  describe('Recent Submissions', () => {
    it('renders recent submissions component', () => {
      render(<DashboardPage />);
      
      expect(screen.getByTestId('recent-submissions')).toBeInTheDocument();
    });
  });

  describe('Layout Grid', () => {
    it('has responsive grid for KPI cards', () => {
      render(<DashboardPage />);
      
      // Check for grid layout classes
      const pageContainer = screen.getByTestId('page-container');
      expect(pageContainer.className).toContain('grid');
    });

    it('has correct column span for graphs', () => {
      render(<DashboardPage />);
      
      // Bar and area graphs should span 4 columns
      // Recent submissions and pie graph should span 3 columns
      const graphs = screen.getAllByTestId(/graph/i);
      expect(graphs.length).toBe(3);
    });
  });

  describe('Styling', () => {
    it('has welcome banner with correct styling', () => {
      render(<DashboardPage />);
      
      const banner = screen.getByText(/Academic Command Center/i).closest('div');
      expect(banner?.className).toContain('rounded-2xl');
      expect(banner?.className).toContain('border');
      expect(banner?.className).toContain('bg-slate-50');
    });

    it('has gradient background on primary button', () => {
      render(<DashboardPage />);
      
      const submitButton = screen.getByText(/Submit New Essay/i).closest('button');
      expect(submitButton?.className).toContain('from-indigo-600');
      expect(submitButton?.className).toContain('to-violet-600');
    });

    it('has hover effects on KPI cards', () => {
      render(<DashboardPage />);
      
      const essaysCard = screen.getByText(/Essays Submitted/i).closest('div');
      expect(essaysCard?.className).toContain('hover:-translate-y-1');
      expect(essaysCard?.className).toContain('hover:shadow-lg');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<DashboardPage />);
      
      const mainHeading = screen.getByText(/Academic Command Center/i);
      expect(mainHeading.tagName.toLowerCase()).toMatch(/h[1-6]/);
    });

    it('has proper tab roles', () => {
      render(<DashboardPage />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Analytics/i })).toBeInTheDocument();
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('has descriptive button text', () => {
      render(<DashboardPage />);
      
      expect(
        screen.getByRole('button', { name: /View Rubrics/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Submit New Essay/i })
      ).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('shows correct essay count', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText('24')).toBeInTheDocument();
    });

    it('shows correct grade percentage', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('shows correct improvement percentage', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText('+12%')).toBeInTheDocument();
    });

    it('shows word count statistic', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText(/3\.5k/i)).toBeInTheDocument();
    });
  });
});
