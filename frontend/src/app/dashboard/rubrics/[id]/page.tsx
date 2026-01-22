'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchRubricDetail, RubricDetail } from '@/service/api/rubric';
import { toast } from 'sonner';
import { IconLoader2, IconArrowLeft, IconClipboardList, IconList, IconScale, IconChartBar } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rubric) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <IconClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Rubric not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The rubric you're looking for doesn't exist
        </p>
        <Button onClick={() => router.push('/dashboard/rubrics')}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Rubrics
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden h-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 overflow-y-auto p-4 md:p-8"
      >
        <div className="mx-auto max-w-6xl space-y-8 pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/rubrics')}
                className="h-8 w-8 rounded-full p-0"
              >
                <IconArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{rubric.rubric_desc}</h1>
                <p className="text-sm text-muted-foreground">
                  Created on {formatDate(rubric.rubric_create_time)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Dimensions
                </CardTitle>
                <IconList className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{rubric.rubric_items?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Evaluation criteria
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Total Levels
                </CardTitle>
                <IconChartBar className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {rubric.rubric_items?.reduce(
                    (sum, item) => sum + (item.level_descriptions?.length ?? 0),
                    0
                  ) ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scoring definitions
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Total Weight
                </CardTitle>
                <IconScale className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(rubric.rubric_items?.reduce(
                    (sum, item) => sum + parseFloat(item.rubric_item_weight || '0'),
                    0
                  ) ?? 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cumulative score weight
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <IconClipboardList className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-tight">Rubric Structure</h2>
            </div>
            
            <Accordion type="multiple" defaultValue={rubric.rubric_items?.map(item => `item-${item.rubric_item_id}`)} className="space-y-4">
              {rubric.rubric_items?.map((item, index) => (
                <motion.div
                  key={item.rubric_item_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AccordionItem value={`item-${item.rubric_item_id}`} className="border-none">
                    <Card className="border-border/60 overflow-hidden shadow-sm">
                      <AccordionTrigger className="hover:no-underline py-4 px-6 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-4 text-left">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-foreground">{item.rubric_item_name}</h3>
                              <p className="text-xs text-muted-foreground font-normal">Grading Dimension</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="px-3 py-1 text-sm font-mono bg-background shadow-inner border border-border/50">
                            {item.rubric_item_weight}%
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                        <div className="divide-y divide-border/40 px-6 py-2 bg-card/30">
                          {(item.level_descriptions ?? [])
                            .sort((a, b) => b.level_max_score - a.level_max_score)
                            .map((level) => {
                              const isExcellent = level.level_max_score >= (item.rubric_item_id === 5 ? 16 : 40);
                              const isStandard = level.level_max_score >= (item.rubric_item_id === 5 ? 8 : 20);
                              
                              return (
                                <div 
                                  key={level.level_desc_id} 
                                  className="group flex flex-col sm:flex-row gap-4 py-5 transition-colors"
                                >
                                  <div className="flex flex-row sm:flex-col sm:items-end gap-2 sm:gap-1 min-w-[120px] pt-1">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/50 border border-border/40 w-fit sm:w-full justify-center">
                                      <span className="text-sm font-bold tabular-nums">
                                        {level.level_min_score}-{level.level_max_score}
                                      </span>
                                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">pts</span>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-[10px] px-2 py-0 h-5 border-none font-semibold",
                                        isExcellent ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                                        isStandard ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                        "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                      )}
                                    >
                                      {isExcellent ? 'Excellent' : isStandard ? 'Standard' : 'Needs Work'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex-1 relative pl-4 border-l-2 border-transparent group-hover:border-primary/20 transition-all">
                                    <p className="text-[15px] text-foreground/90 whitespace-pre-wrap leading-relaxed">
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
      </motion.div>
    </div>
  );
}
