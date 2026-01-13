'use client';

import { AlertCircle, CheckCircle2, Lightbulb, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Insight {
  id: string;
  type: 'critical' | 'suggestion' | 'strength';
  category: string;
  title: string;
  description: string;
  location?: string;
}

interface InsightsListProps {
  insights: Insight[];
}

export function InsightsList({ insights }: InsightsListProps) {
  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className='h-5 w-5 text-red-500' />;
      case 'suggestion':
        return <Lightbulb className='h-5 w-5 text-amber-500' />;
      case 'strength':
        return <CheckCircle2 className='h-5 w-5 text-green-500' />;
    }
  };

  const getBorderColor = (type: Insight['type']) => {
    switch (type) {
      case 'critical':
        return 'border-l-red-500';
      case 'suggestion':
        return 'border-l-amber-500';
      case 'strength':
        return 'border-l-green-500';
    }
  };

  return (
    <Card className='border-border/50 bg-card/50 flex h-full flex-col backdrop-blur-sm'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Lightbulb className='text-primary h-5 w-5' />
          Actionable Insights
        </CardTitle>
        <CardDescription>
          Prioritized suggestions to improve your essay
        </CardDescription>
      </CardHeader>
      <CardContent className='max-h-[600px] flex-1 space-y-4 overflow-y-auto pr-2'>
        {insights.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">No specific insights generated.</div>
        ) : (
          insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={cn(
                  'group bg-background relative rounded-lg border border-l-4 p-4 shadow-sm transition-all duration-300 hover:shadow-md',
                  getBorderColor(insight.type)
                )}
              >
                <div className='mb-2 flex items-start justify-between'>
                  <div className='flex items-center gap-2'>
                    {getIcon(insight.type)}
                    <Badge variant='secondary' className='text-xs font-normal'>
                      {insight.category}
                    </Badge>
                  </div>
                  {insight.location && (
                    <span className='text-muted-foreground bg-muted rounded px-2 py-1 text-xs'>
                      {insight.location}
                    </span>
                  )}
                </div>

                <h4 className='text-foreground group-hover:text-primary mb-1 font-semibold transition-colors'>
                  {insight.title}
                </h4>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {insight.description}
                </p>

                {insight.type !== 'strength' && (
                  <div className='mt-3 flex justify-end opacity-0 transition-opacity group-hover:opacity-100'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='hover:bg-primary/10 hover:text-primary h-8 text-xs'
                    >
                      Apply Fix <ArrowRight className='ml-1 h-3 w-3' />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
