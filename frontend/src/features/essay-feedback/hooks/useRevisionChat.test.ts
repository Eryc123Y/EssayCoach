import { renderHook, act } from '@testing-library/react';
import { useRevisionChat } from './useRevisionChat';
import type { ChatMessage, UseRevisionChatOptions } from '../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('useRevisionChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with default initial messages', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('assistant');
      expect(result.current.messages[0].content).toContain("I've analyzed your essay");
    });

    it('should start with empty input value', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.inputValue).toBe('');
    });

    it('should start with isTyping as false', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.isTyping).toBe(false);
    });

    it('should accept custom initial messages', () => {
      const customMessages: ChatMessage[] = [
        {
          id: 'custom-1',
          role: 'assistant',
          content: 'Custom welcome message',
          timestamp: new Date()
        }
      ];

      const { result } = renderHook(() => 
        useRevisionChat({ initialMessages: customMessages })
      );

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Custom welcome message');
    });

    it('should provide scrollRef', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.scrollRef).toBeDefined();
      expect(result.current.scrollRef.current).toBeNull();
    });
  });

  describe('sendMessage Function', () => {
    it('should not send empty messages', async () => {
      const { result } = renderHook(() => useRevisionChat());

      await act(async () => {
        await result.current.handleSendMessage();
      });

      expect(result.current.messages).toHaveLength(1); // Only initial
    });

    it('should not send whitespace-only messages', async () => {
      const { result } = renderHook(() => useRevisionChat());

      await act(async () => {
        result.current.setInputValue('   ');
        await result.current.handleSendMessage();
      });

      expect(result.current.messages).toHaveLength(1); // Only initial
    });

    it('should set isTyping to false after response', async () => {
      const { result } = renderHook(() => useRevisionChat());

      await act(async () => {
        result.current.setInputValue('Test');
        await result.current.handleSendMessage();
      });

      expect(result.current.isTyping).toBe(false);
    });
  });

  describe('handleKeyDown Function', () => {
    it('should send message on Enter key without shift', async () => {
      const { result } = renderHook(() => useRevisionChat());

      await act(async () => {
        result.current.setInputValue('Enter key test');
      });

      const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: false,
        bubbles: true
      });

      await act(async () => {
        result.current.handleKeyDown(keyboardEvent as unknown as React.KeyboardEvent<HTMLInputElement>);
      });

      // Should have sent the message (2 messages: initial + user)
      expect(result.current.messages.length).toBe(2);
    });

    it('should not send on other keys', async () => {
      const { result } = renderHook(() => useRevisionChat());

      await act(async () => {
        result.current.setInputValue('Key test');
      });

      const keyboardEvent = {
        key: 'Escape',
        preventDefault: vi.fn()
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      await act(async () => {
        result.current.handleKeyDown(keyboardEvent);
      });

      expect(result.current.messages).toHaveLength(1);
    });
  });

  describe('Input Value Management', () => {
    it('should update input value via setInputValue', async () => {
      const { result } = renderHook(() => useRevisionChat());

      await act(async () => {
        result.current.setInputValue('New value');
      });

      expect(result.current.inputValue).toBe('New value');
    });

    it('should return inputValue in result', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.inputValue).toBeDefined();
      expect(typeof result.current.inputValue).toBe('string');
    });

    it('should return setInputValue function', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.setInputValue).toBeDefined();
      expect(typeof result.current.setInputValue).toBe('function');
    });
  });

  describe('Message Array Management', () => {
    it('should return messages array', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.messages).toBeDefined();
      expect(Array.isArray(result.current.messages)).toBe(true);
    });
  });

  describe('Typing State', () => {
    it('should return isTyping boolean', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.isTyping).toBeDefined();
      expect(typeof result.current.isTyping).toBe('boolean');
    });
  });

  describe('Scroll Reference', () => {
    it('should return scrollRef', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.scrollRef).toBeDefined();
      expect(result.current.scrollRef.current).toBeNull();
    });
  });

  describe('Exported Functions', () => {
    it('should export handleSendMessage', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.handleSendMessage).toBeDefined();
      expect(typeof result.current.handleSendMessage).toBe('function');
    });

    it('should export handleKeyDown', () => {
      const { result } = renderHook(() => useRevisionChat());

      expect(result.current.handleKeyDown).toBeDefined();
      expect(typeof result.current.handleKeyDown).toBe('function');
    });
  });

  describe('Custom onSendMessage Callback', () => {
    it('should handle onSendMessage errors gracefully', async () => {
      const onSendMessage = vi.fn().mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => 
        useRevisionChat({ onSendMessage })
      );

      await act(async () => {
        result.current.setInputValue('Question');
        await result.current.handleSendMessage();
      });

      // Should still clear typing state
      expect(result.current.isTyping).toBe(false);
    });
  });
});
