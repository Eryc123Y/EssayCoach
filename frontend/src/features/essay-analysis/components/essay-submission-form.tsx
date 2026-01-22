'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fetchRubricList, RubricListItem } from '@/service/api/rubric';

interface EssaySubmissionFormProps {
  onSubmit: (data: {
    question: string;
    content: string;
    rubricId?: number;
  }) => void;
  isSubmitting?: boolean;
}

export function EssaySubmissionForm({
  onSubmit,
  isSubmitting: externalIsSubmitting
}: EssaySubmissionFormProps) {
  const [question, setQuestion] = useState('');
  const [content, setContent] = useState('');
  const [rubricId, setRubricId] = useState<string>('');
  const [rubrics, setRubrics] = useState<RubricListItem[]>([]);
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);

  // Combine external and local loading states
  const isSubmitting = externalIsSubmitting || localIsSubmitting;

  useEffect(() => {
    fetchRubricList()
      .then((res) => setRubrics(res.results))
      .catch((err) => console.error('Failed to fetch rubrics:', err));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question && content) {
      setLocalIsSubmitting(true);
      onSubmit({
        question,
        content,
        rubricId: rubricId ? parseInt(rubricId) : undefined
      });
    }
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6'>
      {/* Banner Section */}
      <div className='rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900/50'>
        <h1 className='text-foreground mb-2 text-2xl font-bold tracking-tight md:text-3xl'>
          Essay Analysis
        </h1>
        <p className='text-muted-foreground text-base md:text-lg'>
          Intelligent feedback for your writing
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className='bg-card overflow-hidden border-slate-200 shadow-sm dark:border-slate-800'>
          <form onSubmit={handleSubmit}>
            <CardHeader className='border-border/50 border-b px-8 pt-8 pb-6'>
              <CardTitle className='text-foreground flex items-center gap-3 text-xl font-semibold'>
                <BookOpen className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
                Essay Submission
              </CardTitle>
            </CardHeader>

            <CardContent className='space-y-6 p-8'>
              <div className='space-y-3'>
                <Label
                  htmlFor='question'
                  className='text-base font-medium text-slate-700 dark:text-slate-300'
                >
                  Essay Question
                </Label>
                <Input
                  id='question'
                  placeholder='e.g., Discuss the impact of AI on modern education...'
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isSubmitting}
                  className='h-12 rounded-lg border-slate-200 bg-white px-4 text-base transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950'
                />
              </div>

              <div className='space-y-3'>
                <Label
                  htmlFor='rubric'
                  className='text-base font-medium text-slate-700 dark:text-slate-300'
                >
                  Grading Rubric{' '}
                  <span className='ml-1 text-sm font-normal text-slate-400'>
                    (Optional)
                  </span>
                </Label>
                <Select
                  value={rubricId}
                  onValueChange={setRubricId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id='rubric'
                    className='h-12 rounded-lg border-slate-200 bg-white px-4 text-base transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950'
                  >
                    <SelectValue placeholder='Select a rubric for tailored grading...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='0'>Default Rubric</SelectItem>
                    {rubrics.map((rubric) => (
                      <SelectItem
                        key={rubric.rubric_id}
                        value={rubric.rubric_id.toString()}
                      >
                        {rubric.rubric_desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='relative space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='content'
                    className='text-base font-medium text-slate-700 dark:text-slate-300'
                  >
                    Essay Content
                  </Label>
                </div>

                <div className='relative'>
                  <Textarea
                    id='content'
                    placeholder='Start typing or paste your essay here...'
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSubmitting}
                    className='min-h-[450px] resize-none rounded-lg border-slate-200 bg-white p-4 text-base leading-relaxed transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950'
                  />

                  <div className='pointer-events-none absolute right-4 bottom-4 flex items-center gap-3'>
                    <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>
                      {readingTime} min read
                    </span>
                    <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>
                      {wordCount} words
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className='flex justify-end border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-900/50'>
              <Button
                type='submit'
                size='lg'
                disabled={!question || !content || isSubmitting}
                className={cn(
                  'group/btn relative h-14 transform overflow-hidden px-8 text-lg font-bold tracking-wide transition-all duration-500 ease-out hover:scale-[1.03]',
                  'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white',
                  'shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
                  'rounded-xl border-0',
                  (!question || !content || isSubmitting) &&
                    'cursor-not-allowed opacity-50 grayscale hover:scale-100'
                )}
              >
                <div className='absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 group-hover/btn:translate-y-0' />

                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className='mr-2 h-5 w-5 animate-pulse' />
                    Start AI Analysis
                    <ArrowRight className='ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1' />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
