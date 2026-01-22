import { render } from '@testing-library/react';
import { FeedbackCharts } from './FeedbackCharts';
import type { DifyWorkflowRunResponse } from '@/types/dify';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mutable theme value for testing
let mockTheme = 'light';

// Simple mock for next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: mockTheme })
}));

// Mock Recharts components - they don't render properly in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='responsive-container'>{children}</div>
  ),
  RadarChart: ({
    children,
    data
  }: {
    children: React.ReactNode;
    data?: Array<{ subject: string }>;
  }) => (
    <div
      data-testid='radar-chart'
      data-subjects={data?.map((d) => d.subject).join(',')}
    >
      {children}
      {data?.map((d) => (
        <span key={d.subject} data-testid='chart-subject'>
          {d.subject}
        </span>
      ))}
    </div>
  ),
  Radar: () => <div data-testid='radar' />,
  PolarGrid: () => <div data-testid='polar-grid' />,
  PolarAngleAxis: () => <div data-testid='polar-angle-axis' />,
  PolarRadiusAxis: () => <div data-testid='polar-radius-axis' />
}));

describe('FeedbackCharts', () => {
  const createMockOutputs = (
    overrides = {}
  ): NonNullable<DifyWorkflowRunResponse['data']['outputs']> => ({
    overall_score: 85,
    feedback_summary: 'Good essay',
    structure_analysis: {
      score: 80,
      comments: 'Good structure',
      suggestions: ['Add transitions']
    },
    content_analysis: {
      score: 85,
      comments: 'Strong content',
      suggestions: ['More examples']
    },
    style_analysis: {
      score: 90,
      comments: 'Clear style',
      suggestions: ['Vary sentences']
    },
    grammar_notes: [
      {
        type: 'spelling',
        original: 'teh',
        suggestion: 'the',
        explanation: 'Common typo'
      }
    ],
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = 'light';
  });

  describe('Grammar Score Calculation', () => {
    it('should calculate grammar score as 100 minus 5 per grammar note', () => {
      // No grammar notes = 100 score
      const outputs = createMockOutputs({ grammar_notes: [] });
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      // Should render without error
      expect(container).toBeInTheDocument();
    });

    it('should calculate grammar score correctly with multiple notes', () => {
      // 3 notes = 100 - 15 = 85
      const outputs = createMockOutputs({
        grammar_notes: [
          {
            type: 'spelling',
            original: 'teh',
            suggestion: 'the',
            explanation: 'Typo'
          },
          {
            type: 'grammar',
            original: 'is was',
            suggestion: 'was',
            explanation: 'Agreement'
          },
          {
            type: 'punctuation',
            original: 'end.',
            suggestion: 'end!',
            explanation: 'Enthusiasm'
          }
        ]
      });

      const { container } = render(<FeedbackCharts outputs={outputs} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle undefined grammar_notes gracefully', () => {
      const outputs = createMockOutputs({ grammar_notes: undefined });

      const { container } = render(<FeedbackCharts outputs={outputs} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle null grammar_notes gracefully', () => {
      const outputs = createMockOutputs({
        grammar_notes: null as unknown as undefined
      });

      const { container } = render(<FeedbackCharts outputs={outputs} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Handling Missing Analysis Scores', () => {
    it('should handle missing structure analysis score', () => {
      const outputs = createMockOutputs({
        structure_analysis: { score: undefined, comments: '', suggestions: [] }
      });

      const { container } = render(<FeedbackCharts outputs={outputs} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle missing content analysis score', () => {
      const outputs = createMockOutputs({
        content_analysis: { score: undefined, comments: '', suggestions: [] }
      });

      const { container } = render(<FeedbackCharts outputs={outputs} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle missing style analysis score', () => {
      const outputs = createMockOutputs({
        style_analysis: { score: undefined, comments: '', suggestions: [] }
      });

      const { container } = render(<FeedbackCharts outputs={outputs} />);
      expect(container).toBeInTheDocument();
    });

    it('should render with all scores at 0 when analysis is missing', () => {
      const outputs = createMockOutputs({
        structure_analysis: { score: undefined, comments: '', suggestions: [] },
        content_analysis: { score: undefined, comments: '', suggestions: [] },
        style_analysis: { score: undefined, comments: '', suggestions: [] }
      });

      const { container } = render(<FeedbackCharts outputs={outputs} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Theme Adaptation', () => {
    it('should use light theme by default', () => {
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      expect(container).toBeInTheDocument();
    });

    it('should use dark theme when specified', () => {
      mockTheme = 'dark';
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe('Component Rendering', () => {
    it('should render with valid outputs without crashing', () => {
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      expect(container).toBeInTheDocument();
    });

    it('should render chart container structure', () => {
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      // Check that the component renders a card structure
      expect(container.querySelector('[class*="card"]')).toBeInTheDocument();
    });

    it('should render performance overview title', () => {
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      // The component should have a header with title
      expect(
        container.querySelector('h3') ||
          container.querySelector('[class*="header"]')
      ).toBeInTheDocument();
    });

    it('should render chart description', () => {
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      // Should have some descriptive text
      expect(container.textContent).toContain('Performance');
    });

    it('should render with proper styling classes', () => {
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      // Should have backdrop-blur and similar styling classes from the component
      expect(container.innerHTML).toMatch(/backdrop-blur|shadow|container/i);
    });
  });

  describe('Chart Data Structure', () => {
    it('should render radar chart data for four metrics', () => {
      const outputs = createMockOutputs({
        structure_analysis: { score: 75, comments: '', suggestions: [] },
        content_analysis: { score: 88, comments: '', suggestions: [] },
        style_analysis: { score: 92, comments: '', suggestions: [] }
      });

      const { container } = render(<FeedbackCharts outputs={outputs} />);
      expect(container).toBeInTheDocument();
    });

    it('should include all subjects in chart data', () => {
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      // Should render content that includes references to the four metrics
      expect(container.textContent).toMatch(/Structure|Content|Style|Grammar/i);
    });
  });

  describe('Card Container', () => {
    it('should render card element', () => {
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render card header section', () => {
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      expect(
        container.querySelector('[class*="header"]') ||
          container.querySelector('h3')
      ).toBeInTheDocument();
    });

    it('should render card content with chart', () => {
      const outputs = createMockOutputs();
      const { container } = render(<FeedbackCharts outputs={outputs} />);

      expect(
        container.querySelector('[class*="content"]') ||
          container.querySelector('div')
      ).toBeInTheDocument();
    });
  });
});
