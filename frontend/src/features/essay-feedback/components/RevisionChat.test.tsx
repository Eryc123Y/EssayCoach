import { render, screen, fireEvent } from '@testing-library/react';
import { RevisionChat } from './RevisionChat';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('RevisionChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Message Display', () => {
    it('should display the initial assistant message on mount', () => {
      render(<RevisionChat />);

      expect(screen.getByText(/Hello! I've analyzed your essay/i)).toBeInTheDocument();
    });

    it('should display chat card with correct title', () => {
      render(<RevisionChat />);

      expect(screen.getByText(/Revision Assistant/i)).toBeInTheDocument();
    });

    it('should display chat description', () => {
      render(<RevisionChat />);

      expect(screen.getByText(/Ask follow-up questions/i)).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should allow user to type in the input field', () => {
      render(<RevisionChat />);

      const input = screen.getByPlaceholderText(/Ask about your essay.../i) as HTMLInputElement;
      fireEvent.input(input, { target: { value: 'How can I improve my conclusion?' } });

      expect(input.value).toBe('How can I improve my conclusion?');
    });

    it('should have correct placeholder text', () => {
      render(<RevisionChat />);

      expect(screen.getByPlaceholderText(/Ask about your essay.../i)).toBeInTheDocument();
    });
  });

  describe('Send Button State', () => {
    it('should be disabled when input is empty', () => {
      render(<RevisionChat />);

      const input = screen.getByPlaceholderText(/Ask about your essay.../i);
      expect(input).toHaveValue('');

      // Button should be disabled when empty (via button element near input)
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.querySelector('svg'));
      expect(sendButton).toBeDisabled();
    });

    it('should be enabled when input has content', () => {
      render(<RevisionChat />);

      const input = screen.getByPlaceholderText(/Ask about your essay.../i);
      fireEvent.input(input, { target: { value: 'Valid input' } });

      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.querySelector('svg'));
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Enter Key Functionality', () => {
    it('should trigger send on Enter key when input has value', () => {
      render(<RevisionChat />);

      const input = screen.getByPlaceholderText(/Ask about your essay.../i) as HTMLInputElement;
      
      // Type a message first
      fireEvent.input(input, { target: { value: 'Test message' } });
      expect(input.value).toBe('Test message');
      
      // Press Enter
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      // Input should be cleared after sending (observable behavior)
      expect(input.value).toBe('');
    });

    it('should not trigger send on Shift+Enter', () => {
      render(<RevisionChat />);

      const input = screen.getByPlaceholderText(/Ask about your essay.../i) as HTMLInputElement;
      
      // Type a message first
      fireEvent.input(input, { target: { value: 'Test message' } });
      expect(input.value).toBe('Test message');
      
      // Press Shift+Enter (should NOT send)
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      // Input should NOT be cleared
      expect(input.value).toBe('Test message');
    });
  });

  describe('Component Structure', () => {
    it('should render chat messages container', () => {
      render(<RevisionChat />);

      // Should have a container for messages
      const containers = screen.getAllByRole('generic');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('should render send button with icon', () => {
      render(<RevisionChat />);

      // Should have a button with an SVG (send icon)
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.querySelector('svg'));
      expect(sendButton).toBeInTheDocument();
    });

    it('should render avatar for assistant', () => {
      render(<RevisionChat />);

      const avatars = document.querySelectorAll('[data-slot="avatar"]');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('Message Content', () => {
    it('initial message should contain helpful text', () => {
      render(<RevisionChat />);

      expect(screen.getByText(/Hello! I've analyzed your essay/i)).toBeInTheDocument();
      expect(screen.getByText(/Ask me specifically about grammar/i)).toBeInTheDocument();
    });

    it('should have input field for user messages', () => {
      render(<RevisionChat />);

      const input = screen.getByPlaceholderText(/Ask about your essay.../i);
      expect(input).toBeInTheDocument();
      expect(input.tagName.toLowerCase()).toBe('input');
    });
  });
});
