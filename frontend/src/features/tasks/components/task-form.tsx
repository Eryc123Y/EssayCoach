'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task } from '@/service/api/v2/types';
import { TaskMetaFieldsSection, TaskSettingsSection, TaskTextFieldsSection } from './task-form-sections';
import { useTaskForm } from './use-task-form';
import { usePreferences } from '@/components/layout/preference-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { localized } from '@/locales';

interface TaskFormProps {
  taskId?: number;
  initialData?: Task;
}

// Messages raised by useTaskForm itself; anything else is a server message shown as received.
const FORM_ERROR_IDS: Record<string, string> = {
  'Could not load class and rubric options. Refresh and try again.': 'ui.couldNotLoadClassAndRubricOptions',
  'Choose a course, rubric, and due date before saving.': 'ui.chooseACourseRubricAndDueDateBeforeSaving',
  'Choose a class for this course before saving.': 'ui.chooseAClassForThisCourseBeforeSaving'
};

function formErrorMessage(locale: string, error: string) {
  const id = FORM_ERROR_IDS[error];
  return id ? localized(locale, id) : error;
}

/**
 * Task create/update form used by `/dashboard/tasks/new` and `/dashboard/tasks/[id]/edit`.
 *
 * - `taskId` + `initialData` present: updates an existing task.
 * - missing `taskId`: creates a new task.
 */
export function TaskForm({ taskId, initialData }: TaskFormProps) {
  const router = useRouter();
  const { locale } = usePreferences();
  const { loading, error, classes, units, rubrics, formData, setFormData, handleSubmit } = useTaskForm({
    taskId,
    initialData,
  });
  const sectionProps = { formData, setFormData, classes, units, rubrics, loading, taskId };

  return (
    <Card className='mx-auto max-w-4xl'>
      <CardHeader>
        <CardTitle>{taskId ? (localized(locale, 'ui.editAssignment')) : (localized(locale, 'ui.createAssignment550e5f'))}</CardTitle>
        <CardDescription>
          {taskId ? (localized(locale, 'ui.updateAssignmentDetails')) : (localized(locale, 'ui.createAWritingAssignmentForYourStudents'))}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant='destructive' role='alert'><AlertDescription>{formErrorMessage(locale, error)}</AlertDescription></Alert>}
          <TaskTextFieldsSection {...sectionProps} />
          <TaskMetaFieldsSection {...sectionProps} />
          <TaskSettingsSection {...sectionProps} />
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/tasks')}>
            {localized(locale, 'community.cancel')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
