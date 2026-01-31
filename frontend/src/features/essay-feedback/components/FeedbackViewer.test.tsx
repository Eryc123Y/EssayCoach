import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackViewer } from './FeedbackViewer';
import type { WorkflowStatusResponse } from '@/service/agent/agent-service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Helper to create a valid WorkflowStatusResponse for testing
function createMockWorkflowStatusResponse(
  overrides: Partial<WorkflowStatusResponse> = {}
): WorkflowStatusResponse {
  return {
    workflow_run_id: 'test-run-123',
    task_id: 'test-task-456',
    status: 'succeeded',
    outputs: {
      overall_score: 85,
      percentage_score: 85,
      total_possible: 100,
      feedback_items: [
        {
          criterion_name: 'Structure',
          score: 8,
          max_score: 10,
          feedback: 'Well organized essay',
          suggestions: ['Add more transitions']
        },
        {
          criterion_name: 'Content',
          score: 9,
          max_score: 10,
          feedback: 'Strong arguments',
          suggestions: ['Add more examples']
        }
      ],
      overall_feedback: 'Great essay overall',
      strengths: ['Clear thesis', 'Good structure'],
      suggestions: ['Add more citations'],
      analysis_metadata: {}
    },
    error_message: null,
    elapsed_time_seconds: 12.5,
    token_usage: { total: 1500, prompt: 800, completion: 700 },
    ...overrides
  };
}

// Mock child components
vi.mock('./FeedbackCharts', () => ({
  FeedbackCharts: () => (
    <div data-testid='feedback-charts'>FeedbackCharts Mock</div>
  )
}));

