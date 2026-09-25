'use client';

import { useEffect, useState } from 'react';
import { taskService } from '@/service/api/v2';
import type { Task, TaskEligibleStudent } from '@/service/api/v2/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/components/layout/preference-provider';

interface ExtendDeadlineDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExtendDeadlineDialog({
  task,
  open,
  onOpenChange,
  onSuccess,
}: ExtendDeadlineDialogProps) {
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const [newDeadline, setNewDeadline] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<TaskEligibleStudent[]>([]);
  const [studentLoadError, setStudentLoadError] = useState('');

  useEffect(() => {
    if (!open) return;
    let current = true;
    taskService.getEligibleStudents(task.task_id)
      .then(result => { if (current) { setStudents(result); setStudentLoadError(''); } })
      .catch(() => { if (current) setStudentLoadError(zh ? '无法载入学生名单。' : 'Could not load students.'); });
    return () => { current = false; };
  }, [open, task.task_id, zh]);

  // Format the current deadline for display
  const currentDeadline = new Date(task.task_due_datetime).toLocaleString(zh ? 'zh-CN' : 'en-US');

  // Min datetime is now (can't extend to past)
  const now = new Date();
  const minDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const handleSubmit = async () => {
    if (!newDeadline) {
      toast.error(zh ? '请选择新的截止时间。' : 'Please select a new deadline.');
      return;
    }

    const newDeadlineDate = new Date(newDeadline);
    const currentDeadlineDate = new Date(task.task_due_datetime);
    if (newDeadlineDate <= currentDeadlineDate) {
      toast.error(zh ? '新截止时间必须晚于当前截止时间。' : 'New deadline must be after the current deadline.');
      return;
    }

    setIsLoading(true);
    try {
      await taskService.extendDeadline(task.task_id, {
        new_deadline: new Date(newDeadline).toISOString(),
        student_id: studentId,
        reason: reason.trim() || undefined,
      });
      toast.success(studentId
        ? (zh ? '已为学生延长截止时间。' : 'Student deadline extended.')
        : (zh ? '已延长全班截止时间。' : 'Class deadline extended.'));
      onOpenChange(false);
      setNewDeadline('');
      setReason('');
      setStudentId(null);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (zh ? '延长截止时间失败。' : 'Failed to extend deadline.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            {zh ? '延长截止时间' : 'Extend deadline'}
          </DialogTitle>
          <DialogDescription>
            {zh ? `“${task.task_title}”当前截止时间：` : <>Extend the deadline for &ldquo;{task.task_title}&rdquo;. Current deadline: </>}<strong>{currentDeadline}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="extend-target">{zh ? '延期对象' : 'Extend for'}</Label>
            <select
              id="extend-target"
              value={studentId ?? ''}
              onChange={event => setStudentId(event.target.value ? Number(event.target.value) : null)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              disabled={!!studentLoadError}
            >
              <option value="">{zh ? '整个班级／课程' : 'Entire class or course'}</option>
              {students.map(student => <option key={student.user_id} value={student.user_id}>
                {student.display_name} · {student.user_email}
              </option>)}
            </select>
            {studentLoadError && <p role="alert" className="text-xs text-red-700">{studentLoadError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-deadline">{zh ? '新截止时间 *' : 'New deadline *'}</Label>
            <Input
              id="new-deadline"
              type="datetime-local"
              min={minDatetime}
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extend-reason">{zh ? '原因（可选）' : 'Reason (optional)'}</Label>
            <Textarea
              id="extend-reason"
              placeholder={zh ? '例如：教学安排调整' : 'e.g. Schedule change…'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {zh ? '取消' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !newDeadline}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {zh ? '更新中…' : 'Extending…'}
              </>
            ) : (
              <>
                <CalendarClock className="mr-2 h-4 w-4" />
                {zh ? '延长截止时间' : 'Extend deadline'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
