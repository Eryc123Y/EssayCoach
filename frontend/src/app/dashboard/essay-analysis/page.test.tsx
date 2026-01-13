import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIAnalysisPage from './page';
import * as difyApi from '@/service/api/dify';
import { useAuth } from '@/components/layout/simple-auth-context';

// Mock the dependencies
vi.mock('@/service/api/dify', () => ({
  fetchDifyWorkflowRun: vi.fn(),
}));

vi.mock('@/components/layout/simple-auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock PageContainer to avoid layout issues
vi.mock('@/components/layout/page-container', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-container">{children}</div>,
}));

// Mock motion/react to avoid animation delays in tests
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  },
}));

// Mock result components to verify props
vi.mock('@/features/essay-analysis/components/analysis-progress', () => ({
  AnalysisProgress: ({ isLoading, onComplete }: any) => (
    <div data-testid="analysis-progress">
      {isLoading ? 'Loading...' : 'Complete'}
      <button onClick={onComplete} data-testid="complete-analysis-btn">Complete Analysis</button>
    </div>
  ),
}));

vi.mock('@/features/essay-analysis/components/feedback-dashboard', () => ({
  FeedbackDashboard: ({ scores, overallScore }: any) => (
    <div data-testid="feedback-dashboard">
      <div data-testid="overall-score">{overallScore}</div>
      <div data-testid="scores">{JSON.stringify(scores)}</div>
    </div>
  ),
}));

vi.mock('@/features/essay-analysis/components/insights-list', () => ({
  InsightsList: ({ insights }: any) => (
    <div data-testid="insights-list">{JSON.stringify(insights)}</div>
  ),
}));

vi.mock('@/features/essay-analysis/components/revision-chat', () => ({
  RevisionChat: () => <div data-testid="revision-chat">Revision Chat</div>,
}));

// ResizeObserver mock needed for some UI components that might be implicitly used or just good practice
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('AIAnalysisPage', () => {
  const mockUser = { id: 'user-123', name: 'Test User' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  const mockSuccessResponse = {
    status: 'succeeded',
    data: {
      outputs: {
        overall_score: 85,
        structure_analysis: { score: 80, comments: 'Good structure' },
        content_analysis: { score: 90, comments: 'Good content' },
        style_analysis: { score: 85, comments: 'Good style' },
        grammar_notes: [
          { 
            type: 'Typo', 
            explanation: 'Spelling error', 
            original: 'teh', 
            suggestion: 'the' 
          }
        ]
      }
    }
  };

  it('renders the essay submission form initially', () => {
    render(<AIAnalysisPage />);
    
    expect(screen.getByText(/Writing Workspace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Essay Question/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Content/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start AI Analysis/i })).toBeInTheDocument();
  });

  it('allows user input in question and content fields', () => {
    render(<AIAnalysisPage />);
    
    const questionInput = screen.getByLabelText(/Essay Question/i);
    const contentInput = screen.getByLabelText(/Content/i);
    
    fireEvent.change(questionInput, { target: { value: 'Test Question' } });
    fireEvent.change(contentInput, { target: { value: 'Test Essay Content' } });
    
    expect(questionInput).toHaveValue('Test Question');
    expect(contentInput).toHaveValue('Test Essay Content');
  });

  it('submits the form and triggers API call', async () => {
    (difyApi.fetchDifyWorkflowRun as any).mockResolvedValue(mockSuccessResponse);
    
    render(<AIAnalysisPage />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/Essay Question/i), { target: { value: 'Test Question' } });
    fireEvent.change(screen.getByLabelText(/Content/i), { target: { value: 'Test Essay Content' } });
    
    // Submit
    const submitBtn = screen.getByRole('button', { name: /Start AI Analysis/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);
    
    // Verify API call
    await waitFor(() => {
      expect(difyApi.fetchDifyWorkflowRun).toHaveBeenCalledWith({
        essay_question: 'Test Question',
        essay_content: 'Test Essay Content',
        language: 'English',
        response_mode: 'blocking',
        user_id: mockUser.id,
      });
    });
  });

  it('shows analyzing state (loading)', async () => {
    // Return a promise that doesn't resolve immediately to test loading state
    (difyApi.fetchDifyWorkflowRun as any).mockImplementation(() => new Promise(() => {}));
    
    render(<AIAnalysisPage />);
    
    fireEvent.change(screen.getByLabelText(/Essay Question/i), { target: { value: 'Q' } });
    fireEvent.change(screen.getByLabelText(/Content/i), { target: { value: 'C' } });
    fireEvent.click(screen.getByRole('button', { name: /Start AI Analysis/i }));
    
    expect(screen.getByTestId('analysis-progress')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows results after successful analysis', async () => {
    (difyApi.fetchDifyWorkflowRun as any).mockResolvedValue(mockSuccessResponse);
    
    render(<AIAnalysisPage />);
    
    fireEvent.change(screen.getByLabelText(/Essay Question/i), { target: { value: 'Q' } });
    fireEvent.change(screen.getByLabelText(/Content/i), { target: { value: 'C' } });
    fireEvent.click(screen.getByRole('button', { name: /Start AI Analysis/i }));
    
    // Wait for API to return
    await waitFor(() => {
      expect(difyApi.fetchDifyWorkflowRun).toHaveBeenCalled();
    });

    // In the actual component, AnalysisProgress calls onComplete when it's done or API returns.
    // Since we mocked AnalysisProgress, we need to trigger onComplete manually if the component logic relies on it.
    // Looking at page.tsx:
    // setIsLoading(true) -> API Call -> setIsLoading(false) -> handleAnalysisComplete checks !isLoading
    // BUT handleAnalysisComplete is passed to AnalysisProgress.
    // So the page waits for AnalysisProgress to trigger onComplete.
    
    // The mocked AnalysisProgress shows "Complete Analysis" button which calls onComplete
    const completeBtn = await screen.findByTestId('complete-analysis-btn');
    fireEvent.click(completeBtn);
    
    // Now results should be visible
    expect(await screen.findByTestId('feedback-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('insights-list')).toBeInTheDocument();
    expect(screen.getByTestId('revision-chat')).toBeInTheDocument();
    
    // Verify data passed to components
    expect(screen.getByTestId('overall-score')).toHaveTextContent('85');
    
    const scoresContent = screen.getByTestId('scores').textContent;
    expect(scoresContent).toContain('"category":"Structure","score":80');
    expect(scoresContent).toContain('"category":"Content","score":90');
    expect(scoresContent).toContain('"category":"Style","score":85');
    
    const insightsContent = screen.getByTestId('insights-list').textContent;
    expect(insightsContent).toContain('Spelling error');
    expect(insightsContent).toContain('teh');
    expect(insightsContent).toContain('the');
  });

  it('handles API failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (difyApi.fetchDifyWorkflowRun as any).mockRejectedValue(new Error('API Error'));
    
    render(<AIAnalysisPage />);
    
    fireEvent.change(screen.getByLabelText(/Essay Question/i), { target: { value: 'Q' } });
    fireEvent.change(screen.getByLabelText(/Content/i), { target: { value: 'C' } });
    fireEvent.click(screen.getByRole('button', { name: /Start AI Analysis/i }));
    
    await waitFor(() => {
      expect(difyApi.fetchDifyWorkflowRun).toHaveBeenCalled();
    });
    
    // Expect toast error
    // Note: The toast mock might be called, but we assert on page state
    // The component sets state back to 'input' on error
    expect(await screen.findByText(/Writing Workspace/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