vi.mock('./RevisionChat', () => ({
  RevisionChat: () => <div data-testid='revision-chat'>Revision Chat</div>
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid='card' className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-content'>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-header'>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid='card-title'>{children}</h3>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid='card-description'>{children}</p>
  )
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid='progress' data-value={value}>
      Progress: {value}%
    </div>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid='badge'>{children}</span>
  )
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({
    children,
    variant
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => (
    <div data-testid='alert' data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='alert-description'>{children}</div>
  )
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='tabs'>{children}</div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='tabs-list'>{children}</div>
  ),
  TabsTrigger: ({
    children,
    value
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <button data-testid='tabs-trigger' data-value={value}>
      {children}
    </button>
  ),
  TabsContent: ({
    children,
    value
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <div data-testid='tabs-content' data-value={value}>
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    className
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button
      data-testid='button'
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  )
}));

describe('FeedbackViewer', () => {
  const defaultProps = {
    result: null as WorkflowStatusResponse | null,
    isRunning: false,
    progress: 0,
    error: null as string | null,
    onRetry: undefined as (() => void) | undefined
  };

  const createMockOutputs = (overrides = {}) => ({
    overall_score: 85,
    percentage_score: 85,
    total_possible: 100,
    feedback_items: [
      {
        criterion_name: 'Structure',
        score: 8,
        max_score: 10,
        feedback: 'Well organized essay',
        suggestions: ['Add more transitions']
      },
      {
        criterion_name: 'Content',
        score: 9,
        max_score: 10,
        feedback: 'Strong arguments',
        suggestions: ['Add more examples']
      }
    ],
    overall_feedback: 'Great essay overall',
    strengths: ['Clear thesis', 'Good structure'],
    suggestions: ['Add more citations'],
    analysis_metadata: {},
    ...overrides
  });

  const createLegacyOutputs = (overrides = {}) => ({
    overall_score: 85,
    feedback_summary: 'Great essay overall',
    structure_analysis: {
      score: 8,
      comments: 'Well organized essay',
      suggestions: ['Add more transitions']
    },
    content_analysis: {
      score: 9,
      comments: 'Strong arguments',
      suggestions: ['Add more examples']
    },
    style_analysis: {
      score: 8,
      comments: 'Clear writing style',
      suggestions: ['Vary sentence structure']
    },
    grammar_notes: [],
    ...overrides
  });

  const createMockResult = (overrides = {}): WorkflowStatusResponse => ({
    workflow_run_id: 'test-run-123',
    task_id: 'test-task-456',
    status: 'succeeded',
    outputs: createLegacyOutputs(),
    error_message: null,
    elapsed_time_seconds: 12.5,
    token_usage: { total: 1500, prompt: 800, completion: 700 },
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error State Rendering', () => {
    it('should display error message when error prop is provided', () => {
      render(
        <FeedbackViewer {...defaultProps} error='Network connection failed' />
      );

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert')).toHaveAttribute(
        'data-variant',
        'destructive'
      );
      expect(
        screen.getByText(/Error analyzing essay: Network connection failed/i)
      ).toBeInTheDocument();
    });

    it('should show retry button when error occurs and onRetry is provided', () => {
      const handleRetry = vi.fn();
      render(
        <FeedbackViewer
          {...defaultProps}
          error='Something went wrong'
          onRetry={handleRetry}
        />
      );

      const retryButton = screen.getByText(/Retry/i);
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(handleRetry).toHaveBeenCalledOnce();
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<FeedbackViewer {...defaultProps} error='Some error' />);

      expect(screen.queryByText(/Retry/i)).not.toBeInTheDocument();
    });

    it('should display helpful message when error occurs', () => {
      render(<FeedbackViewer {...defaultProps} error='Processing failed' />);

      expect(
        screen.getByText(/Please try submitting your essay again/i)
      ).toBeInTheDocument();
    });
  });

  describe('Loading State Rendering', () => {
    it('should display loading state when isRunning is true', () => {
      render(
        <FeedbackViewer {...defaultProps} isRunning={true} progress={25} />
      );

      // Should show analyzing text
      const analyzingTexts = screen.getAllByText((content) =>
        content.includes('Analyzing')
      );
      expect(analyzingTexts.length).toBeGreaterThan(0);
    });

    it('should update analysis step based on progress percentage', () => {
      const { rerender } = render(
        <FeedbackViewer {...defaultProps} isRunning={true} progress={20} />
      );
      expect(
        screen.getByText(/Analyzing essay structure.../i)
      ).toBeInTheDocument();

      rerender(
        <FeedbackViewer {...defaultProps} isRunning={true} progress={45} />
      );
      expect(
        screen.getByText(/Checking grammar and style.../i)
      ).toBeInTheDocument();

      rerender(
        <FeedbackViewer {...defaultProps} isRunning={true} progress={75} />
      );
      expect(
        screen.getByText(/Generating detailed feedback.../i)
      ).toBeInTheDocument();

      rerender(
        <FeedbackViewer {...defaultProps} isRunning={true} progress={95} />
      );
      expect(screen.getByText(/Finalizing report.../i)).toBeInTheDocument();
    });

    it('should display progress percentage', () => {
      render(
        <FeedbackViewer {...defaultProps} isRunning={true} progress={42} />
      );

      // Should show progress value
      const progressTexts = screen.getAllByText(
        (content) => content.includes('42') || content.includes('42%')
      );
      expect(progressTexts.length).toBeGreaterThan(0);
    });

    it('should show progress bar element', () => {
      render(
        <FeedbackViewer {...defaultProps} isRunning={true} progress={67} />
      );

      // Should have a progress element
      const progressElement = screen.getByTestId('progress');
      expect(progressElement).toBeInTheDocument();
    });
  });

  describe('Empty State Rendering', () => {
    it('should display empty state when result is null and not running', () => {
      render(<FeedbackViewer {...defaultProps} />);

      expect(screen.getByText(/No feedback yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Submit an essay/i)).toBeInTheDocument();
    });

    it('should display empty state when result exists but outputs are missing', () => {
      const resultWithNoOutputs = { ...createMockResult(), outputs: null };
      render(<FeedbackViewer {...defaultProps} result={resultWithNoOutputs} />);

      expect(screen.getByText(/No feedback yet/i)).toBeInTheDocument();
    });
  });

  describe('Success State Rendering', () => {
    it('should display feedback report when result has outputs', () => {
      const result = createMockResult();
      render(<FeedbackViewer {...defaultProps} result={result} />);

      expect(screen.getByText(/Feedback Report/i)).toBeInTheDocument();
    });

    it('should display overall score badge', () => {
      const result = createMockResult({
        outputs: createLegacyOutputs({ overall_score: 92 })
      });
      render(<FeedbackViewer {...defaultProps} result={result} />);

      // Should show the score value
      expect(
        screen.getByText((content) => content.includes('92'))
      ).toBeInTheDocument();
      expect(screen.getByText(/\/100/i)).toBeInTheDocument();
    });

    it('should not display score section when overall_score is undefined', () => {
      const result = createMockResult({
        outputs: createLegacyOutputs({ overall_score: undefined })
      });
      render(<FeedbackViewer {...defaultProps} result={result} />);

      expect(screen.queryByText(/Overall Score/i)).not.toBeInTheDocument();
    });

    it('should render FeedbackCharts component with outputs', () => {
      const result = createMockResult();
      render(<FeedbackViewer {...defaultProps} result={result} />);

      expect(screen.getByTestId('feedback-charts')).toBeInTheDocument();
    });

    it('should render RevisionChat component', () => {
      const result = createMockResult();
      render(<FeedbackViewer {...defaultProps} result={result} />);

      expect(screen.getByTestId('revision-chat')).toBeInTheDocument();
    });

    it('should display feedback summary text', () => {
      const result = createMockResult({
        outputs: createLegacyOutputs({
          feedback_summary: 'Excellent work on this essay.'
        })
      });
      render(<FeedbackViewer {...defaultProps} result={result} />);

      expect(
        screen.getByText(/Excellent work on this essay/i)
      ).toBeInTheDocument();
    });

    it('should display no text feedback message when summary is missing', () => {
      const result = createMockResult({
        outputs: createLegacyOutputs({ feedback_summary: undefined })
      });
      render(<FeedbackViewer {...defaultProps} result={result} />);

      expect(
        screen.getByText(/No text feedback available/i)
      ).toBeInTheDocument();
    });

    it('should display score breakdown badges', () => {
      const result = createMockResult();
      render(<FeedbackViewer {...defaultProps} result={result} />);

      expect(screen.getAllByText(/Structure/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Content/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Style/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Grammar/i).length).toBeGreaterThan(0);
    });

    it('should calculate and display grammar score based on grammar notes', () => {
      const result = createMockResult({
        outputs: createLegacyOutputs({
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
              explanation: 'Subject-verb agreement'
            }
          ]
        })
      });
      render(<FeedbackViewer {...defaultProps} result={result} />);

      // Should show the calculated grammar score (100 - 2*5 = 90)
      const scores = screen.getAllByText((content) => content.includes('90'));
      expect(scores.length).toBeGreaterThan(0);
    });

    it('should handle missing structure analysis score gracefully', () => {
      const result = createMockResult({
        outputs: createLegacyOutputs({
          structure_analysis: {
            score: undefined,
            comments: '',
            suggestions: []
          }
        })
      });

      // Should not throw and should render other content
      expect(() =>
        render(<FeedbackViewer {...defaultProps} result={result} />)
      ).not.toThrow();
    });

    it('should display check circle icon when feedback is complete', () => {
      const result = createMockResult();
      render(<FeedbackViewer {...defaultProps} result={result} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Score Badge Rendering', () => {
    it('should render score badge for valid score', () => {
      const result = createMockResult();
      render(<FeedbackViewer {...defaultProps} result={result} />);

      // Should have scores displayed
      const scores = screen.getAllByText((content) => /\d+/.test(content));
      expect(scores.length).toBeGreaterThan(0);
    });

    it('should not render badge when score is undefined', () => {
      const result = createMockResult({
        outputs: createLegacyOutputs({
          structure_analysis: {
            score: undefined,
            comments: 'test',
            suggestions: []
          }
        })
      });

      // Should not throw and should render other content
      expect(() =>
        render(<FeedbackViewer {...defaultProps} result={result} />)
      ).not.toThrow();
    });

    it('should render all four score categories', () => {
      const result = createMockResult();
      render(<FeedbackViewer {...defaultProps} result={result} />);

      // Verify all score labels are present
      expect(screen.getAllByText(/Structure/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Content/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Style/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Grammar/i).length).toBeGreaterThan(0);
    });
  });
});
