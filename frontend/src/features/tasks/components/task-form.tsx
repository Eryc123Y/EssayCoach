'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task } from '@/service/api/v2/types';
import { TaskMetaFieldsSection, TaskSettingsSection, TaskTextFieldsSection } from './task-form-sections';
import { useTaskForm } from './use-task-form';
import { usePreferences } from '@/components/layout/preference-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const { loading, error, classes, units, rubrics, formData, setFormData, handleSubmit } = useTaskForm({
    taskId,
    initialData,
  });
  const sectionProps = { formData, setFormData, classes, units, rubrics, loading, taskId };

  return (
    <Card className='mx-auto max-w-4xl'>
      <CardHeader>
        <CardTitle>{taskId ? (zh ? '编辑作业' : 'Edit assignment') : (zh ? '新建作业' : 'Create assignment')}</CardTitle>
        <CardDescription>
          {taskId ? (zh ? '更新作业要求与设置' : 'Update assignment details') : (zh ? '为学生布置写作任务' : 'Create a writing assignment for your students')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant='destructive' role='alert'><AlertDescription>{zh ? (error.includes('options') ? '无法加载班级和量表，请刷新页面重试。' : error.includes('Choose a course') ? '保存前请选择课程、量表和截止时间。' : error.includes('Choose a class') ? '保存前请选择班级。' : error) : error}</AlertDescription></Alert>}
          <TaskTextFieldsSection {...sectionProps} />
          <TaskMetaFieldsSection {...sectionProps} />
          <TaskSettingsSection {...sectionProps} />
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/tasks')}>
            {zh ? '取消' : 'Cancel'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
