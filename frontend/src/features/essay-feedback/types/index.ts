export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UseRevisionChatOptions {
  onSendMessage?: (message: string) => Promise<string>;
  initialMessages?: ChatMessage[];
}
