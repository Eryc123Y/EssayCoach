'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  BookOpen,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  Lightbulb,
  Target,
  TrendingUp
} from 'lucide-react';
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
  CardTitle,
  CardDescription
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

const steps = [
  {
    id: 1,
    title: 'Question',
    icon: BookOpen,
    description: 'Enter your essay topic'
  },
  {
    id: 2,
    title: 'Content',
    icon: FileText,
    description: 'Write or paste your essay'
  },
  {
    id: 3,
    title: 'Review',
    icon: ClipboardCheck,
    description: 'Review and submit'
  }
];

const editorNotes = [
  {
    icon: Lightbulb,
    title: 'Lead with clarity',
    desc: 'State your purpose early and keep it focused.'
  },
  {
    icon: Target,
    title: 'Claim + evidence',
    desc: 'Support each point with concrete examples.'
  },
  {
    icon: TrendingUp,
    title: 'Revise for flow',
    desc: 'Read aloud to catch awkward transitions.'
  }
];

export function EssaySubmissionForm({
  onSubmit,
  isSubmitting: externalIsSubmitting
}: EssaySubmissionFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [question, setQuestion] = useState('');
  const [content, setContent] = useState('');
  const [rubricId, setRubricId] = useState<string>('');
  const [rubrics, setRubrics] = useState<RubricListItem[]>([]);
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);

  const isSubmitting = externalIsSubmitting || localIsSubmitting;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  useEffect(() => {
    fetchRubricList()
      .then((res) => setRubrics(res))
      .catch(() => {});
  }, []);

  const canProceed = () => {
    if (currentStep === 1) return question.trim().length > 0;
    if (currentStep === 2) return content.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

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

  return (
    <div className='mx-auto w-full max-w-6xl dark:bg-slate-950'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]'>
        {/* Left Sidebar - Progress Stepper */}
        <aside className='lg:sticky lg:top-6 lg:self-start'>
          <Card
            className={cn(
              'border-slate-200 dark:border-slate-800',
              'bg-slate-50 dark:bg-slate-900',
              'shadow-sm'
            )}
          >
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200'>
                Progress
              </CardTitle>
              <CardDescription className='text-xs text-slate-500 dark:text-slate-400'>
                Three-step practice flow
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div key={step.id} className='relative flex gap-3'>
                    {index < steps.length - 1 && (
                      <span
                        className={cn(
                          'absolute top-9 left-4 h-[calc(100%-10px)] w-px',
                          isCompleted
                            ? 'bg-emerald-500 dark:bg-emerald-600'
                            : 'bg-slate-200 dark:bg-slate-700'
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300',
                        isActive &&
                          'border-emerald-500 bg-emerald-500 text-white shadow-md dark:shadow-emerald-950',
                        isCompleted &&
                          'border-emerald-500 bg-emerald-500 text-white',
                        !isActive &&
                          !isCompleted &&
                          'border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className='h-4 w-4' />
                      ) : (
                        <Icon className='h-4 w-4' />
                      )}
                    </div>
                    <div className='space-y-1'>
                      <div
                        className={cn(
                          'text-sm font-semibold',
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-700 dark:text-slate-200'
                        )}
                      >
                        {step.title}
                      </div>
                      <div className='text-xs text-slate-500 dark:text-slate-400'>
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <div className='space-y-6'>
          <Card
            className={cn(
              'overflow-hidden border-slate-200 dark:border-slate-800',
              'bg-white dark:bg-slate-900',
              'shadow-xl dark:shadow-slate-950'
            )}
          >
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <CardHeader
                className={cn(
                  'border-b border-slate-200 dark:border-slate-800',
                  'bg-slate-50/50 dark:bg-slate-900/50',
                  'px-6 py-5'
                )}
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white'>
                      <BookOpen className='h-6 w-6 text-emerald-600 dark:text-emerald-400' />
                      Essay Practice
                    </CardTitle>
                    <CardDescription className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                      Step {currentStep}: {steps[currentStep - 1].title} ·{' '}
                      {steps[currentStep - 1].description}
                    </CardDescription>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800',
                      'bg-emerald-50 dark:bg-emerald-950/30',
                      'px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300'
                    )}
                  >
                    <Sparkles className='h-4 w-4' />
                    AI Editorial Review
                  </div>
                </div>
              </CardHeader>

              {/* Form Content */}
              <CardContent className='min-h-[340px] p-8'>
                <AnimatePresence mode='wait'>
                  {/* Step 1: Question */}
                  {currentStep === 1 && (
                    <motion.div
                      key='step1'
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className='space-y-6'
                    >
                      {/* Editor's Notes */}
                      <div
                        className={cn(
                          'rounded-lg border border-amber-200 dark:border-amber-800',
                          'bg-amber-50 dark:bg-amber-950/20',
                          'p-4'
                        )}
                      >
                        <h4
                          className={cn(
                            'font-semibold text-amber-800 dark:text-amber-200',
                            'flex items-center gap-2'
                          )}
                        >
                          <Lightbulb className='h-4 w-4' />
                          Editor&apos;s Notes
                        </h4>
                        <div className='mt-3 space-y-3'>
                          {editorNotes.map((tip, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex gap-3 rounded-md border-l-4 border-amber-500',
                                'bg-white/60 dark:bg-slate-900/60',
                                'p-3 shadow-sm'
                              )}
                            >
                              <div
                                className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                  'bg-amber-100 dark:bg-amber-900/50'
                                )}
                              >
                                <tip.icon className='h-4 w-4 text-amber-700 dark:text-amber-400' />
                              </div>
                              <div>
                                <div className='text-sm font-semibold text-slate-800 dark:text-slate-100'>
                                  {tip.title}
                                </div>
                                <div className='text-xs text-slate-600 dark:text-slate-400'>
                                  {tip.desc}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Question Input */}
                      <div className='space-y-3'>
                        <Label
                          htmlFor='question'
                          className='text-base font-semibold text-slate-700 dark:text-slate-200'
                        >
                          Essay Question / Topic
                        </Label>
                        <Input
                          id='question'
                          placeholder='e.g., Discuss the impact of artificial intelligence on modern education...'
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          disabled={isSubmitting}
                          className={cn(
                            'h-14 rounded-lg',
                            'border-slate-200 dark:border-slate-700',
                            'bg-white dark:bg-slate-900',
                            'text-base text-slate-900 dark:text-slate-100',
                            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                            'shadow-sm',
                            'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500',
                            'dark:focus:border-emerald-600 dark:focus:ring-emerald-600'
                          )}
                        />
                      </div>
                      <p className='text-sm text-slate-500 dark:text-slate-400'>
                        Enter the prompt or topic you want reviewed. The clearer
                        the focus, the sharper the feedback.
                      </p>
                    </motion.div>
                  )}

                  {/* Step 2: Content */}
                  {currentStep === 2 && (
                    <motion.div
                      key='step2'
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className='space-y-6'
                    >
                      {/* Word Count Cards */}
                      <div className='grid grid-cols-2 gap-4'>
                        <div
                          className={cn(
                            'rounded-lg border border-slate-200 dark:border-slate-700',
                            'bg-slate-50 dark:bg-slate-900',
                            'p-4 text-center shadow-sm'
                          )}
                        >
                          <div className='text-2xl font-bold text-slate-800 dark:text-slate-100'>
                            {wordCount}
                          </div>
                          <div className='text-sm text-slate-500 dark:text-slate-400'>
                            Words
                          </div>
                        </div>
                        <div
                          className={cn(
                            'rounded-lg border border-slate-200 dark:border-slate-700',
                            'bg-slate-50 dark:bg-slate-900',
                            'p-4 text-center shadow-sm'
                          )}
                        >
                          <div className='text-2xl font-bold text-slate-800 dark:text-slate-100'>
                            {charCount}
                          </div>
                          <div className='text-sm text-slate-500 dark:text-slate-400'>
                            Characters
                          </div>
                        </div>
                      </div>

                      {/* Rubric Select */}
                      <div className='space-y-3'>
                        <Label className='text-base font-semibold text-slate-700 dark:text-slate-200'>
                          Grading Rubric
                          <span className='ml-2 font-normal text-slate-400 dark:text-slate-500'>
                            (Optional)
                          </span>
                        </Label>
                        <Select
                          value={rubricId}
                          onValueChange={setRubricId}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger
                            className={cn(
                              'h-12 rounded-lg',
                              'border-slate-200 dark:border-slate-700',
                              'bg-white dark:bg-slate-900',
                              'shadow-sm'
                            )}
                          >
                            <SelectValue placeholder='Select a rubric for customized feedback...' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='0'>Default Rubric</SelectItem>
                            {rubrics.map((r) => (
                              <SelectItem
                                key={r.rubric_id}
                                value={r.rubric_id.toString()}
                              >
                                {r.rubric_desc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Essay Textarea - Paper-like Editor */}
                      <div className='space-y-3'>
                        <Label className='text-base font-semibold text-slate-700 dark:text-slate-200'>
                          Your Essay Content
                        </Label>
                        <div
                          className={cn(
                            'relative rounded-xl',
                            'border-2 border-slate-200 dark:border-slate-700',
                            'bg-white dark:bg-slate-800',
                            'shadow-sm',
                            'transition-all',
                            'focus-within:border-emerald-400 dark:focus-within:border-emerald-600',
                            'focus-within:ring-4 focus-within:ring-emerald-500/10 dark:focus-within:ring-emerald-600/10'
                          )}
                        >
                          {/* Left gutter line */}
                          <div
                            className={cn(
                              'pointer-events-none absolute top-0 left-0 h-full w-10',
                              'border-r border-slate-200 dark:border-slate-600',
                              'bg-slate-50 dark:bg-slate-700/30'
                            )}
                          />

                          <Textarea
                            placeholder='Paste or type your essay here. Make sure to include an introduction, body paragraphs, and conclusion...'
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isSubmitting}
                            className={cn(
                              'min-h-[280px] resize-none border-0 bg-transparent',
                              'pt-4 pr-4 pl-14',
                              'font-serif text-[16px] leading-8',
                              'text-slate-800 dark:text-slate-100',
                              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                              'focus-visible:ring-0',
                              'bg-transparent'
                            )}
                          />

                          {/* Word count footer */}
                          <div
                            className={cn(
                              'absolute right-3 bottom-3 flex items-center gap-2',
                              'rounded-md bg-slate-100/80 dark:bg-slate-800/80',
                              'px-2 py-1 text-xs text-slate-500 dark:text-slate-400',
                              'shadow-sm'
                            )}
                          >
                            <span>{wordCount} words</span>
                            <span>·</span>
                            <span>{charCount} chars</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Review */}
                  {currentStep === 3 && (
                    <motion.div
                      key='step3'
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className='space-y-6'
                    >
                      {/* Summary */}
                      <div
                        className={cn(
                          'rounded-lg border-2 border-emerald-200 dark:border-emerald-800',
                          'bg-emerald-50/50 dark:bg-emerald-950/20',
                          'p-4'
                        )}
                      >
                        <h4
                          className={cn(
                            'font-semibold text-emerald-800 dark:text-emerald-200',
                            'mb-2 flex items-center gap-2'
                          )}
                        >
                          <ClipboardCheck className='h-4 w-4' />
                          Submission Summary
                        </h4>
                        <div className='grid grid-cols-3 gap-4 text-sm'>
                          <div>
                            <span className='text-slate-500 dark:text-slate-400'>
                              Words:
                            </span>{' '}
                            <span className='font-semibold text-slate-800 dark:text-slate-100'>
                              {wordCount}
                            </span>
                          </div>
                          <div>
                            <span className='text-slate-500 dark:text-slate-400'>
                              Characters:
                            </span>{' '}
                            <span className='font-semibold text-slate-800 dark:text-slate-100'>
                              {charCount}
                            </span>
                          </div>
                          <div>
                            <span className='text-slate-500 dark:text-slate-400'>
                              Rubric:
                            </span>{' '}
                            <span className='font-semibold text-slate-800 dark:text-slate-100'>
                              {rubricId ? 'Custom' : 'Default'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Question Preview */}
                      <div
                        className={cn(
                          'rounded-lg border border-slate-200 dark:border-slate-700',
                          'bg-white dark:bg-slate-900',
                          'p-4'
                        )}
                      >
                        <h4 className='mb-3 font-semibold text-slate-800 dark:text-slate-100'>
                          Question
                        </h4>
                        <p
                          className={cn(
                            'text-slate-600 dark:text-slate-300',
                            'bg-slate-50 dark:bg-slate-950',
                            'rounded-md border border-slate-200 p-3 dark:border-slate-700'
                          )}
                        >
                          {question || '(No question entered)'}
                        </p>
                      </div>

                      {/* Content Preview */}
                      <div
                        className={cn(
                          'rounded-lg border border-slate-200 dark:border-slate-700',
                          'bg-white dark:bg-slate-900',
                          'p-4'
                        )}
                      >
                        <div className='mb-3 flex justify-between'>
                          <h4 className='font-semibold text-slate-800 dark:text-slate-100'>
                            Content Preview
                          </h4>
                          <span className='text-sm text-slate-500 dark:text-slate-400'>
                            {wordCount} words
                          </span>
                        </div>
                        <p
                          className={cn(
                            'text-slate-600 dark:text-slate-300',
                            'bg-slate-50 dark:bg-slate-950',
                            'rounded-md border border-slate-200 p-3 dark:border-slate-700',
                            'max-h-[200px] overflow-y-auto'
                          )}
                        >
                          {content}
                        </p>
                      </div>

                      {/* Editor's Notes */}
                      <div
                        className={cn(
                          'rounded-lg border border-amber-200 dark:border-amber-800',
                          'bg-amber-50 dark:bg-amber-950/20',
                          'p-4'
                        )}
                      >
                        <h4
                          className={cn(
                            'font-semibold text-amber-800 dark:text-amber-200',
                            'flex items-center gap-2'
                          )}
                        >
                          <Lightbulb className='h-4 w-4' />
                          Editor&apos;s Notes
                        </h4>
                        <div className='mt-3 space-y-3'>
                          {editorNotes.map((tip, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex gap-3 rounded-md border-l-4 border-amber-500',
                                'bg-white/60 dark:bg-slate-900/60',
                                'p-3 shadow-sm'
                              )}
                            >
                              <div
                                className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                  'bg-amber-100 dark:bg-amber-900/50'
                                )}
                              >
                                <tip.icon className='h-4 w-4 text-amber-700 dark:text-amber-400' />
                              </div>
                              <div>
                                <div className='text-sm font-semibold text-slate-800 dark:text-slate-100'>
                                  {tip.title}
                                </div>
                                <div className='text-xs text-slate-600 dark:text-slate-400'>
                                  {tip.desc}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>

              {/* Footer Navigation */}
              <CardFooter
                className={cn(
                  'border-t border-slate-200 dark:border-slate-800',
                  'flex justify-between px-6 py-4'
                )}
              >
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleBack}
                  disabled={currentStep === 1 || isSubmitting}
                  className={cn(
                    'gap-2',
                    'border-slate-200 dark:border-slate-700',
                    'text-slate-700 dark:text-slate-200',
                    'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <ArrowLeft className='h-4 w-4' />
                  Back
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type='button'
                    onClick={handleNext}
                    disabled={!canProceed() || isSubmitting}
                    className={cn(
                      'gap-2 bg-emerald-600 hover:bg-emerald-700',
                      'dark:bg-emerald-600 dark:hover:bg-emerald-700',
                      'text-white'
                    )}
                  >
                    Continue
                    <ArrowRight className='h-4 w-4' />
                  </Button>
                ) : (
                  <Button
                    type='submit'
                    disabled={!canProceed() || isSubmitting}
                    className={cn(
                      'gap-2 bg-amber-600 hover:bg-amber-700',
                      'dark:bg-amber-600 dark:hover:bg-amber-700',
                      'text-white'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className='h-4 w-4' />
                        Analyze My Essay
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
