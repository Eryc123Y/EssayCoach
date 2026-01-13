'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EssaySubmissionFormProps {
  onSubmit: (data: { question: string; content: string }) => void;
}

export function EssaySubmissionForm({ onSubmit }: EssaySubmissionFormProps) {
  const [question, setQuestion] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question && content) {
      onSubmit({ question, content });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className='mx-auto w-full max-w-4xl'
    >
      <div className='mb-8 space-y-2 text-center'>
        <h1 className='from-primary bg-gradient-to-r to-purple-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent'>
          Writing Workspace
        </h1>
        <p className='text-muted-foreground text-lg'>
          Submit your essay for instant, multi-dimensional AI analysis.
        </p>
      </div>

      <Card className='border-border/50 shadow-primary/5 bg-card/50 group relative overflow-hidden shadow-xl backdrop-blur-sm'>
        <div className='from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100' />

        <form onSubmit={handleSubmit}>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-xl font-semibold'>
              <FileText className='text-primary h-5 w-5' />
              Essay Details
            </CardTitle>
            <CardDescription>
              Provide the essay question and your response content.
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            <div className='group/input space-y-2'>
              <label
                htmlFor='question'
                className='text-foreground/80 group-focus-within/input:text-primary flex items-center gap-2 text-sm font-medium transition-colors'
              >
                <HelpCircle className='h-4 w-4' />
                Essay Question
              </label>
              <Input
                id='question'
                placeholder='e.g., Discuss the impact of AI on modern education...'
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className='bg-background/50 border-muted focus-visible:ring-primary/30 h-12 text-lg transition-all duration-300'
              />
            </div>

            <div className='group/input space-y-2'>
              <label
                htmlFor='content'
                className='text-foreground/80 group-focus-within/input:text-primary flex items-center gap-2 text-sm font-medium transition-colors'
              >
                <FileText className='h-4 w-4' />
                Content
              </label>
              <div className='relative'>
                <Textarea
                  id='content'
                  placeholder='Start typing or paste your essay here...'
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className='bg-background/50 border-muted focus-visible:ring-primary/30 min-h-[400px] resize-none p-6 text-base leading-relaxed shadow-sm transition-all duration-300 focus:shadow-md'
                />
                <div className='text-muted-foreground bg-background/80 border-border/50 absolute right-4 bottom-4 rounded-md border px-2 py-1 text-xs backdrop-blur-sm'>
                  {content.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className='flex justify-end px-8 pt-2 pb-8'>
            <Button
              type='submit'
              size='lg'
              disabled={!question || !content}
              className={cn(
                'from-primary hover:from-primary/90 shadow-primary/20 bg-gradient-to-r to-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:to-purple-600/90',
                (!question || !content) &&
                  'cursor-not-allowed opacity-50 hover:scale-100'
              )}
            >
              <Sparkles className='mr-2 h-5 w-5 animate-pulse' />
              Start AI Analysis
              <ArrowRight className='ml-2 h-5 w-5' />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
