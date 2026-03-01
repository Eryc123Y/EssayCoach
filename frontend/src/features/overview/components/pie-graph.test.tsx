/**
 * PieGraph Component Tests
 * 
 * Tests for the grade distribution pie graph covering:
 * - Component rendering
 * - Chart data display
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
  ChartTooltipContent: ({ indicator, className, hideLabel }: any) => (
    <div data-testid="chart-tooltip-content" className={className}>
      Tooltip Content {hideLabel && '(hideLabel)'}
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
    <h2 className={className} {...props}>{children}</h2>
  ),
}));

// Mock recharts
vi.mock('recharts', () => ({
  Pie: ({ data, dataKey, nameKey, innerRadius, outerRadius, paddingAngle, label, children }: any) => (
    <div 
      data-testid="pie-chart" 
      data-datakey={dataKey}
      data-namekey={nameKey}
      data-inner-radius={innerRadius}
      data-outer-radius={outerRadius}
      data-padding-angle={paddingAngle}
    >
      {label && typeof label === 'function' && label({ viewBox: { cx: 100, cy: 100 } })}
      {children}
    </div>
  ),
  PieChart: ({ children, data }: any) => (
    <div data-testid="pie-chart-wrapper" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Sector: () => <div data-testid="sector" />,
  Label: ({ content, viewBox }: any) => {
    if (content && typeof content === 'function') {
      return content({ viewBox });
    }
    return null;
  },
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
      expect(screen.getByText(/Common Error Categories/i)).toBeInTheDocument();
    });

    it('displays card description', () => {
      expect(
        screen.getByText(/Distribution of feedback issues in recent submissions/i)
      ).toBeInTheDocument();
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

    it('has container styling', () => {
      const chartContainer = screen.getByTestId('chart-container');
      expect(chartContainer.className).toContain('mx-auto');
      expect(chartContainer.className).toContain('h-[250px]');
      expect(chartContainer.className).toContain('aspect-square');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      render(<PieGraph />);
    });

    it('has descriptive title for screen readers', () => {
      expect(
        screen.getByRole('heading', { name: /Common Error Categories/i })
      ).toBeInTheDocument();
    });

    it('has descriptive text for the distribution', () => {
      expect(
        screen.getByText(/Distribution of feedback issues in recent submissions/i)
      ).toBeInTheDocument();
    });
  });

  describe('Footer Content', () => {
    beforeEach(() => {
      render(<PieGraph />);
    });

    it('displays structure attention message', () => {
      expect(
        screen.getByText(/Structure needs attention/i)
      ).toBeInTheDocument();
    });

    it('displays based on last essays message', () => {
      expect(
        screen.getByText(/Based on last 5 graded essays/i)
      ).toBeInTheDocument();
    });
  });
});
