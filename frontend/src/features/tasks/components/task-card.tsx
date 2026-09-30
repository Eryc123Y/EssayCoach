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
      toast.error(zh ? '删除作业失败。' : 'Failed to delete assignment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async () => {
    try {
      await taskService.publishTask(task.task_id);
      onUpdate();
    } catch {
      toast.error(zh ? '发布作业失败。' : 'Failed to publish assignment.');
    }
  };

  const handleUnpublish = async () => {
    try {
      await taskService.unpublishTask(task.task_id);
      onUpdate();
    } catch {
      toast.error(zh ? '撤回作业失败。' : 'Failed to unpublish assignment.');
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
              {task.task_desc || (zh ? '暂无描述' : 'No description')}
            </CardDescription>
          </div>
          <Badge className={statusColors[task.task_status] || 'bg-secondary'}>
            {({ draft: zh ? '草稿' : 'Draft', published: zh ? '已发布' : 'Published', unpublished: zh ? '已撤回' : 'Unpublished', archived: zh ? '已归档' : 'Archived' } as Record<string, string>)[task.task_status] || task.task_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {task.class_id_class && (
          <div className="text-sm text-muted-foreground">
            {zh ? '班级' : 'Class'} · {className || task.unit_id_unit}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          {deadlineExtended ? (zh ? '你的延期截止时间：' : 'Your extended deadline: ') : (zh ? '截止：' : 'Due: ')}
          {new Date(personalDeadline ?? task.task_due_datetime).toLocaleString(zh ? 'zh-CN' : 'en-US')}
        </div>
        {userRole === 'student' && submissionCount !== null && (
          <div className="text-sm font-medium text-blue-700">
            {submissionCount > 0
              ? revisionAvailable
                ? (zh ? '已提交 · 还可提交一次修订稿' : 'Submitted · one revision available')
                : (zh ? '已提交' : 'Submitted')
              : (zh ? '尚未提交' : 'Not submitted')}
          </div>
        )}
        {userRole === 'student' && submissionCount === 0 && task.task_status === 'published'
          && remainingHours >= 0 && remainingHours <= 48 && (
          <div role="status" className="text-sm font-medium text-amber-700">
            {remainingHours < 24
              ? (zh ? '截止时间不足 24 小时' : 'Due in less than 24 hours')
              : (zh ? '截止时间不足 48 小时' : 'Due in less than 48 hours')}
          </div>
        )}
        {userRole === 'student' && submissionCount === 0 && task.task_status === 'published'
          && remainingHours < 0 && !task.task_allow_late_submission && (
          <div role="status" className="text-sm font-medium text-rose-700">
            {zh ? '已过截止时间' : 'Deadline passed'}
          </div>
        )}
        {task.task_allow_late_submission && (
          <div className="text-sm text-green-600">
            {zh ? '允许逾期提交' : 'Late submissions allowed'}
          </div>
        )}
        {summary && <div className='text-sm text-muted-foreground'>
          {zh ? '已提交' : 'Submitted'} {summary.submitted_students}/{summary.eligible_students}
        </div>}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/tasks/${task.task_id}`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          {userRole === 'student' ? (zh ? '查看作业' : 'View assignment') : (zh ? '查看' : 'View')}
        </Button>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={zh ? '作业操作' : 'Assignment actions'}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${task.task_id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                {zh ? '编辑' : 'Edit'}
              </DropdownMenuItem>
              {task.task_status === 'published' ? (
                <DropdownMenuItem onClick={handleUnpublish}>
                  {zh ? '撤回' : 'Unpublish'}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handlePublish} disabled={task.task_status === 'archived'}>
                  {zh ? '发布' : 'Publish'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDuplicateOpen(true)}>
                <Copy className="mr-2 h-4 w-4" />
                {zh ? '复制' : 'Duplicate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExtendOpen(true)}>
                <CalendarClock className="mr-2 h-4 w-4" />
                {zh ? '延长截止时间' : 'Extend deadline'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {zh ? '删除' : 'Delete'}
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
