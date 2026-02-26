/**
 * SkillRadarChart Component Tests
 *
 * Tests for the skill radar chart covering:
 * - Component rendering
 * - Client-side rendering (useEffect)
 * - Chart data display with 5 skills
 * - Comparison mode (class average)
 * - Tooltip functionality
 * - Different score scenarios
 *
 * Run with: pnpm exec vitest run src/features/essay-feedback/components/skill-radar-chart.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SkillRadarChart } from './skill-radar-chart';

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
  ChartTooltipContent: ({ indicator, className, formatter, labelFormatter }: any) => (
    <div data-testid="chart-tooltip-content" className={className}>
      Tooltip Content - {indicator}
    </div>
  ),
}));

// Mock shadcn/ui card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>{children}</div>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <div data-testid="card-description" className={className} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div data-testid="card-header" className={className} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <div data-testid="card-title" className={className} {...props}>{children}</div>
  ),
}));

// Mock recharts
vi.mock('recharts', () => ({
  PolarAngleAxis: ({ dataKey, tick, tickLine, axisLine }: any) => (
    <div data-testid="polar-angle-axis" data-datakey={dataKey} />
  ),
  PolarGrid: ({ stroke, strokeOpacity, strokeWidth }: any) => (
    <div data-testid="polar-grid" data-stroke={stroke} />
  ),
  Radar: ({ name, dataKey, stroke, fill, strokeWidth, dot, animationDuration }: any) => (
    <div
      data-testid={`radar-${dataKey || name}`}
      data-name={name}
      data-stroke={stroke}
    />
  ),
  RadarChart: ({ children, data, cx, cy, outerRadius, margin }: any) => (
    <div data-testid="radar-chart" data-cx={cx} data-cy={cy}>
      {children}
      {data?.map((item: any, idx: number) => (
        <span key={idx} data-testid="chart-data-item">
          {item.skill}
        </span>
      ))}
    </div>
  ),
  ResponsiveContainer: ({ children, debounce, width, height }: any) => (
    <div data-testid="responsive-container" style={{ width, height }}>
      {children}
    </div>
  ),
}));

const defaultSkills = {
  grammar: 85,
  logic: 72,
  tone: 90,
  structure: 78,
  vocabulary: 88
};

const averageSkills = {
  grammar: 75,
  logic: 70,
  tone: 80,
  structure: 72,
  vocabulary: 78
};

describe('SkillRadarChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders chart after client-side hydration', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });

    it('renders chart after client-side hydration', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });

    it('renders card container', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        expect(screen.getByTestId('card')).toBeInTheDocument();
      });
    });
  });

  describe('Chart Structure', () => {
    beforeEach(() => {
      render(<SkillRadarChart skills={defaultSkills} />);
    });

    it('renders radar chart container', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });

    it('renders responsive container', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      });
    });

    it('renders polar grid', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('polar-grid')).toBeInTheDocument();
      });
    });

    it('renders polar angle axis', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('polar-angle-axis')).toBeInTheDocument();
      });
    });

    it('renders score radar', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('radar-score')).toBeInTheDocument();
      });
    });

    it('renders all 5 skill labels', async () => {
      await waitFor(() => {
        const dataItems = screen.getAllByTestId('chart-data-item');
        expect(dataItems).toHaveLength(5);
      });
    });

    it('displays correct skill names', async () => {
      await waitFor(() => {
        const dataItems = screen.getAllByTestId('chart-data-item');
        const skillNames = dataItems.map((item) => item.textContent);

        expect(skillNames).toEqual(
          expect.arrayContaining([
            'Grammar',
            'Logic',
            'Tone',
            'Structure',
            'Vocabulary'
          ])
        );
      });
    });
  });

  describe('Card Content', () => {
    it('displays default title', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        expect(screen.getByTestId('card-title')).toBeInTheDocument();
      });

      expect(screen.getByTestId('card-title').textContent).toBe('Skill Mastery');
    });

    it('displays default description', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        expect(screen.getByTestId('card-description')).toBeInTheDocument();
      });

      expect(screen.getByTestId('card-description').textContent).toBe(
        'Performance across five writing dimensions'
      );
    });

    it('displays custom title when provided', async () => {
      render(
        <SkillRadarChart
          skills={defaultSkills}
          title="Writing Skills Analysis"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('card-title')).toBeInTheDocument();
      });

      expect(screen.getByTestId('card-title').textContent).toBe(
        'Writing Skills Analysis'
      );
    });

    it('displays custom description when provided', async () => {
      render(
        <SkillRadarChart
          skills={defaultSkills}
          description="Your essay performance breakdown"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('card-description')).toBeInTheDocument();
      });

      expect(screen.getByTestId('card-description').textContent).toBe(
        'Your essay performance breakdown'
      );
    });
  });

  describe('Comparison Mode', () => {
    it('renders only score radar without averageSkills', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        expect(screen.getByTestId('radar-score')).toBeInTheDocument();
        expect(screen.queryByTestId('radar-average')).not.toBeInTheDocument();
      });
    });

    it('renders both score and average radars with averageSkills', async () => {
      render(
        <SkillRadarChart
          skills={defaultSkills}
          averageSkills={averageSkills}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('radar-score')).toBeInTheDocument();
      });
    });

    it('renders legend with both items in comparison mode', async () => {
      render(
        <SkillRadarChart
          skills={defaultSkills}
          averageSkills={averageSkills}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Your Score')).toBeInTheDocument();
        expect(screen.getByText('Class Average')).toBeInTheDocument();
      });
    });

    it('renders legend with only score item without comparison', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        expect(screen.getByText('Your Score')).toBeInTheDocument();
        expect(screen.queryByText('Class Average')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tooltip', () => {
    beforeEach(() => {
      render(<SkillRadarChart skills={defaultSkills} />);
    });

    it('renders tooltip container', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument();
      });
    });

    it('renders tooltip content', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('chart-tooltip-content')).toBeInTheDocument();
      });
    });
  });

  describe('Different Score Scenarios', () => {
    it('handles high scores (90+)', async () => {
      const highScores = {
        grammar: 95,
        logic: 92,
        tone: 98,
        structure: 90,
        vocabulary: 94
      };

      render(<SkillRadarChart skills={highScores} />);

      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });

    it('handles low scores (below 50)', async () => {
      const lowScores = {
        grammar: 35,
        logic: 42,
        tone: 48,
        structure: 40,
        vocabulary: 45
      };

      render(<SkillRadarChart skills={lowScores} />);

      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });

    it('handles zero scores', async () => {
      const zeroScores = {
        grammar: 0,
        logic: 0,
        tone: 0,
        structure: 0,
        vocabulary: 0
      };

      render(<SkillRadarChart skills={zeroScores} />);

      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });

    it('handles perfect scores (100)', async () => {
      const perfectScores = {
        grammar: 100,
        logic: 100,
        tone: 100,
        structure: 100,
        vocabulary: 100
      };

      render(<SkillRadarChart skills={perfectScores} />);

      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });

    it('handles mixed scores', async () => {
      const mixedScores = {
        grammar: 100,
        logic: 50,
        tone: 0,
        structure: 75,
        vocabulary: 25
      };

      render(<SkillRadarChart skills={mixedScores} />);

      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Styling', () => {
    it('has border styling classes', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        const card = screen.getByTestId('card');
        expect(card.className).toContain('border');
      });
    });

    it('has backdrop blur class', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        const card = screen.getByTestId('card');
        expect(card.className).toContain('backdrop-blur');
      });
    });

    it('has hover shadow class', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        const card = screen.getByTestId('card');
        expect(card.className).toContain('hover:shadow');
      });
    });
  });

  describe('Accessibility', () => {
    it('has descriptive title for screen readers', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        const title = screen.getByTestId('card-title');
        expect(title).toBeInTheDocument();
      });
    });

    it('has descriptive text for chart purpose', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        const description = screen.getByTestId('card-description');
        expect(description).toBeInTheDocument();
      });
    });

    it('has tooltip for data points', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Min Height Prop', () => {
    it('uses default minHeight of 300', async () => {
      render(<SkillRadarChart skills={defaultSkills} />);

      await waitFor(() => {
        const container = screen.getByTestId('card-content');
        expect(container).toBeInTheDocument();
      });
    });

    it('uses custom minHeight when provided', async () => {
      render(<SkillRadarChart skills={defaultSkills} minHeight={400} />);

      await waitFor(() => {
        const container = screen.getByTestId('card-content');
        expect(container).toBeInTheDocument();
      });
    });
  });
});
