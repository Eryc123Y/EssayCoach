'use client';

import { taskService } from '@/service/api/v2';
import type { Task, TaskSubmissionSummary } from '@/service/api/v2/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, FileText, Copy, CalendarClock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DuplicateTaskDialog } from './duplicate-task-dialog';
import { ExtendDeadlineDialog } from './extend-deadline-dialog';
import { usePreferences } from '@/components/layout/preference-provider';
import { toast } from 'sonner';
import { localized } from '@/locales';

interface TaskCardProps {
  task: Task;
  className?: string;
  userRole: 'student' | 'lecturer' | 'admin';
  onUpdate: () => void;
}

export function TaskCard({ task, className, userRole, onUpdate }: TaskCardProps) {
  const router = useRouter();
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [personalDeadline, setPersonalDeadline] = useState<string | null>(null);
  const [deadlineExtended, setDeadlineExtended] = useState(false);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);
  const [summary, setSummary] = useState<TaskSubmissionSummary | null>(null);

  useEffect(() => {
    if (userRole !== 'student') return;
    let active = true;
    taskService.getMyDeadline(task.task_id).then(result => {
      if (active) {
        setPersonalDeadline(result.effective_deadline);
        setDeadlineExtended(result.is_extended);
        setSubmissionCount(result.submission_count);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [task.task_id, userRole]);

  useEffect(() => {
    if (userRole === 'student') return;
    let active = true;
    taskService.getSubmissionSummary(task.task_id).then(result => { if (active) setSummary(result); }).catch(() => {});
    return () => { active = false; };
  }, [task.task_id, userRole]);

  const statusColors: Record<string, string> = {
    draft: 'bg-secondary text-secondary-foreground',
    published: 'bg-green-700 text-white',
    unpublished: 'bg-orange-700 text-white',
    archived: 'bg-muted text-muted-foreground',
  };

  const handleDelete = async () => {
    if (!confirm(zh ? `确定永久删除“${task.task_title}”吗？` : `Permanently delete “${task.task_title}”?`)) return;
    
    setIsDeleting(true);
    try {
      await taskService.deleteTask(task.task_id);
      onUpdate();
    } catch {
      toast.error(localized(locale, 'ui.failedToDeleteAssignment'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async () => {
    try {
      await taskService.publishTask(task.task_id);
      onUpdate();
    } catch {
      toast.error(localized(locale, 'ui.failedToPublishAssignment'));
    }
  };

  const handleUnpublish = async () => {
    try {
      await taskService.unpublishTask(task.task_id);
      onUpdate();
    } catch {
      toast.error(localized(locale, 'ui.failedToUnpublishAssignment'));
    }
  };

  const canEdit = userRole === 'lecturer' || userRole === 'admin';
  const deadline = new Date(personalDeadline ?? task.task_due_datetime).getTime();
  const remainingHours = (deadline - Date.now()) / 3_600_000;
  const revisionAvailable = submissionCount === 1 && task.task_allow_resubmission
    && (remainingHours >= 0 || task.task_allow_late_submission);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{task.task_title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {task.task_desc || (localized(locale, 'ui.noDescription'))}
            </CardDescription>
          </div>
          <Badge className={statusColors[task.task_status] || 'bg-secondary'}>
            {({ draft: localized(locale, 'ui.draft'), published: localized(locale, 'ui.published'), unpublished: localized(locale, 'ui.unpublished'), archived: localized(locale, 'ui.archived') } as Record<string, string>)[task.task_status] || task.task_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {task.class_id_class && (
          <div className="text-sm text-muted-foreground">
            {localized(locale, 'community.class')} · {className || task.unit_id_unit}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          {deadlineExtended ? (localized(locale, 'ui.yourExtendedDeadline92e62d')) : (localized(locale, 'ui.due1831b6'))}
          {new Date(personalDeadline ?? task.task_due_datetime).toLocaleString(localized(locale, 'ui.enUs'))}
        </div>
        {userRole === 'student' && submissionCount !== null && (
          <div className="text-sm font-medium text-blue-700">
            {submissionCount > 0
              ? revisionAvailable
                ? (localized(locale, 'ui.submittedOneRevisionAvailable'))
                : (localized(locale, 'ui.submitted667f11'))
              : (localized(locale, 'ui.notSubmitted'))}
          </div>
        )}
        {userRole === 'student' && submissionCount === 0 && task.task_status === 'published'
          && remainingHours >= 0 && remainingHours <= 48 && (
          <div role="status" className="text-sm font-medium text-amber-700">
            {remainingHours < 24
              ? (localized(locale, 'ui.dueInLessThan24Hours'))
              : (localized(locale, 'ui.dueInLessThan48Hours'))}
          </div>
        )}
        {userRole === 'student' && submissionCount === 0 && task.task_status === 'published'
          && remainingHours < 0 && !task.task_allow_late_submission && (
          <div role="status" className="text-sm font-medium text-rose-700">
            {localized(locale, 'ui.deadlinePassed')}
          </div>
        )}
        {task.task_allow_late_submission && (
          <div className="text-sm text-green-600">
            {localized(locale, 'ui.lateSubmissionsAllowed')}
          </div>
        )}
        {summary && <div className='text-sm text-muted-foreground'>
          {localized(locale, 'ui.submitted667f11')} {summary.submitted_students}/{summary.eligible_students}
        </div>}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/tasks/${task.task_id}`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          {userRole === 'student' ? (localized(locale, 'ui.viewAssignment')) : (localized(locale, 'ui.view'))}
        </Button>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={localized(locale, 'ui.assignmentActions')}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${task.task_id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                {localized(locale, 'nav.edit')}
              </DropdownMenuItem>
              {task.task_status === 'published' ? (
                <DropdownMenuItem onClick={handleUnpublish}>
                  {localized(locale, 'ui.unpublish')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handlePublish} disabled={task.task_status === 'archived'}>
                  {localized(locale, 'ui.publish')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDuplicateOpen(true)}>
                <Copy className="mr-2 h-4 w-4" />
                {localized(locale, 'ui.duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExtendOpen(true)}>
                <CalendarClock className="mr-2 h-4 w-4" />
                {localized(locale, 'ui.extendDeadline')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {localized(locale, 'ui.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>

      <DuplicateTaskDialog
        task={task}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        onSuccess={onUpdate}
      />
      <ExtendDeadlineDialog
        task={task}
        open={extendOpen}
        onOpenChange={setExtendOpen}
        onSuccess={onUpdate}
      />
    </Card>
  );
}
