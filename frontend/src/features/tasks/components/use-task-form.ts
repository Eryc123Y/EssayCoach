'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { classService, rubricService, taskService } from '@/service/api/v2';
import type {
  ClassItem,
  RubricListItem,
  Task,
  TaskCreateInput
} from '@/service/api/v2/types';

type UseTaskFormInput = {
  taskId?: number;
  initialData?: Task;
};

type UseTaskFormOutput = {
  loading: boolean;
  classes: ClassItem[];
  rubrics: RubricListItem[];
  formData: TaskCreateInput;
  setFormData: React.Dispatch<React.SetStateAction<TaskCreateInput>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
};

const defaultFormData: TaskCreateInput = {
  unit_id_unit: '',
  rubric_id_marking_rubric: 0,
  task_due_datetime: '',
  task_title: '',
  task_desc: '',
  task_instructions: '',
  class_id_class: undefined,
  task_status: 'draft',
  task_allow_late_submission: false
};

function toInitialFormData(initialData?: Task): TaskCreateInput {
  if (!initialData) {
    return defaultFormData;
  }
  return {
    unit_id_unit: initialData.unit_id_unit,
    rubric_id_marking_rubric: initialData.rubric_id_marking_rubric,
    task_due_datetime: initialData.task_due_datetime,
    task_title: initialData.task_title,
    task_desc: initialData.task_desc || '',
    task_instructions: initialData.task_instructions,
    class_id_class: initialData.class_id_class || undefined,
    task_status: initialData.task_status,
    task_allow_late_submission: initialData.task_allow_late_submission
  };
}

async function saveTask(args: {
  taskId?: number;
  initialData?: Task;
  formData: TaskCreateInput;
}) {
  if (args.taskId && args.initialData) {
    await taskService.updateTask(args.taskId, args.formData);
    return;
  }

  await taskService.createTask(args.formData);
}

export function useTaskForm({
  taskId,
  initialData
}: UseTaskFormInput): UseTaskFormOutput {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [rubrics, setRubrics] = useState<RubricListItem[]>([]);
  const [formData, setFormData] = useState<TaskCreateInput>(
    toInitialFormData(initialData)
  );

  useEffect(() => {
    setFormData(toInitialFormData(initialData));
  }, [initialData]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classesData, rubricsData] = await Promise.all([
          classService.listClasses(),
          rubricService.fetchRubricList({ page_size: 100 })
        ]);
        setClasses(classesData);
        setRubrics(rubricsData.results || rubricsData);
      } catch (error) {
        console.error('Failed to load form data:', error);
      }
    };

    void loadData();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await saveTask({ taskId, initialData, formData });
        router.push('/dashboard/tasks');
      } catch (error) {
        toast.error('Failed to save task. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [formData, initialData, router, taskId]
  );

  return { loading, classes, rubrics, formData, setFormData, handleSubmit };
}
