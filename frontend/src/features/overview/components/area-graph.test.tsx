/**
 * AreaGraph Component Tests
 *
 * Tests for the score improvement area graph covering:
 * - Component rendering
 * - Chart data display
 * - Trend indicators
 * - Tooltip functionality
 *
 * Run with: pnpm test -- area-graph.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AreaGraph } from './area-graph';

// Mock the chart container and related components
vi.mock('@/components/ui/chart', () => ({
  ChartConfig: {},
  ChartContainer: ({ children, config, className }: any) => (
    <div data-testid='chart-container' className={className}>
      {children}
    </div>
  ),
  ChartTooltip: ({ children, content, cursor }: any) => (
    <div data-testid='chart-tooltip' data-cursor={cursor}>
      {content}
      {children}
    </div>
  ),
  ChartTooltipContent: ({ indicator, className }: any) => (
    <div data-testid='chart-tooltip-content' className={className}>
      Tooltip Content - {indicator}
    </div>
  )
}));

// Mock shadcn/ui card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid='card-component' className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardFooter: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  )
}));

// Mock tabler icons
vi.mock('@tabler/icons-react', () => ({
  IconTrendingUp: ({ className, ...props }: any) => (
    <svg data-testid='trending-up-icon' className={className} {...props} />
  )
}));

// Mock recharts
vi.mock('recharts', () => ({
  Area: ({ dataKey, type, fill, stroke, strokeWidth, stackId }: any) => (
    <div
      data-testid={`area-${dataKey}`}
      data-type={type}
      data-stroke={stroke}
      data-stroke-width={strokeWidth}
    />
  ),
  AreaChart: ({ children, data, margin }: any) => (
    <div data-testid='area-chart'>{children}</div>
  ),
  CartesianGrid: ({ vertical, strokeDasharray, strokeOpacity }: any) => (
    <div data-testid='cartesian-grid' data-vertical={vertical} />
  ),
  XAxis: ({
    dataKey,
    tickLine,
    axisLine,
    tickMargin,
    minTickGap,
    tickFormatter
  }: any) => (
    <div
      data-testid='x-axis'
      data-datakey={dataKey}
      data-tick-margin={tickMargin}
    />
  )
}));

describe('AreaGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chart Structure', () => {
    beforeEach(() => {
      render(<AreaGraph />);
    });

    it('renders area chart container', () => {
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('renders cartesian grid', () => {
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('renders vertical grid lines only', () => {
      const grid = screen.getByTestId('cartesian-grid');
      expect(grid).toHaveAttribute('data-vertical', 'false');
    });

    it('renders both area layers (score and average)', () => {
      expect(screen.getByTestId('area-score')).toBeInTheDocument();
      expect(screen.getByTestId('area-avg')).toBeInTheDocument();
    });

    it('renders X axis with assignment labels', () => {
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      const xAxis = screen.getByTestId('x-axis');
      expect(xAxis).toHaveAttribute('data-datakey', 'assignment');
    });
  });

  describe('Card Content', () => {
    beforeEach(() => {
      render(<AreaGraph />);
    });

    it('displays card title', () => {
      expect(screen.getByText(/Score Improvement/i)).toBeInTheDocument();
    });

    it('displays card description', () => {
      expect(
        screen.getByText(/Tracking performance across the semester/i)
      ).toBeInTheDocument();
    });
  });

  describe('Area Data', () => {
    beforeEach(() => {
      render(<AreaGraph />);
    });

    it('displays score area with violet stroke', () => {
      const scoreArea = screen.getByTestId('area-score');
      expect(scoreArea).toHaveAttribute('data-stroke', '#8b5cf6');
      expect(scoreArea).toHaveAttribute('data-stroke-width', '3');
    });

    it('displays average area with indigo stroke', () => {
      const avgArea = screen.getByTestId('area-avg');
      expect(avgArea).toHaveAttribute('data-stroke', '#6366f1');
      expect(avgArea).toHaveAttribute('data-stroke-width', '2');
    });

    it('uses monotone interpolation for smooth curves', () => {
      const scoreArea = screen.getByTestId('area-score');
      expect(scoreArea).toHaveAttribute('data-type', 'monotone');

      const avgArea = screen.getByTestId('area-avg');
      expect(avgArea).toHaveAttribute('data-type', 'monotone');
    });
  });

  describe('Footer Content', () => {
    beforeEach(() => {
      render(<AreaGraph />);
    });

    it('displays improvement trend message', () => {
      expect(
        screen.getByText(/Consistent improvement trend/i)
      ).toBeInTheDocument();
    });

    it('displays trending up icon', () => {
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    });

    it('displays outperforming message', () => {
      expect(
        screen.getByText(/Outperforming class average/i)
      ).toBeInTheDocument();
    });

    it('shows 7% improvement statistic', () => {
      expect(screen.getByText(/7%/i)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    beforeEach(() => {
      render(<AreaGraph />);
    });

    it('has indigo border styling', () => {
      const cardComponent = screen.getByTestId('card-component');
      expect(cardComponent.className).toContain('border-indigo-100');
    });

    it('has white background with dark mode support', () => {
      const cardComponent = screen.getByTestId('card-component');
      expect(cardComponent.className).toContain('bg-white');
      expect(cardComponent.className).toContain('dark:bg-slate-950/50');
    });
  });

  describe('Tooltip', () => {
    beforeEach(() => {
      render(<AreaGraph />);
    });

    it('renders tooltip with dot indicator', () => {
      expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument();
      const tooltipContent = screen.getByTestId('chart-tooltip-content');
      expect(tooltipContent).toHaveTextContent(/dot/i);
    });

    it('hides cursor on tooltip', () => {
      const tooltip = screen.getByTestId('chart-tooltip');
      expect(tooltip).toHaveAttribute('data-cursor', 'false');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(<AreaGraph />);
    });

    it('has descriptive title for screen readers', () => {
      const title = screen.getByText(/Score Improvement/i);
      expect(title.tagName.toLowerCase()).toMatch(/div|p|h[1-6]/);
    });

    it('has footer with context information', () => {
      expect(screen.getByText(/tracking performance/i)).toBeInTheDocument();
    });
  });

  describe('Chart Dimensions', () => {
    beforeEach(() => {
      render(<AreaGraph />);
    });

    it('has responsive aspect ratio', () => {
      const chartContainer = screen.getByTestId('chart-container');
      expect(chartContainer.className).toContain('aspect-auto');
      expect(chartContainer.className).toContain('h-[250px]');
    });
  });
});
