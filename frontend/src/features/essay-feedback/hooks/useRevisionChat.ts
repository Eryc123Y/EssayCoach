import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, UseRevisionChatOptions } from '../types';

const MOCK_RESPONSES = [
  "That's a great question. Based on the rubric, you could improve the flow by adding transition words between paragraphs.",
  'Your argument is strong, but adding a specific example in the second paragraph would make it even more convincing.',
  'I noticed a few passive voice constructions. Try switching them to active voice for more impact.',
  'The conclusion summarizes your points well, but consider ending with a thought-provoking question or a call to action.'
];

const DEFAULT_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      "Hello! I've analyzed your essay. I'm here to help you improve it. Ask me specifically about grammar, flow, or how to strengthen your arguments!",
    timestamp: new Date()
  }
];

export function useRevisionChat(options?: UseRevisionChatOptions) {
  const { onSendMessage, initialMessages = DEFAULT_INITIAL_MESSAGES } =
    options ?? {};

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getMockResponse = useCallback((_message: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomResponse =
          MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
        resolve(randomResponse);
      }, 1500);
    });
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const responseContent = onSendMessage
        ? await onSendMessage(inputValue)
        : await getMockResponse(inputValue);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, onSendMessage, getMockResponse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  return {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    scrollRef,
    handleSendMessage,
    handleKeyDown
  };
}
