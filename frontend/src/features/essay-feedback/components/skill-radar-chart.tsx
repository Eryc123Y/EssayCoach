'use client';

import * as React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

export interface SkillData {
  skill: string;
  score: number;
  fullMark: number;
}

export interface SkillRadarChartProps {
  /** 五项技能分数 */
  skills: {
    grammar: number;
    logic: number;
    tone: number;
    structure: number;
    vocabulary: number;
  };
  /** 是否显示对比数据（可选） */
  averageSkills?: {
    grammar: number;
    logic: number;
    tone: number;
    structure: number;
    vocabulary: number;
  };
  /** 自定义标题 */
  title?: string;
  /** 自定义描述 */
  description?: string;
  /** 最小高度（像素） */
  minHeight?: number;
}

const SKILL_LABELS: Record<keyof SkillRadarChartProps['skills'], string> = {
  grammar: 'Grammar',
  logic: 'Logic',
  tone: 'Tone',
  structure: 'Structure',
  vocabulary: 'Vocabulary'
};

const chartConfig = {
  score: {
    label: 'Your Score',
    color: 'hsl(var(--primary))'
  },
  average: {
    label: 'Class Average',
    color: 'hsl(var(--muted-foreground))'
  }
} satisfies ChartConfig;

export function SkillRadarChart({
  skills,
  averageSkills,
  title = 'Skill Mastery',
  description = 'Performance across five writing dimensions',
  minHeight = 300
}: SkillRadarChartProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Transform skills object to array for Recharts
  const chartData = React.useMemo(() => {
    const data: Array<{
      skill: string;
      score: number;
      fullMark: number;
      average?: number;
    }> = [];

    (Object.keys(skills) as Array<keyof typeof skills>).forEach((key) => {
      data.push({
        skill: SKILL_LABELS[key],
        score: skills[key],
        fullMark: 100,
        average: averageSkills ? averageSkills[key] : undefined
      });
    });

    return data;
  }, [skills, averageSkills]);

  if (!isClient) {
    return (
      <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent style={{ height: minHeight }}>
          <div className='text-muted-foreground flex h-full items-center justify-center'>
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/50 bg-card/50 backdrop-blur-sm transition-shadow hover:shadow-md'>
      <CardHeader>
        <CardTitle className='text-foreground text-lg font-semibold'>
          {title}
        </CardTitle>
        <CardDescription className='text-sm'>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: minHeight }} className='w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <RadarChart
              cx='50%'
              cy='50%'
              outerRadius='80%'
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <PolarGrid
                stroke='hsl(var(--muted-foreground))'
                strokeOpacity={0.15}
                strokeWidth={1}
              />
              <PolarAngleAxis
                dataKey='skill'
                tick={{
                  fill: 'hsl(var(--foreground))',
                  fontSize: 12,
                  fontWeight: 500
                }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator='dot'
                    labelFormatter={(value) => `Skill: ${value}`}
                    formatter={(value, name) => {
                      if (name === 'average') {
                        return [`Avg: ${value}`, ''];
                      }
                      return [`${value}/100`, ''];
                    }}
                  />
                }
              />
              {/* Class Average Radar (if provided) */}
              {averageSkills && (
                <Radar
                  name='average'
                  dataKey='average'
                  stroke='hsl(var(--muted-foreground))'
                  strokeWidth={2}
                  fill='hsl(var(--muted-foreground))'
                  fillOpacity={0.1}
                  dot={{ r: 3, fill: 'hsl(var(--muted-foreground))' }}
                />
              )}
              {/* User Score Radar */}
              <Radar
                name='score'
                dataKey='score'
                stroke='hsl(var(--primary))'
                strokeWidth={3}
                fill='hsl(var(--primary))'
                fillOpacity={0.2}
                dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                animationDuration={1000}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className='mt-4 flex items-center justify-center gap-4'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary h-3 w-3 rounded-full' />
            <span className='text-muted-foreground text-xs font-medium'>
              Your Score
            </span>
          </div>
          {averageSkills && (
            <div className='flex items-center gap-2'>
              <div className='bg-muted-foreground h-3 w-3 rounded-full opacity-50' />
              <span className='text-muted-foreground text-xs font-medium'>
                Class Average
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
