'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import type { Task } from '@/service/api/v2/types';
import {
  TaskMetaFieldsSection,
  TaskSettingsSection,
  TaskTextFieldsSection
} from './task-form-sections';
import { useTaskForm } from './use-task-form';

interface TaskFormProps {
  taskId?: number;
  initialData?: Task;
}

/**
 * Task create/update form used by `/dashboard/tasks/new` and `/dashboard/tasks/[id]/edit`.
 *
 * - `taskId` + `initialData` present: updates an existing task.
 * - missing `taskId`: creates a new task.
 */
export function TaskForm({ taskId, initialData }: TaskFormProps) {
  const router = useRouter();
  const { loading, classes, rubrics, formData, setFormData, handleSubmit } =
    useTaskForm({
      taskId,
      initialData
    });
  const sectionProps = {
    formData,
    setFormData,
    classes,
    rubrics,
    loading,
    taskId
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{taskId ? 'Edit Task' : 'Create New Task'}</CardTitle>
        <CardDescription>
          {taskId
            ? 'Update task details'
            : 'Create a new assignment for your students'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <TaskTextFieldsSection {...sectionProps} />
          <TaskMetaFieldsSection {...sectionProps} />
          <TaskSettingsSection {...sectionProps} />
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/dashboard/tasks')}
          >
            Cancel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
