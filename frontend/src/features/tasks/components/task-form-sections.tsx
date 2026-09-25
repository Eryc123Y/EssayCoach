'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { ClassItem, ClassCreatableUnit, RubricListItem, TaskCreateInput } from '@/service/api/v2/types';
import { usePreferences } from '@/components/layout/preference-provider';
import {
  OPTIONAL_SELECT_SENTINEL,
  fromOptionalSelectValue,
  fromRequiredSelectValue,
  toOptionalSelectValue,
  toDatetimeLocalValue,
} from './task-form-utils';

type SectionProps = {
  formData: TaskCreateInput;
  setFormData: React.Dispatch<React.SetStateAction<TaskCreateInput>>;
  classes: ClassItem[];
  units: ClassCreatableUnit[];
  rubrics: RubricListItem[];
  loading: boolean;
  taskId?: number;
};

export function TaskTextFieldsSection({ formData, setFormData }: SectionProps) {
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">{zh ? '作业标题 *' : 'Assignment title *'}</Label>
        <Input
          id="title"
          value={formData.task_title}
          onChange={(e) => setFormData((prev) => ({ ...prev, task_title: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">{zh ? '描述' : 'Description'}</Label>
        <Textarea
          id="desc"
          value={formData.task_desc || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, task_desc: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">{zh ? '写作要求 *' : 'Instructions *'}</Label>
        <Textarea
          id="instructions"
          value={formData.task_instructions}
          onChange={(e) => setFormData((prev) => ({ ...prev, task_instructions: e.target.value }))}
          required
          rows={4}
          placeholder={zh ? '说明提交方式、字数及格式要求等' : 'Submission instructions, word count, formatting requirements…'}
        />
      </div>
    </>
  );
}

function TaskUnitRubricSection({ formData, setFormData, classes, units, rubrics }: SectionProps) {
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const availableUnits = Array.from(new Map([
    ...classes.map((item) => [item.unit_id_unit, { id: item.unit_id_unit, name: item.unit_id_unit }] as const),
    ...units.map((unit) => [unit.unit_id, { id: unit.unit_id, name: unit.unit_name }] as const),
  ]).values());
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="unit">{zh ? '课程 *' : 'Course *'}</Label>
        <Select value={formData.unit_id_unit} onValueChange={(value) => setFormData((prev) => ({
          ...prev,
          unit_id_unit: value,
          class_id_class: units.some((unit) => unit.unit_id === value) ? undefined : classes.find((item) => item.unit_id_unit === value)?.class_id,
        }))}>
          <SelectTrigger id='unit'><SelectValue placeholder={zh ? '选择课程' : 'Select a course'} /></SelectTrigger>
          <SelectContent>{availableUnits.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.id} · {unit.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rubric">{zh ? '评分量表 *' : 'Rubric *'}</Label>
        <Select
          value={String(formData.rubric_id_marking_rubric)}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              rubric_id_marking_rubric: fromRequiredSelectValue(value, prev.rubric_id_marking_rubric),
            }))
          }
        >
          <SelectTrigger id='rubric'>
            <SelectValue placeholder={zh ? '选择评分量表' : 'Select rubric'} />
          </SelectTrigger>
          <SelectContent>
            {rubrics.map((rubric) => (
              <SelectItem key={rubric.rubric_id} value={String(rubric.rubric_id)}>
                {rubric.rubric_desc || (zh ? `量表 #${rubric.rubric_id}` : `Rubric #${rubric.rubric_id}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function TaskClassDueSection({ formData, setFormData, classes, units }: SectionProps) {
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const requiresClass = Boolean(formData.unit_id_unit) && !units.some((unit) => unit.unit_id === formData.unit_id_unit);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="class">{requiresClass ? (zh ? '班级 *' : 'Class *') : (zh ? '班级（可选）' : 'Class (optional)')}</Label>
        <Select
          value={toOptionalSelectValue(formData.class_id_class)}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, class_id_class: fromOptionalSelectValue(value) }))
          }
        >
          <SelectTrigger id='class'>
            <SelectValue placeholder={zh ? '选择班级' : 'Select a class'} />
          </SelectTrigger>
          <SelectContent>
            {!requiresClass && <SelectItem value={OPTIONAL_SELECT_SENTINEL}>{zh ? '面向整门课程' : 'Whole course'}</SelectItem>}
            {classes.filter((item) => item.unit_id_unit === formData.unit_id_unit).map((cls) => (
              <SelectItem key={cls.class_id} value={String(cls.class_id)}>
                {cls.class_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due">{zh ? '截止时间 *' : 'Due date *'}</Label>
        <Input
          id="due"
          type="datetime-local"
          value={toDatetimeLocalValue(formData.task_due_datetime)}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, task_due_datetime: e.target.value ? new Date(e.target.value).toISOString() : '' }))
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

export function TaskSettingsSection({ formData, setFormData, loading, taskId }: SectionProps) {
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="status">{zh ? '状态' : 'Status'}</Label>
        <Select
          value={formData.task_status}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              task_status: value as 'draft' | 'published' | 'unpublished' | 'archived',
            }))
          }
        >
          <SelectTrigger id='status'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{zh ? '草稿' : 'Draft'}</SelectItem>
            <SelectItem value="published">{zh ? '已发布' : 'Published'}</SelectItem>
            <SelectItem value="unpublished">{zh ? '已撤回' : 'Unpublished'}</SelectItem>
            <SelectItem value="archived">{zh ? '已归档' : 'Archived'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="allow-late"
          checked={Boolean(formData.task_allow_late_submission)}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, task_allow_late_submission: checked }))}
        />
        <Label htmlFor="allow-late">{zh ? '允许逾期提交' : 'Allow late submissions'}</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="allow-resubmission"
          checked={Boolean(formData.task_allow_resubmission)}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, task_allow_resubmission: checked }))}
        />
        <Label htmlFor="allow-resubmission">{zh ? '允许一次重新提交（保留原版本）' : 'Allow one revision (retain the original)'}</Label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? (zh ? '保存中…' : 'Saving…') : taskId ? (zh ? '保存更改' : 'Save changes') : (zh ? '创建作业' : 'Create assignment')}
        </Button>
      </div>
    </>
  );
}
