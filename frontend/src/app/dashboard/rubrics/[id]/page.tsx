'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchRubricDetail, RubricDetail } from '@/service/api/rubric';
import { toast } from 'sonner';
import { IconLoader2, IconArrowLeft, IconClipboardList } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/rubrics')}
          >
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{rubric.rubric_desc}</h1>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(rubric.rubric_create_time)}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rubric Structure</CardTitle>
              <CardDescription>
                {rubric.rubric_items.length} dimensions with detailed scoring levels
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {rubric.rubric_items.reduce((sum, item) => sum + item.level_descriptions.length, 0)} total levels
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {rubric.rubric_items.map((item) => (
              <AccordionItem key={item.rubric_item_id} value={`item-${item.rubric_item_id}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold">{item.rubric_item_name}</span>
                    <Badge variant="outline">Weight: {item.rubric_item_weight}%</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {item.level_descriptions
                      .sort((a, b) => b.max_score - a.max_score) // Sort by score descending
                      .map((level) => (
                        <Card key={level.level_id} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                Score Range: {level.min_score} - {level.max_score}
                              </CardTitle>
                              <Badge 
                                variant={level.max_score >= 80 ? 'default' : level.max_score >= 60 ? 'secondary' : 'outline'}
                              >
                                {Math.round((level.max_score / Math.max(...item.level_descriptions.map(l => l.max_score))) * 100)}%
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {level.level_desc}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Dimensions</p>
              <p className="text-2xl font-bold">{rubric.rubric_items.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Scoring Levels</p>
              <p className="text-2xl font-bold">
                {rubric.rubric_items.reduce((sum, item) => sum + item.level_descriptions.length, 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Weight</p>
              <p className="text-2xl font-bold">
                {rubric.rubric_items.reduce((sum, item) => sum + parseFloat(item.rubric_item_weight), 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
