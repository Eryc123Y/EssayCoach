'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchRubricDetail, RubricDetail } from '@/service/api/rubric';
import { toast } from 'sonner';
import {
  Loader2,
  ArrowLeft,
  ClipboardList,
  List,
  Scale,
  ChartBar,
  Info,
  ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

 export default function RubricDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rubricId = parseInt(params.id as string);
   
  const [rubric, setRubric] = useState<RubricDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const loadRubric = async () => {
      setIsLoading(true);
      try {
        const data = await fetchRubricDetail(rubricId);
        setRubric(data);
      } catch (error: any) {
        console.error('Failed to load rubric:', error);
        toast.error('Failed to load rubric details');
      } finally {
        setIsLoading(false);
      }
    };

    loadRubric();
  }, [rubricId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center p-4'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!rubric) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center p-4 text-center'>
        <div className='bg-muted/50 mb-4 rounded-full p-4'>
          <ClipboardList className='text-muted-foreground h-10 w-10' />
        </div>
        <h2 className='text-foreground text-xl font-semibold'>
          Rubric not found
        </h2>
        <p className='text-muted-foreground mb-6 max-w-xs text-sm'>
          The rubric you&apos;re looking for doesn&apos;t exist or has been
          deleted.
        </p>
        <Button
          onClick={() => router.push('/dashboard/rubrics')}
          variant='outline'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Rubrics
        </Button>
      </div>
    );
  }

  return (
    <div className='mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-6 md:p-8'>
      <div className='flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-12 dark:border-slate-800 dark:bg-slate-900/50'>
        <div className='flex flex-col gap-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/dashboard/rubrics')}
            className='text-muted-foreground hover:text-foreground -ml-2 w-fit'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Library
          </Button>
          <div>
            <h1 className='text-foreground text-3xl font-bold tracking-tight'>
              {rubric.rubric_desc}
            </h1>
            <p className='text-muted-foreground mt-2 text-sm'>
              Created on {formatDate(rubric.rubric_create_time)}
            </p>
          </div>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card className='bg-card border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-800'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium tracking-wider uppercase'>
              Dimensions
            </CardTitle>
            <div className='rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'>
              <List className='h-4 w-4' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-foreground text-3xl font-bold'>
              {rubric.rubric_items?.length ?? 0}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Evaluation criteria
            </p>
          </CardContent>
        </Card>
        <Card className='bg-card border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-800'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium tracking-wider uppercase'>
              Total Levels
            </CardTitle>
            <div className='rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'>
              <ChartBar className='h-4 w-4' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-foreground text-3xl font-bold'>
              {rubric.rubric_items?.reduce(
                (sum, item) => sum + (item.level_descriptions?.length ?? 0),
                0
              ) ?? 0}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Scoring definitions
            </p>
          </CardContent>
        </Card>
        <Card className='bg-card border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-800'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium tracking-wider uppercase'>
              Total Weight
            </CardTitle>
            <div className='rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
              <Scale className='h-4 w-4' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-foreground text-3xl font-bold'>
              {(
                rubric.rubric_items?.reduce(
                  (sum, item) =>
                    sum + parseFloat(item.rubric_item_weight || '0'),
                  0
                ) ?? 0
              ).toFixed(1)}
              %
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Cumulative score weight
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='space-y-6'>
        <motion.div
          layout
          className='flex items-center justify-between gap-2 pb-2 border-b border-border/50'
        >
          <div className='flex items-center gap-2'>
            <ClipboardList className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Rubric Structure</h2>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowInfo(!showInfo)}
            className={cn(
              'text-muted-foreground hover:text-foreground transition-colors duration-300',
              showInfo && 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
            )}
          >
            <motion.div
              animate={{
                scale: showInfo ? [1, 0.9, 1] : 1,
                color: showInfo ? 'rgb(67, 56, 202)' : 'rgb(100, 116, 139)'
              }}
              transition={{
                scale: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                color: { duration: 0.2 }
              }}
              className="mr-2"
            >
              <Info className="h-4 w-4" />
            </motion.div>
            <span className="text-sm font-medium">
              {showInfo ? 'Hide Information' : 'Understanding This Rubric'}
            </span>
            <motion.div
              animate={{ rotate: showInfo ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="ml-2"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </motion.div>

        <AnimatePresence mode='wait'>
          {showInfo && (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1]
            }}
            className='mb-6 rounded-xl border border-border/50 bg-slate-50 dark:bg-slate-900/50 p-6'
          >
            <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
              Understanding This Rubric
            </h3>

            <div className='space-y-4'>
              <div>
                <h4 className="text-base font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                  Core Concepts
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Learn the fundamental concepts behind rubric-based evaluation.
                </p>
              </div>

              <div className='space-y-3'>
                <div>
                  <p className="font-medium text-foreground mb-1">
                    Dimensions:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The criteria or dimensions evaluated in each essay (e.g., Organization, Content, Grammar). Each essay is scored across all dimensions.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">
                    Weight:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The percentage importance of each dimension. All weights add up to 100% to determine the overall score.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">
                    Score Ranges:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Point ranges for each performance level: Excellent, Standard, or Needs Work.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-base font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                  Performance Levels
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Understand what each score level means for essay evaluation.
                </p>
                <div className="space-y-3">
                  <div className='flex items-start gap-3'>
                    <Badge variant='outline' className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400">
                      Excellent
                    </Badge>
                    <p className="text-sm text-muted-foreground ml-3">
                      High-quality work that meets all criteria with excellence.
                    </p>
                  </div>
                  <div className='flex items-start gap-3'>
                    <Badge variant='outline' className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400">
                      Standard
                    </Badge>
                    <p className="text-sm text-muted-foreground ml-3">
                      Acceptable work that meets most criteria.
                    </p>
                  </div>
                  <div className='flex items-start gap-3'>
                    <Badge variant='outline' className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400">
                      Needs Work
                    </Badge>
                    <p className="text-sm text-muted-foreground ml-3">
                      Work that needs improvement to meet expectations.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-base font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                  Example
                </h4>
                <Card className='border-border/50 bg-white dark:bg-slate-950'>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-2">
                      Consider an essay evaluated on Organization (30%) and Content (70%):
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          Excellent:
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Organization: 9/10 (90%), Content: 8/10 (80%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          Overall:
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          8.5 / 10 (85%)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>

        <Accordion
          type='multiple'
          defaultValue={rubric.rubric_items?.map(
            (item) => `item-${item.rubric_item_id}`
          )}
          className='space-y-4'
        >
          {rubric.rubric_items?.map((item, index) => (
            <motion.div
              key={item.rubric_item_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AccordionItem
                value={`item-${item.rubric_item_id}`}
                className='border-none'
              >
                <Card className='border-border/60 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md'>
                  <AccordionTrigger className='bg-secondary/30 hover:bg-secondary/50 px-6 py-4 transition-colors hover:no-underline'>
                    <div className='flex w-full items-center justify-between pr-4'>
                      <div className='flex items-center gap-4 text-left'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700 shadow-sm ring-1 ring-indigo-500/20 dark:bg-indigo-900/50 dark:text-indigo-300'>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className='text-foreground text-lg font-bold'>
                            {item.rubric_item_name}
                          </h3>
                          <p className='text-muted-foreground text-xs font-medium'>
                            Grading Dimension
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant='secondary'
                        className='bg-background border-border/50 border px-3 py-1 font-mono text-sm shadow-sm'
                      >
                        {item.rubric_item_weight}%
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className='p-0'>
                    <div className='divide-border/30 bg-card/50 divide-y px-6 py-2'>
                      {(item.level_descriptions ?? [])
                        .sort((a, b) => b.level_max_score - a.level_max_score)
                        .map((level) => {
                          const isExcellent =
                            level.level_max_score >=
                            (item.rubric_item_id === 5 ? 16 : 40);
                          const isStandard =
                            level.level_max_score >=
                            (item.rubric_item_id === 5 ? 8 : 20);

                          return (
                            <div
                              key={level.level_desc_id}
                              className='group flex flex-col gap-4 py-6 transition-colors sm:flex-row'
                            >
                              <div className='flex min-w-[140px] flex-row gap-2 pt-1 sm:flex-col sm:items-end sm:gap-2'>
                                <div className='bg-secondary/50 border-border/50 flex w-fit items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 shadow-sm sm:w-full'>
                                  <span className='text-foreground text-sm font-bold tabular-nums'>
                                    {level.level_min_score}-
                                    {level.level_max_score}
                                  </span>
                                  <span className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                                    pts
                                  </span>
                                </div>
                                <Badge
                                  variant='outline'
                                  className={cn(
                                    'h-6 w-fit justify-center border px-2.5 py-0.5 text-[10px] font-semibold shadow-sm sm:w-full',
                                    isExcellent
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400'
                                      : isStandard
                                        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400'
                                        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400'
                                  )}
                                >
                                  {isExcellent
                                    ? 'Excellent'
                                    : isStandard
                                      ? 'Standard'
                                      : 'Needs Work'}
                                </Badge>
                              </div>

                              <div className='border-border/40 relative flex-1 border-l-2 pl-6 transition-all duration-300 group-hover:border-indigo-500/30'>
                                <p className='text-foreground/80 text-[15px] leading-relaxed whitespace-pre-wrap'>
                                  {level.level_desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
