'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { taskService, classService, rubricService } from '@/service/api/v2';
import type { Task, TaskCreateInput, ClassItem, RubricListItem } from '@/service/api/v2/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface TaskFormProps {
  taskId?: number;
  initialData?: Task;
}

export function TaskForm({ taskId, initialData }: TaskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [rubrics, setRubrics] = useState<RubricListItem[]>([]);
  
  const [formData, setFormData] = useState<TaskCreateInput>({
    unit_id_unit: '',
    rubric_id_marking_rubric: 0,
    task_due_datetime: '',
    task_title: '',
    task_desc: '',
    task_instructions: '',
    class_id_class: undefined,
    task_status: 'draft',
    task_allow_late_submission: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        unit_id_unit: initialData.unit_id_unit,
        rubric_id_marking_rubric: initialData.rubric_id_marking_rubric,
        task_due_datetime: initialData.task_due_datetime,
        task_title: initialData.task_title,
        task_desc: initialData.task_desc || '',
        task_instructions: initialData.task_instructions,
        class_id_class: initialData.class_id_class || undefined,
        task_status: initialData.task_status,
        task_allow_late_submission: initialData.task_allow_late_submission,
      });
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesData, rubricsData] = await Promise.all([
        classService.listClasses(),
        rubricService.fetchRubricList({ page_size: 100 }),
      ]);
      setClasses(classesData);
      setRubrics(rubricsData.results || rubricsData);
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (taskId && initialData) {
        await taskService.updateTask(taskId, formData);
      } else {
        await taskService.createTask(formData);
      }
      router.push('/dashboard/tasks');
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{taskId ? 'Edit Task' : 'Create New Task'}</CardTitle>
        <CardDescription>
          {taskId ? 'Update task details' : 'Create a new assignment for your students'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.task_title}
              onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={formData.task_desc || ''}
              onChange={(e) => setFormData({ ...formData, task_desc: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions *</Label>
            <Textarea
              id="instructions"
              value={formData.task_instructions}
              onChange={(e) => setFormData({ ...formData, task_instructions: e.target.value })}
              required
              rows={4}
              placeholder="Enter submission instructions, formatting requirements, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                value={formData.unit_id_unit}
                onChange={(e) => setFormData({ ...formData, unit_id_unit: e.target.value })}
                required
                placeholder="e.g., ENG101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rubric">Rubric *</Label>
              <Select
                value={formData.rubric_id_marking_rubric.toString()}
                onValueChange={(value) => setFormData({ ...formData, rubric_id_marking_rubric: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rubric" />
                </SelectTrigger>
                <SelectContent>
                  {rubrics.map((rubric) => (
                    <SelectItem key={rubric.rubric_id} value={rubric.rubric_id.toString()}>
                      {rubric.rubric_desc || `Rubric #${rubric.rubric_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select
                value={formData.class_id_class?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, class_id_class: value ? parseInt(value) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No class</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.class_id} value={cls.class_id.toString()}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due">Due Date *</Label>
              <Input
                id="due"
                type="datetime-local"
                value={formData.task_due_datetime ? new Date(formData.task_due_datetime).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, task_due_datetime: new Date(e.target.value).toISOString() })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              onValueChange={(value) => setFormData({ ...formData, task_status: value as 'draft' | 'published' | 'unpublished' | 'archived' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="unpublished">Unpublished</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allow-late"
              checked={formData.task_allow_late_submission}
              onCheckedChange={(checked) => setFormData({ ...formData, task_allow_late_submission: checked })}
            />
            <Label htmlFor="allow-late">Allow late submissions</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : taskId ? 'Update Task' : 'Create Task'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/tasks')}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
