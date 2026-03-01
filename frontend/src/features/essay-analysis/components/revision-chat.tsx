'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { fetchChatMessage } from '@/service/api/dify';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// Store conversation ID for multi-turn context
let conversationId: string | null = null;

export function RevisionChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get essay context from parent component or localStorage
  const getEssayContext = () => {
    // In a real implementation, this would come from props or a global store
    // For now, we use a minimal context
    return {
      essay_id: undefined, // Would be passed from parent
      conversation_id: conversationId || undefined
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetchChatMessage({
        message: input,
        context: getEssayContext()
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp
          ? new Date(response.timestamp)
          : new Date()
      };

      // Store conversation ID for follow-up messages
      if (response.message) {
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send message';
      toast.error(errorMessage);

      // Remove the user message if API failed
      setMessages((prev) => prev.filter((msg) => msg.id !== userMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Card className='border-border/50 bg-card/50 flex h-full flex-col overflow-hidden shadow-lg backdrop-blur-sm'>
      <CardHeader className='bg-muted/20 border-b pb-4'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Bot className='text-primary h-5 w-5' />
          Revision Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className='relative flex min-h-[400px] flex-1 flex-col p-0'>
        <ScrollArea className='flex-1 p-4'>
          <div className='space-y-4'>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex max-w-[85%] gap-3',
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                <Avatar className='mt-1 h-8 w-8 border shadow-sm'>
                  {msg.role === 'assistant' ? (
                    <>
                      <AvatarImage src='/bot-avatar.png' />
                      <AvatarFallback className='bg-primary text-primary-foreground'>
                        <Sparkles className='h-4 w-4' />
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src='/user-avatar.png' />
                      <AvatarFallback className='bg-muted'>
                        <User className='h-4 w-4' />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                <div
                  className={cn(
                    'rounded-2xl p-3 text-sm leading-relaxed shadow-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted/50 border-border/50 rounded-tl-none border'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className='bg-background/50 border-t p-4 backdrop-blur-sm'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className='flex gap-2'
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder='Ask about grammar, clarity, or style...'
              className='bg-background/80 border-muted focus-visible:ring-primary/30 flex-1 shadow-inner'
            />
            <Button
              type='submit'
              size='icon'
              disabled={!input.trim() || isLoading}
              className='bg-primary shadow-primary/20 shadow-lg transition-transform hover:scale-105 disabled:opacity-50'
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Send className='h-4 w-4' />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
