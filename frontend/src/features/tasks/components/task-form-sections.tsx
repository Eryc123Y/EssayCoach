'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type {
  ClassItem,
  RubricListItem,
  TaskCreateInput
} from '@/service/api/v2/types';
import {
  OPTIONAL_SELECT_SENTINEL,
  fromOptionalSelectValue,
  fromRequiredSelectValue,
  toOptionalSelectValue
} from './task-form-utils';

type SectionProps = {
  formData: TaskCreateInput;
  setFormData: React.Dispatch<React.SetStateAction<TaskCreateInput>>;
  classes: ClassItem[];
  rubrics: RubricListItem[];
  loading: boolean;
  taskId?: number;
};

export function TaskTextFieldsSection({ formData, setFormData }: SectionProps) {
  return (
    <>
      <div className='space-y-2'>
        <Label htmlFor='title'>Task Title *</Label>
        <Input
          id='title'
          value={formData.task_title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, task_title: e.target.value }))
          }
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='desc'>Description</Label>
        <Textarea
          id='desc'
          value={formData.task_desc || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, task_desc: e.target.value }))
          }
          rows={3}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='instructions'>Instructions *</Label>
        <Textarea
          id='instructions'
          value={formData.task_instructions}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              task_instructions: e.target.value
            }))
          }
          required
          rows={4}
          placeholder='Enter submission instructions, formatting requirements, etc.'
        />
      </div>
    </>
  );
}

function TaskUnitRubricSection({
  formData,
  setFormData,
  rubrics
}: SectionProps) {
  return (
    <div className='grid grid-cols-2 gap-4'>
      <div className='space-y-2'>
        <Label htmlFor='unit'>Unit *</Label>
        <Input
          id='unit'
          value={formData.unit_id_unit}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, unit_id_unit: e.target.value }))
          }
          required
          placeholder='e.g., ENG101'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='rubric'>Rubric *</Label>
        <Select
          value={String(formData.rubric_id_marking_rubric)}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              rubric_id_marking_rubric: fromRequiredSelectValue(
                value,
                prev.rubric_id_marking_rubric
              )
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder='Select rubric' />
          </SelectTrigger>
          <SelectContent>
            {rubrics.map((rubric) => (
              <SelectItem
                key={rubric.rubric_id}
                value={String(rubric.rubric_id)}
              >
                {rubric.rubric_desc || `Rubric #${rubric.rubric_id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function TaskClassDueSection({ formData, setFormData, classes }: SectionProps) {
  return (
    <div className='grid grid-cols-2 gap-4'>
      <div className='space-y-2'>
        <Label htmlFor='class'>Class</Label>
        <Select
          value={toOptionalSelectValue(formData.class_id_class)}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              class_id_class: fromOptionalSelectValue(value)
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder='Select class (optional)' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OPTIONAL_SELECT_SENTINEL}>No class</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.class_id} value={String(cls.class_id)}>
                {cls.class_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='due'>Due Date *</Label>
        <Input
          id='due'
          type='datetime-local'
          value={
            formData.task_due_datetime
              ? new Date(formData.task_due_datetime).toISOString().slice(0, 16)
              : ''
          }
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              task_due_datetime: new Date(e.target.value).toISOString()
            }))
          }
          required
        />
      </div>
    </div>
  );
}

export function TaskMetaFieldsSection(props: SectionProps) {
  return (
    <>
      <TaskUnitRubricSection {...props} />
      <TaskClassDueSection {...props} />
    </>
  );
}

export function TaskSettingsSection({
  formData,
  setFormData,
  loading,
  taskId
}: SectionProps) {
  return (
    <>
      <div className='space-y-2'>
        <Label htmlFor='status'>Status</Label>
        <Select
          value={formData.task_status}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              task_status: value as
                | 'draft'
                | 'published'
                | 'unpublished'
                | 'archived'
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='draft'>Draft</SelectItem>
            <SelectItem value='published'>Published</SelectItem>
            <SelectItem value='unpublished'>Unpublished</SelectItem>
            <SelectItem value='archived'>Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex items-center space-x-2'>
        <Switch
          id='allow-late'
          checked={Boolean(formData.task_allow_late_submission)}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              task_allow_late_submission: checked
            }))
          }
        />
        <Label htmlFor='allow-late'>Allow late submissions</Label>
      </div>

      <div className='flex gap-4 pt-4'>
        <Button type='submit' disabled={loading}>
          {loading ? 'Saving...' : taskId ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </>
  );
}
