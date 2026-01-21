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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/rubrics')}
            className="hover:bg-transparent hover:text-primary"
          >
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{rubric.rubric_desc}</h1>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(rubric.rubric_create_time)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Dimensions
            </CardTitle>
            <IconList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rubric.rubric_items.length}</div>
            <p className="text-xs text-muted-foreground">
              Evaluation criteria
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Levels
            </CardTitle>
            <IconChartBar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rubric.rubric_items.reduce((sum, item) => sum + item.level_descriptions.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Scoring definitions
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Weight
            </CardTitle>
            <IconScale className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rubric.rubric_items.reduce((sum, item) => sum + parseFloat(item.rubric_item_weight), 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Cumulative score weight
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rubric Structure</CardTitle>
              <CardDescription>
                Detailed breakdown of grading dimensions and scoring levels
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {rubric.rubric_items.map((item, index) => (
              <motion.div
                key={item.rubric_item_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AccordionItem value={`item-${item.rubric_item_id}`} className="border-b-border/50">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-foreground">{item.rubric_item_name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-secondary/50 font-mono">
                        {item.rubric_item_weight}%
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2 pb-4 pl-9">
                      {item.level_descriptions
                        .sort((a, b) => b.max_score - a.max_score)
                        .map((level) => (
                          <div 
                            key={level.level_id} 
                            className="relative overflow-hidden rounded-lg border border-border/50 bg-card/30 p-4 transition-colors hover:bg-card/50"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-purple-500/50" />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {level.level_desc}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1 min-w-[100px]">
                                <span className="text-sm font-bold">
                                  {level.min_score} - {level.max_score} pts
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px]",
                                    level.max_score >= 80 ? "border-green-500/30 text-green-600 bg-green-500/5" :
                                    level.max_score >= 60 ? "border-yellow-500/30 text-yellow-600 bg-yellow-500/5" :
                                    "border-red-500/30 text-red-600 bg-red-500/5"
                                  )}
                                >
                                  {level.max_score >= 80 ? 'Excellent' : level.max_score >= 60 ? 'Standard' : 'Needs Work'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
}
