/**
 * BarGraph Component Tests
 * 
 * Tests for the writing dimensions bar graph covering:
 * - Component rendering
 * - Client-side rendering (useEffect)
 * - Chart data display
 * - Tooltip functionality
 * 
 * Run with: pnpm test -- bar-graph.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BarGraph } from './bar-graph';

// Mock the chart container and related components
vi.mock('@/components/ui/chart', () => ({
  ChartConfig: {},
  ChartContainer: ({ children, config, className }: any) => (
    <div data-testid="chart-container" className={className}>
      {children}
    </div>
  ),
  ChartTooltip: ({ children, content }: any) => (
    <div data-testid="chart-tooltip">{content}{children}</div>
  ),
  ChartTooltipContent: ({ indicator, className }: any) => (
    <div data-testid="chart-tooltip-content" className={className}>
      Tooltip Content - {indicator}
    </div>
  ),
}));

// Mock shadcn/ui card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card-component" className={className} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
}));

// Mock recharts
vi.mock('recharts', () => ({
  Bar: ({ children, dataKey, name, fill, radius, barSize }: any) => (
    <div data-testid={`bar-${dataKey}`} data-name={name} data-fill={fill}>
      {children}
    </div>
  ),
  BarChart: ({ children, data, layout, margin }: any) => (
    <div data-testid="bar-chart" data-layout={layout}>
      {children}
    </div>
  ),
  CartesianGrid: ({ horizontal, strokeDasharray, strokeOpacity }: any) => (
    <div 
      data-testid="cartesian-grid" 
      data-horizontal={horizontal}
      data-stroke-dasharray={strokeDasharray}
    />
  ),
  XAxis: ({ type, hide, dataKey }: any) => (
    <div data-testid="x-axis" data-type={type} data-hide={hide} />
  ),
  YAxis: ({ dataKey, type, tickLine, axisLine, width }: any) => (
    <div data-testid="y-axis" data-datakey={dataKey} data-type={type} />
  ),
}));

describe('BarGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders chart after hydration', async () => {
      render(<BarGraph />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-container')).toBeInTheDocument();
      });
    });

    it('renders chart after client-side hydration', async () => {
      render(<BarGraph />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-container')).toBeInTheDocument();
      });
    });
  });

  describe('Chart Structure', () => {
    beforeEach(() => {
      render(<BarGraph />);
    });

    it('renders bar chart container', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('renders vertical layout', async () => {
      await waitFor(() => {
        const barChart = screen.getByTestId('bar-chart');
        expect(barChart).toHaveAttribute('data-layout', 'vertical');
      });
    });

    it('renders cartesian grid', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      });
    });

    it('renders horizontal grid lines only', async () => {
      await waitFor(() => {
        const grid = screen.getByTestId('cartesian-grid');
        expect(grid).toHaveAttribute('data-horizontal', 'false');
        expect(grid).toHaveAttribute('data-stroke-dasharray', '3 3');
      });
    });

    it('renders both bars (score and average)', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('bar-score')).toBeInTheDocument();
        expect(screen.getByTestId('bar-avg')).toBeInTheDocument();
      });
    });

    it('renders Y axis with dimensions', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('y-axis')).toBeInTheDocument();
        const yAxis = screen.getByTestId('y-axis');
        expect(yAxis).toHaveAttribute('data-datakey', 'dimension');
      });
    });

    it('hides X axis', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('x-axis')).toBeInTheDocument();
        const xAxis = screen.getByTestId('x-axis');
        expect(xAxis).toHaveAttribute('data-hide', 'true');
      });
    });
  });

  describe('Card Content', () => {
    beforeEach(() => {
      render(<BarGraph />);
    });

    it('displays card title', async () => {
      await waitFor(() => {
        expect(
          screen.getByText(/Writing Dimensions/i)
        ).toBeInTheDocument();
      });
    });

    it('displays card description', async () => {
      await waitFor(() => {
        expect(
          screen.getByText(/Performance across key rubric categories/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Bar Data', () => {
    beforeEach(() => {
      render(<BarGraph />);
    });

    it('displays score bar with correct data key', async () => {
      await waitFor(() => {
        const scoreBar = screen.getByTestId('bar-score');
        expect(scoreBar).toHaveAttribute('data-name', 'Your Score');
      });
    });

    it('displays average bar with correct data key', async () => {
      await waitFor(() => {
        const avgBar = screen.getByTestId('bar-avg');
        expect(avgBar).toHaveAttribute('data-name', 'Class Average');
      });
    });

    it('uses gradient fill for score bar', async () => {
      await waitFor(() => {
        const scoreBar = screen.getByTestId('bar-score');
        expect(scoreBar).toHaveAttribute('data-fill', 'url(#fillGradient)');
      });
    });

    it('uses gray fill for average bar', async () => {
      await waitFor(() => {
        const avgBar = screen.getByTestId('bar-avg');
        expect(avgBar).toHaveAttribute('data-fill', '#cbd5e1');
      });
    });
  });

  describe('Styling', () => {
    beforeEach(() => {
      render(<BarGraph />);
    });

    it('has indigo border styling', async () => {
      await waitFor(() => {
        const card = screen.getByTestId('card-component');
        expect(card.className).toContain('border-indigo-100');
      });
    });

    it('has white background with dark mode support', async () => {
      await waitFor(() => {
        const card = screen.getByTestId('card-component');
        expect(card.className).toContain('bg-white');
        expect(card.className).toContain('dark:bg-slate-950/50');
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(<BarGraph />);
    });

    it('has descriptive title for screen readers', async () => {
      await waitFor(() => {
        const title = screen.getByText(/Writing Dimensions/i);
        expect(title.tagName.toLowerCase()).toMatch(/div|p|h[1-6]/);
      });
    });

    it('has tooltip content for data points', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument();
      });
    });
  });
});
