import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EssayForm } from './EssayForm';
import { vi, describe, it, expect } from 'vitest';

// Mock UI components if necessary, but testing-library usually handles them fine if they are standard React components.
// However, FormField often involves Context which useForm provides.

describe('EssayForm', () => {
  it('renders correctly', () => {
    render(<EssayForm onSubmit={vi.fn()} isSubmitting={false} />);
    expect(
      screen.getByLabelText(/Essay Question \/ Topic/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Essay Content/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyze Essay/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const handleSubmit = vi.fn();
    render(<EssayForm onSubmit={handleSubmit} isSubmitting={false} />);

    fireEvent.click(screen.getByText(/Analyze Essay/i));

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter the essay question\/topic/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Please enter your essay content/i)
      ).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct data', async () => {
    const handleSubmit = vi.fn();
    render(<EssayForm onSubmit={handleSubmit} isSubmitting={false} />);

    fireEvent.input(screen.getByLabelText(/Essay Question \/ Topic/i), {
      target: { value: 'My Topic' }
    });
    fireEvent.input(screen.getByLabelText(/Essay Content/i), {
      target: { value: 'My Content' }
    });

    fireEvent.click(screen.getByText(/Analyze Essay/i));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          essay_question: 'My Topic',
          essay_content: 'My Content',
          language: 'English',
          response_mode: 'blocking'
        }),
        expect.anything()
      );
    });
  });

  it('disables button when submitting', () => {
    render(<EssayForm onSubmit={vi.fn()} isSubmitting={true} />);
    expect(screen.getByText(/Submitting.../i)).toBeDisabled();
  });
});
