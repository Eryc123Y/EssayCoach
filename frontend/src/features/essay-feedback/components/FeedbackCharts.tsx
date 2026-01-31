'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { DifyWorkflowRunResponse } from '@/types/dify';
import { useTheme } from 'next-themes';

interface FeedbackChartsProps {
  outputs: NonNullable<DifyWorkflowRunResponse['data']['outputs']>;
}

export function FeedbackCharts({ outputs }: FeedbackChartsProps) {
  const { theme } = useTheme();

  const grammarScore = Math.max(
    0,
    100 - (outputs.grammar_notes?.length || 0) * 5
  );

  const data = [
    {
      subject: 'Structure',
      A: outputs.structure_analysis?.score || 0,
      fullMark: 100
    },
    {
      subject: 'Content',
      A: outputs.content_analysis?.score || 0,
      fullMark: 100
    },
    {
      subject: 'Style',
      A: outputs.style_analysis?.score || 0,
      fullMark: 100
    },
    {
      subject: 'Grammar',
      A: grammarScore,
      fullMark: 100
    }
  ];

  const chartColor = theme === 'dark' ? '#3b82f6' : '#2563eb';
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const textColor = theme === 'dark' ? '#9ca3af' : '#4b5563';

  return (
    <Card className='border-border/50 bg-background/50 col-span-1 h-full shadow-lg backdrop-blur-xl'>
      <CardHeader className='items-center pb-4'>
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>
          Detailed breakdown of your essay&apos;s performance across key
          metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-2'>
        <div className='h-[300px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <RadarChart cx='50%' cy='50%' outerRadius='80%' data={data}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis
                dataKey='subject'
                tick={{ fill: textColor, fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name='Score'
                dataKey='A'
                stroke={chartColor}
                fill={chartColor}
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
