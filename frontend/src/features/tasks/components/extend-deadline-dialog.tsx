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
import { localized } from '@/locales';

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
      .catch(() => { if (current) setStudentLoadError(localized(locale, 'ui.couldNotLoadStudents')); });
    return () => { current = false; };
  }, [open, task.task_id, locale]);

  // Format the current deadline for display
  const currentDeadline = new Date(task.task_due_datetime).toLocaleString(localized(locale, 'ui.enUs'));

  // The deadline is bolded, so the sentence is split around its placeholder.
  const [descriptionBefore, descriptionAfter = ''] = localized(locale, 'ui.extendTheDeadlineForTitleCurrentDeadline', {
    title: task.task_title,
    deadline: '\u0000'
  }).split('\u0000');

  // Min datetime is now (can't extend to past)
  const now = new Date();
  const minDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const handleSubmit = async () => {
    if (!newDeadline) {
      toast.error(localized(locale, 'ui.pleaseSelectANewDeadline'));
      return;
    }

    const newDeadlineDate = new Date(newDeadline);
    const currentDeadlineDate = new Date(task.task_due_datetime);
    if (newDeadlineDate <= currentDeadlineDate) {
      toast.error(localized(locale, 'ui.newDeadlineMustBeAfterTheCurrentDeadline'));
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
        ? (localized(locale, 'ui.studentDeadlineExtended'))
        : (localized(locale, 'ui.classDeadlineExtended')));
      onOpenChange(false);
      setNewDeadline('');
      setReason('');
      setStudentId(null);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (localized(locale, 'ui.failedToExtendDeadline')));
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
            {localized(locale, 'ui.extendDeadline')}
          </DialogTitle>
          <DialogDescription>
            {descriptionBefore}<strong>{currentDeadline}</strong>{descriptionAfter}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="extend-target">{localized(locale, 'ui.extendFor')}</Label>
            <select
              id="extend-target"
              value={studentId ?? ''}
              onChange={event => setStudentId(event.target.value ? Number(event.target.value) : null)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              disabled={!!studentLoadError}
            >
              <option value="">{localized(locale, 'ui.entireClassOrCourse')}</option>
              {students.map(student => <option key={student.user_id} value={student.user_id}>
                {student.display_name} · {student.user_email}
              </option>)}
            </select>
            {studentLoadError && <p role="alert" className="text-xs text-red-700">{studentLoadError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-deadline">{localized(locale, 'ui.newDeadline')}</Label>
            <Input
              id="new-deadline"
              type="datetime-local"
              min={minDatetime}
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extend-reason">{localized(locale, 'ui.reasonOptional')}</Label>
            <Textarea
              id="extend-reason"
              placeholder={localized(locale, 'ui.eGScheduleChange')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {localized(locale, 'community.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !newDeadline}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {localized(locale, 'ui.extending')}
              </>
            ) : (
              <>
                <CalendarClock className="mr-2 h-4 w-4" />
                {localized(locale, 'ui.extendDeadline')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
