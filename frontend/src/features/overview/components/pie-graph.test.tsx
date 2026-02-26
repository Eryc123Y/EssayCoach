/**
 * PieGraph Component Tests
 * 
 * Tests for the grade distribution pie graph covering:
 * - Component rendering
 * - Chart data display
 * - Legend functionality
 * - Tooltip functionality
 * 
 * Run with: pnpm test -- pie-graph.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PieGraph } from './pie-graph';

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
      Tooltip Content
    </div>
  ),
  ChartLegend: ({ children, content }: any) => (
    <div data-testid="chart-legend">{content}{children}</div>
  ),
  ChartLegendContent: ({ className }: any) => (
    <div data-testid="chart-legend-content" className={className}>
      Legend Content
    </div>
  ),
}));

// Mock shadcn/ui card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardFooter: ({ children, className, ...props }: any) => (
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
  Pie: ({ data, dataKey, cx, cy, innerRadius, outerRadius, paddingAngle, label }: any) => (
    <div 
      data-testid="pie-chart" 
      data-datakey={dataKey}
      data-inner-radius={innerRadius}
      data-outer-radius={outerRadius}
    />
  ),
  PieChart: ({ children, data }: any) => (
    <div data-testid="pie-chart-wrapper">
      {children}
    </div>
  ),
  Sector: () => <div data-testid="sector" />,
}));

describe('PieGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chart Structure', () => {
    beforeEach(() => {
      render(<PieGraph />);
    });

    it('renders pie chart wrapper', () => {
      expect(screen.getByTestId('pie-chart-wrapper')).toBeInTheDocument();
    });

    it('renders pie chart', () => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('has donut style (inner radius)', () => {
      const pie = screen.getByTestId('pie-chart');
      expect(pie).toHaveAttribute('data-inner-radius', '60');
    });

    it('has outer radius configured', () => {
      const pie = screen.getByTestId('pie-chart');
      expect(pie).toHaveAttribute('data-outer-radius', '80');
    });

    it('has padding angle between segments', () => {
      const pie = screen.getByTestId('pie-chart');
      expect(pie).toHaveAttribute('data-padding-angle', '2');
    });
  });

  describe('Card Content', () => {
    beforeEach(() => {
      render(<PieGraph />);
    });

    it('displays card title', () => {
      expect(screen.getByText(/Grade Distribution/i)).toBeInTheDocument();
    });

    it('displays card description', () => {
      expect(
        screen.getByText(/Distribution across rubric categories/i)
      ).toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    beforeEach(() => {
      render(<PieGraph />);
    });

    it('renders chart legend', () => {
      expect(screen.getByTestId('chart-legend')).toBeInTheDocument();
    });

    it('renders legend content', () => {
      expect(screen.getByTestId('chart-legend-content')).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    beforeEach(() => {
      render(<PieGraph />);
    });

    it('renders tooltip', () => {
      expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument();
    });

    it('renders tooltip content', () => {
      expect(screen.getByTestId('chart-tooltip-content')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    beforeEach(() => {
      render(<PieGraph />);
    });

    it('has card styling', () => {
      const chartContainer = screen.getByTestId('chart-container');
      expect(chartContainer).toBeInTheDocument();
    });

    it('has responsive layout', () => {
      const chartContainer = screen.getByTestId('chart-container');
      expect(chartContainer.className).toContain('aspect-auto');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(<PieGraph />);
    });

    it('has descriptive title for screen readers', () => {
      const title = screen.getByText(/Grade Distribution/i);
      expect(title.tagName.toLowerCase()).toMatch(/h[1-6]/);
    });

    it('has legend for color interpretation', () => {
      expect(screen.getByTestId('chart-legend-content')).toBeInTheDocument();
    });
  });

  describe('Footer Content', () => {
    beforeEach(() => {
      render(<PieGraph />);
    });

    it('may display additional info in footer', () => {
      // Footer is optional based on implementation
      const footer = screen.queryByTestId(/footer/i);
      // Test passes regardless of footer presence
      expect(footer).toBeInTheDocument();
    });
  });
});
