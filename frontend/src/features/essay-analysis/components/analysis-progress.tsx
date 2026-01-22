'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AnalysisProgressProps {
  isLoading: boolean;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, label: 'Reading submission' },
  { id: 2, label: 'Analyzing structure & flow' },
  { id: 3, label: 'Checking grammar & mechanics' },
  { id: 4, label: 'Evaluating content depth' },
  { id: 5, label: 'Finalizing insights' }
];

export function AnalysisProgress({
  isLoading,
  onComplete
}: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      // Progress up to 90% while loading
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 1; // Approx 4.5 seconds to 90%
        });
      }, 50);
    } else {
      // Complete the progress when loading finishes
      setProgress(100);
    }

    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    // Update steps based on progress
    const stepDuration = 100 / STEPS.length;
    const calculatedStep = Math.min(
      Math.floor(progress / stepDuration),
      STEPS.length - 1
    );

    if (progress >= 100) {
      const timeout = setTimeout(onComplete, 800); // Slight delay after 100%
      return () => clearTimeout(timeout);
    }

    setCurrentStep(calculatedStep);
  }, [progress, onComplete]);

  return (
    <div className='mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='w-full'
      >
        <Card className='bg-card/80 relative overflow-hidden border-none shadow-2xl backdrop-blur-xl'>
          <div className='from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent' />

          <CardContent className='space-y-8 p-8'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='relative'>
                <div className='bg-primary/20 absolute inset-0 rounded-full blur-xl' />
                <div className='bg-background border-border/50 relative rounded-full border p-4 shadow-lg'>
                  <Sparkles className='text-primary h-8 w-8 animate-pulse' />
                </div>
              </div>
              <div className='space-y-1 text-center'>
                <h2 className='text-2xl font-bold tracking-tight'>
                  AI Analysis in Progress
                </h2>
                <p className='text-muted-foreground'>
                  Please wait while we evaluate your essay...
                </p>
              </div>
            </div>

            <div className='space-y-6'>
              <div className='space-y-2'>
                <div className='text-muted-foreground flex justify-between text-xs font-medium'>
                  <span>{progress}% Complete</span>
                  <span>{isLoading ? 'Estimating...' : 'Done'}</span>
                </div>
                <Progress value={progress} className='bg-muted/50 h-2 w-full' />
              </div>

              <div className='space-y-3'>
                <AnimatePresence mode='wait'>
                  {STEPS.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep || progress === 100;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: index <= currentStep + 1 ? 1 : 0.4,
                          x: 0
                        }}
                        className='flex items-center gap-3'
                      >
                        <div className='relative flex h-5 w-5 items-center justify-center'>
                          {isCompleted ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <CheckCircle2 className='h-5 w-5 text-green-500' />
                            </motion.div>
                          ) : isActive ? (
                            <Loader2 className='text-primary h-5 w-5 animate-spin' />
                          ) : (
                            <Circle className='text-muted-foreground/30 h-4 w-4' />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-sm font-medium transition-colors duration-300',
                            isActive || isCompleted
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {step.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
