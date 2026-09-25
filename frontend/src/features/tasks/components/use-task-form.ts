'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classService, rubricService, taskService } from '@/service/api/v2';
import type { ClassItem, ClassCreatableUnit, RubricListItem, Task, TaskCreateInput } from '@/service/api/v2/types';

type UseTaskFormInput = {
  taskId?: number;
  initialData?: Task;
};

type UseTaskFormOutput = {
  loading: boolean;
  error: string | null;
  classes: ClassItem[];
  units: ClassCreatableUnit[];
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
  task_allow_late_submission: false,
  task_allow_resubmission: false,
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
    task_allow_late_submission: initialData.task_allow_late_submission,
    task_allow_resubmission: initialData.task_allow_resubmission,
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

export function useTaskForm({ taskId, initialData }: UseTaskFormInput): UseTaskFormOutput {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [units, setUnits] = useState<ClassCreatableUnit[]>([]);
  const [rubrics, setRubrics] = useState<RubricListItem[]>([]);
  const [formData, setFormData] = useState<TaskCreateInput>(toInitialFormData(initialData));

  useEffect(() => {
    setFormData(toInitialFormData(initialData));
  }, [initialData]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classesData, unitsData, rubricsData] = await Promise.all([
          classService.listClasses(),
          classService.listCreatableUnits(),
          rubricService.fetchRubricList({ page_size: 100 }),
        ]);
        setClasses(classesData);
        setUnits(unitsData);
        setRubrics(rubricsData.results || rubricsData);
      } catch {
        setError('Could not load class and rubric options. Refresh and try again.');
      }
    };

    void loadData();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      try {
        if (!formData.unit_id_unit || !formData.rubric_id_marking_rubric || !formData.task_due_datetime) {
          setError('Choose a course, rubric, and due date before saving.');
          return;
        }
        if (!units.some((unit) => unit.unit_id === formData.unit_id_unit) && !formData.class_id_class) {
          setError('Choose a class for this course before saving.');
          return;
        }
        await saveTask({ taskId, initialData, formData });
        router.push('/dashboard/tasks');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Failed to save task. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [formData, initialData, router, taskId, units]
  );

  return { loading, error, classes, units, rubrics, formData, setFormData, handleSubmit };
}
