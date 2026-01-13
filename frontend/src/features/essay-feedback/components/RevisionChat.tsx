'use client';

import { Send, User as UserIcon, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRevisionChat } from '../hooks/useRevisionChat';

interface RevisionChatProps {
  onSendMessage?: (message: string) => Promise<string>;
}

export function RevisionChat({ onSendMessage }: RevisionChatProps = {}) {
  const {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    scrollRef,
    handleSendMessage,
    handleKeyDown
  } = useRevisionChat({ onSendMessage });

  return (
    <Card className='border-border/50 bg-background/50 flex h-[500px] flex-col shadow-lg backdrop-blur-xl'>
      <CardHeader className='border-border/40 border-b pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Sparkles className='h-5 w-5 text-indigo-500' />
          Revision Assistant
        </CardTitle>
        <CardDescription>
          Ask follow-up questions to improve your draft.
        </CardDescription>
      </CardHeader>

      <CardContent className='relative flex flex-1 flex-col overflow-hidden p-0'>
        <ScrollArea className='flex-1 p-4' ref={scrollRef}>
          <div className='space-y-4'>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex w-full max-w-[80%] gap-2',
                  message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                )}
              >
                <Avatar className='border-border/50 h-8 w-8 border'>
                  {message.role === 'assistant' ? (
                    <>
                      <AvatarImage src='/bot-avatar.png' />
                      <AvatarFallback className='bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'>
                        <Bot className='h-4 w-4' />
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className='bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
                      <UserIcon className='h-4 w-4' />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div
                  className={cn(
                    'rounded-2xl px-4 py-2 text-sm shadow-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted/80 text-foreground border-border/50 rounded-tl-sm border'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className='flex w-full max-w-[80%] gap-2'>
                <Avatar className='border-border/50 h-8 w-8 border'>
                  <AvatarFallback className='bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'>
                    <Bot className='h-4 w-4' />
                  </AvatarFallback>
                </Avatar>
                <div className='bg-muted/80 border-border/50 flex items-center gap-1 rounded-2xl rounded-tl-sm border px-4 py-2'>
                  <div className='bg-foreground/40 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]'></div>
                  <div className='bg-foreground/40 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]'></div>
                  <div className='bg-foreground/40 h-2 w-2 animate-bounce rounded-full'></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className='bg-background/50 border-border/40 mt-auto border-t p-3 backdrop-blur-sm'>
          <div className='flex gap-2'>
            <Input
              placeholder='Ask about your essay...'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className='border-border/50 flex-1 rounded-full focus-visible:ring-indigo-500/30'
            />
            <Button
              size='icon'
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className='rounded-full bg-indigo-600 shadow-md transition-all hover:scale-105 hover:bg-indigo-700 active:scale-95'
            >
              <Send className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
