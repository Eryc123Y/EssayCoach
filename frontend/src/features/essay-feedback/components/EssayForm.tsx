'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import type { DifyWorkflowRunRequest } from '@/types/dify';

interface EssayFormProps {
  onSubmit: (data: DifyWorkflowRunRequest) => void;
  isSubmitting: boolean;
}

export function EssayForm({ onSubmit, isSubmitting }: EssayFormProps) {
  const form = useForm<DifyWorkflowRunRequest>({
    defaultValues: {
      essay_question: '',
      essay_content: '',
      language: 'English',
      response_mode: 'blocking'
    }
  });

  const essayContent = form.watch('essay_content');
  const charCount = essayContent?.length || 0;
  const maxChars = 20000;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Essay</CardTitle>
        <CardDescription>
          Enter your essay topic and content below to receive detailed AI feedback and grading.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='essay_question'
              rules={{ required: 'Please enter the essay question/topic' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Essay Question / Topic</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. Discuss the impact of AI on education'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='essay_content'
              rules={{ required: 'Please enter your essay content' }}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Essay Content</FormLabel>
                    <span className={`text-xs ${charCount > maxChars ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder='Paste your essay here...'
                      className='min-h-[300px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='language'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <Input placeholder='English' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? 'Submitting...' : 'Analyze Essay'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
