'use client';

import { motion } from 'motion/react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ScoreData {
  category: string;
  score: number;
  fullMark: number;
  description?: string;
}

interface FeedbackDashboardProps {
  scores: ScoreData[];
  overallScore: number;
}

export function FeedbackDashboard({ scores, overallScore }: FeedbackDashboardProps) {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='md:col-span-1'
        >
          <Card className='border-border/50 bg-card/50 h-full shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md'>
            <CardHeader>
              <CardTitle>Overall Score</CardTitle>
              <CardDescription>
                Average performance across metrics
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col items-center justify-center pt-6'>
              <div className='relative flex h-32 w-32 items-center justify-center'>
                <svg className='h-full w-full -rotate-90 transform'>
                  <circle
                    cx='64'
                    cy='64'
                    r='60'
                    stroke='currentColor'
                    strokeWidth='8'
                    fill='transparent'
                    className='text-muted/20'
                  />
                  <circle
                    cx='64'
                    cy='64'
                    r='60'
                    stroke='currentColor'
                    strokeWidth='8'
                    fill='transparent'
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * overallScore) / 100}
                    className='text-primary transition-all duration-1000 ease-out'
                    strokeLinecap='round'
                  />
                </svg>
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <span className='text-4xl font-bold tracking-tighter'>
                    {overallScore}
                  </span>
                  <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                    / 100
                  </span>
                </div>
              </div>
              <div className='mt-6 flex flex-wrap justify-center gap-2'>
                <Badge
                  variant='outline'
                  className='bg-primary/5 border-primary/20 text-primary'
                >
                  {overallScore >= 90 ? 'Excellent' : overallScore >= 70 ? 'Good' : 'Needs Work'}
                </Badge>
                {overallScore >= 50 && (
                  <Badge
                    variant='outline'
                    className='border-green-500/20 bg-green-500/5 text-green-600'
                  >
                    Passing
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='md:col-span-2'
        >
          <Card className='border-border/50 bg-card/50 h-full shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md'>
            <CardHeader>
              <CardTitle>Performance Dimensions</CardTitle>
              <CardDescription>
                Breakdown by assessment criteria
              </CardDescription>
            </CardHeader>
            <CardContent className='h-[300px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <RadarChart
                  cx='50%'
                  cy='50%'
                  outerRadius='80%'
                  data={scores}
                >
                  <PolarGrid
                    stroke='hsl(var(--muted-foreground))'
                    strokeOpacity={0.2}
                  />
                  <PolarAngleAxis
                    dataKey='category'
                    tick={{
                      fill: 'hsl(var(--foreground))',
                      fontSize: 12,
                      fontWeight: 500
                    }}
                  />
                  <Radar
                    name='Score'
                    dataKey='score'
                    stroke='hsl(var(--primary))'
                    strokeWidth={3}
                    fill='hsl(var(--primary))'
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Breakdown Tabs */}
      <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle>Metric Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {scores.length > 0 ? (
            <Tabs defaultValue={scores[0].category} className='w-full'>
              <TabsList className='bg-muted/50 h-auto w-full justify-start overflow-x-auto rounded-xl p-1'>
                {scores.map((item) => (
                  <TabsTrigger
                    key={item.category}
                    value={item.category}
                    className='data-[state=active]:bg-background rounded-lg px-4 py-2 transition-all data-[state=active]:shadow-sm'
                  >
                    {item.category}{' '}
                    <span className='ml-2 text-xs opacity-70'>
                      ({item.score})
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {scores.map((item) => (
                <TabsContent
                  key={item.category}
                  value={item.category}
                  className='mt-6 space-y-4'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold'>
                      {item.category} Assessment
                    </h3>
                    <div className='text-primary text-2xl font-bold'>
                      {item.score}/100
                    </div>
                  </div>
                  <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                    <div
                      className='bg-primary h-full transition-all duration-500'
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <p className='text-muted-foreground leading-relaxed'>
                    {item.description || `The ${item.category.toLowerCase()} of your essay demonstrates performance consistent with the score.`}
                  </p>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center text-muted-foreground p-8">
              No detailed metrics available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
